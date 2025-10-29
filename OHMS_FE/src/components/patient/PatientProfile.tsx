import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { axiosInstance } from "../../utils/fetchFromAPI";
import Navigator from "../Navigator";

interface Profile {
  id: string;
  dob: string;
  email: string;
  enabled: boolean;
  gender: string;
  identification: string;
  imageUrl: string; // Sửa lại từ image_url -> imageUrl
  medicle_specialy: string;
  password: string;
  phone: number;
  provider: number;
  provider_id: string;
  refresh_token: string;
  reset_token: string;
  username: string;
}

export default function PatientProfile() {
  const [edit, setEdit] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/users/getinfo");
        console.log("👤 PatientProfile:", res.data);
        setProfile(res.data);
        if (res.data.imageUrl) {
          setImagePreview(res.data.imageUrl);
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải hồ sơ bệnh nhân!");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const formData = new FormData();

      // Append các field của UserRequest theo định dạng form-data
      formData.append("username", profile.username);
      formData.append("email", profile.email);
      formData.append("password", profile.password || ""); // Backend sẽ bỏ qua nếu empty
      
      if (profile.phone) {
        formData.append("phone", profile.phone.toString());
      }
      
      if (profile.dob) {
        formData.append("dob", profile.dob);
      }
      
      if (profile.gender) {
        formData.append("gender", profile.gender);
      }
      

      // Append avatar file nếu có
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Log để debug
      console.log("📤 Sending FormData:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.patch(
        `http://localhost:8080/users/userUpdateUser/${profile.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${localStorage.getItem("accessToken") || ""}`,
          },
          withCredentials: true,
        }
      );

      console.log("✅ Update response:", response.data);
      
      // Update local profile với data mới từ server
      if (response.data.results) {
        setProfile(response.data.results);
        if (response.data.results.imageUrl) {
          setImagePreview(response.data.results.imageUrl);
        }
      }

      toast.success("Cập nhật hồ sơ thành công!");
      setEdit(false);
      setAvatarFile(null);
    } catch (error: any) {
      console.error("❌ Update error:", error);
      toast.error(error.response?.data?.message || "Cập nhật hồ sơ thất bại!");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh!");
      return;
    }

    setAvatarFile(file);

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-gray-600">Đang tải hồ sơ...</p>
      </div>
    );
  }

  // Empty State
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium text-gray-500">Không có dữ liệu hồ sơ</p>
      </div>
    );
  }

  // View Mode
  if (!edit) {
    return (
      <div className="bg-gray-50 py-0 px-2">
        <Navigator />
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Cover Image with Gradient */}
            <div className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
            </div>

            {/* Profile Header - Centered */}
            <div className="px-6 pb-6 -mt-16">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={profile.username}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-gray-100"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold ${imagePreview ? 'hidden' : ''}`}>
                    {profile.username?.[0]?.toUpperCase() || "👤"}
                  </div>
                </div>

                {/* User Info */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.username}</h1>
                <p className="text-sm text-gray-500 mb-4">ID: {profile.id}</p>

                {/* Edit Button */}
                <button
                  onClick={() => setEdit(true)}
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 pb-6 space-y-4">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">Thông tin cá nhân</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                    <span className="text-sm font-medium text-gray-900 break-all">{profile.email || "--"}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Số điện thoại</span>
                    <span className="text-sm font-medium text-gray-900">{profile.phone || "--"}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày sinh</span>
                    <span className="text-sm font-medium text-gray-900">
                      {profile.dob ? new Date(profile.dob).toLocaleDateString('vi-VN') : "--"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giới tính</span>
                    <span className="text-sm font-medium text-gray-900">{profile.gender || "--"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pl-10">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Edit Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h2>
            <button
              onClick={() => {
                setEdit(false);
                setAvatarFile(null);
              }}
              className="w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Avatar Preview - Centered */}
          <div className="flex flex-col items-center py-8 bg-gray-50 border-b border-gray-200">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg ${imagePreview ? 'hidden' : ''}`}>
              {profile.username?.[0]?.toUpperCase() || "👤"}
            </div>
            <p className="text-sm text-gray-500 mt-3">Ảnh đại diện</p>
            {avatarFile && (
              <p className="text-xs text-green-600 mt-1">✓ Đã chọn: {avatarFile.name}</p>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleProfileUpdate} className="px-6 py-6 space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tải lên ảnh đại diện
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">JPG, PNG hoặc GIF (tối đa 5MB)</p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới tính
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEdit(false);
                  setAvatarFile(null);
                }}
                className="flex-1 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={uploadingImage}
                className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {uploadingImage ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
