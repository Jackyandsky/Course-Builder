'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Package, Key, Box } from 'lucide-react';
import { ClipboardList as ClipboardCheck } from 'lucide-react';
import { contentService } from '@/lib/supabase/content';
import { ProprietaryProductCategory } from '@/types/content';
import { Button, Card, Input, Textarea, Spinner, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';


// Available icons for categories
const availableIcons = [
  { name: 'key', icon: Key, label: 'Key' },
  { name: 'box', icon: Box, label: 'Box' },
  { name: 'clipboard-check', icon: ClipboardCheck, label: 'Clipboard Check' },
  { name: 'package', icon: Package, label: 'Package' },
];

export default function ProprietaryCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProprietaryProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProprietaryProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'package',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await contentService.getProprietaryProductCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category - would need to implement updateCategory in contentService
        console.log('Update not implemented yet');
      } else {
        // Create new category
        await contentService.createProprietaryProductCategory(formData);
      }
      
      setShowForm(false);
      setFormData({ name: '', description: '', color: '#3B82F6', icon: 'package' });
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleEdit = (category: ProprietaryProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || 'package',
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" category? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await contentService.deleteProprietaryProductCategory(categoryId);
      // Refresh the categories list
      loadCategories();
      // Optionally show a success message
      console.log(`Successfully deleted category: ${categoryName}`);
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.message || 'Failed to delete category. Please try again.');
    }
  };

  const getIconComponent = (iconName?: string) => {
    const iconData = availableIcons.find(i => i.name === iconName);
    const IconComponent = iconData?.icon || Package;
    return <IconComponent className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proprietary Product Categories</h1>
          <p className="text-gray-600 mt-2">Manage categories for proprietary products</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Study Guides"
              required
            />
            
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={3}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-full rounded-md border border-gray-300 cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableIcons.map((iconData) => (
                  <button
                    key={iconData.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconData.name })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1',
                      formData.icon === iconData.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <iconData.icon className="h-5 w-5" />
                    <span className="text-xs">{iconData.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setFormData({ name: '', description: '', color: '#3B82F6', icon: 'package' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">
              No categories yet. Create your first proprietary product category.
            </p>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: category.color + '20', color: category.color }}
                  >
                    {getIconComponent(category.icon)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                    {category.content_count !== undefined && (
                      <Badge variant="outline" size="sm" className="mt-1">
                        {category.content_count} items
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/${category.name.toLowerCase().replace(/\s+/g, '-')}`)}
              >
                View Content
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}