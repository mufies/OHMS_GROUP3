import DoctorListSection from "../../components/DoctorListSection";
import Footer from "../../components/footer";
import Navigator from "../../components/Navigator";
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
                    } else if (newRole === 'ROLE_admin') {
                        // Redirect admin to admin dashboard
                        window.location.href = '/admin';
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
        if (!isProcessingToken) {
            if (role === "ROLE_doctor") {
                window.location.href = "/doctor";
            } else if (role === "ROLE_admin") {
                window.location.href = "/admin";
            }
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
{/* sửa lại thành get all và filter bác sĩ, tách ra componet riêng  */}
                <DoctorListSection/>
              
            </main>
            <Footer/>
        </div>
    );
}

export default Home;