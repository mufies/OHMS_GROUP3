// PatientAppointments.tsx
import React from "react";
import styles from "./PatientAppointments.module.css";


export default function PatientAppointments() {
  const appointments = [
    // Nếu muốn test trạng thái trống, để mảng này rỗng
    {
      doctor: "Lâm Việt Trung",
      date: "22/09/2025",
      time: "18:45 - 19:00",
      clinic: "Tiêu hoá",
      status: "Đã huỷ",
      code: "YMA2509201963",
      patientId: "YM25000000306",
      patient: "Trần Lê Đăng Khoa",
      dob: "05/10/2004",
      phone: "0795742530",
      gender: "Nam",
      address: "Chưa cập nhật",
      result: "",
      stt: "29"
    }
  ];

  if (appointments.length === 0) {
    return (
      
      <section className={styles.section}>
        
       
        <h2 className={styles.title}>Lịch khám</h2>
        <div className={styles.searchBox}>
          <input placeholder="Mã giao dịch, tên dịch vụ, tên bệnh nhân,..." disabled />
        </div>
        <div className={styles.emptyBox}>
          <span className={styles.emptyIcon}>🗎</span>
          <span>Lịch khám của bạn trống !</span>
        </div>
      </section>
    );
  }

  // Có lịch khám
  const a = appointments[0];
  return (
    <section className={styles.section}>
     
      <h2 className={styles.title}>Lịch khám</h2>
      <div className={styles.searchBox}>
        <input placeholder="Mã giao dịch, tên dịch vụ, tên bệnh nhân,..." disabled />
      </div>
      <div className={styles.appointmentDetail}>
        <div className={styles.left}>
          <div className={styles.doctorName}>{a.doctor}</div>
          <div>{a.time} - {a.date}</div>
          <div>{a.patient}</div>
          <div className={styles.sttBox}>
            <span>STT</span>
            <b>{a.stt}</b>
          </div>
        </div>
        <div className={styles.right}>
          {/* Thông tin chi tiết như ảnh 3 */}
          <div className={styles.detailRow}><span>Mã phiếu khám</span><span>{a.code}</span></div>
          <div className={styles.detailRow}><span>Ngày khám</span><span>{a.date}</span></div>
          <div className={styles.detailRow}><span>Giờ khám</span><span>{a.time} (Buổi chiều)</span></div>
          <div className={styles.detailRow}><span>Chuyên khoa</span><span>{a.clinic}</span></div>
          <div className={styles.detailRow}><span>Mã bệnh nhân</span><span>{a.patientId}</span></div>
          <div className={styles.detailRow}><span>Họ và tên</span><span>{a.patient}</span></div>
          <div className={styles.detailRow}><span>Ngày sinh</span><span>{a.dob}</span></div>
          <div className={styles.detailRow}><span>Số điện thoại</span><span>{a.phone}</span></div>
          <div className={styles.detailRow}><span>Giới tính</span><span>{a.gender}</span></div>
          <div className={styles.detailRow}><span>Địa chỉ</span><span>{a.address}</span></div>
          <div className={styles.detailRow}><span>Kết quả</span><span>Đang chờ cập nhật</span></div>
        </div>
      </div>
    </section>
  );
}