import DoctorListSection from "../../components/DoctorListSection";
import Footer from "../../components/footer";
import Navigator from "../../components/Navigator";
import { useEffect, useState } from "react";
import doctorImg from "../../assets/doctor.jpg";
import {
  FaUserMd,
  FaComments,
  FaHospital,
  FaClock,
  FaStar,
  FaShieldAlt,
} from "react-icons/fa";

function Home() {
  const [isProcessingToken, setIsProcessingToken] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const extractRoleFromToken = (token: string) => {
    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.scope;
    } catch (e) {
      console.error("Invalid token");
      return null;
    }
  };

  const redirectByRole = (userRole: string) => {
    switch (userRole) {
      case "ROLE_DOCTOR":
        window.location.href = "/doctor";
        break;
      case "ROLE_ADMIN":
        window.location.href = "/admin";
        break;
      case "ROLE_PATIENT":
        setIsProcessingToken(false);
        break;
      case "ROLE_RECEPTIONIST":
        window.location.href = "/receptionPage";
        break;
      case "ROLE_STAFF":
        window.location.href = "/staff";
        break;
      default:
        setIsProcessingToken(false);
    }
  };

  const handleTokenFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      try {
        localStorage.setItem("accessToken", token);
        const newRole = extractRoleFromToken(token);
        setRole(newRole);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (newRole) {
          redirectByRole(newRole);
        } else {
          setIsProcessingToken(false);
        }
      } catch (error) {
        alert("Lỗi xác thực token. Thử lại nhé!");
        localStorage.removeItem("accessToken");
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsProcessingToken(false);
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    const hasTokenInUrl = handleTokenFromUrl();
    if (!hasTokenInUrl) {
      const existingToken = localStorage.getItem("accessToken");
      if (existingToken) {
        const payloadRole = extractRoleFromToken(existingToken);
        if (payloadRole) {
          setRole(payloadRole);
          redirectByRole(payloadRole);
        } else {
          localStorage.removeItem("accessToken");
          setIsProcessingToken(false);
        }
      } else {
        setIsProcessingToken(false);
      }
    }
  }, []);

  if (isProcessingToken) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-blue-400 rounded-full animate-spin" />
        <h2 className="text-xl font-semibold text-slate-900">Đang xử lý đăng nhập...</h2>
        <p className="text-gray-500">Vui lòng chờ...</p>
      </div>
    );
  }

  return (
    <div>
      <Navigator />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white py-24 px-6 border-b-2 border-blue-100 min-h-[320px]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 leading-tight">
                Đặt khám &amp; Tư vấn Online
                <br />
                Tại Bệnh viện quốc tế
              </h1>
              <p className="mt-5 text-lg text-slate-700 font-medium max-w-lg">
                Tận hưởng trải nghiệm đặt khám nhanh chóng, không chờ đợi. Nhận tư vấn sức khỏe từ đội ngũ chuyên gia y tế hàng đầu, mọi lúc mọi nơi.
              </p>
              <div className="mt-10 flex flex-wrap gap-5">
                <a
                  href="/booking"
                  className="bg-blue-700 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  Đặt khám ngay
                </a>
                <a
                  href="/online-consult"
                  className="bg-white text-blue-700 py-4 px-8 rounded-xl border-2 border-blue-700 font-semibold text-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  Tư vấn Online
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src={doctorImg}
                alt="Đội ngũ y bác sĩ"
                className="max-w-[340px] w-full rounded-2xl shadow-md object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-blue-50 py-12">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 px-6">
            <FeatureCard
              icon={<FaUserMd className="w-8 h-8 text-blue-500" />}
              title="Đặt lịch khám online"
              desc="Lựa chọn bác sĩ, chuyên khoa và thời gian phù hợp. Nhận xác nhận lập tức."
            />
            <FeatureCard
              icon={<FaComments className="w-8 h-8 text-blue-500" />}
              title="Tư vấn y khoa 1:1"
              desc="Gặp gỡ các chuyên gia qua video call hoặc chat để được tư vấn nhanh chóng và hiệu quả."
            />
            <FeatureCard
              icon={<FaHospital className="w-8 h-8 text-blue-500" />}
              title="Dịch vụ y tế đa dạng"
              desc="Khám tổng quát, chuyên khoa, xét nghiệm, hình ảnh và nhiều dịch vụ tiện ích."
            />
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 px-6">
            <FeatureCard
              icon={<FaClock className="w-8 h-8 text-blue-500" />}
              title="Tiết kiệm thời gian"
              desc="Đặt lịch nhanh chóng, không phải chờ đợi tại bệnh viện."
            />
            <FeatureCard
              icon={<FaStar className="w-8 h-8 text-blue-500" />}
              title="Chuyên gia uy tín"
              desc="Tiếp cận đội ngũ bác sĩ giàu kinh nghiệm, tư vấn tận tâm."
            />
            <FeatureCard
              icon={<FaShieldAlt className="w-8 h-8 text-blue-500" />}
              title="Bảo mật thông tin"
              desc="Thông tin cá nhân và sức khỏe được bảo vệ nghiêm ngặt."
            />
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-blue-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-blue-700 mb-12">
              Phản hồi khách hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TestimonialCard
                feedback="Dịch vụ rất tiện lợi, tôi không phải chờ lâu và được tư vấn tận tình ngay tại nhà."
                name="Nguyễn Thị Mai"
                role="Bệnh nhân"
              />
              <TestimonialCard
                feedback="Bác sĩ chuyên nghiệp và nhiệt tình, giúp tôi hiểu rõ tình trạng sức khỏe."
                name="Trần Văn Hùng"
                role="Bệnh nhân"
              />
              <TestimonialCard
                feedback="Giao diện dễ dùng, đặt lịch nhanh và tiện lợi cho người bận rộn như tôi."
                name="Lê Thu Hà"
                role="Khách hàng"
              />
            </div>
          </div>
        </section>

        {/* Doctor List */}
        {/* <DoctorListSection /> */}
      </main>
      <Footer />
    </div>
  );
}

// Card component cho các section (viết chung để việc sửa, thêm, bớt icon/card dễ dàng)
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center text-center">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 mb-5">
        {icon}
      </div>
      <h3 className="text-blue-800 font-semibold mb-2 text-lg">{title}</h3>
      <p className="text-slate-700 text-base">{desc}</p>
    </div>
  );
}

// Card component cho phần phản hồi khách hàng
function TestimonialCard({
  feedback,
  name,
  role,
}: {
  feedback: string;
  name: string;
  role: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <p className="text-gray-700 mb-6">&ldquo;{feedback}&rdquo;</p>
      <h4 className="font-semibold text-blue-800">{name}</h4>
      <p className="text-sm text-gray-500">{role}</p>
    </div>
  );
}

export default Home;
