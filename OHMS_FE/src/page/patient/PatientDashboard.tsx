import React, { useState } from "react";
import PatientProfile from "../compoments/PatientProfile";
import PatientAppointments from "../compoments/PatientAppointments";
import PatientTransactions from "../compoments/PatientTransactions";
import PatientAccount from "../compoments/PatientAccount";
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
          {activeTab === "appointments" && <PatientAppointments />}
          {activeTab === "transactions" && <PatientTransactions />}
          {activeTab === "profile" && <PatientProfile />}
          {activeTab === "account" && <PatientAccount />}
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