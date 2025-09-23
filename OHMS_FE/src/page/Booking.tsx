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
import Footer from "../compoment/footer.tsx";
//
// interface Doctor {
//   id: string;
//   name: string;
//   specialty: string;
//   image: string;
//   rating: number;
//   experience: string;
//   location: string;
//   price: string;
//   available: boolean;
// }
//
// interface TimeSlot {
//   time: string;
//   available: boolean;
// }

// interface Appointment {
//   id: string;
//   doctorName: string;
//   specialty: string;
//   date: string;
//   time: string;
//   status: 'confirmed' | 'pending' | 'completed';
// }

const Booking = () => {
  // const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  // const [selectedDate, setSelectedDate] = useState<string>('');
  // const [selectedTime, setSelectedTime] = useState<string>('');
  // const [searchTerm, setSearchTerm] = useState<string>('');
  // const [specialty, setSpecialty] = useState<string>('');
  // const [patientInfo, setPatientInfo] = useState({
  //   name: '',
  //   phone: '',
  //   email: '',
  //   reason: ''
  // });
  // const [isBooked, setIsBooked] = useState(false);
  // const [showMyAppointments, setShowMyAppointments] = useState(false);

  // // Mock data for doctors
  // const doctors: Doctor[] = [
  //   {
  //     id: '1',
  //     name: 'Dr. Nguyễn Văn An',
  //     specialty: 'Tim mạch',
  //     image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
  //     rating: 4.8,
  //     experience: '15 năm',
  //     location: 'Bệnh viện Đa khoa Thành phố',
  //     price: '500.000đ',
  //     available: true
  //   },
  //   {
  //     id: '2',
  //     name: 'Dr. Trần Thị Bình',
  //     specialty: 'Nhi khoa',
  //     image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
  //     rating: 4.9,
  //     experience: '12 năm',
  //     location: 'Bệnh viện Nhi Trung ương',
  //     price: '400.000đ',
  //     available: true
  //   },
  //   {
  //     id: '3',
  //     name: 'Dr. Lê Minh Châu',
  //     specialty: 'Da liễu',
  //     image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
  //     rating: 4.7,
  //     experience: '10 năm',
  //     location: 'Phòng khám Da liễu Thẩm mỹ',
  //     price: '300.000đ',
  //     available: true
  //   },
  //   {
  //     id: '4',
  //     name: 'Dr. Phạm Thị Dung',
  //     specialty: 'Sản phụ khoa',
  //     image: 'https://images.unsplash.com/photo-1594824475317-3435b3ce8e05?w=150&h=150&fit=crop&crop=face',
  //     rating: 4.8,
  //     experience: '18 năm',
  //     location: 'Bệnh viện Phụ sản Hà Nội',
  //     price: '600.000đ',
  //     available: false
  //   },
  //   {
  //     id: '5',
  //     name: 'Dr. Hoàng Văn Minh',
  //     specialty: 'Thần kinh',
  //     image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face',
  //     rating: 4.6,
  //     experience: '20 năm',
  //     location: 'Bệnh viện Bạch Mai',
  //     price: '700.000đ',
  //     available: true
  //   },
  //   {
  //     id: '6',
  //     name: 'Dr. Vũ Thị Lan',
  //     specialty: 'Xương khớp',
  //     image: 'https://images.unsplash.com/photo-1601233749202-95d04d5b3c00?w=150&h=150&fit=crop&crop=face',
  //     rating: 4.5,
  //     experience: '8 năm',
  //     location: 'Bệnh viện Việt Đức',
  //     price: '450.000đ',
  //     available: true
  //   }
  // ];



    const specialties = [
        'Nhi khoa', 'Sản phụ khoa', 'Da liễu', 'Tiêu hoá', 'Cơ xương khớp',
        'Dị ứng - miễn dịch', 'Gây mê hồi sức', 'Tai - mũi - họng', 'Ung bướu',
        'Tim mạch', 'Lão khoa', 'Chấn thương chỉnh hình', 'Hồi sức cấp cứu',
        'Ngoại tổng quát', 'Y học dự phòng', 'Răng - Hàm - Mặt', 'Truyền nhiễm',
        'Nội thận', 'Nội tiết', 'Tâm thần', 'Hô hấp', 'Xét nghiệm', 'Huyết học',
        'Tâm lý', 'Nội thần kinh', 'Ngôn ngữ trị liệu', 'Phục hồi chức năng - Vật lý trị liệu',
        'Vô sinh hiếm muộn', 'Y học cổ truyền', 'Lao - bệnh phổi',
    ];



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

                <div
                    className="
            mt-12 grid gap-8
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
          "
                >
                    {specialties.map((spec) => (
                        <div
                            key={spec}
                            className="flex flex-col items-center text-center transition-transform hover:scale-105"
                        >
                            <div
                                className="
                  mb-3 flex h-16 w-16 items-center justify-center
                  rounded-full bg-white/10 text-2xl text-black
                  shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-1 ring-white/20
                  hover:ring-2 hover:ring-white/50 cursor-pointer
                "
                            >
                                <FontAwesomeIcon icon={faStethoscope} />
                            </div>
                            <span className="text-sm text-black line-clamp-2">{spec}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <Footer />
    </>
  );
};

export default Booking;
