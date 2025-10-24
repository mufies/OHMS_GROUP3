import React, { useState } from "react";
import "./PatientAccount.module.css";
//import { useNavigate } from "react-router-dom";



export default function PatientAccount() {
  const [showEdit, setShowEdit] = useState(false);
  const [profile] = useState({
    name: "Trần Lê Đăng Khoa",
    phone: "0795742530",
    dob: "05/10/2004",
    address: "",
    cmnd: "048204001744",
    bhyt: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Gọi API đổi mật khẩu ở đây
  };

  return (
    <section className="patient-account-section">
      <div className="patient-account-info-card">
   
        <h3>Thông tin tài khoản</h3>
        <div className="info-row"><span>Họ và tên</span><span>{profile.name}</span></div>
        <div className="info-row"><span>Số điện thoại</span><span>{profile.phone}</span></div>
        <div className="info-row"><span>Ngày sinh</span><span>{profile.dob}</span></div>
        <div className="info-row"><span>Địa chỉ</span><span>{profile.address || "---"}</span></div>
        <div className="info-row"><span>CMND/CCCD</span><span>{profile.cmnd}</span></div>
        <div className="info-row"><span>Mã BHYT</span><span>{profile.bhyt || "---"}</span></div>
        <button className="edit-link" onClick={() => setShowEdit(true)}>Thay đổi thông tin</button>
      </div>
      <div className="change-password-card">
        <h3>Thay đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword}>
          <label>Mật khẩu hiện tại *</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Mật khẩu hiện tại của bạn" />
          <label>Mật khẩu mới *</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" />
          <button type="submit" className="change-btn" disabled={!currentPassword || !newPassword}>Thay đổi</button>
        </form>
      </div>
    </section>
  );
}