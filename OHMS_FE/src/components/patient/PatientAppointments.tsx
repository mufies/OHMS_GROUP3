import  { useEffect, useState } from "react";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";
import Navigator from "../Navigator";
import RescheduleModal from "../../components/patient/appointment/reScheduleAppointment";

// Interfaces
interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
}

interface ServiceAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExaminationInfo[];
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  doctorId: string | null;
  doctorName: string | null;
  doctorSpecialty: string | null;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExaminationInfo[] | null;
  parentAppointmentId: string | null;
  serviceAppointments: ServiceAppointment[] | null;
  discount: number | null;
  deposit: number | null;
  depositStatus: string | null;
  cancelTime: string | null;
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string;
    deposit: number | null;
    workDate: string;
  } | null>(null);
  
  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);

  const getPatientId = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId;
    } catch (error) {
      console.error("❌ Lỗi decode token:", error);
      return null;
    }
  };

  const fetchAppointments = async () => {
    const patientId = getPatientId();
    if (!patientId) return;

    try {
      const res = await axiosInstance.get(`/appointments/patient/${patientId}`);
      
      const sortedAppointments = res.data.sort((a: Appointment, b: Appointment) => {
        const dateTimeA = new Date(`${a.workDate} ${a.startTime}`);
        const dateTimeB = new Date(`${b.workDate} ${b.startTime}`);
        return dateTimeB.getTime() - dateTimeA.getTime();
      });
      
      setAppointments(sortedAppointments);
    } catch (err) {
      console.error("❌ Lỗi fetch:", err);
      setError("Không thể tải danh sách lịch hẹn.");
      toast.error("Không thể tải danh sách lịch hẹn!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const patientId = getPatientId();
    if (!patientId) {
      setError("Không tìm thấy ID bệnh nhân.");
      setLoading(false);
      return;
    }

    fetchAppointments();
  }, []);

  const getDaysUntilAppointment = (workDate: string): number => {
    const appointmentDate = new Date(workDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateRefund = (deposit: number, daysUntil: number): { amount: number; percentage: number } => {
    if (daysUntil >= 2) {
      return { amount: deposit, percentage: 100 };
    } else if (daysUntil === 1) {
      return { amount: Math.floor(deposit * 0.5), percentage: 50 };
    } else {
      return { amount: 0, percentage: 0 };
    }
  };

  const openCancelModal = (appointmentId: string, deposit: number | null, workDate: string) => {
    const daysUntil = getDaysUntilAppointment(workDate);
    
    if (daysUntil < 0) {
      toast.error("Không thể hủy lịch đã qua!");
      return;
    }

    setSelectedAppointment({ id: appointmentId, deposit, workDate });
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setCancellingId(selectedAppointment.id);
    try {
      await axiosInstance.put(`/appointments/${selectedAppointment.id}/cancel`);
      
      const daysUntil = getDaysUntilAppointment(selectedAppointment.workDate);
      const refund = calculateRefund(selectedAppointment.deposit || 0, daysUntil);
      
      setShowCancelModal(false);
      toast.success(`Hủy lịch thành công! Hoàn lại ${refund.amount.toLocaleString('vi-VN')} ₫`);
      
      await fetchAppointments();
    } catch (err) {
      console.error("❌ Lỗi hủy lịch:", err);
      toast.error("Hủy lịch thất bại!");
    } finally {
      setCancellingId(null);
      setSelectedAppointment(null);
    }
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSuccess = async () => {
    await fetchAppointments();
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'COMPLETED': 'Hoàn thành',
      'IN_PROGRESS': 'Đang khám',
      'Schedule': 'Đã đặt lịch',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-700',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'Schedule': 'bg-yellow-100 text-yellow-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải lịch khám...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Lịch khám</h2>
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Bạn chưa có lịch khám nào</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Navigator />
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch khám của tôi ({appointments.length})</h2>

        {appointments.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {a.doctorName || "Chưa phân công bác sĩ"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Chuyên khoa: <span className="font-medium">{a.doctorSpecialty?.replace(/[\[\]]/g, '') || "—"}</span>
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}>
                    {getStatusLabel(a.status)}
                  </span>
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    ID: {a.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Thông tin lịch hẹn */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-5 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ngày khám</p>
                    <p className="text-sm font-medium text-gray-900">{a.workDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Giờ khám</p>
                    <p className="text-sm font-medium text-gray-900">{a.startTime} - {a.endTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Liên hệ</p>
                    <p className="text-sm font-medium text-gray-900">{a.patientPhone || "--"}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => openCancelModal(a.id, a.deposit, a.workDate)}
                    disabled={cancellingId === a.id}
                    className="flex-1 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {cancellingId === a.id ? 'Đang hủy...' : 'Hủy lịch'}
                  </button>
                  <button
                    onClick={() => openRescheduleModal(a)}
                    className="flex-1 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Dời lịch
                  </button>
                </div>
              )}

              {/* Show cancel date if cancelled */}
              {a.status === 'CANCELLED' && a.cancelTime && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-red-900">Đã hủy lịch</p>
                      <p className="text-xs text-red-700">Ngày hủy: {new Date(a.cancelTime).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment, Services - giữ nguyên như code cũ */}
              {(a.deposit !== null || a.discount !== null) && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="text-base font-bold text-gray-900">Thông tin thanh toán</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {a.discount !== null && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Giảm giá</p>
                        <p className="text-sm font-bold text-green-600">{a.discount}%</p>
                      </div>
                    )}
                    {a.deposit !== null && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Tiền cọc</p>
                        <p className="text-sm font-bold text-green-600">{a.deposit.toLocaleString('vi-VN')} ₫</p>
                      </div>
                    )}
                    {a.depositStatus && (
                      <div className="bg-white rounded-lg p-3 col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Trạng thái cọc</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          a.depositStatus === 'DEPOSIT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {a.depositStatus === 'DEPOSIT' ? 'Đã cọc' : 'Chưa cọc'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {a.medicalExaminations && a.medicalExaminations.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-base font-bold text-gray-900">Dịch vụ khám</h4>
                  </div>
                  <ul className="space-y-2">
                    {a.medicalExaminations.map((m) => (
                      <li key={m.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm text-gray-900">{m.name}</span>
                          {m.minDuration && (
                            <span className="ml-2 text-xs text-gray-500">({m.minDuration} phút)</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-indigo-600">{m.price.toLocaleString("vi-VN")} ₫</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {a.serviceAppointments && a.serviceAppointments.length > 0 && (
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <h4 className="text-base font-bold text-gray-900">Dịch vụ bổ sung ({a.serviceAppointments.length})</h4>
                  </div>
                  <div className="space-y-3">
                    {a.serviceAppointments.map((service) => (
                      <div key={service.id} className="bg-white rounded-lg p-3 border-l-4 border-pink-400">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">
                            {service.startTime} - {service.endTime}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(service.status)}`}>
                            {getStatusLabel(service.status)}
                          </span>
                        </div>
                        {service.medicalExaminations.map((exam) => (
                          <div key={exam.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-900">{exam.name}</span>
                            <span className="text-sm font-bold text-pink-600">{exam.price.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận hủy lịch</h3>
                  <p className="text-sm text-gray-500">Bạn có chắc chắn muốn hủy lịch khám này?</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {(() => {
                const daysUntil = getDaysUntilAppointment(selectedAppointment.workDate);
                const refund = calculateRefund(selectedAppointment.deposit || 0, daysUntil);
                
                return (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-blue-900">Thời gian còn lại</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {daysUntil} ngày
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-green-900">Số tiền hoàn lại</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-green-600">
                          {refund.amount.toLocaleString('vi-VN')} ₫
                        </p>
                        <span className="text-sm text-green-700 font-medium">
                          ({refund.percentage}%)
                        </span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        <strong>Lưu ý:</strong> Số tiền hoàn lại sẽ được chuyển về tài khoản của bạn trong 3-5 ngày làm việc.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={confirmCancelAppointment}
                disabled={cancellingId !== null}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {cancellingId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Xác nhận hủy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleAppointment && (
        <RescheduleModal
          appointment={rescheduleAppointment}
          patientAppointments={appointments}
          onClose={() => {
            setShowRescheduleModal(false);
            setRescheduleAppointment(null);
          }}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </>
  );
}
