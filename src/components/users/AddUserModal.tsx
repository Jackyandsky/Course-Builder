'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Users, GraduationCap, Phone, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { getUserGroups } from '@/lib/supabase/user-management';
import type { UserRole, UserGroup } from '@/types/user-management';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function AddUserModal({ isOpen, onClose, onUserCreated }: AddUserModalProps) {
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
  
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    const { data } = await getUserGroups();
    setGroups(data || []);
  };

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
          group_ids: selectedGroups,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      onUserCreated();
      handleClose();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      grade_level: '',
      phone: '',
      parent_email: '',
      send_invitation: true,
    });
    setSelectedGroups([]);
    setErrors({});
    onClose();
  };

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Administrator' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New User" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </h3>
          
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
              label="Email"
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
              label="Role"
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
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />
            
            {formData.role === 'student' && (
              <Input
                label="Parent Email"
                type="email"
                value={formData.parent_email}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                error={errors.parent_email}
                placeholder="parent@example.com"
              />
            )}
          </div>
        </div>

        {/* Group Assignment */}
        {groups.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Assignment
            </h3>
            
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center gap-3 py-2 hover:bg-gray-50 px-2 rounded">
                  <Checkbox
                    checked={selectedGroups.includes(group.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedGroups([...selectedGroups, group.id]);
                      } else {
                        setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{group.name}</p>
                    {group.code && <p className="text-sm text-gray-500">Code: {group.code}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Authentication */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication
          </h3>
          
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
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                placeholder="At least 6 characters"
                required
              />
            )}
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={<UserPlus className="h-4 w-4" />}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}