import React from "react";
import Navigator from "../../compoment/Navigator";

const days = [
  { label: "Th 2, 22-09", slots: [], full: true },
  { label: "Th 4, 24-09", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30"], full: false },
  { label: "Th 6, 26-09", slots: ["17:30-17:45", "17:45-18:00"], full: false },
  { label: "Th 2, 29-09", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30", "17:30-17:45", "17:45-18:00"], full: false },
  { label: "Th 4, 01-10", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30", "17:30-17:45", "17:45-18:00", "18:00-18:15", "18:15-18:30", "18:30-18:45"], full: false },
  { label: "Th 6, 03-10", slots: ["16:30-16:45", "16:45-17:00", "17:00-17:15", "17:15-17:30", "17:30-17:45", "17:45-18:00", "18:00-18:15", "18:15-18:30", "18:30-18:45", "18:45-19:00"], full: false }
];

const services = [
  {
    id: "0173d634-7281-4490-b789-237e5c8d6ddb",
    name: "Siêu âm tổng quát",
    price: 150000
  },
  {
    id: "22d821b9-2990-42e3-8e65-0f2fdb0c82dd",
    name: "Khám chuyên khoa tim mạch",
    price: 300000
  },
  {
    id: "333c3042-3d80-41bd-bcd1-def07ad3bbc7",
    name: "Khám chuyên khoa mắt",
    price: 220000
  },
  {
    id: "39f37b24-1ebd-47ff-b677-065b8e9eefbf",
    name: "Chụp X-quang phổi",
    price: 120000
  },
  {
    id: "44f8e7d5-d421-4667-873e-70a1b6a08ee0",
    name: "Khám tai mũi họng",
    price: 180000
  },
  {
    id: "70a498da-939d-4516-b395-c3efb91eaac6",
    name: "Khám da liễu",
    price: 200000
  },
  {
    id: "9094c53e-5d3e-4a44-9bde-0fe6442004b0",
    name: "Điện tim 12 chuyển đạo",
    price: 100000
  },
  {
    id: "a17a23ac-48dc-4776-93a9-7728f6f9be3d",
    name: "Khám phụ khoa tổng quát",
    price: 250000
  },
  {
    id: "a31c4013-062d-4824-b7c8-b16171fe5400",
    name: "Tư vấn online",
    price: 50000
  },
  {
    id: "b8c5e303-e8c6-433d-84a4-c7a66b565ed7",
    name: "Xét nghiệm máu tổng quát",
    price: 80000
  },
  {
    id: "bcc69d0f-230b-4eb6-9f4d-6b056a938ef3",
    name: "Khám tổng quát",
    price: 150000
  },
  {
    id: "e4491928-fcaa-4508-8fc8-c9ae1da74d54",
    name: "Khám chuyên khoa mắt",
    price: 220000
  }
];

const doctors = [
  {
    id: "397fd57f-ddc2-48a5-b794-f878958418d6",
    username: "Nguyễn Văn An",
    password: "$2a$10$dGQpzD3lrmmSQsEA3iDt8erZ8GPl2pQ3ZCpI3k0908YR2wAZ8QBsa",
    imageUrl: null,
    email: "nguyenvanan@hospital.vn",
    roles: [
      {
        name: "DOCTOR",
        description: null,
        permissions: []
      }
    ],
    phone: "0901234567",
    medicleSpecially: "Tim mạch",
    experience: "15 năm",
    rating: 4.8,
    patients: 1250,
    description: "Bác sĩ chuyên khoa Tim mạch với hơn 15 năm kinh nghiệm điều trị các bệnh về tim mạch. Tốt nghiệp Đại học Y Hà Nội và có chứng chỉ hành nghề quốc tế.",
    education: "Tiến sĩ - Đại học Y Hà Nội",
    certifications: ["Chứng chỉ Tim mạch can thiệp", "Chứng chỉ Siêu âm tim"]
  },
  {
    id: "accedf2e-c4a1-43bb-8190-cc90aacfb0e7",
    username: "Trần Thị Bình",
    password: "$2a$10$bUC4yteWzhuLfPLHKPk4KuwAcebcthYx8dVk3mdQxZlEm7K1fYsRq",
    imageUrl: null,
    email: "tranthibinh@hospital.vn",
    roles: [
      {
        name: "DOCTOR",
        description: null,
        permissions: []
      }
    ],
    phone: "0902345678",
    medicleSpecially: "Nhi khoa",
    experience: "12 năm",
    rating: 4.9,
    patients: 2100,
    description: "Bác sĩ Nhi khoa giàu kinh nghiệm trong chăm sóc sức khỏe trẻ em từ sơ sinh đến 16 tuổi. Chuyên về các bệnh về hô hấp và tiêu hóa ở trẻ em.",
    education: "Thạc sĩ - Đại học Y Dược TP.HCM",
    certifications: ["Chứng chỉ Nhi khoa", "Chứng chỉ Dinh dưỡng trẻ em"]
  },
  {
    id: "c3815f59-f051-499e-97c8-78982a13870a",
    username: "Lê Minh Cường",
    password: "$2a$10$plNElyIAMNDplamCNJB7xO/kEwQLCw0mSzah7z0kMJIPkNNP1X0IC",
    imageUrl: null,
    email: "leminhcuong@hospital.vn",
    roles: [
      {
        name: "DOCTOR",
        description: null,
        permissions: []
      }
    ],
    phone: "0903456789",
    medicleSpecially: "Da liễu",
    experience: "10 năm",
    rating: 4.7,
    patients: 980,
    description: "Chuyên gia về các bệnh da liễu, mụn trứng cá, và các vấn đề về thẩm mỹ da. Áp dụng công nghệ laser hiện đại trong điều trị.",
    education: "Bác sĩ - Đại học Y Hà Nội",
    certifications: ["Chứng chỉ Da liễu", "Chứng chỉ Laser thẩm mỹ"]
  },
  {
    id: "f5da192f-f962-457a-a5e1-be85840bdc5c",
    username: "Phạm Thị Dung",
    password: "$2a$10$Q6UvHI7Y2Pen.AYfs9iKc.lMi.Dnu50a9RhkNGjlitS1CZPmgbjEW",
    imageUrl: null,
    email: "phamthidung@hospital.vn",
    roles: [
      {
        name: "DOCTOR",
        description: null,
        permissions: []
      }
    ],
    phone: "0904567890",
    medicleSpecially: "Xương khớp",
    experience: "18 năm",
    rating: 4.8,
    patients: 1560,
    description: "Bác sĩ chuyên khoa Xương khớp với nhiều năm kinh nghiệm điều trị viêm khớp, thoái hóa khớp và chấn thương thể thao.",
    education: "Tiến sĩ - Đại học Y Dược TP.HCM",
    certifications: ["Chứng chỉ Xương khớp", "Chứng chỉ Y học thể thao"]
  },
  {
    id: "uuid_for_doctor",
    username: "Hoàng Văn Em",
    password: "$2a$10$dGQpzD3lrmmSQsEA3iDt8erZ8GPl2pQ3ZCpI3k0908YR2wAZ8QBsa",
    imageUrl: null,
    email: "hoangvanem@hospital.vn",
    roles: [
      {
        name: "DOCTOR",
        description: null,
        permissions: []
      }
    ],
    phone: "0905678901",
    medicleSpecially: "Thần kinh",
    experience: "20 năm",
    rating: 5.0,
    patients: 1890,
    description: "Chuyên gia hàng đầu về các bệnh lý thần kinh, đau đầu, tai biến mạch máu não. Có nhiều công trình nghiên cứu được công bố quốc tế.",
    education: "Tiến sĩ - Đại học Y Tokyo",
    certifications: ["Chứng chỉ Thần kinh học", "Chứng chỉ Điện não đồ"]
  }
];

function BookingSchedule() {
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = React.useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = React.useState(false);
  const [showDoctorModal, setShowDoctorModal] = React.useState(false);
  const [viewDoctorProfile, setViewDoctorProfile] = React.useState<string | null>(null);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
  };

  const handleDoctorModalClose = () => {
    setShowDoctorModal(false);
    setViewDoctorProfile(null);
  };

  const handleViewDoctorProfile = (doctorId: string) => {
    setViewDoctorProfile(doctorId);
  };

  return (
    <>
      <Navigator />
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto flex gap-8 mt-8">
          {/* Main content */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            {/* Service and Doctor Selection in One Row */}
            <div className="mb-8">
              <div className="text-2xl font-bold mb-4">
                1&nbsp; Chọn dịch vụ và bác sĩ
              </div>
              <div className="grid grid-cols-2 gap-6">
                {/* Service Selection Card */}
                <div 
                  onClick={() => setShowServiceModal(true)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900">Dịch vụ khám</div>
                        <div className="text-sm text-gray-500">Chọn dịch vụ phù hợp</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {selectedServices.length > 0 ? (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900">
                        Đã chọn {selectedServices.length} dịch vụ
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        Tổng: {formatPrice(getTotalPrice())}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Chưa chọn dịch vụ nào</div>
                  )}
                </div>

                {/* Doctor Selection Card */}
                <div 
                  onClick={() => setShowDoctorModal(true)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900">Bác sĩ</div>
                        <div className="text-sm text-gray-500">Chọn bác sĩ khám bệnh</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {selectedDoctor ? (
                    <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold">
                          {doctors.find(d => d.id === selectedDoctor)?.username.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-green-900 truncate">
                          BS. {doctors.find(d => d.id === selectedDoctor)?.username}
                        </div>
                        <div className="text-xs text-green-700">
                          {doctors.find(d => d.id === selectedDoctor)?.medicleSpecially}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Chưa chọn bác sĩ</div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <div className="text-2xl font-bold mb-4">
                2&nbsp; Thời gian khám
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="font-semibold text-lg mb-4">
                  Ngày và giờ khám
                </div>
                <div className="flex items-center gap-2 mb-6 overflow-x-auto">
                  <button className="border-none bg-none text-2xl cursor-pointer text-gray-500 flex-shrink-0">&lt;</button>
                  {days.map((day, idx) => (
                    <div
                      key={day.label}
                      onClick={() => !day.full && setSelectedDay(idx)}
                      className={`p-4 rounded-xl text-center min-w-[120px] flex-shrink-0 ${
                        idx === selectedDay
                          ? "border-2 border-gray-900 font-bold shadow-md"
                          : "border border-gray-200 font-medium"
                      } ${
                        day.full
                          ? "bg-gray-100 text-red-500 cursor-not-allowed"
                          : "bg-white text-gray-900 cursor-pointer"
                      }`}
                    >
                      {day.label}
                      <div className={`text-sm mt-1 ${day.full ? "text-red-500" : "text-green-500"}`}>
                        {day.full ? "Đã đầy lịch" : `${day.slots.length} khung giờ`}
                      </div>
                    </div>
                  ))}
                  <button className="border-none bg-none text-2xl cursor-pointer text-gray-500 flex-shrink-0">&gt;</button>
                </div>
                <div className="font-semibold text-lg mb-3">
                  <span className="inline-block w-6 h-6 rounded-full bg-gray-900 text-white text-center leading-6 font-bold mr-2">O</span>
                  Buổi chiều
                </div>
                <div className="flex flex-wrap gap-4">
                  {days[selectedDay].slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-4 px-6 rounded-lg font-semibold text-base cursor-pointer transition-all ${
                        slot === selectedSlot
                          ? "border-2 border-blue-600 bg-blue-600 text-white"
                          : "border border-gray-200 bg-gray-100 text-gray-900 hover:border-gray-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-[380px] bg-white rounded-2xl shadow-lg p-8 h-fit sticky top-8">
            <div className="font-bold text-xl mb-4">
              Thông tin đặt khám
            </div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ đã chọn:</div>
                <div className="space-y-2">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId);
                    return (
                      <div key={serviceId} className="flex justify-between items-start text-sm">
                        <span className="text-gray-600 flex-1 pr-2">{service?.name}</span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(service?.price || 0)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Tổng cộng:</span>
                  <span className="text-base font-bold text-blue-600">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            )}

            {/* Selected Doctor */}
            {selectedDoctor && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Bác sĩ:</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {doctors.find(d => d.id === selectedDoctor)?.imageUrl ? (
                      <img 
                        src={doctors.find(d => d.id === selectedDoctor)?.imageUrl!} 
                        alt="doctor" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg font-semibold">
                        {doctors.find(d => d.id === selectedDoctor)?.username.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      BS. {doctors.find(d => d.id === selectedDoctor)?.username}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {doctors.find(d => d.id === selectedDoctor)?.medicleSpecially || "Đa khoa"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {doctors.find(d => d.id === selectedDoctor)?.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Time */}
            {selectedSlot && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">Thời gian khám:</div>
                <div className="text-sm text-gray-900">
                  <div className="font-medium">{days[selectedDay].label}</div>
                  <div className="text-blue-600 font-semibold mt-1">{selectedSlot}</div>
                </div>
              </div>
            )}

            {/* Clinic Info */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-3">Địa điểm khám:</div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">Phòng khám Đa khoa</div>
                  <div className="text-xs text-gray-600 mt-1">
                    53 Phạm Hữu Chí, Phường 12, Quận 5, Hồ Chí Minh
                  </div>
                </div>
              </div>
            </div>

            <button
              className={`w-full font-bold text-base border-none rounded-lg py-4 mb-3 transition-all ${
                selectedSlot && selectedServices.length > 0 && selectedDoctor
                  ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!selectedSlot || selectedServices.length === 0 || !selectedDoctor}
            >
              Xác nhận đặt khám
            </button>
            <div className="text-xs text-gray-500 text-center leading-relaxed">
              Bằng cách nhấn nút xác nhận, bạn đã đồng ý với các điều khoản và điều kiện đặt khám
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-100 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chọn dịch vụ khám</h2>
                <p className="text-sm text-gray-500 mt-1">Chọn một hoặc nhiều dịch vụ phù hợp</p>
              </div>
              <button
                onClick={handleServiceModalClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">{service.name}</div>
                        <div className="text-sm text-blue-600 font-medium mt-1">{formatPrice(service.price)}</div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedServices.includes(service.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}>
                        {selectedServices.includes(service.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div>
                <div className="text-sm text-gray-600">Đã chọn {selectedServices.length} dịch vụ</div>
                <div className="text-lg font-bold text-blue-600">Tổng: {formatPrice(getTotalPrice())}</div>
              </div>
              <button
                onClick={handleServiceModalClose}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Selection Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chọn bác sĩ</h2>
                <p className="text-sm text-gray-500 mt-1">Chọn bác sĩ phù hợp với nhu cầu của bạn</p>
              </div>
              <button
                onClick={handleDoctorModalClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {viewDoctorProfile ? (
                // Doctor Profile View
                <div>
                  <button
                    onClick={() => setViewDoctorProfile(null)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại danh sách
                  </button>
                  {(() => {
                    const doctor = doctors.find(d => d.id === viewDoctorProfile);
                    return doctor ? (
                      <div>
                        {/* Doctor Header */}
                        <div className="flex items-start gap-6 mb-6">
                          <div className="w-32 h-32 rounded-2xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {doctor.imageUrl ? (
                              <img src={doctor.imageUrl} alt={doctor.username} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <span className="text-gray-400 text-5xl font-semibold">
                                {doctor.username.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">BS. {doctor.username}</h3>
                            <div className="flex items-center gap-4 mb-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {doctor.medicleSpecially}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500 text-xl">★</span>
                                <span className="font-semibold text-lg">{doctor.rating}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-gray-900">{doctor.experience}</div>
                                <div className="text-sm text-gray-600">Kinh nghiệm</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-gray-900">{doctor.patients}+</div>
                                <div className="text-sm text-gray-600">Bệnh nhân</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-gray-900">{doctor.certifications?.length || 0}</div>
                                <div className="text-sm text-gray-600">Chứng chỉ</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Doctor Details */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Giới thiệu</h4>
                            <p className="text-gray-700 leading-relaxed">{doctor.description}</p>
                          </div>

                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Học vấn</h4>
                            <p className="text-gray-700">{doctor.education}</p>
                          </div>

                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-3">Chứng chỉ</h4>
                            <div className="space-y-2">
                              {doctor.certifications?.map((cert, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-700">{cert}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Thông tin liên hệ</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-700">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {doctor.email}
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {doctor.phone}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor.id);
                              handleDoctorModalClose();
                            }}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Chọn bác sĩ này
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                // Doctor List View
                <div className="space-y-3">
                  {doctors.map(doctor => (
                    <div
                      key={doctor.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedDoctor === doctor.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => setSelectedDoctor(doctor.id)}
                        >
                          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {doctor.imageUrl ? (
                              <img src={doctor.imageUrl} alt={doctor.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-400 text-2xl font-semibold">
                                {doctor.username.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg text-gray-900">BS. {doctor.username}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {doctor.medicleSpecially} • {doctor.experience}
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium text-gray-900">{doctor.rating}</span>
                              </div>
                              <div className="text-sm text-gray-600">{doctor.patients}+ bệnh nhân</div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDoctorProfile(doctor.id)}
                          className="ml-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!viewDoctorProfile && (
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {selectedDoctor ? `Đã chọn: BS. ${doctors.find(d => d.id === selectedDoctor)?.username}` : 'Chưa chọn bác sĩ'}
                </div>
                <button
                  onClick={handleDoctorModalClose}
                  disabled={!selectedDoctor}
                  className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                    selectedDoctor
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BookingSchedule;
