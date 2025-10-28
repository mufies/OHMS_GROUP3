import React, { useState, useEffect } from 'react';

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
}

interface DoctorFormProps {
  doctor: Doctor | null;
  onSubmit: (doctorData: Partial<Doctor>) => void;
  onCancel: () => void;
}

const MEDICAL_SPECIALTIES = [
  'CARDIOLOGY',
  'DERMATOLOGY',
  'ENDOCRINOLOGY',
  'GASTROENTEROLOGY',
  'HEMATOLOGY',
  'INFECTIOUS_DISEASE',
  'NEPHROLOGY',
  'NEUROLOGY',
  'ONCOLOGY',
  'OPHTHALMOLOGY',
  'ORTHOPEDICS',
  'OTOLARYNGOLOGY',
  'PEDIATRICS',
  'PSYCHIATRY',
  'PULMONOLOGY',
  'RADIOLOGY',
  'RHEUMATOLOGY',
  'UROLOGY'
];

const DoctorForm: React.FC<DoctorFormProps> = ({ doctor, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    medicleSpecially: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (doctor) {
      setFormData({
        username: doctor.username,
        email: doctor.email,
        phone: doctor.phone || '',
        password: '',
        medicleSpecially: doctor.medicleSpecially || [],
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        medicleSpecially: [],
      });
    }
  }, [doctor]);

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

    if (!doctor && !formData.password.trim()) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }

    if (formData.medicleSpecially.length === 0) {
      newErrors.medicleSpecially = 'Vui lòng chọn ít nhất một chuyên khoa';
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

  const handleSpecialtyChange = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      medicleSpecially: prev.medicleSpecially.includes(specialty)
        ? prev.medicleSpecially.filter(s => s !== specialty)
        : [...prev.medicleSpecially, specialty],
    }));
    
    // Clear error when user selects specialty
    if (errors.medicleSpecially) {
      setErrors(prev => ({
        ...prev,
        medicleSpecially: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || null,
        medicleSpecially: formData.medicleSpecially,
        roles: ["DOCTOR"]
      };

      // Only include password for new doctors
      if (!doctor && formData.password) {
        (submitData as any).password = formData.password;
      }

      onSubmit(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {doctor ? 'Sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
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

          {!doctor && (
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
              Chuyên khoa *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {MEDICAL_SPECIALTIES.map((specialty) => (
                <label key={specialty} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.medicleSpecially.includes(specialty)}
                    onChange={() => handleSpecialtyChange(specialty)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{specialty}</span>
                </label>
              ))}
            </div>
            {errors.medicleSpecially && (
              <p className="text-red-500 text-sm mt-1">{errors.medicleSpecially}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              {doctor ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm;
