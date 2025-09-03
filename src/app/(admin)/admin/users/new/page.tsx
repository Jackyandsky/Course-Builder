'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Lock, Users, GraduationCap, Phone, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import type { UserRole } from '@/types/user-management';

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as UserRole,
    grade_level: '',
    phone: '',
    parent_email: '',
    send_invitation: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.send_invitation && !formData.password) {
      newErrors.password = 'Password is required when not sending invitation';
    } else if (!formData.send_invitation && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.role === 'student' && formData.grade_level) {
      const grade = parseInt(formData.grade_level);
      if (isNaN(grade) || grade < 1 || grade > 12) {
        newErrors.grade_level = 'Grade must be between 1 and 12';
      }
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      newErrors.parent_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          grade_level: formData.grade_level ? parseInt(formData.grade_level) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Navigate to the user's profile page
      router.push(`/admin/users/${data.data.id}`);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Administrator' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-2xl font-bold">Create New User</h1>
        <p className="text-gray-600 mt-1">Add a new user to the system</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                error={errors.full_name}
                placeholder="John Doe"
                required
              />
              
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="User Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                options={roleOptions}
                required
              />
              
              {formData.role === 'student' && (
                <Input
                  label="Grade Level"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  error={errors.grade_level}
                  placeholder="1-12"
                />
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number (Optional)"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="+1 (555) 123-4567"
              />
              
              {formData.role === 'student' && (
                <Input
                  label="Parent Email (Optional)"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  error={errors.parent_email}
                  placeholder="parent@example.com"
                />
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Authentication */}
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Settings
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={formData.send_invitation}
                  onChange={(checked) => setFormData({ ...formData, send_invitation: checked })}
                />
                <div>
                  <p className="font-medium">Send invitation email</p>
                  <p className="text-sm text-gray-500">User will receive an email to set their password</p>
                </div>
              </label>
              
              {!formData.send_invitation && (
                <Input
                  label="Initial Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  placeholder="At least 6 characters"
                  required
                />
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm mb-6">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/admin/users')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={<UserPlus className="h-4 w-4" />}
            disabled={loading}
          >
            {loading ? 'Creating User...' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
}