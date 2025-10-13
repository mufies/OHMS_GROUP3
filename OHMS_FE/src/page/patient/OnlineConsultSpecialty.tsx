import { useNavigate } from "react-router-dom";
import Navigator from "../../compoment/Navigator";


const specialties = [
  'Nhi khoa', 'Sản phụ khoa', 'Da liễu', 'Tiêu hoá', 'Cơ xương khớp',
        'Dị ứng - miễn dịch', 'Gây mê hồi sức', 'Tai - mũi - họng', 'Ung bướu',
        'Tim mạch', 'Lão khoa', 'Chấn thương chỉnh hình', 'Hồi sức cấp cứu',
        'Ngoại tổng quát', 'Y học dự phòng', 'Răng - Hàm - Mặt', 'Truyền nhiễm',
        'Nội thận', 'Nội tiết', 'Tâm thần', 'Hô hấp', 'Xét nghiệm', 'Huyết học',
        'Tâm lý', 'Nội thần kinh', 'Ngôn ngữ trị liệu', 'Phục hồi chức năng - Vật lý trị liệu',
        'Vô sinh hiếm muộn', 'Y học cổ truyền', 'Lao - bệnh phổi',
  // ...thêm chuyên khoa khác...
];

function OnlineConsultSpecialty() {
  const navigate = useNavigate();

  const handleSelect = (spec: string) => {
    navigate(`/online-consult-time?specialty=${encodeURIComponent(spec)}`);
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
        gap: 24
      }}>
        {specialties.map(spec => (
          <button
            key={spec}
            style={{
              padding: "24px 12px",
              background: "white",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 18,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
            onClick={() => handleSelect(spec)}
          >
            {spec}
          </button>
        ))}
      </div>
    </div>
    </>
  );
}

export default OnlineConsultSpecialty;