'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Users, BookOpen, Globe, Lock,
  Grid, List, Filter // Changed from Filter2 to Filter
} from 'lucide-react';
import { VocabularyGroup, DifficultyLevel } from '@/types/database';
import { vocabularyService, VocabularyGroupFilters } from '@/lib/supabase/vocabulary';
import { categoryService } from '@/lib/supabase/categories';
import {
  Button, Card, Badge, SearchBox, FilterPanel, Spinner, Select
} from '@/components/ui';
import { cn } from '@/lib/utils';

const difficultyColors: Record<DifficultyLevel, string> = {
  basic: 'success',
  standard: 'warning',
  premium: 'danger',
};

export default function VocabularyGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<(VocabularyGroup & { vocabulary_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VocabularyGroupFilters>({});
  const [stats, setStats] = useState({
    vocabulary: { total: 0, basic: 0, standard: 0, premium: 0 },
    groups: { total: 0, basic: 0, standard: 0, premium: 0 }
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  // Add state to control the visibility of the filter panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // NEW STATE

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadGroups();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [statsData, languagesData, categoriesData] = await Promise.all([
        vocabularyService.getVocabularyStats(),
        vocabularyService.getLanguages(),
        categoryService.getCategories({ type: 'vocabulary' }),
      ]);

      setStats(statsData);
      setLanguages(languagesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await vocabularyService.getVocabularyGroups(filters);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load vocabulary groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters({ ...filters, [filterId]: value });
  };

  const difficultyLevels = vocabularyService.getDifficultyLevels();

  const filterGroups = [
    {
      id: 'difficulty',
      label: 'Difficulty',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Levels' },
        ...difficultyLevels.map(level => ({ value: level.value, label: level.label })),
      ],
    },
    {
      id: 'language',
      label: 'Language',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Languages' },
        ...languages.map(lang => ({ value: lang, label: lang.toUpperCase() })),
      ],
    },
    {
      id: 'categoryId',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Categories' },
        ...categories.map(cat => ({ value: cat.id, label: cat.name })),
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vocabulary Groups</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Organize your vocabulary into themed groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded",
                viewMode === 'grid'
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded",
                viewMode === 'list'
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => router.push('/admin/vocabulary')}
            variant="outline"
            leftIcon={<BookOpen className="h-4 w-4" />}
          >
            Words
          </Button>
          <Button
            onClick={() => router.push('/admin/vocabulary/groups/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Group
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Groups</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.groups.total}
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Words</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.vocabulary.total}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        {difficultyLevels.slice(0, 4).map((level) => (
          <Card key={level.value} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {level.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.groups[level.value] || 0}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full bg-${level.color}-500`}></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters - MODIFIED SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBox
              placeholder="Search by group name or description..."
              onSearch={handleSearch}
              fullWidth
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {isFilterPanelOpen && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <FilterPanel
              filters={filterGroups}
              values={filters}
              onChange={handleFilterChange}
              onReset={() => setFilters({})}
              collapsible={false}
              // className="h-full" // Removed this className
            />
          </div>
        )}
      </div>

      {/* Groups Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No groups found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start organizing your vocabulary by creating your first group.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/vocabulary/groups/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Group
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => {
            const relatedBooks = group.vocabulary_group_books?.map(vgb => vgb.book).filter(Boolean) || [];
            return (
              <Card
                key={group.id}
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/admin/vocabulary/groups/${group.id}`)}
              >
                <Card.Content className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {group.vocabulary_count} words
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {group.is_public ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={difficultyColors[group.difficulty] as any}
                        size="sm"
                      >
                        {group.difficulty}
                      </Badge>
                      <Badge variant="warning" size="sm">
                        {group.language.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {group.target_language && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Target: {group.target_language.toUpperCase()}
                    </p>
                  )}

                  {relatedBooks.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Related Books ({relatedBooks.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {relatedBooks.slice(0, 2).map((book) => book && (
                          <Badge
                            key={book.id}
                            variant="outline"
                            className="text-xs px-1 py-0.5"
                            title={book.title}
                          >
                            {book.title.length > 15 ? `${book.title.substring(0, 15)}...` : book.title}
                          </Badge>
                        ))}
                        {relatedBooks.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                            +{relatedBooks.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {group.category && (
                    <div className="mb-3">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: group.category.color ? `${group.category.color}20` : undefined,
                          color: group.category.color || undefined,
                        }}
                      >
                        {group.category.name}
                      </span>
                    </div>
                  )}

                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {group.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {group.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{group.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const relatedBooks = group.vocabulary_group_books?.map(vgb => vgb.book).filter(Boolean) || [];
            return (
              <Card
                key={group.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/vocabulary/groups/${group.id}`)}
              >
                <Card.Content className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-lg flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {group.name}
                            </h3>
                            {group.is_public ? (
                              <Globe className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {group.vocabulary_count} words
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={difficultyColors[group.difficulty] as any}
                            size="sm"
                          >
                            {group.difficulty}
                          </Badge>
                          <Badge variant="warning" size="sm">
                            {group.language.toUpperCase()}
                          </Badge>
                          {group.target_language && (
                            <Badge variant="warning" size="sm">
                              → {group.target_language.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {group.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {relatedBooks.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Related Books ({relatedBooks.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {relatedBooks.slice(0, 4).map((book) => book && (
                              <Badge
                                key={book.id}
                                variant="outline"
                                className="text-xs"
                                title={book.title}
                              >
                                {book.title}
                              </Badge>
                            ))}
                            {relatedBooks.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{relatedBooks.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {group.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: group.category.color ? `${group.category.color}20` : undefined,
                              color: group.category.color || undefined,
                            }}
                          >
                            {group.category.name}
                          </span>
                        )}
                        {group.tags && group.tags.length > 0 && (
                          <>
                            {group.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {group.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{group.tags.length - 3}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}