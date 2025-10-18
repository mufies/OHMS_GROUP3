import { useNavigate } from "react-router-dom";
import Navigator from "../../compoment/Navigator";
import { MedicalSpecialty, MedicalSpecialtyType, MEDICAL_SPECIALTY_LABELS } from '../../constant/medicalSpecialty';

function OnlineConsultSpecialty() {
  const navigate = useNavigate();

  const handleSelect = (specialtyValue: string) => {
    navigate(`/online-consult-time?specialty=${encodeURIComponent(specialtyValue)}`);
  };

  return (
    <>  
      <Navigator />
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <h2 style={{ textAlign: "center", marginTop: 60, fontSize: 28, fontWeight: 700 }}>
          Chọn chuyên khoa bạn muốn tư vấn online
        </h2>
        <div style={{
          maxWidth: 800,
          margin: "40px auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          padding: "0 20px"
        }}>
          {Object.entries(MedicalSpecialty).map(([key, value]) => (
            <button
              key={value}
              style={{
                padding: "24px 12px",
                background: "white",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 18,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
              onClick={() => handleSelect(value)}
            >
              {MEDICAL_SPECIALTY_LABELS[value as MedicalSpecialtyType]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default OnlineConsultSpecialty;
