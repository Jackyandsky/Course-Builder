'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { methodService } from '@/lib/supabase/methods';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { SearchBox } from '@/components/ui/SearchBox';
import { Spinner } from '@/components/ui/Spinner';
import { 
  Settings,
  Plus,
  Trash2,
  Search,
  ExternalLink
} from 'lucide-react';

interface CourseMethodManagerProps {
  courseId: string;
  onUpdate?: () => void;
}

export function CourseMethodManager({ courseId, onUpdate }: CourseMethodManagerProps) {
  const router = useRouter();
  const [methods, setMethods] = useState<any[]>([]);
  const [courseMethods, setCourseMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMethods, courseMethodRelations] = await Promise.all([
        methodService.getMethodsWithBelongings({}),
        methodService.getCourseMethods(courseId)
      ]);
      
      setMethods(allMethods);
      setCourseMethods(courseMethodRelations);
    } catch (error) {
      console.error('Failed to load methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMethods = methods.filter(method => 
    !courseMethods.some(cm => cm.method.id === method.id) &&
    (method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     method.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     method.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddMethods = async () => {
    if (selectedMethods.length === 0) return;

    setAdding(true);
    try {
      for (const methodId of selectedMethods) {
        await methodService.addMethodToCourse(courseId, methodId, {
          position: courseMethods.length + selectedMethods.indexOf(methodId)
        });
      }
      
      setShowAddModal(false);
      setSelectedMethods([]);
      setSearchTerm('');
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add methods to course:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMethod = async (relationId: string) => {
    try {
      await methodService.removeMethodFromCourse(relationId);
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove method from course:', error);
    }
  };

  const toggleMethodSelection = (methodId: string) => {
    setSelectedMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Course Methods
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {courseMethods.length} method{courseMethods.length !== 1 ? 's' : ''} assigned to this course
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Methods
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/methods/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New
          </Button>
        </div>
      </div>

      {/* Course Methods List */}
      {courseMethods.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No methods assigned
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add teaching methods to guide instructional approaches for this course
          </p>
          <Button 
            className="mt-4" 
            size="sm"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Methods
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courseMethods
            .sort((a, b) => a.position - b.position)
            .map((courseMethod) => (
              <Card key={courseMethod.id} className="hover:shadow-md transition-shadow">
                <Card.Content className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">
                          {courseMethod.method.name}
                        </h4>
                        {courseMethod.method.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: courseMethod.method.category.color ? `${courseMethod.method.category.color}20` : undefined,
                              color: courseMethod.method.category.color || undefined,
                            }}
                          >
                            {courseMethod.method.category.name}
                          </span>
                        )}
                      </div>
                      
                      {courseMethod.method.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {courseMethod.method.description}
                        </p>
                      )}
                      
                      {courseMethod.method.tags && courseMethod.method.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {courseMethod.method.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/methods/${courseMethod.method.id}/edit`)}
                        leftIcon={<ExternalLink className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMethod(courseMethod.id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
        </div>
      )}

      {/* Add Methods Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedMethods([]);
          setSearchTerm('');
        }}
        title="Add Methods to Course"
        size="lg"
      >
        <div className="space-y-4">
          <SearchBox
            placeholder="Search methods..."
            onSearch={setSearchTerm}
            defaultValue={searchTerm}
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No methods found matching your search.' : 'All available methods are already added to this course.'}
              </div>
            ) : (
              filteredMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethods.includes(method.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => toggleMethodSelection(method.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMethods.includes(method.id)}
                      onChange={() => toggleMethodSelection(method.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{method.name}</h5>
                        {method.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: method.category.color ? `${method.category.color}20` : undefined,
                              color: method.category.color || undefined,
                            }}
                          >
                            {method.category.name}
                          </span>
                        )}
                      </div>
                      {method.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {method.description}
                        </p>
                      )}
                      {method.tags && method.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {method.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            {selectedMethods.length} method{selectedMethods.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedMethods([]);
                setSearchTerm('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMethods}
              disabled={selectedMethods.length === 0 || adding}
              leftIcon={adding ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
            >
              {adding ? 'Adding...' : `Add ${selectedMethods.length} Method${selectedMethods.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}