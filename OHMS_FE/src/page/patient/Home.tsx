import Navigator from "../../compoment/Navigator";

function Home() {
    return (
        <div>
            <Navigator />
            <main>
                <section style={{
                    padding: "96px 16px 32px",
                    background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)"
                }}>
                    <div style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr",
                        gap: 32
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: 40,
                                lineHeight: 1.2,
                                margin: 0,
                                fontWeight: 800,
                                color: "#0f172a"
                            }}>Kết nối Người Dân với Cơ sở & Dịch vụ Y tế hàng đầu</h1>
                            <p style={{
                                marginTop: 16,
                                fontSize: 18,
                                color: "#334155"
                            }}>Đặt khám nhanh • Lấy số thứ tự trực tuyến • Tư vấn sức khỏe từ xa</p>
                            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                                <a href="/booking" style={{
                                    background: "#0ea5e9",
                                    color: "white",
                                    padding: "12px 18px",
                                    borderRadius: 10,
                                    textDecoration: "none",
                                    fontWeight: 600
                                }}>Đặt khám ngay</a>

                                <a href="/online-consult"
                                    style={{
                                    background: "white",
                                    color: "#0ea5e9",
                                    padding: "12px 18px",
                                    borderRadius: 10,
                                    border: "1px solid #0ea5e9",
                                    textDecoration: "none",
                                    fontWeight: 600
                                        }}>
                                    Tư vấn Online
                                </a>
                                
                            </div>
                        </div>
                        <div style={{
                            height: 260,
                            background: "#e2f2ff",
                            borderRadius: 16
                        }} />
                    </div>
                </section>

                

                <section style={{ padding: "16px" }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                            <h2 style={{ fontSize: 24, margin: 0, color: "#0f172a" }}>Bác sĩ TƯ VẤN khám bệnh qua video</h2>
                            <a href="/doctor" style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>Xem tất cả</a>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 16 }}>
                            {[1,2,3,4].map((i) => (
                                <a key={i} href="#" style={{
                                    display: "block",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    background: "white",
                                    textDecoration: "none",
                                    color: "#0f172a"
                                }}>
                                    <div style={{ height: 140, background: "#f1f5f9" }} />
                                    <div style={{ padding: 12 }}>
                                        <div style={{ fontWeight: 700 }}>BS. Chuyên khoa {i}</div>
                                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Tư vấn video • Đặt lịch theo giờ</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ padding: "32px 16px" }}>
                    <div style={{ 
                        maxWidth: 1000, 
                        margin: "0 auto", 
                        display: "flex", 
                        gridTemplateColumns: "repeat(5, 1fr)", 
                        gap: 20,
                        // justifyContent: "center",
                        // alignItems: "center",
                        // justifyItems: "center"
                        placeItems: "center"
                    }}>
                        {[
                            { label: "Lượt khám", value: "3.0M+" },
                            { label: "Bác sĩ", value: "1000+" },
                            { label: "Truy cập tháng", value: "850K+" },
                            { label: "Truy cập ngày", value: "28.3K+" },
                        ].map((s) => (
                            <div key={s.label} style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: 24,
                                textAlign: "center",
                                minWidth: 220,
                                width: "100%"
                            }}>
                                <div style={{ fontSize: 30, fontWeight: 1000, color: "#0f172a" }}>{s.value}</div>
                                <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                

                <section id="apps" style={{ padding: "16px" }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto", background: "#0ea5e9", color: "white", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 24 }}>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>Tải ứng dụng Đặt khám nhanh</div>
                            <div style={{ opacity: 0.9, marginTop: 6 }}>Trải nghiệm đặt khám thuận tiện, nhanh chóng ở mọi nơi</div>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button style={{ background: "white", color: "#0ea5e9", border: 0, padding: "10px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>App Store</button>
                            <button style={{ background: "white", color: "#0ea5e9", border: 0, padding: "10px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Google Play</button>
                        </div>
                    </div>
                </section>
            </main>
            <footer style={{ padding: 24, borderTop: "1px solid #e2e8f0", marginTop: 24 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: 16,
                        color: "#0f172a"
                    }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>Về OHMS</div>
                            <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>Kết nối người dân với cơ sở và dịch vụ y tế hàng đầu.</p>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Hướng dẫn</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {[
                                    "Cài đặt ứng dụng",
                                    "Đặt lịch khám",
                                    "Tư vấn qua video",
                                    "Quy trình hoàn phí",
                                    "Câu hỏi thường gặp",
                                ].map(i => (
                                    <li key={i} style={{ marginTop: 6 }}><a href="#" style={{ color: "#475569", textDecoration: "none" }}>{i}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Liên hệ hợp tác</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 8 }}>
                                {["Cơ sở y tế", "Phòng mạch", "Doanh nghiệp", "Quảng cáo", "Tuyển dụng"].map(i => (
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
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 16 }}>© 2025 - OHMS. Lấy cảm hứng giao diện từ Medpro.</div>
                </div>
            </footer>
        </div>
    );
}

export default Home;


