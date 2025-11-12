import React from 'react';
import { axiosInstance } from '../../utils/fetchFromAPI';
import { BookingType, MedicalExamination } from '../../types/booking.types';

interface BookingTypeModalProps {
  show: boolean;
  specialty: string | null;
  onSelectType: (type: BookingType) => void;
  onServicesLoaded: (services: MedicalExamination[]) => void;
  onSelectedServicesUpdate: (serviceIds: string[]) => void;
}

export const BookingTypeModal: React.FC<BookingTypeModalProps> = ({
  show,
  specialty,
  onSelectType,
  onServicesLoaded,
  onSelectedServicesUpdate
}) => {
  if (!show) return null;

  const handleConsultationOnly = async () => {
    try {
      const response = await axiosInstance.post(
        '/medical-examination/by-specialty',
        { specility: specialty }
      );
      
      if (response.data?.results) {

        

      }
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Lỗi khi tải danh sách dịch vụ!');
    }
  };

  const handleServiceAndConsultation = async () => {
    try {
      const response = await axiosInstance.post(
        '/medical-examination/by-specialty',
        { specility: specialty }
      );
      
      if (response.data?.results) {
        const khamBenhService = response.data.results.find(
          (s: MedicalExamination) => s.name === 'Khám bệnh'
        );
        
        if (khamBenhService) {
          onServicesLoaded(response.data.results);
          onSelectedServicesUpdate([khamBenhService.id]);
          onSelectType('SERVICE_AND_CONSULTATION');
        } else {
          alert('Không tìm thấy dịch vụ "Khám bệnh"!');
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Lỗi khi tải danh sách dịch vụ!');
    }
  };

  return (
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
            {/* Consultation Only */}
            <div
              onClick={handleConsultationOnly}
              className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all transform hover:scale-105"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt khám</h3>
              <p className="text-sm text-gray-600 mb-4">Khám bác sĩ trực tiếp</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Gặp bác sĩ ngay</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Nhanh chóng</span>
                </div>
              </div>
            </div>

            {/* Service + Consultation */}
            <div
              onClick={handleServiceAndConsultation}
              className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all transform hover:scale-105"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dịch vụ + Khám</h3>
              <p className="text-sm text-gray-600 mb-4">Làm dịch vụ trước, sau đó khám</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Xét nghiệm, siêu âm</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Kết quả trước khi khám</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              💡 Chọn "Dịch vụ + Khám" nếu bạn cần làm xét nghiệm, siêu âm trước khi gặp bác sĩ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
