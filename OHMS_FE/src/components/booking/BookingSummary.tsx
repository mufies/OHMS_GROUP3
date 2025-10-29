import React from 'react';
import { Doctor, MedicalExamination, TimeSlot, DiagnosticSlot, BookingType } from '../../types/booking.types';
import { formatPrice, formatTime, applyDiscount, calculateDeposit } from '../../utils/bookingHelpers';

interface BookingSummaryProps {
  selectedServices: string[];
  services: MedicalExamination[];
  selectedDoctor: Doctor | null;
  selectedSlot: TimeSlot | null;
  selectedDay: number;
  weekSchedule: any[];
  diagnosticSlots: DiagnosticSlot[];
  consultationSlot: TimeSlot | null;
  bookingType: BookingType;
  getTotalDuration: () => number;
  onPayment: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedServices,
  services,
  selectedDoctor,
  selectedSlot,
  selectedDay,
  weekSchedule,
  diagnosticSlots,
  consultationSlot,
  bookingType,
  getTotalDuration,
  onPayment
}) => {
  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const totalPrice = getTotalPrice();
  const discountedPrice = applyDiscount(totalPrice);
  const depositAmount = calculateDeposit(discountedPrice);

  const isReadyToBook = 
    (bookingType === 'CONSULTATION_ONLY' && selectedSlot) ||
    (bookingType === 'SERVICE_AND_CONSULTATION' && selectedSlot && consultationSlot);

  return (
    <div className="w-[380px] bg-white rounded-2xl shadow-lg p-8 h-fit sticky top-8">
      <div className="font-bold text-xl mb-4">
        Thông tin đặt khám
      </div>

      {selectedServices.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ đã chọn:</div>
          <div className="space-y-2">
            {selectedServices.map(serviceId => {
              const service = services.find(s => s.id === serviceId);
              if (!service) return null;
              return (
                <div key={serviceId} className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 font-medium">{service.name}</div>
                    {service.minDuration && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{service.minDuration} phút</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    {formatPrice(service.price)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Duration Summary */}
          {getTotalDuration() > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-600">Tổng thời gian:</span>
              <span className="font-semibold text-blue-600">{getTotalDuration()} phút</span>
            </div>
          )}
          
          {/* Price Summary with Discount */}
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Tổng giá dịch vụ:</span>
              <span className="font-medium text-gray-900">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600">Giảm giá (10%):</span>
              <span className="font-medium text-green-600">-{formatPrice(totalPrice - discountedPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-600">Sau giảm giá:</span>
              <span className="font-semibold text-blue-600">{formatPrice(discountedPrice)}</span>
            </div>
            <div className="flex justify-between items-center text-sm bg-orange-50 -mx-2 px-2 py-2 rounded">
              <span className="text-orange-600 font-semibold">Cần đặt cọc (50%):</span>
              <span className="font-bold text-orange-600">{formatPrice(depositAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Bác sĩ:</div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              {selectedDoctor.imageUrl ? (
                <img src={selectedDoctor.imageUrl} alt={selectedDoctor.username} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                BS. {selectedDoctor.username}
              </div>
              <div className="text-xs text-gray-600">
                {selectedDoctor.medicleSpecially}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{selectedDoctor.rating}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {bookingType === 'SERVICE_AND_CONSULTATION' && selectedServices.length > 0 ? (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Thời gian:</div>
          <div className="space-y-3">
            {diagnosticSlots.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-2">Làm dịch vụ:</div>
                {diagnosticSlots.map((ds, idx) => (
                  <div key={idx} className="text-xs text-gray-900 bg-purple-50 p-2 rounded mb-1">
                    <div className="font-semibold">{ds.serviceName}</div>
                    <div className="text-purple-600">{formatTime(ds.startTime)} - {formatTime(ds.endTime)}</div>
                  </div>
                ))}
              </div>
            )}
            {consultationSlot && (
              <div>
                <div className="text-xs text-gray-600 mb-2">Khám bác sĩ:</div>
                <div className="text-xs text-gray-900 bg-green-50 p-2 rounded">
                  <div className="font-semibold">Khám với bác sĩ</div>
                  <div className="text-green-600">{formatTime(consultationSlot.startTime)} - {formatTime(consultationSlot.endTime)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : selectedSlot && weekSchedule[selectedDay] && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Thời gian khám:</div>
          <div className="text-sm text-gray-900">
            <div className="font-medium">{weekSchedule[selectedDay].label}</div>
            <div className="text-blue-600 font-semibold mt-1">
              {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onPayment}
        className={`w-full font-bold text-base border-none rounded-lg py-4 mb-3 transition-all ${
          isReadyToBook
            ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!isReadyToBook}
      >
        {selectedServices.length > 0 
          ? `Đặt cọc ${formatPrice(depositAmount)} và xác nhận`
          : 'Thanh toán và đặt khám'
        }
      </button>
      <div className="text-xs text-gray-500 text-center leading-relaxed">
        {selectedServices.length > 0 
          ? 'Bạn chỉ cần thanh toán 50% giá trị đơn hàng để giữ lịch hẹn. Số tiền còn lại sẽ thanh toán khi đến khám.'
          : 'Bằng cách nhấn nút thanh toán, bạn đã đồng ý với các điều khoản và điều kiện đặt khám'
        }
      </div>
    </div>
  );
};
