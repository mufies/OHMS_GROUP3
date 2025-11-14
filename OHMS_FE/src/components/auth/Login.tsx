"use client"

import type React from "react"
import { useState } from "react"
import { X, Mail, Lock, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import {  fetchGetProfile, fetchLoginUser } from "../../utils/fetchFromAPI"
import { useNavigate } from "react-router-dom"
import ForgotPasswordModal from "./ForgotPasswordModal"
import ResetPasswordModal from "./ResetPasswordModal" // 👈 thêm dòng này

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgot, setShowForgot] = useState(false)
  const [showReset, setShowReset] = useState(false) // 👈 thêm state reset modal
  const navigate = useNavigate()
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    // 1️⃣ Gọi API login
    await fetchLoginUser(email, password, navigate);
    toast.success("Đăng nhập thành công!");

    // 2️⃣ Lấy profile sau khi login
    const profile = await fetchGetProfile();
    console.log("Profile:", profile);

    // 3️⃣ Kiểm tra quyền và điều hướng
    if (profile?.roles?.some((r: any) => r.name === "ADMIN")) {
      // Admin: không redirect đến /admin vì route chưa được bật
      // Giữ nguyên ở trang hiện tại hoặc redirect về home
      navigate("/");
    } else if (profile?.roles?.some((r: any) => r.name === "DOCTOR")) {
      // nếu doctor thì nhảy qua doctor
      navigate("/doctor");
    } else {
      navigate("/user");
    }

    // 4️⃣ Đóng modal
    onClose();
  } catch (error) {
    console.error("Login failed:", error);
    toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
  } finally {
    setIsLoading(false);
  }
};


  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google"
  }

  return (
    <>
      {/* LOGIN MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
            <p className="mt-2 text-sm text-gray-600">
              Chào mừng bạn quay lại. Vui lòng nhập thông tin của bạn.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowForgot(true)} // 👈 mở modal forgot
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">hoặc</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Đăng nhập với Google
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <ForgotPasswordModal
          onClose={() => setShowForgot(false)}
          onSuccess={() => setShowReset(true)} // 👈 Khi gửi mail thành công → mở reset
        />
      )}

      {/* Reset Password Modal */}
      {showReset && (
  <ResetPasswordModal
    onClose={() => setShowReset(false)}
    onSuccess={() => {
      setShowReset(false);
      // ✅ Mở lại modal login
      toast.success("Mật khẩu đã được đặt lại! Hãy đăng nhập lại.");
    }}
  />
)}

    </>
  )
}
