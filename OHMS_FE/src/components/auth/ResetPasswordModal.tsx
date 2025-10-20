import React, { useState } from 'react';
import { fetchResetPass } from '../../utils/fetchFromAPI';
import { toast } from 'react-toastify';

interface ResetPasswordModalProps {
  onClose: () => void;     // Đóng modal Reset
  onSuccess: () => void;   // Mở lại modal Login
}

export default function ResetPasswordModal({ onClose, onSuccess }: ResetPasswordModalProps) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetchResetPass({ token, newPassword });
      console.log(res);
      toast.success("Đặt lại mật khẩu thành công! Bạn sẽ được chuyển về trang đăng nhập...")

      
      // ✅ Sau 1.5 giây tự động đóng reset và mở lại login
      setTimeout(() => {
        onClose();
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error('❌ Mã khôi phục không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Đặt lại mật khẩu
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã khôi phục
            </label>
            <input
              type="text"
              placeholder="Nhập mã khôi phục đã được gửi qua email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        {message && <p className="mt-4 text-green-600 text-center font-medium">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-center font-medium">{error}</p>}
      </div>
    </div>
  );
}
