import React, { useState, useEffect } from 'react';

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

interface StaffFormProps {
  user: User | null;
  onSubmit: (userData: Partial<User>) => void;
  onCancel: () => void;
}

const STAFF_POSITIONS = [
  { value: 'LABORATORY_MEDICINE', label: 'Kỹ thuật viên xét nghiệm' },
  { value: 'PHYSICAL_THERAPY', label: 'Kỹ thuật viên vật lý trị liệu' },
  { value: 'SPEECH_THERAPY', label: 'Kỹ thuật viên ngôn ngữ trị liệu' },
  { value: 'PSYCHOLOGY', label: 'Tâm lý học' },
  { value: 'DENTISTRY', label: 'Nha khoa' },
  { value: 'EMERGENCY_MEDICINE', label: 'Cấp cứu' },
  { value: 'PREVENTIVE_MEDICINE', label: 'Y tế dự phòng' },
  { value: 'TRADITIONAL_MEDICINE', label: 'Y học cổ truyền' },
  { value: 'INFECTIOUS_DISEASE', label: 'Truyền nhiễm' },
  { value: 'NEPHROLOGY', label: 'Thận học' }
];

const StaffForm: React.FC<StaffFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    position: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        password: '',
        position: user.medicleSpecially || [], // Use medicleSpecially field to store position
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        position: [],
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }

    if (formData.position.length === 0) {
      newErrors.position = 'Vui lòng chọn ít nhất một vị trí';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePositionChange = (position: string) => {
    setFormData(prev => ({
      ...prev,
      position: prev.position.includes(position)
        ? prev.position.filter(p => p !== position)
        : [...prev.position, position],
    }));
    
    // Clear error when user selects position
    if (errors.position) {
      setErrors(prev => ({
        ...prev,
        position: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        const submitData: Partial<User> = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone || null,
          roles: [{ name: 'STAFF', description: 'Staff role', permissions: [] }], // Always set role as STAFF
          medicleSpecially: formData.position, // Use medicleSpecially field to store position
        };

        // Only include password for new users
        if (!user && formData.password) {
          (submitData as any).password = formData.password;
        }

        await onSubmit(submitData);
        setIsSubmitting(false);
      } catch (error: any) {
        setIsSubmitting(false);
        if (error.message?.includes('302') || error.message?.includes('USER_EXISTED')) {
          setSubmitError('Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        } else {
          setSubmitError(error.message || 'Có lỗi xảy ra khi tạo nhân viên. Vui lòng thử lại.');
        }
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
          {user ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập tên đăng nhập"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số điện thoại"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập mật khẩu"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vị trí *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {STAFF_POSITIONS.map((position) => (
                <label key={position.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.position.includes(position.value)}
                    onChange={() => handlePositionChange(position.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{position.label}</span>
                </label>
              ))}
            </div>
            {errors.position && (
              <p className="text-red-500 text-sm mt-1">{errors.position}</p>
            )}
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
              {isSubmitting ? 'Đang xử lý...' : (user ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;
