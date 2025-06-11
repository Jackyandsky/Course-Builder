'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, BookOpen, Volume2, Image as ImageIcon,
  Grid, List, Users, Filter // Import Filter icon
} from 'lucide-react';
import { Vocabulary, DifficultyLevel } from '@/types/database';
import { vocabularyService, VocabularyFilters } from '@/lib/supabase/vocabulary';
import {
  Button, Card, Badge, SearchBox, FilterPanel, Spinner, Select
} from '@/components/ui';
import { cn } from '@/lib/utils';

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
  expert: 'primary',
};

export default function VocabularyPage() {
  const router = useRouter();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VocabularyFilters>({});
  const [stats, setStats] = useState({
    vocabulary: { total: 0, beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
    groups: { total: 0, beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [partsOfSpeech, setPartsOfSpeech] = useState<string[]>([]);
  // Add state to control the visibility of the filter panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // New state

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadVocabulary();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [statsData, partsData] = await Promise.all([
        vocabularyService.getVocabularyStats(),
        vocabularyService.getPartsOfSpeech(),
      ]);

      setStats(statsData);
      setPartsOfSpeech(partsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      const data = await vocabularyService.getVocabulary(filters);
      setVocabulary(data);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
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
      id: 'partOfSpeech',
      label: 'Part of Speech',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Parts' },
        ...partsOfSpeech.map(pos => ({ value: pos, label: pos.charAt(0).toUpperCase() + pos.slice(1) })),
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vocabulary</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your vocabulary words and groups
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
            onClick={() => router.push('/vocabulary/groups')}
            variant="outline"
            leftIcon={<Users className="h-4 w-4" />}
          >
            Groups
          </Button>
          <Button
            onClick={() => router.push('/vocabulary/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Word
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
                {stats.vocabulary.total}
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
                {stats.groups.total}
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
                  {stats.vocabulary[level.value] || 0}
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
              placeholder="Search by word, translation, or definition..."
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


      {/* Vocabulary Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : vocabulary.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No vocabulary found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start building your vocabulary by adding your first word.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/vocabulary/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Word
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vocabulary.map((word) => (
            <Card
              key={word.id}
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => router.push(`/vocabulary/${word.id}`)}
            >
              <Card.Content className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {word.word}
                    </h3>
                    {word.pronunciation && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {word.pronunciation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {word.audio_url && <Volume2 className="h-4 w-4 text-gray-400" />}
                    {word.image_url && <ImageIcon className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {word.translation && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {word.translation}
                  </p>
                )}

                {word.definition && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                    {word.definition}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={difficultyColors[word.difficulty] as any}
                      size="sm"
                    >
                      {word.difficulty}
                    </Badge>
                    {word.part_of_speech && (
                      <Badge variant="warning" size="sm">
                        {word.part_of_speech}
                      </Badge>
                    )}
                  </div>
                </div>

                {word.tags && word.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {word.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {word.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{word.tags.length - 2}
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
          {vocabulary.map((word) => (
            <Card
              key={word.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/vocabulary/${word.id}`)}
            >
              <Card.Content className="p-4">
                <div className="flex items-start gap-4">
                  {word.image_url ? (
                    <img
                      src={word.image_url}
                      alt={word.word}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {word.word}
                          </h3>
                          {word.audio_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const audio = new Audio(word.audio_url);
                                audio.play().catch(console.error);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {word.pronunciation && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {word.pronunciation}
                          </p>
                        )}
                        {word.translation && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {word.translation}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={difficultyColors[word.difficulty] as any}
                          size="sm"
                        >
                          {word.difficulty}
                        </Badge>
                        {word.part_of_speech && (
                          <Badge variant="warning" size="sm">
                            {word.part_of_speech}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {word.definition && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {word.definition}
                      </p>
                    )}

                    {word.example_sentence && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Example:</span> {word.example_sentence}
                      </div>
                    )}

                    {word.tags && word.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        {word.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                        {word.tags.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{word.tags.length - 4}
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