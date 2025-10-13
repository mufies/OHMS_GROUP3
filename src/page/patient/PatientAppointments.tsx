import React from "react";
import "./PatientDashboard.css";

export default function PatientAppointment() {
  const appointments = [
    {
      doctor: "BS. Nguyễn Văn A",
      date: "15/12/2024",
      time: "09:00 - 10:00",
      clinic: "53 Phạm Hữu Chí, Quận 5",
    },
  ];

  return (
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
  );
}