'use client';

import { useState, useEffect } from 'react';
import { contentService } from '@/lib/supabase/content';
import { ProprietaryProductCategory } from '@/types/content';
import { Button, Card, Spinner, Modal, Input, Textarea, Badge } from '@/components/ui';

export default function SimpleProprietaryCategoriesPage() {
  const [categories, setCategories] = useState<ProprietaryProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await contentService.getProprietaryProductCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proprietary Product Categories</h1>
          <p className="text-gray-600 mt-2">Found {categories.length} categories</p>
        </div>
        <Button size="lg" onClick={() => setShowModal(true)}>
          Add Category
        </Button>
      </div>
      
      <div className="grid gap-4">
        {categories.map(cat => (
          <Card key={cat.id} className="p-4">
            <h3 className="font-semibold">{cat.name}</h3>
            <p className="text-gray-600">{cat.description || 'No description'}</p>
          </Card>
        ))}
      </div>
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Category"
      >
        <form className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g., Study Guides"
            required
          />
          <Textarea
            label="Description"
            placeholder="Brief description of this category"
            rows={3}
          />
          <Button type="submit">Create Category</Button>
        </form>
      </Modal>
    </div>
  );
}