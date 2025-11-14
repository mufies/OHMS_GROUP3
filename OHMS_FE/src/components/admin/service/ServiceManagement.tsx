import React, { useState, useEffect } from 'react';
import ServiceList from './ServiceList';
import ServiceForm from './ServiceForm';
import { axiosInstance } from '../../../utils/fetchFromAPI';

interface Service {
  id: string;
  name: string;
  price: number;
  minDuration: number | null;
}

interface ApiResponse {
  code: number;
  results: Service[];
}

interface UpdateResponse {
  code: number;
  results: Service;
}

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get<ApiResponse>('/medical-examination');
      
      if (data.code === 200) {
        setServices(data.results);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await axiosInstance.delete(`/medical-examination/${serviceId}`);
        // Refresh the list after successful deletion
        fetchServices();
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
        console.error('Error deleting service:', err);
      }
    }
  };

  const handleFormSubmit = async (serviceData: Partial<Service>) => {
    try {
      const payload = {
        name: serviceData.name,
        price: serviceData.price,
        minDuration: serviceData.minDuration || null,
      };

      if (editingService) {
        // Update existing service using PATCH API
        const { data: result } = await axiosInstance.patch<UpdateResponse>(
          `/medical-examination/${editingService.id}`,
          payload
        );
        console.log('Update successful:', result);
        setShowForm(false);
        setEditingService(null);
        fetchServices(); // Refresh the list
      } else {
        // Create new service using POST API
        const { data: result } = await axiosInstance.post<UpdateResponse>(
          '/medical-examination',
          payload
        );
        console.log('Create successful:', result);
        setShowForm(false);
        setEditingService(null);
        fetchServices(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      // Re-throw error to be caught by ServiceForm
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo/cập nhật dịch vụ';
      throw new Error(errorMessage);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingService(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải danh sách dịch vụ...</div>
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Dịch vụ</h1>
        <button
          onClick={handleAddService}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Thêm Dịch vụ
        </button>
      </div>

      <ServiceList
        services={services}
        onEdit={handleEditService}
        onDelete={handleDeleteService}
      />

      {showForm && (
        <ServiceForm
          service={editingService}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default ServiceManagement;

