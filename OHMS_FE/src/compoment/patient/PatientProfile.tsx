import React, { useState } from "react";
import styles from "./PatientProfile.module.css";


export default function PatientProfile() {
  const [edit, setEdit] = useState(false);
  const [profile, setProfile] = useState({
    name: "Trần Lê Đăng Khoa",
    phone: "0795742530",
    dob: "2004-10-05",
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
    setEdit(false);
    // Gọi API cập nhật hồ sơ ở đây
  };

  if (!edit) {
    return (
      
      <section className={styles.profileSection}>
     
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {profile.name.split(" ").slice(-2).map(w => w[0]).join("")}
          </div>
          <div>
            <div className={styles.profileName}>{profile.name}</div>
            <div className={styles.profileId}>Mã BN: YMP252422018</div>
          </div>
        </div>
        <div className={styles.profileAlert}>
          <b>Hoàn thiện thông tin</b> để đặt khám và quản lý hồ sơ y tế được tốt hơn.
        </div>
        <div className={styles.profileInfoBox}>
          <div>
            <h3 className={styles.profileGroupTitle}>Thông tin cơ bản</h3>
            <div className={styles.profileInfoGrid}>
              <div className={styles.profileInfoRow}>
                <span>Họ và tên</span>
                <span>{profile.name}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Điện thoại</span>
                <span>{profile.phone}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Ngày sinh</span>
                <span>{profile.dob.split("-").reverse().join("/")}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Giới tính</span>
                <span>{profile.gender}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Địa chỉ</span>
                <span>{profile.address || "--"}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className={styles.profileGroupTitle}>Thông tin bổ sung</h3>
            <div className={styles.profileInfoGrid}>
              <div className={styles.profileInfoRow}>
                <span>Mã BHYT</span>
                <span>{profile.bhyt || "--"}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Số CMND/CCCD</span>
                <span>{profile.cmnd}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Dân tộc</span>
                <span>{profile.nation}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Nghề nghiệp</span>
                <span>{profile.job}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <span>Email</span>
                <span>{profile.email}</span>
              </div>
            </div>
          </div>
        </div>
        <button className={styles.profileBtn} onClick={() => setEdit(true)}>
          Thay đổi thông tin
        </button>
      </section>
    );
  }

  // Giao diện form sửa như ảnh 6
  return (
    <section className={styles.profileEditSection}>
      
      <form
        className={styles.profileEditForm}
        onSubmit={handleProfileUpdate}
      >
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
        <div className={styles.formActions}>
          <button type="button" className={styles.profileBtn} onClick={() => setEdit(false)}>Hủy</button>
          <button type="submit" className={`${styles.profileBtn} ${styles.primary}`}>Cập nhật</button>
        </div>
      </form>
    </section>
  );
}