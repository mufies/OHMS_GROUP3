// import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  // faCalendarAlt,
  // faClock,
  // faMapMarkerAlt,
  // faPhone,
  // faEnvelope,
  // faSearch,
  // faCheck,
  faStethoscope
} from '@fortawesome/free-solid-svg-icons';
import Navigator from '../compoment/Navigator';
import SearchDoctor from '../compoment/searchDoctor';
import {  useNavigate } from 'react-router-dom';


const Booking = () => {
  const navigate = useNavigate();
  const specialties = [
        'Nhi khoa', 'Sản phụ khoa', 'Da liễu', 'Tiêu hoá', 'Cơ xương khớp',
        'Dị ứng - miễn dịch', 'Gây mê hồi sức', 'Tai - mũi - họng', 'Ung bướu',
        'Tim mạch', 'Lão khoa', 'Chấn thương chỉnh hình', 'Hồi sức cấp cứu',
        'Ngoại tổng quát', 'Y học dự phòng', 'Răng - Hàm - Mặt', 'Truyền nhiễm',
        'Nội thận', 'Nội tiết', 'Tâm thần', 'Hô hấp', 'Xét nghiệm', 'Huyết học',
        'Tâm lý', 'Nội thần kinh', 'Ngôn ngữ trị liệu', 'Phục hồi chức năng - Vật lý trị liệu',
        'Vô sinh hiếm muộn', 'Y học cổ truyền', 'Lao - bệnh phổi',
    ];

  const handleSpecialtyClick = (spec: string) => {
    navigate(`/booking-schedule?specialty=${encodeURIComponent(spec)}`);
  };

  return (
    <>
        <div className=" w-full min-h-[100vh] bg-white pt-12  ">
      <Navigator />

      <SearchDoctor />
            <div className="mx-auto max-w-6xl text-center pt-10 ">
                <h2 className="text-5xl font-bold text-black">
                    Đa dạng chuyên khoa khám
                </h2>
                <p className="mt-2 text-sm text-black/80 pt-5">
                    Đặt khám dễ dàng và tiện lợi hơn với đầy đủ các chuyên khoa
                </p>

                <div className="mt-12 grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {specialties.map((spec) => (
        <div
          key={spec}
          className="flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer"
          onClick={() => handleSpecialtyClick(spec)}
        >
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl text-black shadow ring-1 ring-white/20">
            <FontAwesomeIcon icon={faStethoscope} />
          </div>
          <span className="text-sm text-black line-clamp-2">{spec}</span>
        </div>
      ))}
    </div>
            </div>
        </div>
    </>
  );
};

export default Booking;