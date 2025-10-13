import React, { useState } from "react";
import "./PatientDashboard.css";

export default function PatientAccount() {
  const [accountInfo] = useState({
    name: "Trần Lê Đăng Khoa",
    phone: "0795742530",
    dob: "05/10/2004",
    address: "",
    cmnd: "048204001744",
    bhyt: "",
    email: "muaongcobe9@gmail.com",
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Gọi API đổi mật khẩu ở đây
  };

  return (
    <section>
      <h2 className="patient-title">Tài khoản</h2>
      <div className="patient-account-info">
        <div>
          <div><b>Họ và tên</b></div>
          <div>{accountInfo.name}</div>
        </div>
        <div>
          <div><b>Số điện thoại</b></div>
          <div>{accountInfo.phone}</div>
        </div>
        <div>
          <div><b>Ngày sinh</b></div>
          <div>{accountInfo.dob}</div>
        </div>
        <div>
          <div><b>Địa chỉ</b></div>
          <div>{accountInfo.address || "---"}</div>
        </div>
        <div>
          <div><b>CMND/CCCD</b></div>
          <div>{accountInfo.cmnd}</div>
        </div>
        <div>
          <div><b>Mã BHYT</b></div>
          <div>{accountInfo.bhyt || "---"}</div>
        </div>
        <div>
          <a href="#" className="patient-link">Thay đổi thông tin</a>
        </div>
      </div>
      <div className="patient-change-password">
        <h3>Thay đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword}>
          <div>
            <label>Mật khẩu hiện tại *</label>
            <input type="password" placeholder="Mật khẩu hiện tại của bạn" required />
          </div>
          <div>
            <label>Mật khẩu mới *</label>
            <input type="password" placeholder="Nhập mật khẩu mới" required />
          </div>
          <button type="submit" className="patient-btn" style={{ marginTop: 16 }}>Thay đổi</button>
        </form>
      </div>
    </section>
  );
}