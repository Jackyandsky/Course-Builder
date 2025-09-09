import { CourseService } from '../course.service';
import { mockSupabaseClient } from '@/__mocks__/supabase';

describe('CourseService', () => {
  let courseService: CourseService;

  beforeEach(() => {
    jest.clearAllMocks();
    courseService = new CourseService(mockSupabaseClient);
  });

  describe('getCoursesWithDetails', () => {
    it('should fetch courses with schedules and lessons', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'Course 1',
          is_public: true,
          schedules: [
            {
              id: 'schedule-1',
              name: 'Schedule 1',
              schedule_type: 'weekly',
              is_active: true,
              lessons: { count: 10 },
            },
          ],
        },
      ];

      mockSupabaseClient.from().select().eq().order.mockResolvedValueOnce({
        data: mockCourses,
        error: null,
      });

      const result = await courseService.getCoursesWithDetails();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses');
      expect(result.data).toEqual(mockCourses);
      expect(result.error).toBeNull();
    });

    it('should filter by user ID when provided', async () => {
      mockSupabaseClient.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await courseService.getCoursesWithDetails('user-123');

      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });

  describe('getCourseStats', () => {
    it('should return course statistics', async () => {
      const mockEnrollments = { count: 25, data: [], error: null };
      const mockLessons = { count: 12, data: [], error: null };
      const mockTasks = { count: 8, data: [], error: null };

      // Mock each call individually
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockEnrollments)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockLessons)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockTasks)
          })
        });

      const result = await courseService.getCourseStats('course-123');

      expect(result).toEqual({
        enrollmentCount: 25,
        lessonCount: 12,
        taskCount: 8,
      });
    });

    it('should handle null counts gracefully', async () => {
      const mockNullResult = { count: null, data: [], error: null };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockNullResult)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockNullResult)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockNullResult)
          })
        });

      const result = await courseService.getCourseStats('course-123');

      expect(result).toEqual({
        enrollmentCount: 0,
        lessonCount: 0,
        taskCount: 0,
      });
    });
  });

  describe('getFeaturedCourses', () => {
    it('should fetch featured courses for homepage', async () => {
      const mockFeaturedCourses = [
        { id: 'course-1', title: 'Featured Course 1', show_on_homepage: true },
        { id: 'course-2', title: 'Featured Course 2', show_on_homepage: true },
      ];

      mockSupabaseClient.from().select().eq().eq().order().limit.mockResolvedValueOnce({
        data: mockFeaturedCourses,
        error: null,
      });

      const result = await courseService.getFeaturedCourses(8);

      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('show_on_homepage', true);
      expect(mockSupabaseClient.from().select().eq().eq().order().limit).toHaveBeenCalledWith(8);
      expect(result.data).toEqual(mockFeaturedCourses);
    });

    it('should use default limit of 8', async () => {
      mockSupabaseClient.from().select().eq().eq().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await courseService.getFeaturedCourses();

      expect(mockSupabaseClient.from().select().eq().eq().order().limit).toHaveBeenCalledWith(8);
    });
  });

  describe('searchCourses', () => {
    it('should search courses by title and description', async () => {
      const searchTerm = 'programming';
      const mockResults = [
        { id: 'course-1', title: 'Programming Basics', description: 'Learn programming' },
      ];

      mockSupabaseClient.from().select().eq().or().order.mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const result = await courseService.searchCourses(searchTerm);

      expect(mockSupabaseClient.from().select().eq().or).toHaveBeenCalledWith(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
      expect(result.data).toEqual(mockResults);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        difficulty: 'intermediate',
        priceMin: 50,
        priceMax: 200,
      };

      mockSupabaseClient.from().select().eq().eq().gte().lte().order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await courseService.searchCourses('test', filters);

      expect(mockSupabaseClient.from().select().eq()).toHaveBeenCalledWith('difficulty', 'intermediate');
      expect(mockSupabaseClient.from().select().eq().eq().gte).toHaveBeenCalledWith('price', 50);
      expect(mockSupabaseClient.from().select().eq().eq().gte().lte).toHaveBeenCalledWith('price', 200);
    });
  });

  describe('error handling', () => {
    it('should throw database errors', async () => {
      const dbError = { code: 'PGRST301', message: 'Database connection failed' };
      
      mockSupabaseClient.from().select().eq().order.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      await expect(courseService.getCoursesWithDetails()).rejects.toThrow();
    });
  });
});