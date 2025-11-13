
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
                                    { label: "Đặt lịch khám với AI", path: "/guide#booking" },
                                    { label: "Tư vấn qua video", path: "/guide#consultation" },
                                    { label: "Quy trình hoàn phí", path: "/guide#refund" },
                                    { label: "Câu hỏi thường gặp", path: "/guide#faq" },
                                ].map(i => (
                                    <li key={i.label} style={{ marginTop: 6 }}><a href={i.path} style={{ color: "#475569", textDecoration: "none" }}>{i.label}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Chính sách</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {[
                                    { label: "Điều khoản dịch vụ", path: "/policy#terms" },
                                    { label: "Chính sách bảo mật", path: "/policy#privacy" },
                                    { label: "Quy định sử dụng", path: "/policy#usage" }
                                ].map(i => (
                                    <li key={i.label} style={{ marginTop: 6 }}><a href={i.path} style={{ color: "#475569", textDecoration: "none" }}>{i.label}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Liên hệ</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {[
                                    "support@oachs.com",
                                    "1900 1234",
                                    "Chat trực tuyến"
                                ].map(i => (
                                    <li key={i} style={{ marginTop: 6, color: "#475569", fontSize: 14 }}>{i}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 16 }}>© 2025 - OACHS. Lấy cảm hứng giao diện từ Medpro.</div>
                </div>
            </footer>
    </div>
  )
}
