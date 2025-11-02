import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faVenusMars, 
  faCalendar,
  faStethoscope,
  faEdit,
  faSave,
  faTimes,
  faIdCard,
  faMapMarkerAlt,
  faGraduationCap,
  faBriefcase,
  faCertificate,
  faInfoCircle,
  faCamera,
  faCheckCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

interface DoctorInfo {
  id: string;
  username: string;
  email: string;
  phone: number;
  gender: string;
  dob: string;
  address: string;
  medicleSpecially: string[];
  education: string;
  experience: number;
  certifications: string;
  description: string;
  imageUrl: string;
  bankNumber: string;
  bankName: string;
}

interface ModalProps {
  isOpen: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

function Modal({ isOpen, type, message, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <FontAwesomeIcon 
            icon={type === 'success' ? faCheckCircle : faExclamationCircle} 
            className={`text-3xl mr-3 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}
          />
          <h3 className="text-xl font-semibold">
            {type === 'success' ? 'Thành công!' : 'Lỗi!'}
          </h3>
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-white ${
              type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorProfile() {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({
    isOpen: false,
    type: 'success',
    message: ''
  });
  
  const [editForm, setEditForm] = useState<Partial<DoctorInfo>>({});

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      const doctorId = decodedPayload.userId;

      const response = await axios.get(
        `http://localhost:8080/users/findUser/${doctorId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      setDoctorInfo(response.data.results);
      setEditForm(response.data.results);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching doctor profile:', err);
      setError('Unable to load doctor information');
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm(doctorInfo!);
      setSelectedAvatar(null);
      setPreviewUrl(null);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'phone' || name === 'experience' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setModal({
          isOpen: true,
          type: 'error',
          message: 'Không tìm thấy token xác thực'
        });
        setSaving(false);
        return;
      }

      // Tạo FormData
      const formData = new FormData();
      
      // Thêm các trường vào FormData
      if (editForm.username) formData.append('username', editForm.username);
      if (editForm.email) formData.append('email', editForm.email);
      if (editForm.phone) formData.append('phone', editForm.phone.toString());
      if (editForm.gender) formData.append('gender', editForm.gender);
      if (editForm.dob) formData.append('dob', editForm.dob);
      if (editForm.address) formData.append('address', editForm.address);
      if (editForm.education) formData.append('education', editForm.education);
      if (editForm.experience !== undefined) formData.append('experience', editForm.experience.toString());
      if (editForm.certifications) formData.append('certifications', editForm.certifications);
      if (editForm.description) formData.append('description', editForm.description);
      
      // Thêm avatar nếu có
      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      const response = await axios.patch(
        `http://localhost:8080/users/userUpdateUser/${doctorInfo!.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setDoctorInfo(response.data.results);
      setEditForm(response.data.results);
      setIsEditing(false);
      setSelectedAvatar(null);
      setPreviewUrl(null);
      setSaving(false);
      
      setModal({
        isOpen: true,
        type: 'success',
        message: 'Cập nhật hồ sơ thành công!'
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setModal({
        isOpen: true,
        type: 'error',
        message: err.response?.data?.message || 'Không thể cập nhật thông tin'
      });
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error && !doctorInfo) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Lỗi</p>
          <p>{error}</p>
          <button 
            onClick={fetchDoctorProfile}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0085b9] to-[#00a8e8] h-32"></div>
        <div className="px-8 pb-8">
          <div className="flex items-end -mt-16 mb-6">
            <div className="relative w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group">
              {previewUrl || doctorInfo?.imageUrl ? (
                <img 
                  src={previewUrl || doctorInfo.imageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="text-6xl text-[#0085b9]" />
              )}
              
              {/* Camera overlay khi edit */}
              {isEditing && (
                <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <FontAwesomeIcon icon={faCamera} className="text-white text-3xl" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="ml-6 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={editForm.username || ''}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-2xl w-full max-w-md"
                  />
                ) : (
                  doctorInfo?.username || 'Chưa cập nhật'
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                <FontAwesomeIcon icon={faStethoscope} className="mr-2" />
                {doctorInfo?.medicleSpecially?.join(', ') || 'Chưa cập nhật chuyên khoa'}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 bg-[#0085b9] text-white rounded-lg hover:bg-[#006f8f] flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faEdit} />
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            Thông tin cá nhân
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faIdCard} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Mã định danh</p>
                <p className="text-gray-800 font-medium">{doctorInfo?.id || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ''}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{doctorInfo?.email || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faPhone} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Số điện thoại</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone || ''}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{doctorInfo?.phone || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faVenusMars} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Giới tính</p>
                {isEditing ? (
                  <select
                    name="gender"
                    value={editForm.gender || ''}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                ) : (
                  <p className="text-gray-800 font-medium">{doctorInfo?.gender || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faCalendar} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Ngày sinh</p>
                {isEditing ? (
                  <input
                    type="date"
                    name="dob"
                    value={editForm.dob || ''}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{formatDate(doctorInfo?.dob || '')}</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Địa chỉ</p>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={editForm.address || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{doctorInfo?.address || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            Thông tin nghề nghiệp
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faBriefcase} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Kinh nghiệm (năm)</p>
                {isEditing ? (
                  <input
                    type="number"
                    name="experience"
                    value={editForm.experience || 0}
                    onChange={handleInputChange}
                    min="0"
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{doctorInfo?.experience || 0} năm</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faGraduationCap} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Học vấn</p>
                {isEditing ? (
                  <textarea
                    name="education"
                    value={editForm.education || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                    placeholder="VD: Bác sĩ - Đại học Y Hà Nội"
                  />
                ) : (
                  <p className="text-gray-800 font-medium whitespace-pre-line">
                    {doctorInfo?.education || 'Chưa cập nhật'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faCertificate} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Chứng chỉ</p>
                {isEditing ? (
                  <textarea
                    name="certifications"
                    value={editForm.certifications || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                    placeholder="Liệt kê các chứng chỉ chuyên môn"
                  />
                ) : (
                  <p className="text-gray-800 font-medium whitespace-pre-line">
                    {doctorInfo?.certifications || 'Chưa cập nhật'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500 mt-1 w-5" />
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-500">Giới thiệu</p>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editForm.description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full"
                    placeholder="Mô tả về bản thân và chuyên môn của bạn"
                  />
                ) : (
                  <p className="text-gray-800 font-medium whitespace-pre-line">
                    {doctorInfo?.description || 'Chưa cập nhật'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
