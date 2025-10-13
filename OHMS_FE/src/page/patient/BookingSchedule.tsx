import React from "react";
import Navigator from "../../compoment/Navigator";

const days = [
  { label: "Th 2, 22-09", slots: [], full: true },
  { label: "Th 4, 24-09", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30"], full: false },
  { label: "Th 6, 26-09", slots: ["17:30-17:45", "17:45-18:00"], full: false },
  { label: "Th 2, 29-09", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30", "17:30-17:45", "17:45-18:00"], full: false },
  { label: "Th 4, 01-10", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30", "17:30-17:45", "17:45-18:00", "18:00-18:15", "18:15-18:30", "18:30-18:45"], full: false },
  { label: "Th 6, 03-10", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30", "17:30-17:45", "17:45-18:00", "18:00-18:15", "18:15-18:30", "18:30-18:45", "18:45-19:00"], full: false }
];

function BookingSchedule() {
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);

  return (
    <>
      <Navigator />
      <div style={{ background: "#fafafa", minHeight: "100vh", padding: "32px 0" }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 32
        }}>
          {/* Main content */}
          <div style={{
            flex: 1,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            padding: 32
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
              1&nbsp; Thời gian khám
            </div>
            <div style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 24,
              marginBottom: 24
            }}>
              <div style={{ color: "#ef4444", fontSize: 15, marginBottom: 12 }}>
                * Nếu bệnh nhân bạn việc không đến khám được vui lòng hủy lịch khám đã đặt và đặt lại ngày khác. Xin cảm ơn!
              </div>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 16 }}>
                1&nbsp; Ngày và giờ khám
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 24
              }}>
                <button style={{
                  border: "none",
                  background: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#6b7280"
                }}>&lt;</button>
                {days.map((day, idx) => (
                  <div
                    key={day.label}
                    onClick={() => !day.full && setSelectedDay(idx)}
                    style={{
                      padding: "16px 24px",
                      borderRadius: 12,
                      border: idx === selectedDay ? "2px solid #111827" : "1px solid #e5e7eb",
                      background: day.full ? "#f3f4f6" : "#fff",
                      color: day.full ? "#ef4444" : "#111827",
                      fontWeight: idx === selectedDay ? 700 : 500,
                      fontSize: 16,
                      cursor: day.full ? "not-allowed" : "pointer",
                      boxShadow: idx === selectedDay ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                      marginRight: 8,
                      minWidth: 120,
                      textAlign: "center"
                    }}
                  >
                    {day.label}
                    <div style={{ fontSize: 13, color: day.full ? "#ef4444" : "#22c55e", marginTop: 4 }}>
                      {day.full ? "Đã đầy lịch" : `${day.slots.length} khung giờ`}
                    </div>
                  </div>
                ))}
                <button style={{
                  border: "none",
                  background: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#6b7280"
                }}>&gt;</button>
              </div>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 12 }}>
                <span style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#111827",
                  color: "#fff",
                  textAlign: "center",
                  lineHeight: "24px",
                  fontWeight: 700,
                  marginRight: 8
                }}>O</span>
                Buổi chiều
              </div>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16
              }}>
                {days[selectedDay].slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: "16px 24px",
                      borderRadius: 8,
                      border: slot === selectedSlot ? "2px solid #2563eb" : "1px solid #e5e7eb",
                      background: slot === selectedSlot ? "#2563eb" : "#f3f4f6",
                      color: slot === selectedSlot ? "#fff" : "#111827",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer"
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div style={{
            width: 350,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            padding: 32,
            height: "fit-content"
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              Thông tin đặt khám
            </div>
            {/* Thông tin bác sĩ, phòng khám, ... */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#e5e7eb",
                overflow: "hidden"
              }}>
                {/* <img src="..." alt="avatar" style={{ width: "100%", height: "100%" }} /> */}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Lâm Việt Trung</div>
                <div style={{ fontSize: 14, color: "#374151" }}>
                  Phòng mạch: 53 Phạm Hữu Chí, Phường 12, Quận 5, Hồ Chí Minh
                </div>
              </div>
            </div>
            <button
              style={{
                width: "100%",
                background: selectedSlot ? "#2563eb" : "#d1d5db",
                color: selectedSlot ? "#fff" : "#111827",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                borderRadius: 8,
                padding: "14px 0",
                marginBottom: 12,
                cursor: selectedSlot ? "pointer" : "not-allowed"
              }}
              disabled={!selectedSlot}
            >
              Xác nhận đặt khám
            </button>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Bằng cách nhấn nút xác nhận, bạn đã đồng ý với các điều khoản và điều kiện đặt khám
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookingSchedule;