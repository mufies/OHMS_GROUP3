import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope } from '@fortawesome/free-solid-svg-icons';
import Navigator from '../components/Navigator';
import SearchDoctor from '../components/searchDoctor';
import { useNavigate } from 'react-router-dom';
import { MedicalSpecialty, MEDICAL_SPECIALTY_LABELS, MedicalSpecialtyType } from '../constant/medicalSpecialty';
import { useState } from 'react';

const Booking = () => {
  const navigate = useNavigate();
  const [showBookingTypeModal, setShowBookingTypeModal] = useState(true); // Hiện modal ngay khi vào trang
  const [selectedBookingType, setSelectedBookingType] = useState<'clinical' | 'preventive' | null>(null);

  // Chuyển object thành array of { key, label }
  const specialties = Object.entries(MEDICAL_SPECIALTY_LABELS).map(([key, label]) => ({
    key: key as MedicalSpecialtyType,
    label: label
  }));

  const handleSpecialtyClick = (specialtyKey: MedicalSpecialtyType) => {
    if (selectedBookingType === 'clinical') {
      navigate(`/booking-schedule-new?specialty=${specialtyKey}`);
    }
    // Nếu preventive thì không cần specialty, đã navigate rồi
  };

  const handleBookingTypeSelect = (bookingType: 'clinical' | 'preventive') => {
    setSelectedBookingType(bookingType);
    setShowBookingTypeModal(false);
    
    if (bookingType === 'preventive') {
      // Y tế dự phòng: dẫn thẳng đến trang booking preventive
      navigate('/booking-preventive');
    }
    // Nếu clinical: để user chọn chuyên khoa trên trang này
  };

  return (
    <>
      <div className="w-full min-h-[100vh] bg-white pt-12">
        <Navigator />
        <SearchDoctor />
        
        <div className="mx-auto max-w-6xl text-center pt-10">
          <h2 className="text-5xl font-bold text-black">
            {selectedBookingType === 'clinical' ? 'Chọn chuyên khoa khám' : 'Đa dạng chuyên khoa khám'}
          </h2>
          <p className="mt-2 text-sm text-black/80 pt-5">
            {selectedBookingType === 'clinical' 
              ? 'Chọn chuyên khoa phù hợp với nhu cầu của bạn'
              : 'Đặt khám dễ dàng và tiện lợi hơn với đầy đủ các chuyên khoa'}
          </p>

          {selectedBookingType === 'clinical' && (
            <div className="mt-12 grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {specialties.map((spec) => (
                <div
                  key={spec.key}
                  className="flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer"
                  onClick={() => handleSpecialtyClick(spec.key)}
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl text-black shadow ring-1 ring-white/20">
                    <FontAwesomeIcon icon={faStethoscope} />
                  </div>
                  <span className="text-sm text-black line-clamp-2">{spec.label}</span>
                </div>
              ))}
            </div>
          )}

          {!selectedBookingType && (
            <div className="mt-12 text-center text-gray-500">
              <p>Vui lòng chọn loại đặt lịch để tiếp tục</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Type Selection Modal */}
      {showBookingTypeModal && (
        <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Chọn loại đặt lịch</h2>
              <p className="text-gray-600 mb-8">Vui lòng chọn hình thức đặt lịch phù hợp với nhu cầu của bạn</p>

              <div className="grid grid-cols-2 gap-6">
                {/* Consultation + Clinical */}
                <div
                  onClick={() => handleBookingTypeSelect('clinical')}
                  className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Khám + Dịch vụ cận lâm sàng</h3>
                  <p className="text-sm text-gray-600 mb-4">Khám bác sĩ, xét nghiệm, siêu âm</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Có bác sĩ chuyên khoa</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Khám toàn diện</span>
                    </div>
                  </div>
                </div>

                {/* Preventive Service */}
                <div
                  onClick={() => handleBookingTypeSelect('preventive')}
                  className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                    <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Y tế dự phòng</h3>
                  <p className="text-sm text-gray-600 mb-4">Tiêm chủng, đo huyết áp</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Không cần bác sĩ</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Nhanh chóng, tiện lợi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center">
                <button
                  onClick={() => {
                    setShowBookingTypeModal(false);
                    // Nếu không chọn gì thì quay về trang home
                    if (!selectedBookingType) {
                      navigate('/');
                    }
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {selectedBookingType ? 'Đóng' : 'Hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Booking;
