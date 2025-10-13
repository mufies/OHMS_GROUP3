import { useLocation } from "react-router-dom";
import Navigator from "../../compoment/Navigator";
import { useNavigate } from "react-router-dom";

function Doctor() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const specialty = params.get("specialty");
    const doctors = [
        {
            id: 1,
            name: "BS. Nguyễn Văn An",
            title: "Trưởng khoa Tim mạch",
            experience: "15 năm kinh nghiệm",
            rating: "4.9",
            specialty: "Tim mạch",
            hospital: "Bệnh viện Đa Khoa Trung Ương",
            price: "500.000₫",
            availableTime: "Hôm nay, 14:30"
        },
        {
            id: 2,
            name: "TS.BS. Trần Thị Bình",
            title: "Phó Giám đốc Bệnh viện Nhi",
            experience: "12 năm kinh nghiệm",
            rating: "4.8",
            specialty: "Nhi khoa",
            hospital: "Bệnh viện Nhi Trung Ương",
            price: "600.000₫",
            availableTime: "Mai, 09:00"
        },
        {
            id: 3,
            name: "BS. Lê Minh Cường",
            title: "Bác sĩ chuyên khoa II",
            experience: "10 năm kinh nghiệm",
            rating: "4.7",
            specialty: "Thần kinh",
            hospital: "Bệnh viện Chợ Rẫy",
            price: "450.000₫",
            availableTime: "Thứ 3, 16:00"
        },
        {
            id: 4,
            name: "BS. Phạm Thị Dung",
            title: "Bác sĩ chuyên khoa I",
            experience: "8 năm kinh nghiệm",
            rating: "4.9",
            specialty: "Da liễu",
            hospital: "Bệnh viện Da Liễu Trung Ương",
            price: "400.000₫",
            availableTime: "Thứ 4, 10:30"
        }
    ];

    const filteredDoctors = specialty
        ? doctors.filter((doctor) => doctor.specialty === specialty)
        : doctors;
    return (
        <div>
            <Navigator />
            <main style={{ padding: "96px 16px 32px" }}>
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                    {/* Header Section */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <h1 style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: "#1f2937",
                            margin: 0,
                            marginBottom: 8
                        }}>
                            Đặt lịch khám bác sĩ
                        </h1>
                        <p style={{
                            fontSize: 16,
                            color: "#6b7280",
                            margin: 0,
                            maxWidth: 500,
                            marginLeft: "auto",
                            marginRight: "auto"
                        }}>
                            Chọn bác sĩ phù hợp với nhu cầu khám chữa bệnh của bạn
                        </p>
                    </div>

                    {/* Doctor Cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {doctors.map((doctor) => (
                            <div key={doctor.id} style={{
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                padding: 20,
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                            }}>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto",
                                    gap: 20,
                                    alignItems: "start"
                                }}>
                                    {/* Left Side - Doctor Info */}
                                    <div style={{ display: "flex", gap: 16 }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: "50%",
                                            background: "#f3f4f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "50%",
                                                background: "#d1d5db",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#6b7280",
                                                fontSize: 18,
                                                fontWeight: 600
                                            }}>
                                                {doctor.name.split(' ').slice(-1)[0].charAt(0)}
                                            </div>
                                        </div>

                                        {/* Doctor Details */}
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                fontSize: 18,
                                                fontWeight: 700,
                                                color: "#1f2937",
                                                margin: 0,
                                                marginBottom: 4
                                            }}>
                                                {doctor.name}
                                            </h3>
                                            <p style={{
                                                fontSize: 14,
                                                color: "#374151",
                                                margin: 0,
                                                marginBottom: 8
                                            }}>
                                                {doctor.title}
                                            </p>
                                            
                                            {/* Experience & Rating */}
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 16,
                                                marginBottom: 8
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <polyline points="12,6 12,12 16,14"/>
                                                    </svg>
                                                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                                                        {doctor.experience}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2">
                                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                                                    </svg>
                                                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                                                        {doctor.rating}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Specialty Tag */}
                                            <div style={{
                                                display: "inline-block",
                                                background: "#3b82f6",
                                                color: "white",
                                                padding: "4px 12px",
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                marginBottom: 8
                                            }}>
                                                {doctor.specialty}
                                            </div>

                                            {/* Hospital */}
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                    <circle cx="12" cy="10" r="3"/>
                                                </svg>
                                                <span style={{ fontSize: 13, color: "#6b7280" }}>
                                                    {doctor.hospital}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side - Pricing & Actions */}
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                        gap: 12
                                    }}>
                                        {/* Price */}
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: "#1f2937"
                                            }}>
                                                {doctor.price}
                                            </div>
                                            <div style={{
                                                fontSize: 12,
                                                color: "#6b7280"
                                            }}>
                                                Phí khám
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: "flex",
                                            gap: 8
                                        }}>
                                            <button
                                            onClick={() => navigate("/online-consult")} style={{
                                                border: "1px solid #3b82f6",
                                                background: "white",
                                                color: "#3b82f6",
                                                padding: "8px 12px",
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                cursor: "pointer"
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="23 7 16 12 23 17 23 7"/>
                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                                                </svg>
                                                Tư vấn online
                                            </button>
                                            <button 
                                            onClick={() => navigate("/booking-schedule")} style={{
                                                background: "#3b82f6",
                                                color: "white",
                                                border: "none",
                                                padding: "8px 16px",
                                                borderRadius: 8,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                display: "flex",
                                            }}>
                                                
                                                Đặt lịch khám
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability */}
                                <div style={{
                                    marginTop: 16,
                                    paddingTop: 16,
                                    borderTop: "1px solid #f3f4f6",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                    <span style={{ fontSize: 14, color: "#6b7280" }}>
                                        {doctor.availableTime}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Doctor;
