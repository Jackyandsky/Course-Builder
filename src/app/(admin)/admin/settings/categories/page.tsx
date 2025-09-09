'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Plus, Search, Edit2, Trash2, ChevronRight, ChevronLeft,
  Folder, FolderOpen, Tag, AlertCircle, Check,
  X, Filter, Grid3x3, List, ChevronDown
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
  itemCount?: number;
  level?: number;
  parent?: Category;
}

const CATEGORY_TYPES = [
  { value: 'course', label: 'Courses' },
  { value: 'book', label: 'Books' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'objective', label: 'Objectives' },
  { value: 'method', label: 'Methods' },
  { value: 'task', label: 'Tasks' },
  { value: 'content', label: 'Content', special: true }
];

const ITEMS_PER_PAGE = 10;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Store all categories for client-side filtering
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Separate initial loading state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'course',
    parent_id: '',
    grandparent_id: '', // For three-level classification
    color: '#3B82F6',
    icon: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Fetch all categories once and store them
  const fetchAllCategories = async () => {
    try {
      setInitialLoading(true);
      
      // First fetch without counts for faster initial load
      const response = await fetch('/api/categories?parent_id=null&skipCounts=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setAllCategories(data);
      setCategories(data);
      setInitialLoading(false);
      setLoading(false);

      // Then fetch with counts in background (non-blocking)
      fetchCategoriesWithCounts();
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('error', 'Failed to load categories');
      setInitialLoading(false);
      setLoading(false);
    }
  };

  // Fetch categories with counts in background
  const fetchCategoriesWithCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?parent_id=null');
      const data = await response.json();

      if (response.ok) {
        setAllCategories(data);
        setCategories(data);
      }
    } catch (error) {
      // Silent fail for background count update
      console.error('Error fetching category counts:', error);
    }
  }, []);

  // Client-side filtering function
  const filterCategories = useCallback(() => {
    let filtered = [...allCategories];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(cat => cat.type === selectedType);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchLower) ||
        (cat.description && cat.description.toLowerCase().includes(searchLower))
      );
    }

    setCategories(filtered);
  }, [allCategories, selectedType, searchTerm]);

  const fetchSubCategories = useCallback(async (parentId: string) => {
    try {
      // Fetch without expensive counts first for faster load
      const response = await fetch(`/api/categories?parent_id=${parentId}&skipCounts=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subcategories');
      }

      setSubCategories(data);
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      setCurrentPage(1);

      // Fetch with full counts in background (non-blocking)
      fetch(`/api/categories?parent_id=${parentId}`)
        .then(res => res.json())
        .then(fullData => {
          if (Array.isArray(fullData)) {
            setSubCategories(fullData);
          }
        })
        .catch(err => console.error('Error fetching subcategory counts:', err));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      showMessage('error', 'Failed to load subcategories');
    }
  }, []);

  const fetchParentCategories = async (type: string) => {
    try {
      const response = await fetch(`/api/categories?type=${type}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch parent categories');
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching parent categories:', error);
      return [];
    }
  };

  // Initial load - fetch all categories once
  useEffect(() => {
    fetchAllCategories();
  }, []); // Only on mount

  // Apply filters when search term or type changes (client-side)
  useEffect(() => {
    if (!initialLoading) {
      filterCategories();
    }
  }, [searchTerm, selectedType, filterCategories, initialLoading]);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory.id);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory, fetchSubCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Determine the actual parent_id based on three-level selection
      let actualParentId = formData.grandparent_id || formData.parent_id || null;
      
      const body = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        parent_id: actualParentId,
        color: formData.color,
        icon: formData.icon,
        ...(editingCategory && { id: editingCategory.id })
      };

      const response = await fetch('/api/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      showMessage('success', editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowModal(false);
      resetForm();
      // Refresh all categories after successful save
      await fetchAllCategories();
      if (selectedCategory) {
        fetchSubCategories(selectedCategory.id);
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      showMessage('error', error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }
      
      showMessage('success', 'Category deleted successfully');
      setShowDeleteConfirm(null);
      // Refresh all categories after successful delete
      await fetchAllCategories();
      if (selectedCategory) {
        fetchSubCategories(selectedCategory.id);
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showMessage('error', error.message || 'Failed to delete category');
      setShowDeleteConfirm(null);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
      parent_id: category.parent_id || '',
      grandparent_id: '', // Will be populated if needed
      color: category.color || '#3B82F6',
      icon: category.icon || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'course',
      parent_id: '',
      grandparent_id: '',
      color: '#3B82F6',
      icon: ''
    });
    setEditingCategory(null);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const paginatedSubCategories = subCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Categories Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Organize your content with hierarchical categories
            </p>
          </div>
          <Button onClick={() => {
            resetForm();
            setShowModal(true);
          }} variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {CATEGORY_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Root Categories */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Root Categories</h3>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No categories found</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                {categories.map(category => {
                  const categoryType = CATEGORY_TYPES.find(t => t.value === category.type);
                  const isSpecial = categoryType?.special;
                  
                  return (
                    <div
                      key={category.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                        ${selectedCategory?.id === category.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : isSpecial
                            ? 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isSpecial 
                              ? 'bg-purple-100 text-purple-700 font-semibold' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {categoryType?.label}
                          </span>
                          {category.childCount > 0 && (
                            <span className="text-xs text-gray-500">
                              ({category.childCount} subcategories)
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(category);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(category.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
              {categories.length > 10 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Scroll to see all {categories.length} categories
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Subcategories */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedCategory ? `Subcategories of "${selectedCategory.name}"` : 'Subcategories'}
          </h3>
          
          {!selectedCategory ? (
            <div className="text-center py-8">
              <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a category to view subcategories</p>
            </div>
          ) : subCategories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No subcategories found</p>
              <Button
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ 
                    ...prev, 
                    parent_id: selectedCategory.id,
                    type: selectedCategory.type 
                  }));
                  setShowModal(true);
                }}
                variant="secondary"
                size="sm"
                className="mt-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Subcategory
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {paginatedSubCategories.map(category => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 pl-4">
                            {category.name}
                          </h4>
                          {category.children && category.children.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ({category.children.length} items)
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1 pl-4 truncate">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(category.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Third level categories */}
                    {category.children && category.children.length > 0 && (
                      <div className="ml-8 mt-1 space-y-1">
                        {category.children.map(child => (
                          <div 
                            key={child.id}
                            className="flex items-center justify-between p-2 text-xs rounded border border-gray-100 hover:bg-gray-50"
                          >
                            <span className="text-gray-700 pl-4">{child.name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(child)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(child.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowDeleteConfirm(null)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Success/Error Messages */}
      {message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Enhanced Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  type: e.target.value,
                  parent_id: '',
                  grandparent_id: ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {CATEGORY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Three-level classification */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category (Optional)
              </label>
              <select
                value={formData.parent_id}
                onChange={async (e) => {
                  setFormData({ 
                    ...formData, 
                    parent_id: e.target.value,
                    grandparent_id: ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Root Category)</option>
                {categories
                  .filter(cat => cat.type === formData.type && cat.id !== editingCategory?.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            {formData.parent_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-parent Category (Optional - for 3rd level)
                </label>
                <select
                  value={formData.grandparent_id}
                  onChange={(e) => setFormData({ ...formData, grandparent_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (2nd level category)</option>
                  {subCategories
                    .filter(cat => cat.parent_id === formData.parent_id && cat.id !== editingCategory?.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (Optional)
            </label>
            <Input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Enter icon name or emoji"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}