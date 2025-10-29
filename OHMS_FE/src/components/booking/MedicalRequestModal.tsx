import React, { useState } from 'react';
import { MedicalServicesRequest } from '../../types/booking.types';
import { formatPrice } from '../../utils/bookingHelpers';

interface MedicalRequestModalProps {
  show: boolean;
  requests: MedicalServicesRequest[];
  onUseRequest: (request: MedicalServicesRequest) => void;
  onDecline: () => void;
}

export const MedicalRequestModal: React.FC<MedicalRequestModalProps> = ({
  show,
  requests,
  onUseRequest,
  onDecline
}) => {
  const [selectedRequest, setSelectedRequest] = useState<MedicalServicesRequest | null>(null);

  if (!show || requests.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Yêu cầu khám bệnh từ bác sĩ</h2>
            <p className="text-sm text-gray-500 mt-1">Bạn có yêu cầu khám bệnh từ bác sĩ. Bạn có muốn sử dụng yêu cầu này?</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedRequest?.id === request.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Yêu cầu từ BS. {request.doctor.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Chuyên khoa: {request.medicalSpecialty}
                    </div>
                    {request.createdAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ngày tạo: {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedRequest?.id === request.id
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedRequest?.id === request.id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Dịch vụ yêu cầu:</div>
                  <div className="space-y-2">
                    {request.medicalExaminations.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-900">{exam.name}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{formatPrice(exam.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Tổng cộng:</span>
                    <span className="text-base font-bold text-blue-600">
                      {formatPrice(
                        request.medicalExaminations.reduce((sum, exam) => sum + exam.price, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onDecline}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Tự chọn dịch vụ
          </button>
          <button
            onClick={() => selectedRequest && onUseRequest(selectedRequest)}
            disabled={!selectedRequest}
            className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-colors ${
              selectedRequest
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Sử dụng yêu cầu này
          </button>
        </div>
      </div>
    </div>
  );
};
