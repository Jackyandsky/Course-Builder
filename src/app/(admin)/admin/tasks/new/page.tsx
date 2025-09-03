'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input, Textarea, Select, Spinner, Modal, Checkbox } from '@/components/ui';
import { BelongingSelector } from '@/components/ui/BelongingSelector';
import { useToast } from '@/contexts/ToastContext';
import { taskService } from '@/lib/supabase/tasks';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus, Upload } from 'lucide-react';
import type { Category } from '@/types/database';

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const returnUrl = searchParams.get('return');
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
  const [belongingCourses, setBelongingCourses] = useState<string[]>([]);
  const [belongingLessons, setBelongingLessons] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    points: 0,
    media_required: false,
    allowed_media_types: ['image', 'video', 'audio', 'document'] as string[],
    max_file_size_mb: 200,
    max_files_count: 5,
    submission_type: 'either' as 'text_only' | 'media_only' | 'both' | 'either',
    text_submission_enabled: true,
    min_text_length: 0,
    max_text_length: 5000,
    text_submission_placeholder: 'Enter your response here...',
    text_submission_instructions: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryService.getCategories({ type: 'task' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating task with data:', formData);
      const newTask = await taskService.createTask(formData);
      console.log('Task created:', newTask);
      
      // Debug logging
      console.log('Selected courses:', belongingCourses);
      console.log('Selected lessons/sessions:', belongingLessons);
      
      // Add belonging relationships
      const relationshipPromises = [];
      
      // Add to courses
      for (let i = 0; i < belongingCourses.length; i++) {
        const courseId = belongingCourses[i];
        console.log(`Adding task ${newTask.id} to course ${courseId} at position ${i}`);
        relationshipPromises.push(
          taskService.addTaskToCourse(courseId, newTask.id, { position: i })
            .then(result => {
              console.log(`Successfully added to course ${courseId}:`, result);
              return result;
            })
            .catch(err => {
              console.error(`Failed to add to course ${courseId}:`, err);
              throw err;
            })
        );
      }
      
      // Add to lessons/sessions
      for (let i = 0; i < belongingLessons.length; i++) {
        const lessonId = belongingLessons[i];
        console.log(`Adding task ${newTask.id} to lesson ${lessonId} at position ${i}`);
        relationshipPromises.push(
          taskService.addTaskToLesson(lessonId, newTask.id, { position: i })
            .then(result => {
              console.log(`Successfully added to lesson ${lessonId}:`, result);
              return result;
            })
            .catch(err => {
              console.error(`Failed to add to lesson ${lessonId}:`, err);
              throw err;
            })
        );
      }
      
      if (relationshipPromises.length > 0) {
        console.log(`Saving ${relationshipPromises.length} relationships...`);
        const results = await Promise.all(relationshipPromises);
        console.log('All relationships saved:', results);
      } else {
        console.log('No relationships to save');
      }
      
      showSuccess('Task Created', 'The task has been created successfully.');
      setTimeout(() => {
        if (returnUrl) {
          router.push(decodeURIComponent(returnUrl));
        } else {
          router.push('/admin/tasks');
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to create task:', error);
      showError('Creation Failed', 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'task',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');

      await loadCategories();
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      
    } catch (error) {
      console.error("Failed to create task category:", error);
      alert('Failed to create category. Please try again.');
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (returnUrl) {
                  router.push(decodeURIComponent(returnUrl));
                } else {
                  router.push('/admin/tasks');
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {returnUrl ? 'Back' : 'Back to Tasks'}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
              <p className="text-gray-600 mt-1">Add a new task to the system</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Input
                label="Task Title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter task title"
                required
              />
              
              <Textarea
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter task description"
                rows={4}
              />
              
              <div className="flex gap-2">
                <Select
                  label="Category"
                  value={formData.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCategoryModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' }
                  ]}
                />
                
                <Input
                  label="Points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Relationships</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Belongs to Courses
                </label>
                <BelongingSelector
                  selectedCourses={belongingCourses}
                  selectedLessons={[]}
                  onCoursesChange={setBelongingCourses}
                  onLessonsChange={() => {}}
                  buttonLabel="Select Courses"
                  mode="courses-only"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Belongs to Sessions
                </label>
                <BelongingSelector
                  selectedCourses={[]}
                  selectedLessons={belongingLessons}
                  onCoursesChange={() => {}}
                  onLessonsChange={setBelongingLessons}
                  buttonLabel="Select Sessions"
                  mode="sessions-only"
                  filterCourses={belongingCourses}
                  showAllSessionsIfNoMatch={false}
                />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Submission Settings</h2>
            </Card.Header>
            <Card.Content className="space-y-6">
              {/* Submission Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Type
                </label>
                <Select
                  value={formData.submission_type}
                  onChange={(e) => {
                    const value = e.target.value as typeof formData.submission_type;
                    handleChange('submission_type', value);
                    // Auto-update related fields
                    if (value === 'text_only') {
                      handleChange('media_required', false);
                      handleChange('text_submission_enabled', true);
                    } else if (value === 'media_only') {
                      handleChange('media_required', true);
                      handleChange('text_submission_enabled', false);
                    } else if (value === 'both') {
                      handleChange('media_required', true);
                      handleChange('text_submission_enabled', true);
                    } else { // either
                      handleChange('media_required', false);
                      handleChange('text_submission_enabled', true);
                    }
                  }}
                  options={[
                    { value: 'text_only', label: 'Text Only' },
                    { value: 'media_only', label: 'Media Files Only' },
                    { value: 'both', label: 'Both Required (Text + Files)' },
                    { value: 'either', label: 'Either (Text or Files)' }
                  ]}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.submission_type === 'text_only' && 'Students can only submit text responses'}
                  {formData.submission_type === 'media_only' && 'Students can only upload files'}
                  {formData.submission_type === 'both' && 'Students must provide both text and file uploads'}
                  {formData.submission_type === 'either' && 'Students can choose to submit text, files, or both'}
                </p>
              </div>

              {/* Text Submission Settings */}
              {(formData.submission_type !== 'media_only') && (
                <div className="border-t pt-4">
                  <Textarea
                    label="Text Submission Instructions (Optional)"
                    value={formData.text_submission_instructions || ''}
                    onChange={(e) => handleChange('text_submission_instructions', e.target.value)}
                    placeholder="Provide specific instructions for the text submission..."
                    rows={3}
                  />
                </div>
              )}

              {/* Media Upload Settings */}
              {(formData.submission_type !== 'text_only') && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Media Upload Settings</h3>
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed File Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['image', 'video', 'audio', 'document'].map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={formData.allowed_media_types.includes(type)}
                            onChange={(checked) => {
                              if (checked) {
                                handleChange('allowed_media_types', [...formData.allowed_media_types, type]);
                              } else {
                                handleChange('allowed_media_types', formData.allowed_media_types.filter(t => t !== type));
                              }
                            }}
                          />
                          <label htmlFor={`type-${type}`} className="text-sm capitalize cursor-pointer">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Max File Size (MB)"
                      type="number"
                      value={formData.max_file_size_mb}
                      onChange={(e) => handleChange('max_file_size_mb', parseInt(e.target.value) || 100)}
                      min="1"
                      max="500"
                    />
                    
                    <Input
                      label="Max Number of Files"
                      type="number"
                      value={formData.max_files_count}
                      onChange={(e) => handleChange('max_files_count', parseInt(e.target.value) || 1)}
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">File Upload Information</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Images: JPG, PNG, GIF, WebP, SVG, BMP (max 50MB)</li>
                          <li>• Videos: MP4, WebM, MOV, AVI, MKV (max 200MB)</li>
                          <li>• Audio: MP3, WAV, M4A, OGG, AAC, FLAC (max 50MB)</li>
                          <li>• Documents: PDF, DOC, DOCX, TXT, PPT, XLS, ZIP, RAR (max 100MB)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (returnUrl) {
                  router.push(decodeURIComponent(returnUrl));
                } else {
                  router.push('/admin/tasks');
                }
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Create Task
            </Button>
          </div>
        </form>

        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Create New Category"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="h-10 w-full"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCategory}>
                Create Category
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}