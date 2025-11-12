import DoctorListSection from "../../components/DoctorListSection";
import Footer from "../../components/footer";
import Navigator from "../../components/Navigator";
import { useEffect, useState } from 'react';

function Home() {
    const [isProcessingToken, setIsProcessingToken] = useState(true); // ← BẮT ĐẦU VỚI TRUE để check token
    const [role, setRole] = useState<string | null>(null);

    // Hàm extract role từ token
    const extractRoleFromToken = (token: string) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload.scope;
        } catch (e) {
            console.error("Invalid token");
            return null;
        }
    };

    // Hàm redirect dựa trên role
    const redirectByRole = (userRole: string) => {
        console.log('Redirecting based on role:', userRole);
        
        switch (userRole) {
            case 'ROLE_doctor':
                window.location.href = '/doctor';
                break;
            case 'ROLE_admin':
                window.location.href = '/admin';
                break;
            case 'ROLE_patient':
                window.location.href = '/dashboard';
                break;
            case 'ROLE_receptionist':
                window.location.href = '/receptionPage';
                break;
            case 'ROLE_staff':
                window.location.href = '/staff';
                break;
            default:
                console.log('Unknown role, staying on home');
                setIsProcessingToken(false);
        }
    };

    // Hàm xử lý token từ URL
    const handleTokenFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            try {
                // Lưu token vào localStorage
                localStorage.setItem('accessToken', token);

                // Extract role
                const newRole = extractRoleFromToken(token);
                setRole(newRole);

                // Clear query param khỏi URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);

                // Redirect dựa trên role
                if (newRole) {
                    redirectByRole(newRole);
                } else {
                    setIsProcessingToken(false);
                }

            } catch (error) {
                console.error('Lỗi xử lý token:', error);
                alert('Lỗi xác thực token. Thử lại nhé!');
                localStorage.removeItem('accessToken');
                window.history.replaceState({}, document.title, window.location.pathname);
                setIsProcessingToken(false);
            }
            return true; // Đã xử lý token từ URL
        }
        return false; // Không có token từ URL
    };

    // ← EFFECT CHÍNH: Check token ngay khi component mount
    useEffect(() => {

        // 1. Kiểm tra token từ URL trước
        const hasTokenInUrl = handleTokenFromUrl();
        
        if (!hasTokenInUrl) {
            // 2. Nếu không có token từ URL, check localStorage
            const existingToken = localStorage.getItem("accessToken");
            
            if (existingToken) {
                const payloadRole = extractRoleFromToken(existingToken);
                
                if (payloadRole) {
                    console.log('Valid token with role:', payloadRole);
                    setRole(payloadRole);
                    // ← TỰ ĐỘNG REDIRECT NGAY
                    redirectByRole(payloadRole);
                } else {
                    localStorage.removeItem('accessToken');
                    setIsProcessingToken(false);
                }
            } else {
                // Không có token → Show home page bình thường
                setIsProcessingToken(false);
            }
        }
    }, []); // Chỉ chạy 1 lần khi mount

    // Show loading khi đang xử lý token
    if (isProcessingToken) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #0ea5e9',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <h2 style={{ margin: 0, color: '#0f172a' }}>Đang xử lý đăng nhập...</h2>
                <p style={{ margin: 0, color: '#64748b' }}>Vui lòng chờ...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
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

                                <a href="/online-consult" style={{
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

                <DoctorListSection />
            </main>
            <Footer />
        </div>
    );
}

export default Home;
