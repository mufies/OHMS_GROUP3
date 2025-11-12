import { useState, useEffect } from "react";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";

interface CancelledAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientBankName?: string;
  patientBankNumber?: string;
  
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  deposit: number | null;
  cancelTime: string;
  isRemoveByChangeSchedule?: boolean;
  medicalExaminations: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export default function CancelRequestManager() {
  const [cancelledAppointments, setCancelledAppointments] = useState<CancelledAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CancelledAppointment | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCancelledAppointments();
  }, []);

  const fetchCancelledAppointments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/appointments/cancelled");
      
      // ← SORT: Chờ hoàn tiền lên đầu
      const sorted = (res.data as CancelledAppointment[]).sort((a, b) => {
        const aIsRefunded = a.deposit !== null && a.deposit < 0;
        const bIsRefunded = b.deposit !== null && b.deposit < 0;
        
        const aRefund = calculateRefund(
          Math.abs(a.deposit || 0),
          a.cancelTime,
          a.workDate,
          a.isRemoveByChangeSchedule
        );
        
        const bRefund = calculateRefund(
          Math.abs(b.deposit || 0),
          b.cancelTime,
          b.workDate,
          b.isRemoveByChangeSchedule
        );
        
        // Priority: Chờ hoàn tiền (có refund > 0) > Đã hoàn tiền > Không hoàn
        if (!aIsRefunded && aRefund.amount > 0 && (bIsRefunded || bRefund.amount === 0)) {
          return -1; // a lên trước (chờ hoàn tiền)
        }
        if (!bIsRefunded && bRefund.amount > 0 && (aIsRefunded || aRefund.amount === 0)) {
          return 1; // b lên trước (chờ hoàn tiền)
        }
        
        // Nếu cùng trạng thái, sort theo ngày hủy (mới nhất trước)
        return new Date(b.cancelTime).getTime() - new Date(a.cancelTime).getTime();
      });
      
      setCancelledAppointments(sorted);
    } catch (error) {
      console.error("Error fetching cancelled appointments:", error);
      toast.error("Không thể tải danh sách lịch đã hủy");
    } finally {
      setLoading(false);
    }
  };

  const calculateRefund = (deposit: number, cancelTime: string, workDate: string, isRemoveByChangeSchedule?: boolean): { amount: number; percentage: number } => {
    if (isRemoveByChangeSchedule === true) {
      return { amount: deposit, percentage: 100 };
    }
    
    const cancelDate = new Date(cancelTime);
    const appointmentDate = new Date(workDate);
    
    cancelDate.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const diffTime = appointmentDate.getTime() - cancelDate.getTime();
    const daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysBetween >= 2) {
      return { amount: deposit, percentage: 100 };
    } else if (daysBetween >= 1) {
      return { amount: Math.floor(deposit * 0.5), percentage: 50 };
    } else {
      return { amount: 0, percentage: 0 };
    }
  };

  const handleConfirmRefund = async (appointmentId: string, refundAmount: number) => {
    if (refundAmount === 0) {
      toast.error("Không có tiền để hoàn!");
      return;
    }

    setProcessingId(appointmentId);
    try {
      await axiosInstance.put(`/appointments/${appointmentId}/refund`, {
        refundAmount: refundAmount
      });

      toast.success(`Đã xác nhận hoàn tiền ${refundAmount.toLocaleString('vi-VN')} ₫`);
      
      setShowBankModal(false);
      setSelectedAppointment(null);
      
      await fetchCancelledAppointments();
    } catch (error: any) {
      console.error("Error confirming refund:", error);
      toast.error(error.response?.data?.message || "Không thể xác nhận hoàn tiền");
    } finally {
      setProcessingId(null);
    }
  };

  const openBankModal = (appointment: CancelledAppointment) => {
    setSelectedAppointment(appointment);
    setShowBankModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Báo cáo lịch đã hủy</h2>
          <p className="text-sm text-gray-600 mt-1">Quản lý hoàn tiền cho các lịch hẹn bị hủy</p>
        </div>
        <button
          onClick={fetchCancelledAppointments}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Hướng dẫn hoàn tiền</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• <strong>Chờ hoàn tiền</strong> sẽ hiển thị ở trên cùng</li>
              <li>• Bấm vào appointment để xem thông tin ngân hàng của bệnh nhân</li>
              <li>• Chuyển khoản số tiền refund đến tài khoản của bệnh nhân</li>
              <li>• Sau khi chuyển xong, bấm "Xác nhận đã hoàn tiền"</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : cancelledAppointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">Không có lịch hẹn nào bị hủy</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tổng số lịch đã hủy: <strong>{cancelledAppointments.length}</strong>
          </p>

          <div className="grid gap-4">
            {cancelledAppointments.map((appointment) => {
              const refund = calculateRefund(
                Math.abs(appointment.deposit || 0),
                appointment.cancelTime,
                appointment.workDate,
                appointment.isRemoveByChangeSchedule
              );
              const isRefunded = appointment.deposit !== null && appointment.deposit < 0;
              const refundedAmount = isRefunded ? Math.abs(appointment.deposit || 0) : 0;

              return (
                <div
                  key={appointment.id}
                  onClick={() => !isRefunded && refund.amount > 0 && openBankModal(appointment)}
                  className={`bg-white rounded-lg border-2 p-6 transition-all ${
                    isRefunded 
                      ? 'border-green-300 bg-green-50 cursor-default' 
                      : refund.amount > 0
                      ? 'border-red-300 hover:shadow-lg hover:border-red-400 cursor-pointer'
                      : 'border-gray-300 cursor-default'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{appointment.patientName}</h4>
                          <p className="text-sm text-gray-600">
                            📧 {appointment.patientEmail} | 📞 {appointment.patientPhone || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          Bác sĩ: {appointment.doctorName}
                        </span>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-full font-bold ${
                      isRefunded 
                        ? 'bg-green-200 text-green-800' 
                        : refund.amount > 0 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {isRefunded ? '✅ Đã hoàn tiền' : refund.amount > 0 ? '⏳ Chờ hoàn tiền' : '❌ Không hoàn'}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-1">Ngày khám</p>
                      <p className="text-sm font-bold text-blue-900">{appointment.workDate}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-purple-700 font-semibold mb-1">Giờ khám</p>
                      <p className="text-sm font-bold text-purple-900">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs text-orange-700 font-semibold mb-1">Ngày hủy</p>
                      <p className="text-sm font-bold text-orange-900">
                        {appointment.cancelTime?.split('T')[0] || appointment.cancelTime}
                      </p>
                    </div>

                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                      <p className="text-xs text-teal-700 font-semibold mb-1">Trạng thái</p>
                      <p className="text-sm font-bold text-teal-900">{appointment.status}</p>
                    </div>
                  </div>

                  {/* Refund Info */}
                  <div className={`rounded-lg p-4 border-2 ${
                    isRefunded 
                      ? 'bg-green-50 border-green-200' 
                      : refund.percentage === 100 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : refund.percentage === 50 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {isRefunded ? (
                          <>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              Tiền cọc ban đầu: {refundedAmount.toLocaleString('vi-VN')} ₫
                            </p>
                            <p className="text-lg font-bold text-green-700">
                              ✅ Đã hoàn: {refundedAmount.toLocaleString('vi-VN')} ₫
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              Tiền cọc: {Math.abs(appointment.deposit || 0).toLocaleString('vi-VN')} ₫
                            </p>
                            <p className={`text-lg font-bold ${
                              refund.percentage === 100 ? 'text-yellow-700' :
                              refund.percentage === 50 ? 'text-orange-700' :
                              'text-gray-700'
                            }`}>
                              Cần hoàn: {refund.amount.toLocaleString('vi-VN')} ₫ ({refund.percentage}%)
                            </p>
                          </>
                        )}
                      </div>
                      
                      {!isRefunded && refund.amount > 0 && (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  {appointment.medicalExaminations && appointment.medicalExaminations.length > 0 && (
                    <div className="mt-4 bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                      <p className="text-xs font-semibold text-indigo-900 mb-2">Dịch vụ đã đặt:</p>
                      <div className="space-y-1">
                        {appointment.medicalExaminations.map((exam) => (
                          <div key={exam.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{exam.name}</span>
                            <span className="font-semibold text-indigo-600">
                              {exam.price.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bank Info Modal - ← TRANSPARENT BACKGROUND */}
      {showBankModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Thông tin hoàn tiền</h3>
                  <p className="text-sm text-gray-500">Chuyển khoản đến tài khoản bệnh nhân</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Patient Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-3">THÔNG TIN BỆNH NHÂN</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Họ tên:</span>
                    <span className="font-bold text-blue-900">{selectedAppointment.patientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Email:</span>
                    <span className="font-medium text-blue-900">{selectedAppointment.patientEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Số điện thoại:</span>
                    <span className="font-medium text-blue-900">{selectedAppointment.patientPhone}</span>
                  </div>
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                <p className="text-xs font-semibold text-green-900 mb-3">🏦 THÔNG TIN NGÂN HÀNG</p>
                <div className="space-y-3">
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Tên ngân hàng</p>
                    <p className="text-lg font-bold text-green-900">
                      {selectedAppointment.patientBankName || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Số tài khoản</p>
                    <p className="text-lg font-bold text-green-900 tracking-wider">
                      {selectedAppointment.patientBankNumber || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Amount */}
              {(() => {
                const refund = calculateRefund(
                  Math.abs(selectedAppointment.deposit || 0),
                  selectedAppointment.cancelTime,
                  selectedAppointment.workDate,
                  selectedAppointment.isRemoveByChangeSchedule
                );

                return (
                  <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300">
                    <p className="text-xs font-semibold text-amber-900 mb-3">💰 SỐ TIỀN CẦN HOÀN</p>
                    
                    {selectedAppointment.isRemoveByChangeSchedule && (
                      <div className="mb-3 bg-red-100 border border-red-300 rounded-lg p-2">
                        <p className="text-xs font-semibold text-red-800">
                          ⚠️ Bác sĩ đã điều chỉnh lịch → Hoàn 100% tiền cọc
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700">Tiền cọc:</span>
                        <span className="font-bold text-amber-900">
                          {Math.abs(selectedAppointment.deposit || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700">Tỷ lệ hoàn:</span>
                        <span className="font-bold text-amber-900">{refund.percentage}%</span>
                      </div>
                      <div className="border-t border-amber-300 pt-2 flex justify-between">
                        <span className="font-bold text-amber-900">Số tiền hoàn:</span>
                        <span className="text-2xl font-bold text-amber-700">
                          {refund.amount.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-red-800">
                  <strong>⚠️ Lưu ý:</strong> Chỉ bấm "Xác nhận đã hoàn tiền" sau khi đã chuyển khoản thành công!
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowBankModal(false);
                  setSelectedAppointment(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const refund = calculateRefund(
                    Math.abs(selectedAppointment.deposit || 0),
                    selectedAppointment.cancelTime,
                    selectedAppointment.workDate,
                    selectedAppointment.isRemoveByChangeSchedule
                  );
                  handleConfirmRefund(selectedAppointment.id, refund.amount);
                }}
                disabled={processingId !== null}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
              >
                {processingId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Xác nhận đã hoàn tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
