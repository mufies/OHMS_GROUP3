import React from 'react';
import { MedicalExamination } from '../../types/booking.types';
import { formatPrice, applyDiscount, calculateDeposit } from '../../utils/bookingHelpers';

interface ServiceSelectionModalProps {
  show: boolean;
  services: MedicalExamination[];
  selectedServices: string[];
  onToggleService: (serviceId: string) => void;
  onClose: () => void;
  getTotalDuration: () => number;
}

export const ServiceSelectionModal: React.FC<ServiceSelectionModalProps> = ({
  show,
  services,
  selectedServices,
  onToggleService,
  onClose,
  getTotalDuration
}) => {
  if (!show) return null;

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const totalPrice = getTotalPrice();
  const discountedPrice = applyDiscount(totalPrice);
  const depositAmount = calculateDeposit(discountedPrice);

  return (
    <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chọn dịch vụ khám</h2>
            <p className="text-sm text-gray-500 mt-1">Chọn một hoặc nhiều dịch vụ phù hợp</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Info Banner */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900 mb-1">Ưu đãi đặt khám online:</div>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Giảm 10% tổng giá trị dịch vụ</li>
                  <li>• Chỉ cần đặt cọc 50% để giữ lịch</li>
                  <li>• Thanh toán số còn lại khi đến khám</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {services.map(service => (
              <div
                key={service.id}
                onClick={() => onToggleService(service.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedServices.includes(service.id)
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedServices.includes(service.id)
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedServices.includes(service.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">{service.name}</div>
                    </div>
                    <div className="text-blue-600 font-bold text-sm mb-1">
                      {formatPrice(service.price)}
                    </div>
                    {service.minDuration && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{service.minDuration} phút</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">Đã chọn {selectedServices.length} dịch vụ</div>
            
            {/* Duration Info */}
            {selectedServices.length > 0 && getTotalDuration() > 0 && (
              <div className="mb-2">
                <div className="text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tổng thời gian: {getTotalDuration()} phút
                </div>
              </div>
            )}
            
            {/* Price Breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng giá dịch vụ:</span>
                <span className="font-medium text-gray-900">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Giảm giá (10% đặt online):</span>
                <span className="font-medium text-green-600">-{formatPrice(totalPrice - discountedPrice)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                <span className="text-gray-600">Sau giảm giá:</span>
                <span className="font-semibold text-blue-600">{formatPrice(discountedPrice)}</span>
              </div>
              <div className="flex justify-between text-sm pb-1">
                <span className="text-orange-600">Cần đặt cọc (50%):</span>
                <span className="font-bold text-orange-600">{formatPrice(depositAmount)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
