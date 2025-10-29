import React, { useState } from 'react';
import { Doctor } from '../../types/booking.types';

interface DoctorSelectionModalProps {
  show: boolean;
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onSelectDoctor: (doctor: Doctor) => void;
  onClose: () => void;
}

export const DoctorSelectionModal: React.FC<DoctorSelectionModalProps> = ({
  show,
  doctors,
  selectedDoctor,
  onSelectDoctor,
  onClose
}) => {
  const [viewDoctorProfile, setViewDoctorProfile] = useState<string | null>(null);

  if (!show) return null;

  const handleViewProfile = (doctorId: string) => {
    setViewDoctorProfile(doctorId);
  };

  const handleCloseProfile = () => {
    setViewDoctorProfile(null);
  };

  const viewingDoctor = viewDoctorProfile 
    ? doctors.find(d => d.id === viewDoctorProfile) 
    : null;

  return (
    <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {viewingDoctor ? `Hồ sơ BS. ${viewingDoctor.username}` : 'Chọn bác sĩ'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {viewingDoctor ? 'Thông tin chi tiết bác sĩ' : 'Chọn bác sĩ phù hợp với nhu cầu của bạn'}
            </p>
          </div>
          <button
            onClick={viewingDoctor ? handleCloseProfile : onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {viewingDoctor ? (
            /* Doctor Profile View */
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {viewingDoctor.imageUrl ? (
                    <img src={viewingDoctor.imageUrl} alt={viewingDoctor.username} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">BS. {viewingDoctor.username}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Chuyên khoa:</span>
                      <span>{viewingDoctor.medicleSpecially}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Kinh nghiệm:</span>
                      <span>{viewingDoctor.experience}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Email:</span>
                      <span>{viewingDoctor.email}</span>
                    </div>
                    {viewingDoctor.phone && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Điện thoại:</span>
                        <span>{viewingDoctor.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{viewingDoctor.rating}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {viewingDoctor.patients}+ bệnh nhân
                    </div>
                  </div>
                </div>
              </div>

              {viewingDoctor.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Giới thiệu</h4>
                  <p className="text-gray-600 text-sm">{viewingDoctor.description}</p>
                </div>
              )}

              {viewingDoctor.education && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Học vấn</h4>
                  <p className="text-gray-600 text-sm">{viewingDoctor.education}</p>
                </div>
              )}

              {viewingDoctor.certifications && viewingDoctor.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Chứng chỉ</h4>
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                    {viewingDoctor.certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  onSelectDoctor(viewingDoctor);
                  handleCloseProfile();
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chọn bác sĩ này
              </button>
            </div>
          ) : (
            /* Doctor List View */
            <div className="space-y-3">
              {doctors.map(doctor => (
                <div
                  key={doctor.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedDoctor?.id === doctor.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => onSelectDoctor(doctor)}
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {doctor.imageUrl ? (
                          <img src={doctor.imageUrl} alt={doctor.username} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">BS. {doctor.username}</div>
                        <div className="text-sm text-gray-600 mb-2">{doctor.medicleSpecially}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{doctor.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{doctor.patients}+ bệnh nhân</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewProfile(doctor.id)}
                      className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!viewDoctorProfile && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedDoctor ? `Đã chọn: BS. ${selectedDoctor.username}` : 'Chưa chọn bác sĩ'}
            </div>
            <button
              onClick={onClose}
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
  );
};
