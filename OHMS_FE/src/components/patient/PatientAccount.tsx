import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PatientAccount.module.css";
import { toast } from "sonner"; // hoặc react-toastify nếu bạn đang dùng thư viện đó

interface PatientProfile {
  name: string;
  phone: string;
  dob: string;
}

export default function PatientAccount() {
  const [showEdit, setShowEdit] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // Giả sử bạn lưu patientId trong localStorage khi login
  const patientId = localStorage.getItem("patientId") || "YM25000000306";

  // 📦 1. Gọi API lấy thông tin bệnh nhân khi mở trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get<PatientProfile>(
          `http://localhost:8080/api/patients/${patientId}`
        );
        setProfile(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin bệnh nhân!");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [patientId]);

  // 📤 2. Gọi API đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8080/api/patients/${patientId}/password`, {
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      console.error(error);
      toast.error("Đổi mật khẩu thất bại! Kiểm tra lại thông tin.");
    }
  };

  if (loading) {
    return <div className="patient-account-section">Đang tải thông tin...</div>;
  }

  if (!profile) {
    return <div className="patient-account-section">Không có dữ liệu bệnh nhân.</div>;
  }

  return (
    <section className="patient-account-section">
      <div className="patient-account-info-card">
        <h3>Thông tin tài khoản</h3>
        <div className="info-row"><span>Họ và tên</span><span>{profile.name}</span></div>
        <div className="info-row"><span>Số điện thoại</span><span>{profile.phone}</span></div>
        <div className="info-row"><span>Ngày sinh</span><span>{profile.dob}</span></div>
        <button className="edit-link" onClick={() => setShowEdit(true)}>Thay đổi thông tin</button>
      </div>

      <div className="change-password-card">
        <h3>Thay đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword}>
          <label>Mật khẩu hiện tại *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mật khẩu hiện tại của bạn"
            required
          />
          <label>Mật khẩu mới *</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            required
          />
          <button
            type="submit"
            className="change-btn"
            disabled={!currentPassword || !newPassword}
          >
            Thay đổi
          </button>
        </form>
      </div>
    </section>
  );
}
