import React from "react";
import "./PatientDashboard.css";

export default function PatientTransactions() {
  const transactions = [
    {
      id: "GD001",
      service: "Khám tổng quát",
      patient: "Trần Lê Đăng Khoa",
      phone: "0795742530",
      date: "15/12/2024",
      amount: "155.00",
      status: "Thành công",
    },
  ];

  return (
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
  );
}