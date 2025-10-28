import React, { useEffect, useState } from "react";
import styles from "./PatientMedicalRecords.module.css";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";

// 🩺 Kiểu dữ liệu khớp với backend (MedicalRecordResponse)
interface MedicineInfo {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
}

interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
}

interface PrescriptionInfo {
  id: string;
  amount: number;
  status: string;
  medicines: MedicineInfo[];
}

interface MedicalRecord {
  id: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  symptoms: string;
  diagnosis: string;
  prescription: PrescriptionInfo | null;
  medicalExaminations: MedicalExaminationInfo[] | null;
  createdAt: string;
}

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🧠 Lấy patientId từ localStorage (đã lưu khi login)
  const accessData = localStorage.getItem("accessData");
  const parsed = accessData ? JSON.parse(accessData) : null;
  const patientId = parsed?.userId || "79ae910a-e836-4334-8731-5cc6fa21b4e4";

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axiosInstance.get(`/medical-records/patient/${patientId}`);
        console.log("🧾 MedicalRecords:", res.data);

        if (res.data?.results) setRecords(res.data.results);
        else setRecords([]);
      } catch (err) {
        console.error(err);
        setError("Không thể tải hồ sơ bệnh án.");
        toast.error("Không thể tải hồ sơ bệnh án!");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [patientId]);

  // ⏳ Loading
  if (loading)
    return <div className={styles.section}>Đang tải hồ sơ bệnh án...</div>;

  // ❌ Lỗi
  if (error)
    return <div className={styles.section}>{error}</div>;

  // ❌ Không có dữ liệu
  if (records.length === 0)
    return (
      <div className={styles.section}>
        <h2 className={styles.title}>Hồ sơ bệnh án</h2>
        <div className={styles.emptyBox}>
          <span>Chưa có hồ sơ bệnh án nào.</span>
        </div>
      </div>
    );

  // ✅ Hiển thị danh sách hồ sơ
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>🧾 Hồ sơ bệnh án của tôi</h2>

      {records.map((r) => (
        <div key={r.id} className={styles.card}>
          <div className={styles.header}>
            <div className={styles.doctorBox}>
              <h3>{r.doctorName || "Chưa có bác sĩ"}</h3>
              <p>Chuyên khoa: {r.doctorSpecialty || "--"}</p>
              <p>Ngày khám: {r.appointmentDate || "Không rõ"} ({r.appointmentTime || "--"})</p>
            </div>
            <div className={styles.statusBox}>
              <span className={styles.recordId}>Mã hồ sơ: {r.id}</span>
              <span className={styles.date}>
                | Tạo lúc: {new Date(r.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div><b>Triệu chứng:</b> {r.symptoms || "--"}</div>
            <div><b>Chẩn đoán:</b> {r.diagnosis || "--"}</div>
            <div><b>Bệnh nhân:</b> {r.patientName}</div>
            <div><b>Email:</b> {r.patientEmail}</div>
            <div><b>SĐT:</b> {r.patientPhone || "--"}</div>
          </div>

          {/* 💊 Đơn thuốc */}
          {r.prescription && (
            <div className={styles.prescriptionBox}>
              <h4>💊 Đơn thuốc</h4>
              <p>
                <b>Trạng thái:</b>{" "}
                <span
                  className={`${styles.prescriptionStatus} ${
                    r.prescription.status === "PAID"
                      ? styles.statusPaid
                      : styles.statusPending
                  }`}
                >
                  {r.prescription.status}
                </span>
              </p>
              <p><b>Tổng tiền:</b> {r.prescription.amount?.toLocaleString("vi-VN")} ₫</p>

              {r.prescription.medicines?.length > 0 && (
                <ul className={styles.medicineList}>
                  {r.prescription.medicines.map((m) => (
                    <li key={m.id}>
                      <b>{m.name}</b> — {m.dosage} ({m.instructions})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 🧪 Dịch vụ khám */}
          {r.medicalExaminations && r.medicalExaminations.length > 0 && (
            <div className={styles.examBox}>
              <h4>🧪 Dịch vụ khám</h4>
              <ul>
                {r.medicalExaminations.map((e) => (
                  <li key={e.id}>
                    {e.name} — <b>{e.price.toLocaleString("vi-VN")} ₫</b>
                  </li>
                ))}
              </ul>
              <p className={styles.total}>
                Tổng phí dịch vụ:{" "}
                <b>
                  {r.medicalExaminations
                    .reduce((sum, e) => sum + (e.price || 0), 0)
                    .toLocaleString("vi-VN")} ₫
                </b>
              </p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
