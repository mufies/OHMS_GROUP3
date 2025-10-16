// import React from "react";
import Navigator from "../compoments/Navigator";

function BookingPayment() {
  return (
    <>
      <Navigator />
      <div style={{ background: "#f6f8fa", minHeight: "100vh", padding: "32px ", paddingTop: 100 }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 32,
          flexWrap: "wrap"
        }}>
          {/* Main content */}
          <div style={{ flex: 2, minWidth: 600 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
              Hoàn Tất Cuộc Hẹn Khám Bệnh
            </h1>
            <div style={{ color: "#374151", marginBottom: 24 }}>
              Thanh toán y tế an toàn được bảo vệ bởi mã hóa tuân thủ HIPAA
            </div>
            {/* Service Info */}
            <div style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 24,
              marginBottom: 24
            }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Service của bạn</div>
              <div style={{ marginBottom: 8 }}>
                Dịch vụ đã chọn: Khám tổng quát<br />
                Bác sĩ: BS. Nguyễn Văn A<br />
                Thời gian khám: 9:00 AM - 10:00 AM, 15/12/2024
              </div>
              <div style={{
                fontWeight: 700,
                fontSize: 22,
                color: "#22c55e",
                marginTop: 8
              }}>
                $150 <span style={{ fontSize: 14, color: "#6b7280" }}>Đặt trước 25%</span>
              </div>
            </div>
            {/* Patient Info */}
            <div style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 24,
              marginBottom: 24
            }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Thông tin bệnh nhân</div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div>Họ</div>
                  <input style={{ width: 180, padding: 8, marginBottom: 8 }} value="Nguyễn" readOnly />
                </div>
                <div>
                  <div>Tên</div>
                  <input style={{ width: 180, padding: 8, marginBottom: 8 }} value="Văn A" readOnly />
                </div>
                <div>
                  <div>Email</div>
                  <input style={{ width: 220, padding: 8, marginBottom: 8 }} value="nguyenvana@example.com" readOnly />
                </div>
                <div>
                  <div>Số điện thoại</div>
                  <input style={{ width: 180, padding: 8, marginBottom: 8 }} value="(+84) 123-456-789" readOnly />
                </div>
                {/* Thêm các trường khác tương tự */}
              </div>
              <div>
                <div>Địa chỉ</div>
                <input style={{ width: 400, padding: 8, marginBottom: 8 }} value="123 Đường Nguyễn Huệ" readOnly />
              </div>
              {/* ...Các trường khác... */}
            </div>
            {/* Payment Method */}
            <div style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 24,
              marginBottom: 24
            }}>
              
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
                Thông tin y tế và thanh toán của bạn được bảo mật theo tiêu chuẩn HIPAA
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div style={{
            flex: 1,
            minWidth: 320,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 24,
            height: "fit-content"
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Tóm tắt cuộc hẹn</div>
            <div style={{ marginBottom: 8 }}>Khám tổng quát: <b>$150.00</b></div>
            <div style={{ marginBottom: 8 }}>Giảm giá: <span style={{ color: "#22c55e" }}>-$5.00</span></div>
            <div style={{ marginBottom: 8 }}>Phí xử lý: <b>$10.00</b></div>
            <div style={{
              fontWeight: 700,
              fontSize: 20,
              color: "#2563eb",
              margin: "16px 0"
            }}>
              Tổng cộng: $155.00
            </div>
            <button style={{
              width: "100%",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              borderRadius: 8,
              padding: "14px 0",
              marginBottom: 12,
              cursor: "pointer"
            }}>
              Đặt lịch hẹn
            </button>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
              Bằng cách đặt lịch, bạn đồng ý với <a href="#" style={{ color: "#2563eb" }}>Điều khoản Y tế</a> và <a href="#" style={{ color: "#2563eb" }}>Chính sách bảo mật</a>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Những gì được bao gồm:</div>
            <ul style={{ fontSize: 14, color: "#374151", paddingLeft: 18 }}>
              <li>Tư vấn y tế chuyên nghiệp</li>
              <li>Hỗ trợ sức khỏe điện tử</li>
              <li>Khuyến nghị theo dõi</li>
              <li>Đơn thuốc nếu cần</li>
              <li>Đường dây hỗ trợ y tế 24/7</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookingPayment;