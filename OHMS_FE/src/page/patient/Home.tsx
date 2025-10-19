import Navigator from "../../compoment/Navigator";
import { useEffect, useState } from 'react'; // Thêm useState cho loading

function Home() {
    const [isProcessingToken, setIsProcessingToken] = useState(false); // State loading khi xử lý token
    const [role, setRole] = useState(null); // State cho role, để update sau khi xử lý token

    // Hàm extract role từ token (giữ nguyên code bạn)
    const extractRoleFromToken = (token:string) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload.scope; // Ví dụ: "ROLE_patient" hoặc "ROLE_doctor"
        } catch (e) {
            console.error("Invalid token");
            return null;
        }
    };

    // Hàm xử lý token từ URL
    const handleTokenFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            setIsProcessingToken(true);
            try {
                // Lưu token vào localStorage
                localStorage.setItem('accessToken', token);

                // Extract role
                const newRole = extractRoleFromToken(token);
                setRole(newRole);
                console.log('Token từ URL đã xử lý, role:', newRole);

                // Clear query param khỏi URL (tránh reload xử lý lại)
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);

                // Redirect dựa trên role (sau 500ms để show loading ngắn)
                setTimeout(() => {
                    if (newRole === 'ROLE_doctor') { // Giả sử scope là "ROLE_doctor"
                        window.location.href = '/doctor';
                    } else if (newRole === 'ROLE_patient') {
                        // Giữ nguyên Home hoặc redirect dashboard nếu có
                        window.location.href = '/dashboard'; // Tùy chỉnh nếu cần
                    }
                    setIsProcessingToken(false);
                }, 500);

            } catch (error) {
                console.error('Lỗi xử lý token:', error);
                alert('Lỗi xác thực token. Thử lại nhé!');
                localStorage.removeItem('accessToken');
                // Clear URL
                window.history.replaceState({}, document.title, window.location.pathname);
                setIsProcessingToken(false);
            }
        }
    };

    // Lấy token từ localStorage nếu không có từ URL
    useEffect(() => {
        // Đầu tiên, check token từ URL
        handleTokenFromUrl();

        // Nếu không có từ URL, lấy từ localStorage
        if (!isProcessingToken) {
            const token = localStorage.getItem("accessToken");
            if (token) {
                const payloadRole = extractRoleFromToken(token);
                setRole(payloadRole);
            }
        }
    }, []); // Chạy 1 lần khi mount

    // Effect redirect dựa trên role (chỉ nếu không đang xử lý token)
    useEffect(() => {
        if (!isProcessingToken && role === "ROLE_doctor") { // Thay "doctor" bằng "ROLE_doctor" để match scope
            window.location.href = "/doctor";
        }
    }, [role, isProcessingToken]);

    // Show loading nếu đang xử lý token
    if (isProcessingToken) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>
                    <h2>Đang xử lý đăng nhập...</h2>
                    <p>Nhận token từ Google thành công! Chờ tí...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navigator />
            <main>
                <section style={{
                    padding: "96px 16px 32px",
                    background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)"
                }}>
                    <div style={{
                        maxWidth: "100vw",
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
                        display: "grid", // Đổi từ flex sang grid để match gridTemplateColumns
                        gridTemplateColumns: "repeat(4, 1fr)", // Sửa thành 4 vì chỉ có 4 items, không phải 5
                        gap: 20,
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