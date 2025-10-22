import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "./PatientDashboard.css";
import { AnimatePresence, motion } from "framer-motion";

const SIDEBAR_ITEMS = [
  { path: "/patient/appointments", label: "Lịch khám" },
  { path: "/patient/transactions", label: "Lịch sử thanh toán" },
  { path: "/patient/profile", label: "Hồ sơ" },
  { path: "/patient/account", label: "Tài khoản" },
];

export default function PatientDashboard() {
  const location = useLocation();

  return (
    <div className="patient-dashboard-bg">
      <div className="patient-dashboard-container">
        <aside className="patient-sidebar">
          <ul>
            {SIDEBAR_ITEMS.map(item => (
              <li
                key={item.path}
                className={location.pathname === item.path ? "active" : ""}
              >
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </aside>
              
        <main className="patient-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
