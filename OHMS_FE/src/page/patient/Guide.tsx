import Navigator from "../../components/Navigator";
import Footer from "../../components/footer";

export default function Guide() {
  return (
    <div>
      <Navigator />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white mt-5">
        {/* Hero Section */}
        <section className="py-14 px-6 border-b border-blue-100">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-3">
              Hướng dẫn sử dụng OACHS
            </h1>
            <p className="text-lg text-slate-700">
              Chi tiết cách sử dụng các dịch vụ hỗ trợ đặt lịch, tư vấn, hoàn phí trên nền tảng OACHS
            </p>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-2xl mx-auto space-y-12">

            {/* Đặt lịch khám */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-blue-600">
              <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-4">
                Đặt lịch khám trực tuyến
              </h2>
              <div className="space-y-4 text-gray-700 text-base">
                <ol className="list-decimal list-inside space-y-3 ml-4">
                  <li>
                    <span className="font-semibold">Truy cập mục Đặt khám:</span> Chọn nút "Đặt khám ngay" trên trang chủ.
                  </li>
                  <li>
                    <span className="font-semibold">Tìm bác sĩ:</span> Lọc theo chuyên khoa hoặc tìm theo tên.
                  </li>
                  <li>
                    <span className="font-semibold">Chọn thời gian:</span> Xem lịch của bác sĩ và chọn khung giờ bạn muốn.
                  </li>
                  <li>
                    <span className="font-semibold">Nhập thông tin:</span> Điền thông tin cá nhân, lý do khám.
                  </li>
                  <li>
                    <span className="font-semibold">Thanh toán:</span> Đặt cọc 50%.
                  </li>
                  <li>
                    <span className="font-semibold">Xác nhận:</span> Hệ thống gửi xác nhận qua email và SMS.
                  </li>
                </ol>
                <div className="mt-4 p-4 bg-blue-50 rounded text-blue-700">
                  <span className="font-semibold">Mẹo:</span> Đã đặt lịch có thể xem lại, đổi lịch trong mục "Lịch khám của tôi"
                </div>
              </div>
            </div>

            {/* Đặt lịch bằng AI */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-indigo-600">
              <h2 className="text-xl md:text-2xl font-bold text-indigo-700 mb-4">
                Đặt lịch bằng AI
              </h2>
              <div className="space-y-3 text-gray-700 text-base">
                <p>
                  Bạn có thể sử dụng trợ lý ảo AI để đặt lịch nhanh, chỉ cần nhập yêu cầu tự nhiên, ví dụ:
                </p>
                <div className="bg-indigo-50 rounded-lg px-4 py-2 mb-2 text-indigo-700 font-semibold">
                  "Đặt cho tôi lịch khám nội tiết vào sáng Chủ Nhật tới"
                </div>
                <p>
                  Dữ liệu yêu cầu sẽ được AI xử lý và đề xuất lịch phù hợp, bạn xác nhận để hoàn tất đặt lịch như bình thường.
                </p>
                <div className="mt-2 rounded bg-white border border-indigo-100 p-4">
                  <input type="text" placeholder="Nhập yêu cầu đặt lịch..." className="w-full p-2 rounded border focus:outline-none" />
                  <button className="mt-3 w-full bg-indigo-600 text-white py-2 px-4 rounded font-semibold hover:bg-indigo-700 transition">Gửi yêu cầu AI</button>
                </div>
              </div>
            </div>

            {/* Tư vấn qua video */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-green-500">
              <h2 className="text-xl md:text-2xl font-bold text-green-700 mb-4">
                Tư vấn Online qua video
              </h2>
              <div className="space-y-4 text-gray-700 text-base">
                <ol className="list-decimal list-inside space-y-3 ml-4">
                  <li>
                    <span className="font-semibold">Chọn chuyên khoa:</span> Truy cập "Tư vấn Online", chọn lĩnh vực cần hỗ trợ.
                  </li>
                  <li>
                    <span className="font-semibold">Chọn bác sĩ:</span> Chọn hoặc đặt lịch với bác sĩ sẵn sàng tư vấn.
                  </li>
                  <li>
                    <span className="font-semibold">Hoàn tất thanh toán:</span> Thanh toán, xác nhận đặt lịch tư vấn.
                  </li>
                  <li>
                    <span className="font-semibold">Tham gia cuộc gọi:</span> Đúng giờ, vào mục "Cuộc tư vấn" và nhấn "Tham gia".
                  </li>
                  <li>
                    <span className="font-semibold">Tư vấn:</span> Gặp và trao đổi trực tiếp với bác sĩ qua video.
                  </li>
                </ol>
                <div className="mt-4 p-4 bg-green-50 rounded text-green-700">
                  Đảm bảo kết nối mạng ổn định, camera và micro đã bật.
                </div>
              </div>
            </div>

            {/* Quy trình hoàn phí */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-orange-600">
              <h2 className="text-xl md:text-2xl font-bold text-orange-700 mb-4">
                Quy trình hoàn phí
              </h2>
              <div className="space-y-4 text-gray-700 text-base">
                <div className="space-y-2 ml-2">
                  <div className="p-3 bg-orange-50 rounded">
                    <span className="font-semibold">• Hủy trước 24 giờ:</span> Hoàn toàn bộ phí đặt cọc
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <span className="font-semibold">• Hủy 12-24 giờ:</span> Hoàn 50% phí đặt cọc
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <span className="font-semibold">• Hủy dưới 12 giờ:</span> Không hoàn phí
                  </div>
                </div>
                <div className="mt-3 p-3 rounded bg-orange-50 text-orange-700">
                  Thời gian trả phí hoàn từ 3-5 ngày làm việc. Liên hệ hỗ trợ nếu gặp vấn đề.
                </div>
              </div>
            </div>

            {/* Câu hỏi thường gặp */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-purple-600">
              <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-4">
                Câu hỏi thường gặp
              </h2>
              <div className="space-y-5 text-gray-700 text-base">
                <div>
                  <span className="font-semibold text-gray-900 block">Có thể đổi lịch khám không?</span>
                  <span className="block">Bạn đổi miễn phí nếu trước 24 giờ. Vào "Lịch khám của tôi" để thao tác.</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Giá dịch vụ?</span>
                  <span className="block">Giá tùy vào bác sĩ, chuyên khoa; hiển thị trước khi xác nhận đặt lịch.</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Nếu bác sĩ không sẵn sàng thì sao?</span>
                  <span className="block">Lịch tự động hủy, hoàn 100% phí và gửi thông báo đến bạn qua email.</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
