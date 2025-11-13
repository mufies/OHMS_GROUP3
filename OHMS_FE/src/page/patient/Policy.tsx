import Navigator from "../../components/Navigator";
import Footer from "../../components/footer";

export default function Policy() {
  return (
    <div>
      <Navigator />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white pt-6">
        {/* Hero Section */}
        <section className="py-12 px-6 md:px-0 border-b border-blue-100">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-3">
              Chính sách & Điều khoản sử dụng
            </h1>
            <p className="text-lg text-gray-700">
              Đọc kỹ các điều khoản, chính sách bảo mật trước khi sử dụng nền tảng OACHS.
            </p>
          </div>
        </section>

        {/* Nội dung chính sách */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto space-y-10">

            {/* Điều khoản dịch vụ */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">Điều khoản dịch vụ</h2>
              <div className="space-y-4 text-gray-700 text-base">
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">1. Chấp nhận điều khoản</h3>
                  <p>
                    Khi truy cập và sử dụng hệ thống OACHS, bạn đồng ý tuân thủ mọi quy định và điều khoản này. Nếu không đồng ý, vui lòng thoát nền tảng.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">2. Giới hạn trách nhiệm</h3>
                  <p>
                    OACHS là hệ thống kết nối bác sĩ với bệnh nhân. Mọi hoạt động tư vấn, khám chữa bệnh thuộc trách nhiệm cá nhân của bác sĩ, nền tảng chỉ hỗ trợ kết nối.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">3. Quy tắc sử dụng</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Không được quấy rối, đe dọa, xúc phạm nhân viên, bác sĩ.</li>
                    <li>Không chia sẻ nội dung sai sự thật hoặc gây hiểu lầm.</li>
                    <li>Không thực hiện hành vi gây hại cho hệ thống hoặc cộng đồng.</li>
                    <li>Không xâm phạm quyền sở hữu trí tuệ.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">4. Thanh toán</h3>
                  <p>
                    Người dùng chịu trách nhiệm thanh toán đúng hạn. Nếu sự cố phát sinh từ bên trung gian thanh toán, OACHS chỉ hỗ trợ nhưng không chịu trách nhiệm pháp lý về việc mất mát, chậm trễ.
                  </p>
                </div>
                <div className="p-3 mt-4 bg-blue-50 rounded text-blue-700 text-sm">
                  Điều khoản có thể được thay đổi bất cứ lúc nào, hãy kiểm tra trang này thường xuyên để cập nhật mới nhất.
                </div>
              </div>
            </div>

            {/* Chính sách bảo mật */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-600">
              <h2 className="text-2xl font-bold text-green-700 mb-4">Chính sách bảo mật</h2>
              <div className="space-y-4 text-gray-700 text-base">
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">1. Thu thập thông tin</h3>
                  <p>OACHS có thể thu thập các loại thông tin sau:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Thông tin cá nhân: họ tên, địa chỉ, email, số điện thoại.</li>
                    <li>Thông tin sức khỏe: triệu chứng, lịch sử khám, đơn thuốc.</li>
                    <li>Thông tin thanh toán: số tài khoản (mã hóa).</li>
                    <li>Hoạt động sử dụng: IP, thiết bị, lịch sử truy cập.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">2. Sử dụng thông tin</h3>
                  <p>Thông tin được dùng để:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Phục vụ khám, tư vấn sức khỏe.</li>
                    <li>Liên lạc, quản lý hồ sơ.</li>
                    <li>Tuân thủ quy định pháp luật.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">3. Bảo vệ thông tin</h3>
                  <p>
                    OACHS áp dụng các giải pháp bảo mật: mã hóa SSL, lưu trữ an toàn; bạn cần bảo mật mật khẩu cá nhân.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">4. Chia sẻ thông tin</h3>
                  <p>
                    OACHS không chia sẻ dữ liệu cá nhân cho bên thứ ba, trừ trường hợp cần thiết như: yêu cầu pháp luật, phục vụ bác sĩ điều trị, hoặc đối tác bảo mật.
                  </p>
                </div>
                <div className="p-3 mt-4 bg-green-50 rounded text-green-700 text-sm">
                  Mọi thông tin sức khỏe đều được bảo mật theo tiêu chuẩn quốc tế về dữ liệu y tế.
                </div>
              </div>
            </div>

            {/* Quy định sử dụng */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-600">
              <h2 className="text-2xl font-bold text-purple-700 mb-4">Quy định sử dụng</h2>
              <div className="space-y-4 text-gray-700 text-base">
                <div>
                  <h3 className="font-semibold text-purple-800 mb-1">1. Tài khoản cá nhân</h3>
                  <p>Bạn phải quản lý thông tin tài khoản, mật khẩu; chủ động cảnh báo, bảo vệ nếu nghi ngờ bị tấn công.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800 mb-1">2. Nội dung đăng tải</h3>
                  <p>Chỉ chia sẻ nội dung đúng quy định, không đăng bài trái pháp luật, xúc phạm cộng đồng.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800 mb-1">3. Tuân thủ pháp luật</h3>
                  <p>Bạn cam kết sử dụng dịch vụ đúng mục đích, không vi phạm pháp luật hoặc quy tắc cộng đồng.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800 mb-1">4. Liên kết bên ngoài</h3>
                  <p>Mọi liên kết ngoài trong OACHS chỉ mang tính tham khảo, chúng tôi không chịu trách nhiệm về nội dung bên ngoài nền tảng.</p>
                </div>
                <div className="p-3 mt-4 bg-purple-50 rounded text-purple-700 text-sm">
                  Nếu vi phạm, tài khoản sẽ bị tạm khoá hoặc xóa vĩnh viễn tuỳ mức độ, theo chính sách OACHS.
                </div>
              </div>
            </div>

            {/* Contact - Liên hệ */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-8 text-white mt-8">
              <h2 className="text-2xl font-bold mb-4">Liên hệ & Hỗ trợ</h2>
              <div className="space-y-2">
                <p>Nếu cần hỗ trợ về điều khoản, quyền riêng tư hoặc khiếu nại, hãy liên hệ chúng tôi qua:</p>
                <p><span className="font-semibold">Email:</span> support@oachs.com</p>
                <p><span className="font-semibold">Hotline:</span> 1900 1234</p>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
