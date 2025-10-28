import React, { useEffect, useState } from "react";
import styles from "./PatientAppointments.module.css";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";

// 🩺 Kiểu dữ liệu trùng với JSON trả về
interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  doctorId: string | null;
  doctorName: string | null;
  doctorSpecialty: string | null;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExaminationInfo[] | null;
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔑 Lấy patientId từ accessData (lưu khi đăng nhập)
  const accessData = localStorage.getItem("accessData");
  const parsedData = accessData ? JSON.parse(accessData) : null;
  const patientId = parsedData?.userId || "79ae910a-e836-4334-8731-5cc6fa21b4e4";

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axiosInstance.get(`/appointments/patient/${patientId}`);
        console.log("📋 Appointments:", res.data);
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách lịch hẹn.");
        toast.error("Không thể tải danh sách lịch hẹn!");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [patientId]);

  // 🌀 Trạng thái tải
  if (loading)
    return (
      <section className={styles.section}>
        <h2>Đang tải danh sách lịch khám...</h2>
      </section>
    );

  // ⚠️ Lỗi
  if (error)
    return (
      <section className={styles.section}>
        <h2>{error}</h2>
      </section>
    );

  // ❌ Không có lịch khám
  if (appointments.length === 0)
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Lịch khám</h2>
        <div className={styles.emptyBox}>
          <span className={styles.emptyIcon}>🗎</span>
          <span>Bạn chưa có lịch khám nào.</span>
        </div>
      </section>
    );

  // ✅ Hiển thị danh sách lịch khám
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>📅 Lịch khám của tôi</h2>

      {appointments.map((a) => (
        <div key={a.id} className={styles.appointmentCard}>
          <div className={styles.left}>
            <h3 className={styles.doctorName}>
              {a.doctorName ? a.doctorName : "Chưa có bác sĩ"}
            </h3>
            <p>
              <b>Chuyên khoa:</b> {a.doctorSpecialty || "—"}
            </p>
            <p>
              <b>Thời gian:</b> {a.workDate} — {a.startTime} → {a.endTime}
            </p>
            <p>
              <b>Trạng thái:</b>{" "}
              <span
                className={`${styles.status} ${
                  a.status === "Completed"
                    ? styles.done
                    : a.status === "Schedule"
                    ? styles.pending
                    : styles.cancelled
                }`}
              >
                {a.status}
              </span>
            </p>
          </div>

          <div className={styles.right}>
            <div className={styles.detailRow}>
              <span>Mã phiếu khám:</span>
              <span>{a.id}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Bệnh nhân:</span>
              <span>{a.patientName}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Email:</span>
              <span>{a.patientEmail}</span>
            </div>
            <div className={styles.detailRow}>
              <span>SĐT:</span>
              <span>{a.patientPhone || "--"}</span>
            </div>

            {a.medicalExaminations && a.medicalExaminations.length > 0 && (
              <div className={styles.medicalList}>
                <span className={styles.medicalTitle}>Dịch vụ khám:</span>
                <ul>
                  {a.medicalExaminations.map((m) => (
                    <li key={m.id}>
                      {m.name} — <b>{m.price.toLocaleString("vi-VN")} ₫</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
