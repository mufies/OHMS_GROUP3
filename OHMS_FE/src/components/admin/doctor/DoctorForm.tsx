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
  avatar?: File | null;
}

interface DoctorFormProps {
  doctor: Doctor | null;
  onSubmit: (doctorData: Partial<Doctor>) => void;
  onCancel: () => void;
}

const MEDICAL_SPECIALTIES = [
  { value: 'INTERNAL_MEDICINE', label: 'Nội khoa' },
  { value: 'SURGERY', label: 'Ngoại khoa' },
  { value: 'CARDIOLOGY', label: 'Tim mạch' },
  { value: 'PEDIATRICS', label: 'Nhi khoa' },
  { value: 'DERMATOLOGY', label: 'Da liễu' },
  { value: 'OBSTETRICS_GYNECOLOGY', label: 'Sản phụ khoa' },
  { value: 'GASTROENTEROLOGY', label: 'Tiêu hóa' },
  { value: 'ORTHOPEDICS', label: 'Cơ xương khớp' },
  { value: 'ALLERGY_IMMUNOLOGY', label: 'Dị ứng - miễn dịch' },
  { value: 'ANESTHESIOLOGY', label: 'Gây mê hồi sức' },
  { value: 'OTOLARYNGOLOGY', label: 'Tai - mũi - họng' },
  { value: 'ONCOLOGY', label: 'Ung bướu' },
  { value: 'GERIATRICS', label: 'Lão khoa' },
  { value: 'TRAUMA_ORTHOPEDICS', label: 'Chấn thương chỉnh hình' },
  { value: 'EMERGENCY_MEDICINE', label: 'Hồi sức cấp cứu' },
  { value: 'GENERAL_SURGERY', label: 'Ngoại tổng quát' },
  { value: 'PREVENTIVE_MEDICINE', label: 'Y học dự phòng' },
  { value: 'DENTISTRY', label: 'Răng - Hàm - Mặt' },
  { value: 'INFECTIOUS_DISEASE', label: 'Truyền nhiễm' },
  { value: 'NEPHROLOGY', label: 'Nội thận' },
  { value: 'ENDOCRINOLOGY', label: 'Nội tiết' },
  { value: 'PSYCHIATRY', label: 'Tâm thần' },
  { value: 'PULMONOLOGY', label: 'Hô hấp' },
  { value: 'LABORATORY_MEDICINE', label: 'Xét nghiệm' },
  { value: 'HEMATOLOGY', label: 'Huyết học' },
  { value: 'PSYCHOLOGY', label: 'Tâm lý' },
  { value: 'NEUROLOGY', label: 'Nội thần kinh' },
  { value: 'SPEECH_THERAPY', label: 'Ngôn ngữ trị liệu' },
  { value: 'PHYSICAL_THERAPY', label: 'Phục hồi chức năng - Vật lý trị liệu' },
  { value: 'REPRODUCTIVE_MEDICINE', label: 'Vô sinh hiếm muộn' },
  { value: 'TRADITIONAL_MEDICINE', label: 'Y học cổ truyền' },
  { value: 'TUBERCULOSIS', label: 'Lao - bệnh phổi' }
];

const DoctorForm: React.FC<DoctorFormProps> = ({ doctor, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    medicleSpecially: [] as string[],
    avatar: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (doctor) {
      setFormData({
        username: doctor.username,
        email: doctor.email,
        phone: doctor.phone || '',
        password: '',
        medicleSpecially: doctor.medicleSpecially || [],
        avatar: null,
      });
      // Set current avatar preview if exists
      if (doctor.imageUrl) {
        setAvatarPreview(doctor.imageUrl);
      } else {
        setAvatarPreview(null);
      }
    } else {
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        medicleSpecially: [],
        avatar: null,
      });
      setAvatarPreview(null);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Vui lòng chọn file ảnh hợp lệ',
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Kích thước file không được vượt quá 5MB',
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        avatar: file,
      }));

      // Create preview for new file
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.avatar) {
        setErrors(prev => ({
          ...prev,
          avatar: '',
        }));
      }
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null,
    }));
    // If editing and no new avatar selected, show current image
    if (doctor && doctor.imageUrl && !formData.avatar) {
      setAvatarPreview(doctor.imageUrl);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        const submitData: any = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone || null,
          medicleSpecially: formData.medicleSpecially,
          roles: [{ name: 'DOCTOR', description: 'Doctor role', permissions: [] }],
        };

        // Only include avatar if a new one is selected
        if (formData.avatar) {
          submitData.avatar = formData.avatar;
        }

        // Only include password for new doctors
        if (!doctor && formData.password) {
          (submitData as any).password = formData.password;
        }

        await onSubmit(submitData);
        setIsSubmitting(false);
      } catch (error: any) {
        setIsSubmitting(false);
        if (error.message?.includes('302') || error.message?.includes('USER_EXISTED')) {
          setSubmitError('Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        } else {
          setSubmitError(error.message || 'Có lỗi xảy ra khi tạo bác sĩ. Vui lòng thử lại.');
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh đại diện
            </label>
            <div className="space-y-3">
              {avatarPreview ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {doctor && !formData.avatar ? 'Ảnh hiện tại' : 'Ảnh mới đã chọn'}
                  </div>
                  <label htmlFor="avatar-upload-edit" className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:text-blue-800 underline">
                      {doctor && !formData.avatar ? 'Thay đổi ảnh' : 'Chọn ảnh khác'}
                    </span>
                    <input
                      id="avatar-upload-edit"
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-2">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Chọn ảnh đại diện
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PNG, JPG, GIF lên đến 5MB
                      </span>
                    </label>
                    <input
                      id="avatar-upload"
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </div>
                </div>
              )}
              {!avatarPreview && (
                <input
                  id="avatar-upload-alt"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
            </div>
            {errors.avatar && (
              <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>
            )}
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
                <label key={specialty.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.medicleSpecially.includes(specialty.value)}
                    onChange={() => handleSpecialtyChange(specialty.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{specialty.label}</span>
                </label>
              ))}
            </div>
            {errors.medicleSpecially && (
              <p className="text-red-500 text-sm mt-1">{errors.medicleSpecially}</p>
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
              {isSubmitting ? 'Đang xử lý...' : (doctor ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm;
