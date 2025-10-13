import React, { useState } from "react";
import "./PatientDashboard.css";

export default function PatientProfile() {
  const [profileEdit, setProfileEdit] = useState(false);
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

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileEdit(false);
    // Gọi API cập nhật hồ sơ ở đây
  };

  return (
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
  );
}