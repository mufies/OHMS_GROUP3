import React, { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  price: number;
  minDuration: number | null;
  type: string | null;
}

interface ServiceFormProps {
  service: Service | null;
  onSubmit: (serviceData: Partial<Service>) => Promise<void>;
  onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    minDuration: '',
    type: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        price: service.price.toString(),
        minDuration: service.minDuration?.toString() || '',
        type: service.type || '',
      });
    } else {
      setFormData({
        name: '',
        price: '',
        minDuration: '',
        type: '',
      });
    }
  }, [service]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên dịch vụ là bắt buộc';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Giá là bắt buộc';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = 'Giá phải là số dương';
      }
    }

    if (formData.minDuration.trim()) {
      const durationNum = parseInt(formData.minDuration);
      if (isNaN(durationNum) || durationNum <= 0) {
        newErrors.minDuration = 'Thời gian phải là số nguyên dương';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        const submitData: Partial<Service> = {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          minDuration: formData.minDuration.trim() 
            ? parseInt(formData.minDuration) 
            : null,
          type: formData.type.trim() || null,
        };

        await onSubmit(submitData);
        setIsSubmitting(false);
      } catch (error: any) {
        setIsSubmitting(false);
        setSubmitError(error.message || 'Có lỗi xảy ra khi tạo/cập nhật dịch vụ. Vui lòng thử lại.');
      }
    }
  };

  const handleRetry = () => {
    setSubmitError(null);
    setErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {service ? 'Sửa thông tin dịch vụ' : 'Thêm dịch vụ mới'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên dịch vụ *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập tên dịch vụ"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VND) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập giá dịch vụ"
              min="0"
              step="1000"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian tối thiểu (phút)
            </label>
            <input
              type="number"
              name="minDuration"
              value={formData.minDuration}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.minDuration ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập thời gian tối thiểu (phút)"
              min="1"
            />
            {errors.minDuration && (
              <p className="text-red-500 text-sm mt-1">{errors.minDuration}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Để trống nếu không xác định
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại dịch vụ
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn loại dịch vụ</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="PREVENTIVE">Dự phòng</option>
              <option value="TREATMENT">Điều trị</option>
              <option value="EXAMINATION">Xét nghiệm</option>
              <option value="IMAGING">Chẩn đoán hình ảnh</option>
              <option value="CONSULTATION">Tư vấn</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">
              Để trống nếu không xác định
            </p>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Hủy
            </button>
            {submitError && (
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
              >
                Thử lại
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isSubmitting ? 'Đang xử lý...' : (service ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;

