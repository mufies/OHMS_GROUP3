import React, { useState, useEffect } from 'react';
import DoctorList from './DoctorList';
import DoctorForm from './DoctorForm';
import { fetchCreateUser } from '../../../utils/fetchFromAPI';

interface Doctor {
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
  avatar?: File | null;
}

interface ApiResponse {
  code: number;
  results: Doctor[];
}

interface UpdateResponse {
  code: number;
  results: Doctor;
}

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('http://localhost:8080/users/getListDoctor', {
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
        setDoctors(data.results);
      } else {
        throw new Error('Failed to fetch doctors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setShowForm(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowForm(true);
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bác sĩ này?')) {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await fetch(`http://localhost:8080/users/${doctorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refresh the list after successful deletion
          fetchDoctors();
        } else {
          throw new Error('Failed to delete doctor');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error deleting doctor:', err);
      }
    }
  };

  const handleFormSubmit = async (doctorData: Partial<Doctor>) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      if (editingDoctor) {
        // Update existing doctor using PATCH API
        const formData = new FormData();
        
        // Add all doctor data fields to FormData
        Object.entries(doctorData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key === 'avatar' && value instanceof File) {
              // Handle avatar file
              formData.append('avatar', value);
            } else if (key === 'medicleSpecially' && Array.isArray(value)) {
              // Handle medicleSpecially array - send each enum value as separate form field
              value.forEach((specialty) => {
                formData.append('medicleSpecially', String(specialty));
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

        const response = await fetch(`http://localhost:8080/users/adminUpdateUser/${editingDoctor.id}`, {
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
          setEditingDoctor(null);
          fetchDoctors(); // Refresh the list
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update doctor');
        }
      } else {
        // Create new doctor using POST API
        const formData = new FormData();
        
        // Add all doctor data fields to FormData
        Object.entries(doctorData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key === 'avatar' && value instanceof File) {
              // Handle avatar file
              formData.append('avatar', value);
            } else if (key === 'medicleSpecially' && Array.isArray(value)) {
              // Handle medicleSpecially array - send each enum value as separate form field
              value.forEach((specialty) => {
                formData.append('medicleSpecially', String(specialty));
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
        setEditingDoctor(null);
        fetchDoctors(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      // Re-throw error to be caught by DoctorForm
      throw new Error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo bác sĩ');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDoctor(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải danh sách bác sĩ...</div>
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Bác sĩ</h1>
        <button
          onClick={handleAddDoctor}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Thêm Bác sĩ
        </button>
      </div>

      <DoctorList
        doctors={doctors}
        onEdit={handleEditDoctor}
        onDelete={handleDeleteDoctor}
      />

      {showForm && (
        <DoctorForm
          doctor={editingDoctor}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default DoctorManagement;
