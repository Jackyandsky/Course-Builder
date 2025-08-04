'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { SearchBox } from '@/components/ui/SearchBox';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    role?: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState('student');

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Note: This is a simplified version. In production, you'd need proper
      // server-side API endpoints to fetch users from auth.users table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        // For now, we'll show a message that user management needs backend setup
      }
      
      setUsers([]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditRole(user.user_metadata?.role || 'student');
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      // In production, this would be an API call to update user role
      console.log('Update user role:', selectedUser.id, editRole);
      setIsEditModalOpen(false);
      // Reload users after update
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'student', label: 'Students' },
    { value: 'tutor', label: 'Tutors' },
    { value: 'admin', label: 'Administrators' },
  ];

  const userRoleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'tutor', label: 'Tutor' },
    { value: 'admin', label: 'Administrator' },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.user_metadata?.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      render: (user: UserData) => (
        <div>
          <p className="font-medium">{user.user_metadata?.full_name || 'N/A'}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role',
      render: (user: UserData) => {
        const role = user.user_metadata?.role || 'student';
        const variants = {
          admin: 'danger' as const,
          tutor: 'primary' as const,
          student: 'secondary' as const,
        };
        return (
          <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
            {role}
          </Badge>
        );
      }
    },
    { 
      key: 'created_at', 
      label: 'Joined',
      render: (user: UserData) => new Date(user.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: UserData) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage students, tutors, and administrators</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Add User
        </Button>
      </div>

      <Card>
        <Card.Content className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <SearchBox
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={() => {}}
              />
            </div>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              options={roleOptions}
              className="w-48"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : users.length > 0 ? (
            <Table
              columns={columns}
              data={filteredUsers}
            />
          ) : (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">User management requires backend setup</p>
              <p className="text-sm text-gray-500 mt-2">
                To manage users, you need to set up proper API endpoints with admin privileges
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Role"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">User</p>
              <p className="font-medium">{selectedUser.user_metadata?.full_name || selectedUser.email}</p>
            </div>
            
            <Select
              label="Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              options={userRoleOptions}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole}>
                Update Role
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}