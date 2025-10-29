import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";
import Navigator from "../Navigator";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  bankNumber?: string;
  bankName?: string;
  imageUrl?: string;
  dob?: string;
  gender?: string;
}

const VIETNAMESE_BANKS = [
  "Vietcombank",
  "VietinBank",
  "BIDV",
  "Agribank",
  "Techcombank",
  "MB Bank",
  "ACB",
  "VPBank",
  "TPBank",
  "Sacombank",
  "HDBank",
  "VIB",
  "SHB",
  "SeABank",
  "OCB",
  "MSB",
  "KienlongBank",
  "VietCapitalBank",
  "BacABank",
  "PVcomBank",
  "Eximbank",
  "NCB",
  "VietBank",
  "LienVietPostBank",
  "SCB",
  "ABBank"
];

export default function PatientAccount() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Bank info states
  const [showBankSection, setShowBankSection] = useState(false);
  const [bankNumber, setBankNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [updatingBank, setUpdatingBank] = useState(false);

  const getUserId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId;
    } catch (error) {
      console.error("❌ Lỗi decode token:", error);
      return null;
    }
  };

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/users/getinfo');
        setProfile(res.data);
        
        // Set bank info nếu đã có
        if (res.data.bankNumber) setBankNumber(res.data.bankNumber);
        if (res.data.bankName) setBankName(res.data.bankName);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin tài khoản!");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!oldPassword) {
      toast.error("Mật khẩu cũ không được để trống");
      return;
    }

    if (!newPassword) {
      toast.error("Mật khẩu mới không được để trống");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!confirmPassword) {
      toast.error("Xác nhận mật khẩu không được để trống");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    setChangingPassword(true);
    try {
      const userId = getUserId();
      if (!userId) {
        toast.error("Không tìm thấy thông tin người dùng!");
        return;
      }

      const response = await axiosInstance.post(`/users/changePassword/${userId}`, {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });

      if (response.data.code === 200) {
        toast.success(response.data.message || "Đổi mật khẩu thành công!");
        
        // Clear form
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Dữ liệu không hợp lệ!";
        toast.error(message);
      } else if (error.response?.status === 401) {
        toast.error("Mật khẩu cũ không đúng!");
      } else {
        toast.error("Đổi mật khẩu thất bại! Vui lòng thử lại.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Update bank info handler
  const handleUpdateBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankNumber || !bankName) {
      toast.error("Vui lòng điền đầy đủ thông tin ngân hàng!");
      return;
    }

    if (!/^\d{9,16}$/.test(bankNumber)) {
      toast.error("Số tài khoản phải là 9-16 chữ số!");
      return;
    }

    setUpdatingBank(true);
    try {
      const userId = getUserId();
      if (!userId) {
        toast.error("Không tìm thấy thông tin người dùng!");
        return;
      }

      const response = await axiosInstance.patch(`/users/changeBank/${userId}`, {
        bankNumber,
        bankName,
      });

      if (response.data.code === 200) {
        toast.success("Cập nhật thông tin ngân hàng thành công!");
        setShowBankSection(false);
        
        // Refresh profile
        const res = await axiosInstance.get('/users/getinfo');
        setProfile(res.data);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Cập nhật thất bại!";
      toast.error(errorMsg);
    } finally {
      setUpdatingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-medium">Không tìm thấy thông tin tài khoản</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Navigator />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý tài khoản</h2>

      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
            {profile.imageUrl ? (
              <img src={profile.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{profile.username}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Email</span>
            <span className="text-sm font-medium text-gray-900">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Số điện thoại</span>
            <span className="text-sm font-medium text-gray-900">{profile.phone || "Chưa cập nhật"}</span>
          </div>
          {profile.dob && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Ngày sinh</span>
              <span className="text-sm font-medium text-gray-900">{profile.dob}</span>
            </div>
          )}
          {profile.gender && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Giới tính</span>
              <span className="text-sm font-medium text-gray-900">{profile.gender}</span>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
                <p className="text-sm text-gray-500">Cập nhật mật khẩu bảo mật</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showPasswordSection ? "Thu gọn" : "Mở rộng"}
            </button>
          </div>
        </div>

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {changingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Đổi mật khẩu
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Bank Info Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Thông tin ngân hàng</h3>
                <p className="text-sm text-gray-500">Để nhận tiền hoàn khi hủy lịch</p>
              </div>
            </div>
            <button
              onClick={() => setShowBankSection(!showBankSection)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showBankSection ? "Thu gọn" : profile.bankNumber ? "Chỉnh sửa" : "Thêm"}
            </button>
          </div>
        </div>

        {!showBankSection && profile.bankNumber && (
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Ngân hàng</span>
              <span className="text-sm font-medium text-gray-900">{profile.bankName}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Số tài khoản</span>
              <span className="text-sm font-mono font-medium text-gray-900">{profile.bankNumber}</span>
            </div>
          </div>
        )}

        {showBankSection && (
          <form onSubmit={handleUpdateBankInfo} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngân hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VIETNAMESE_BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập số tài khoản (9-16 chữ số)"
                required
                maxLength={16}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Chỉ nhập số, không có khoảng trắng</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>Lưu ý:</strong> Thông tin này sẽ được sử dụng để hoàn tiền khi bạn hủy lịch khám. Vui lòng kiểm tra kỹ trước khi lưu.
              </p>
            </div>

            <button
              type="submit"
              disabled={updatingBank}
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {updatingBank ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lưu thông tin
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
