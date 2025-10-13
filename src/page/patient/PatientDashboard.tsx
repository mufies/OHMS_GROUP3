import React, { useState } from "react";
import "./PatientDashboard.css";

const SIDEBAR_ITEMS = [
  { key: "appointments", label: "Lịch khám" },
  { key: "transactions", label: "Lịch sử thanh toán" },
  { key: "profile", label: "Hồ sơ" },
  { key: "account", label: "Tài khoản" },
  { key: "logout", label: "Đăng xuất" },
];

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [profileEdit, setProfileEdit] = useState(false);

  // Dữ liệu mẫu, sau này thay bằng dữ liệu từ backend
  const [profile, setProfile] = useState({
    name: "Trần Lê Đăng Khoa",
    phone: "0795742530",
    dob: "05/10/2004",
    gender: "Nam",
    address: "",
    cmnd: "048204001744",
    bhyt: "",
    email: "muaongcobe9@gmail.com",
    job: "Công Nghệ Thông Tin ( I T )",
    nation: "Kinh",
  });

  // Dữ liệu lịch khám mẫu
  const appointments = [
    {
      doctor: "BS. Nguyễn Văn A",
      date: "15/12/2024",
      time: "09:00 - 10:00",
      clinic: "53 Phạm Hữu Chí, Quận 5",
    },
  ];

  // Dữ liệu giao dịch mẫu
  const transactions = [
    {
      id: "GD001",
      service: "Khám tổng quát",
      patient: profile.name,
      phone: profile.phone,
      date: "15/12/2024",
      amount: "155.00",
      status: "Thành công",
    },
  ];

  // Dữ liệu tài khoản mẫu
  const accountInfo = {
    ...profile,
  };

  // Xử lý cập nhật hồ sơ
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileEdit(false);
    // Sau này gọi API cập nhật hồ sơ ở đây
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Gọi API đổi mật khẩu ở đây
  };

  return (
    <div className="patient-dashboard-bg">
      <div className="patient-dashboard-container">
        <aside className="patient-sidebar">
          <ul>
            {SIDEBAR_ITEMS.map(item => (
              <li
                key={item.key}
                className={activeTab === item.key ? "active" : ""}
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </aside>
        <main className="patient-main">
          {/* Lịch khám */}
          {activeTab === "appointments" && (
            <section>
              <h2 className="patient-title">Lịch khám</h2>
              <div className="patient-appointments-list">
                {appointments.length === 0 ? (
                  <div className="patient-empty">
                    <span>Lịch khám của bạn trống !</span>
                  </div>
                ) : (
                  appointments.map((a, idx) => (
                    <div key={idx} className="patient-appointment-card">
                      <div><b>Bác sĩ:</b> {a.doctor}</div>
                      <div><b>Thời gian:</b> {a.date} ({a.time})</div>
                      <div><b>Phòng khám:</b> {a.clinic}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Lịch sử giao dịch */}
          {activeTab === "transactions" && (
            <section>
              <h2 className="patient-title">Lịch sử thanh toán</h2>
              <div className="patient-transactions-list">
                {transactions.length === 0 ? (
                  <div className="patient-empty">
                    <span>Chưa có thông tin thanh toán</span>
                  </div>
                ) : (
                  transactions.map((t, idx) => (
                    <div key={idx} className="patient-transaction-card">
                      <div><b>Mã giao dịch:</b> {t.id}</div>
                      <div><b>Dịch vụ:</b> {t.service}</div>
                      <div><b>Bệnh nhân:</b> {t.patient}</div>
                      <div><b>Số điện thoại:</b> {t.phone}</div>
                      <div><b>Ngày:</b> {t.date}</div>
                      <div><b>Số tiền:</b> {t.amount}</div>
                      <div><b>Trạng thái:</b> {t.status}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Hồ sơ */}
          {activeTab === "profile" && (
            <section>
              <h2 className="patient-title">Hồ sơ</h2>
              {!profileEdit ? (
                <div className="patient-profile-view">
                  <div className="patient-profile-basic">
                    <div><b>Họ và tên:</b> {profile.name}</div>
                    <div><b>Điện thoại:</b> {profile.phone}</div>
                    <div><b>Ngày sinh:</b> {profile.dob}</div>
                    <div><b>Giới tính:</b> {profile.gender}</div>
                    <div><b>Địa chỉ:</b> {profile.address || "--"}</div>
                  </div>
                  <div className="patient-profile-extra">
                    <div><b>Mã BHYT:</b> {profile.bhyt || "--"}</div>
                    <div><b>Số CMND/CCCD:</b> {profile.cmnd}</div>
                    <div><b>Dân tộc:</b> {profile.nation}</div>
                    <div><b>Nghề nghiệp:</b> {profile.job}</div>
                    <div><b>Email:</b> {profile.email}</div>
                  </div>
                  <button className="patient-btn" onClick={() => setProfileEdit(true)}>Thay đổi thông tin</button>
                </div>
              ) : (
                <form className="patient-profile-edit" onSubmit={handleProfileUpdate}>
                  <div>
                    <label>Họ và tên</label>
                    <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                  </div>
                  <div>
                    <label>Số điện thoại</label>
                    <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} required />
                  </div>
                  <div>
                    <label>Ngày sinh</label>
                    <input type="date" value={profile.dob} onChange={e => setProfile({ ...profile, dob: e.target.value })} required />
                  </div>
                  <div>
                    <label>Giới tính</label>
                    <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label>Địa chỉ</label>
                    <input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
                  </div>
                  <div>
                    <label>Số CMND/CCCD</label>
                    <input value={profile.cmnd} onChange={e => setProfile({ ...profile, cmnd: e.target.value })} />
                  </div>
                  <div>
                    <label>Dân tộc</label>
                    <input value={profile.nation} onChange={e => setProfile({ ...profile, nation: e.target.value })} />
                  </div>
                  <div>
                    <label>Nghề nghiệp</label>
                    <input value={profile.job} onChange={e => setProfile({ ...profile, job: e.target.value })} />
                  </div>
                  <div>
                    <label>Mã BHYT</label>
                    <input value={profile.bhyt} onChange={e => setProfile({ ...profile, bhyt: e.target.value })} />
                  </div>
                  <div>
                    <label>Email</label>
                    <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button type="button" className="patient-btn" onClick={() => setProfileEdit(false)}>Hủy</button>
                    <button type="submit" className="patient-btn primary">Cập nhật</button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Tài khoản */}
          {activeTab === "account" && (
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
          )}

          {/* Đăng xuất */}
          {activeTab === "logout" && (
            <section>
              <h2 className="patient-title">Đăng xuất</h2>
              <button className="patient-btn primary" onClick={() => alert("Đã đăng xuất!")}>Xác nhận đăng xuất</button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}