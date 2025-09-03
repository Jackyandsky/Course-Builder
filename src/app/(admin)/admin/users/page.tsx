'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Upload, Filter, Search, GraduationCap, Eye, ShoppingCart, Calendar } from 'lucide-react';
import type { UserProfile, UserRole, UserGroup } from '@/types/user-management';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRole !== 'all') params.append('role', selectedRole);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const { data } = await response.json();
      setUsers(data.users);
      
      // Set empty groups array for now - can be enhanced later with a separate API
      setGroups([]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search)
    );
  });

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'student', label: 'Students' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'parent', label: 'Parents' },
    { value: 'admin', label: 'Administrators' },
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      render: (user: UserProfile) => (
        <div
          onClick={() => router.push(`/admin/users/${user.id}`)}
          className="cursor-pointer"
        >
          <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
          <p className="text-sm text-gray-600">{user.email || `ID: ${user.id.slice(0, 8)}...`}</p>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role',
      render: (user: UserProfile) => {
        const variants = {
          admin: 'danger' as const,
          teacher: 'primary' as const,
          student: 'secondary' as const,
          parent: 'success' as const,
          guest: 'outline' as const,
        };
        return (
          <Badge variant={variants[user.role] || 'secondary'}>
            {user.role}
          </Badge>
        );
      }
    },
    { 
      key: 'grade_level', 
      label: 'Grade',
      render: (user: UserProfile) => user.grade_level ? `Grade ${user.grade_level}` : '-'
    },
    { 
      key: 'created_at', 
      label: 'Joined',
      render: (user: UserProfile) => new Date(user.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: UserProfile) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/users/${user.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage students, teachers, parents, and administrators</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            leftIcon={<GraduationCap className="h-4 w-4" />}
            onClick={() => router.push('/admin/enrollments')}
          >
            Enrollments
          </Button>
          <Button 
            variant="secondary"
            leftIcon={<Calendar className="h-4 w-4" />}
            onClick={() => router.push('/admin/bookings')}
          >
            Bookings
          </Button>
          <Button 
            variant="secondary"
            leftIcon={<ShoppingCart className="h-4 w-4" />}
            onClick={() => router.push('/admin/orders')}
          >
            Orders
          </Button>
          <Button 
            variant="secondary"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => setShowBulkImportModal(true)}
          >
            Bulk Import
          </Button>
          <Button 
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => router.push('/admin/users/new')}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'student').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'teacher').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Parents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'parent').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Groups</p>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <Card.Content className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
              options={roleOptions}
              className="w-48"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Spinner size="lg" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table
              columns={columns}
              data={filteredUsers}
              className="cursor-pointer"
            />
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search criteria' : 'Create your first user to get started'}
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Bulk Import Users</h3>
            <p className="text-gray-600 mb-4">Bulk import functionality would go here.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulkImportModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowBulkImportModal(false)}>
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}