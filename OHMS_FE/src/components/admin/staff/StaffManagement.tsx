import React, { useState, useEffect } from 'react';
import StaffList from './StaffList';
import StaffForm from './StaffForm';
import { fetchCreateUser } from '../../../utils/fetchFromAPI';

interface User {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  imageUrl: string | null;
  roles: Array<{
    name: string;
    description: string | null;
    permissions: any[];
  }>;
  medicleSpecially: string[] | null;
}

interface ApiResponse {
  code: number;
  results: User[];
}

interface UpdateResponse {
  code: number;
  results: User;
}

const StaffManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('http://localhost:8080/users/getListUser', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.code === 200) {
        // Filter only users with STAFF role
        const staffUsers = data.results.filter(user => 
          user.roles.some(role => role.name === 'STAFF')
        );
        setUsers(staffUsers);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await fetch(`http://localhost:8080/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refresh the list after successful deletion
          fetchUsers();
        } else {
          throw new Error('Failed to delete user');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleFormSubmit = async (userData: Partial<User>) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      if (editingUser) {
        // Update existing user using PATCH API
        const formData = new FormData();
        
        // Add all user data fields to FormData
        Object.entries(userData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key === 'medicleSpecially' && Array.isArray(value)) {
              // Handle medicleSpecially array (used for staff positions) - send each value as separate form field
              value.forEach((position) => {
                formData.append('medicleSpecially', String(position));
              });
            } else if (key === 'roles' && Array.isArray(value)) {
              // Handle roles array - send each role name as separate form field
              value.forEach((role) => {
                if (typeof role === 'object' && role.name) {
                  formData.append('roles', role.name);
                } else if (typeof role === 'string') {
                  formData.append('roles', role);
                }
              });
            } else if (Array.isArray(value)) {
              // Handle other arrays
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              // Handle objects
              formData.append(key, JSON.stringify(value));
            } else {
              // Handle primitive values
              formData.append(key, String(value));
            }
          }
        });

        const response = await fetch(`http://localhost:8080/users/adminUpdateUser/${editingUser.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Remove Content-Type header to let browser set it with boundary for FormData
          },
          body: formData,
        });

        if (response.ok) {
          const result: UpdateResponse = await response.json();
          console.log('Update successful:', result);
          setShowForm(false);
          setEditingUser(null);
          fetchUsers(); // Refresh the list
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user');
        }
      } else {
        // Create new user using POST API
        const formData = new FormData();
        
        // Add all user data fields to FormData
        Object.entries(userData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key === 'medicleSpecially' && Array.isArray(value)) {
              // Handle medicleSpecially array (used for staff positions) - send each value as separate form field
              value.forEach((position) => {
                formData.append('medicleSpecially', String(position));
              });
            } else if (key === 'roles' && Array.isArray(value)) {
              // Handle roles array - send each role name as separate form field
              value.forEach((role) => {
                if (typeof role === 'object' && role.name) {
                  formData.append('roles', role.name);
                } else if (typeof role === 'string') {
                  formData.append('roles', role);
                }
              });
            } else if (Array.isArray(value)) {
              // Handle other arrays
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              // Handle objects
              formData.append(key, JSON.stringify(value));
            } else {
              // Handle primitive values
              formData.append(key, String(value));
            }
          }
        });

        const result = await fetchCreateUser(formData);
        console.log('Create successful:', result);
        setShowForm(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      // Re-throw error to be caught by StaffForm
      throw new Error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo nhân viên');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải danh sách người dùng...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhân viên</h1>
        <button
          onClick={handleAddUser}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Thêm Nhân viên
        </button>
      </div>

      <StaffList
        users={users}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {showForm && (
        <StaffForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default StaffManagement;
