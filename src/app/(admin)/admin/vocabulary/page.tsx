'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, BookOpen, Volume2, Image as ImageIcon,
  Grid, List, Users, Filter, Globe, Lock // Import Filter, Globe, and Lock icons
} from 'lucide-react';
import { Vocabulary, VocabularyGroup, DifficultyLevel } from '@/types/database';

interface VocabularyGroupFilters {
  search?: string;
  difficulty?: DifficultyLevel;
  language?: string;
  targetLanguage?: string;
  categoryId?: string;
  tags?: string[];
  isPublic?: boolean;
}
import {
  Button, Card, Badge, SearchBox, FilterPanel, Spinner, Select
} from '@/components/ui';
import { cn } from '@/lib/utils';

const difficultyColors: Record<DifficultyLevel, string> = {
  basic: 'success',
  standard: 'warning',
  premium: 'danger',
};

export default function VocabularyPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<(VocabularyGroup & { vocabulary_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState<VocabularyGroupFilters>({});
  const [stats, setStats] = useState({
    vocabulary: { total: 0, basic: 0, standard: 0, premium: 0 },
    groups: { total: 0, basic: 0, standard: 0, premium: 0 }
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [languages, setLanguages] = useState<string[]>([]);
  // Add state to control the visibility of the filter panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // New state

  useEffect(() => {
    let mounted = true;
    
    // Immediately set loading to false after a short delay to prevent blocking
    const quickLoadTimer = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 100);
    
    // Load initial data
    const init = async () => {
      if (mounted) {
        try {
          // Always reload stats when component mounts or remounts
          setStatsLoading(true);
          await Promise.all([
            loadInitialData().catch(console.error),
            loadStats().catch(console.error)
          ]);
        } catch (error) {
          console.error('Initialization error:', error);
          if (mounted) {
            setLoading(false);
            setStatsLoading(false);
          }
        }
      }
    };
    
    init();
    
    // Also reload stats when page becomes visible (handles back navigation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        setStatsLoading(true);
        loadStats().catch(console.error);
      }
    };
    
    const handleFocus = () => {
      if (mounted) {
        setStatsLoading(true);
        loadStats().catch(console.error);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      mounted = false;
      clearTimeout(quickLoadTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (filters.search !== undefined || filters.difficulty || filters.categoryId) {
      loadGroups();
    }
  }, [filters]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/vocabulary?operation=stats', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const stats = await response.json();
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        vocabulary: { total: 0, basic: 0, standard: 0, premium: 0 },
        groups: { total: 0, basic: 0, standard: 0, premium: 0 }
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const response = await fetch('/api/admin/vocabulary?viewType=groups', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary data');
      }
      
      const { data } = await response.json();
      
      setGroups(data.vocabularyGroups || []);
      setLanguages(data.languages || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setGroups([]);
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      
      // Set a maximum timeout for loading states
      const loadingTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000);
      
      const params = new URLSearchParams();
      params.append('viewType', 'groups');
      if (filters.search) params.append('search', filters.search);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);

      const response = await fetch(`/api/admin/vocabulary?${params}`, {
        signal: AbortSignal.timeout(5000)
      });
      
      clearTimeout(loadingTimeout);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary groups');
      }
      
      const { data } = await response.json();
      setGroups(data.vocabularyGroups || []);
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

  const difficultyLevels = [
    { value: 'basic', label: 'Basic', color: 'green' },
    { value: 'standard', label: 'Standard', color: 'yellow' },
    { value: 'premium', label: 'Premium', color: 'purple' },
  ];

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
        ...languages.map(lang => ({ value: lang, label: lang.charAt(0).toUpperCase() + lang.slice(1) })),
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vocabulary Groups</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your vocabulary groups and collections
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
            onClick={() => router.push('/admin/vocabulary/individual')}
            variant="outline"
            leftIcon={<BookOpen className="h-4 w-4" />}
          >
            Individual Words
          </Button>
          <Button
            onClick={() => router.push('/admin/vocabulary/groups/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Group
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Words</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {statsLoading ? <Spinner size="sm" /> : stats.vocabulary.total}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Groups</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {statsLoading ? <Spinner size="sm" /> : stats.groups.total}
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
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
                  {statsLoading ? <Spinner size="sm" /> : (stats.vocabulary[level.value as keyof typeof stats.vocabulary] || 0)}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full bg-${level.color}-500`}></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters - Modified section */}
      <div className="space-y-4"> {/* Changed from flex flex-col lg:flex-row gap-4 to space-y-4 */}
        <div className="flex flex-col sm:flex-row gap-4"> {/* Changed from flex-1 to flex-col sm:flex-row gap-4 */}
          <div className="flex-1">
            <SearchBox
              placeholder="Search groups by name or description..."
              onSearch={handleSearch}
              fullWidth
            />
          </div>
          {/* Add a button to toggle the filter panel */}
          <Button
            variant="outline"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {/* Conditionally render the FilterPanel */}
        {isFilterPanelOpen && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <FilterPanel
              filters={filterGroups}
              values={filters}
              onChange={handleFilterChange}
              onReset={() => setFilters({})}
              collapsible={false}
              // className="h-full" // Removed this className as it might conflict with conditional rendering
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No vocabulary groups found</h3>
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
          {groups.map((group) => (
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
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{group.vocabulary_count || 0} words</span>
                      {group.language && (
                        <>
                          <span>•</span>
                          <span>{group.language}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {group.is_public ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={difficultyColors[group.difficulty] as any}
                      size="sm"
                    >
                      {group.difficulty}
                    </Badge>
                    {group.target_language && group.target_language !== group.language && (
                      <Badge variant="info" size="sm">
                        → {group.target_language}
                      </Badge>
                    )}
                  </div>
                </div>

                {group.tags && group.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
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
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/vocabulary/groups/${group.id}`)}
            >
              <Card.Content className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
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
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <span>{group.vocabulary_count || 0} words</span>
                          {group.language && (
                            <>
                              <span>•</span>
                              <span>{group.language}</span>
                            </>
                          )}
                          {group.target_language && group.target_language !== group.language && (
                            <>
                              <span>→</span>
                              <span>{group.target_language}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={difficultyColors[group.difficulty] as any}
                          size="sm"
                        >
                          {group.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {group.description}
                      </p>
                    )}

                    {group.tags && group.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        {group.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                        {group.tags.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{group.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}