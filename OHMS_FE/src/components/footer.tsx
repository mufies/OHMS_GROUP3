
export default function Footer() {
  return (
    <div>
      <footer style={{ padding: 24, borderTop: "1px solid #e2e8f0", marginTop: 24 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: 16,
                        color: "#0f172a"
                    }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>Về OACHS</div>
                            <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>Kết nối người dân với cơ sở và dịch vụ y tế hàng đầu.</p>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Hướng dẫn</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {[
                                    "Đặt lịch khám",
                                    "Tư vấn qua video",
                                    "Câu hỏi thường gặp",
                                ].map(i => (
                                    <li key={i} style={{ marginTop: 6 }}><a href="#" style={{ color: "#475569", textDecoration: "none" }}>{i}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Liên hệ hợp tác</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {[ "Quảng cáo", "Tuyển dụng"].map(i => (
                                    <li key={i} style={{ marginTop: 6 }}><a href="#" style={{ color: "#475569", textDecoration: "none" }}>{i}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Chính sách</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {["Điều khoản dịch vụ", "Chính sách bảo mật", "Quy định sử dụng"].map(i => (
                                    <li key={i} style={{ marginTop: 6 }}><a href="#" style={{ color: "#475569", textDecoration: "none" }}>{i}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 16 }}>© 2025 - OACHS. Online Appointment & Consultation Hospital System</div>
                </div>
            </footer>
    </div>
  )
}
