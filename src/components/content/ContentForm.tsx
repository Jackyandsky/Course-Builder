'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Book as BookIcon, Tag } from 'lucide-react';
import { Button, Card, Input, Textarea, Select, Checkbox, Badge } from '@/components/ui';
import { bookService } from '@/lib/supabase/books';
import { contentService } from '@/lib/supabase/content';
import { Book } from '@/types/database';
import { Content, CreateContentData, UpdateContentData } from '@/types/content';
import { cn } from '@/lib/utils';

interface ContentFormProps {
  initialData?: Content;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export function ContentForm({ initialData, categoryId, categoryName, categorySlug }: ContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.content || '',
    usage_instructions: initialData?.content_data?.usage_instructions || '',
    book_id: initialData?.book_id || '',
    is_public: initialData?.is_public || false,
    featured: initialData?.featured || false,
    status: initialData?.status || 'active',
    tags: initialData?.tags || [],
    notes: initialData?.content_data?.notes || '',
    price: initialData?.content_data?.price || '',
    duration: initialData?.content_data?.duration || '',
    level: initialData?.content_data?.level || '',
    show_on_menu: initialData?.show_on_menu || false,
    show_on_homepage: initialData?.show_on_homepage || false,
    menu_order: initialData?.menu_order || 0,
    homepage_order: initialData?.homepage_order || 0,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await bookService.getBooks();
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = `${categoryName.slice(0, -1)} name is required`;
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.book_id) {
      newErrors.book_id = 'Please select a book';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const contentData = {
        name: formData.name.trim(),
        content: formData.description.trim(),
        category_id: categoryId,
        book_id: formData.book_id,
        is_public: formData.is_public,
        featured: formData.featured,
        status: formData.status as 'active' | 'draft' | 'archived',
        tags: formData.tags,
        show_on_menu: formData.show_on_menu,
        show_on_homepage: formData.show_on_homepage,
        menu_order: formData.menu_order,
        homepage_order: formData.homepage_order,
        content_data: {
          type: categoryName.toLowerCase().slice(0, -1) as any,
          usage_instructions: formData.usage_instructions.trim(),
          notes: formData.notes.trim(),
          price: formData.price,
          duration: formData.duration,
          level: formData.level,
        },
      };

      if (isEditing) {
        await contentService.updateContent({ 
          id: initialData.id, 
          ...contentData 
        } as UpdateContentData);
      } else {
        await contentService.createContent(contentData as CreateContentData);
      }
      
      router.push(`/admin/${categorySlug}`);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to save content:', error);
      setErrors({ submit: error.message || 'Failed to save content. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <Card>
        <Card.Header>
          <Card.Title>Basic Information</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <Input
            label={`${categoryName.slice(0, -1)} Name`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder={`Enter ${categoryName.toLowerCase().slice(0, -1)} name`}
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            placeholder={`Describe this ${categoryName.toLowerCase().slice(0, -1)}`}
            rows={4}
            required
          />
          
          <Textarea
            label="Usage Instructions"
            value={formData.usage_instructions}
            onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
            placeholder={`How to use this ${categoryName.toLowerCase().slice(0, -1)}`}
            rows={4}
          />
          
          <Select
            label="Associated Book"
            value={formData.book_id}
            onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
            error={errors.book_id}
            required
          >
            <option value="">Select a book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author}
              </option>
            ))}
          </Select>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Additional Details</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes or information"
            rows={3}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Price (optional)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g., $29.99"
            />
            
            <Input
              label="Duration (optional)"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 2 hours"
            />
            
            <Input
              label="Level (optional)"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              placeholder="e.g., Beginner"
            />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Tags</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <Card.Header>
          <Card.Title>Visibility Settings</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="show_on_menu"
                checked={formData.show_on_menu}
                onChange={(e) => setFormData({ ...formData, show_on_menu: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show_on_menu" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show in Navigation Menu
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="show_on_homepage"
                checked={formData.show_on_homepage}
                onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show_on_homepage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show on Homepage
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Menu Order"
              value={formData.menu_order}
              onChange={(e) => setFormData({ ...formData, menu_order: parseInt(e.target.value) || 0 })}
              helperText="Lower numbers appear first in menu"
              disabled={!formData.show_on_menu}
            />
            
            <Input
              type="number"
              label="Homepage Order"
              value={formData.homepage_order}
              onChange={(e) => setFormData({ ...formData, homepage_order: parseInt(e.target.value) || 0 })}
              helperText="Lower numbers appear first on homepage"
              disabled={!formData.show_on_homepage}
            />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Settings</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'draft' | 'archived' })}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          
          <div className="space-y-2">
            <Checkbox
              id="is_public"
              checked={formData.is_public}
              onChange={(checked) => setFormData({ ...formData, is_public: checked })}
              label="Make this content public"
            />
            
            <Checkbox
              id="featured"
              checked={formData.featured}
              onChange={(checked) => setFormData({ ...formData, featured: checked })}
              label="Feature this content"
            />
          </div>
        </Card.Content>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push(`/admin/${categorySlug}`)}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          loading={loading} 
          leftIcon={<Save className="h-4 w-4" />}
        >
          {isEditing ? 'Update' : 'Create'} {categoryName.slice(0, -1)}
        </Button>
      </div>
    </form>
  );
}