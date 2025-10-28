import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./PatientProfile.module.css";
import { toast } from "sonner";
import { axiosInstance } from "../../utils/fetchFromAPI";

// 🧩 Khớp với database của bạn
interface Profile {
  id: string;
  dob: string;
  email: string;
  enabled: boolean;
  gender: string;
  identification: string;
  image_url: string;
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

  // 📥 Gọi API lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get(
          "/users/getinfo", // 👈 backend tự nhận biết user từ token
        );
        setProfile(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải hồ sơ bệnh nhân!");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 📤 Cập nhật hồ sơ
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await axios.put("http://localhost:8080/users/userUpdateUser", profile, {
        withCredentials: true,
      });
      toast.success("Cập nhật hồ sơ thành công!");
      setEdit(false);
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật hồ sơ thất bại!");
    }
  };

  // ⏳ Hiển thị loading
  if (loading) return <div className={styles.profileSection}>Đang tải hồ sơ...</div>;
  if (!profile) return <div className={styles.profileSection}>Không có dữ liệu hồ sơ.</div>;

  // 👀 Nếu không ở chế độ chỉnh sửa
  if (!edit) {
    return (
      <section className={styles.profileSection}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {profile.username?.[0]?.toUpperCase() || "👤"}
          </div>
          <div>
            <div className={styles.profileName}>{profile.username}</div>
            <div className={styles.profileId}>Mã BN: {profile.id}</div>
          </div>
        </div>

        <div className={styles.profileInfoBox}>
          <div>
            <h3 className={styles.profileGroupTitle}>Thông tin cơ bản</h3>
            <div className={styles.profileInfoGrid}>
              <div><span>Email</span><span>{profile.email}</span></div>
              <div><span>Số điện thoại</span><span>{profile.phone}</span></div>
              <div><span>Ngày sinh</span><span>{profile.dob?.split("-").reverse().join("/")}</span></div>
              <div><span>Giới tính</span><span>{profile.gender}</span></div>
            </div>
          </div>

          <div>
            <h3 className={styles.profileGroupTitle}>Thông tin bổ sung</h3>
            <div className={styles.profileInfoGrid}>
              <div><span>CMND/CCCD</span><span>{profile.identification || "--"}</span></div>
              <div><span>Chuyên khoa</span><span>{profile.medicle_specialy || "--"}</span></div>
              <div><span>Trạng thái</span><span>{profile.enabled ? "Hoạt động" : "Bị khóa"}</span></div>
            </div>
          </div>
        </div>

        <button className={styles.profileBtn} onClick={() => setEdit(true)}>
          Chỉnh sửa thông tin
        </button>
      </section>
    );
  }

  // 📝 Nếu đang chỉnh sửa
  return (
    <section className={styles.profileEditSection}>
      <form className={styles.profileEditForm} onSubmit={handleProfileUpdate}>
        <div><label>Tên đăng nhập</label>
          <input
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          />
        </div>

        <div><label>Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>

        <div><label>Số điện thoại</label>
          <input
            type="number"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: Number(e.target.value) })}
          />
        </div>

        <div><label>Ngày sinh</label>
          <input
            type="date"
            value={profile.dob}
            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
          />
        </div>

        <div><label>Giới tính</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        <div><label>CMND/CCCD</label>
          <input
            value={profile.identification}
            onChange={(e) => setProfile({ ...profile, identification: e.target.value })}
          />
        </div>

        <div><label>Chuyên khoa</label>
          <input
            value={profile.medicle_specialy}
            onChange={(e) => setProfile({ ...profile, medicle_specialy: e.target.value })}
          />
        </div>

        <div><label>Ảnh đại diện (URL)</label>
          <input
            value={profile.image_url}
            onChange={(e) => setProfile({ ...profile, image_url: e.target.value })}
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.profileBtn} onClick={() => setEdit(false)}>
            Hủy
          </button>
          <button type="submit" className={`${styles.profileBtn} ${styles.primary}`}>
            Lưu thay đổi
          </button>
        </div>
      </form>
    </section>
  );
}
