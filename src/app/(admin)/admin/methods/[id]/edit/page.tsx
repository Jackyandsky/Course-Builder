'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Input, Textarea, Select, Spinner, Badge, Modal, BelongingSelector } from '@/components/ui';
import { methodService } from '@/lib/supabase/methods';
import { categoryService } from '@/lib/supabase/categories';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import type { Category, Method } from '@/types/database';

export default function EditMethodPage() {
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    tags: [] as string[],
    belongingCourses: [] as string[],
    belongingLessons: [] as string[],
  });

  useEffect(() => {
    Promise.all([loadMethod(), loadCategories()]);
  }, [methodId]);

  const loadMethod = async () => {
    try {
      const method = await methodService.getMethod(methodId);
      
      // Load belonging relationships
      const methodWithBelongings = await methodService.getMethodsWithBelongings({ search: '', tags: [] });
      const currentMethod = methodWithBelongings.find(m => m.id === methodId);
      
      setFormData({
        name: method.name,
        description: method.description || '',
        category_id: method.category_id || '',
        tags: method.tags || [],
        belongingCourses: (currentMethod as any)?.belongingCourses?.map((c: any) => c.id) || [],
        belongingLessons: (currentMethod as any)?.belongingLessons?.map((l: any) => l.id) || [],
      });
    } catch (error) {
      console.error('Failed to load method:', error);
      alert('Failed to load method');
      router.push('/admin/methods');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories({ type: 'method' });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a method name');
      return;
    }

    setLoading(true);
    try {
      // Update the method
      await methodService.updateMethod({ 
        id: methodId, 
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || undefined,
        tags: formData.tags,
      });

      // Update belonging relationships
      // First, remove all existing relationships
      try {
        await methodService.removeMethodFromAllCourses(methodId);
        await methodService.removeMethodFromAllLessons(methodId);
      } catch (removeError) {
        console.error('Failed to remove existing relationships (non-fatal):', removeError);
      }

      // Add to selected courses
      try {
        for (const courseId of formData.belongingCourses) {
          await methodService.addMethodToCourse(courseId, methodId, { position: 0 });
        }
      } catch (courseError) {
        console.error('Failed to add to courses (non-fatal):', courseError);
      }

      // Add to selected lessons
      try {
        for (const lessonId of formData.belongingLessons) {
          await methodService.addMethodToLesson(lessonId, methodId, { position: 0 });
        }
      } catch (lessonError) {
        console.error('Failed to add to lessons (non-fatal):', lessonError);
      }

      router.push('/admin/methods');
    } catch (error) {
      console.error('Failed to update method:', error);
      alert('Failed to update method. Please try again.');
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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.createCategory({
        name: newCategoryName,
        type: 'method',
        color: newCategoryColor,
      });

      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');

      // Reload categories specifically to ensure fresh data
      const freshCategories = await categoryService.getCategories({ type: 'method' });
      setCategories(freshCategories);
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      
    } catch (error) {
      console.error("Failed to create method category:", error);
      alert('Failed to create category. Please try again.');
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Method edit content */}
    </div>
  );
}