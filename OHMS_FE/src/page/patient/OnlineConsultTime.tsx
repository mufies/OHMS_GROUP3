import { useLocation } from "react-router-dom";
import React from "react";
import Navigator from "../../compoment/Navigator";


const timeSlots = [
  "17:00-17:05", "17:05-17:10", "17:10-17:15", "17:15-17:20", "17:20-17:25", "17:25-17:30",
  "17:30-17:35", "17:35-17:40", "17:40-17:45", "17:45-17:50", "17:50-17:55", "17:55-18:00",
  "18:00-18:05", "18:05-18:10", "18:10-18:15", "18:15-18:20", "18:20-18:25", "18:25-18:30"
];
const days = [
  { label: "Th 2, 22-09", slots: timeSlots },
  { label: "Th 3, 23-09", slots: timeSlots },
  { label: "Th 4, 24-09", slots: timeSlots },
  { label: "Th 5, 25-09", slots: timeSlots },
  { label: "Th 6, 26-09", slots: timeSlots },
  { label: "Th 7, 27-09", slots: timeSlots.slice(0, 12) }
];

function OnlineConsultTime() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const specialty = params.get("specialty") || "Chưa chọn chuyên khoa";

  const [selectedDay, setSelectedDay] = React.useState(0); // Mặc định chọn ngày đầu tiên

  return (
    <>
    <Navigator/>
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "32px 0" }}>
      <div style={{
        maxWidth: 700,
        margin: "0 auto",
        background: "white",
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        padding: 32
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Chọn thời gian tư vấn online
        </div>
        <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 16 }}>
          Chuyên khoa: {specialty}
        </div>

        {/* Tabs ngày */}
        <div style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          marginBottom: 16
        }}>
          {days.map((day, idx) => (
            <button
              key={day.label}
              onClick={() => setSelectedDay(idx)}
              style={{
                padding: "10px 18px",
                border: "none",
                borderBottom: idx === selectedDay ? "3px solid #0ea5e9" : "3px solid transparent",
                background: "none",
                fontWeight: 600,
                color: idx === selectedDay ? "#0ea5e9" : "#334155",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              {day.label} <span style={{ color: "#22c55e", fontWeight: 400, fontSize: 13 }}> {day.slots.length} khung giờ</span>
            </button>
          ))}
        </div>

        {/* Khung giờ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 12,
          maxHeight: 220,
          overflowY: "auto",
          marginBottom: 24
        }}>
          {days[selectedDay].slots.map(slot => (
            <button
              key={slot}
              style={{
                padding: "12px 0",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontWeight: 500,
                color: "#0f172a",
                cursor: "pointer"
              }}
              // onClick={() => ...xử lý chọn khung giờ...}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Nút đặt tư vấn */}
        <button style={{
          width: "100%",
          background: "#2563eb",
          color: "white",
          fontWeight: 700,
          fontSize: 18,
          border: "none",
          borderRadius: 8,
          padding: "16px 0",
          cursor: "pointer"
        }}>
          ĐẶT TƯ VẤN NGAY
        </button>
      </div>
    </div>
    </>
  );
}

export default OnlineConsultTime;