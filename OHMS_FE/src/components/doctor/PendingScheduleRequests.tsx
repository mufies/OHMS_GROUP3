import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  scheduleChangeRequestService,
  ScheduleChangeRequestResponse,
} from "../../services/scheduleChangeRequestService";

interface PendingScheduleRequestsProps {
  doctorId: string;
}

const formatTime = (timeStr?: string): string => {
  if (!timeStr) return "";
  return timeStr.substring(0, 5);
};

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const getDayName = (dateStr: string): string => {
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return days[date.getDay()];
};

export default function PendingScheduleRequests({ doctorId }: PendingScheduleRequestsProps) {
  const [requests, setRequests] = useState<ScheduleChangeRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequestResponse | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, [doctorId]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await scheduleChangeRequestService.getPendingRequestsForDoctor(doctorId);
      const filteredRequests = (response.results || []).filter(
        (request: ScheduleChangeRequestResponse) => request.targetDoctorId === doctorId
      );
      setRequests(filteredRequests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast.error("Không thể tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await scheduleChangeRequestService.approveRequestByDoctor(requestId, doctorId);
      toast.success("✅ Đã phê duyệt yêu cầu thành công!");
      fetchPendingRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.message || "Không thể phê duyệt yêu cầu");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      await scheduleChangeRequestService.rejectRequestByDoctor(
        selectedRequest.id,
        doctorId,
        rejectionNote
      );
      toast.success("❌ Đã từ chối yêu cầu");
      setShowRejectModal(false);
      setRejectionNote("");
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.message || "Không thể từ chối yêu cầu");
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case "CREATE":
        return { label: "Tạo mới", color: "bg-green-100 text-green-700", icon: "➕" };
      case "UPDATE":
        return { label: "Cập nhật", color: "bg-blue-100 text-blue-700", icon: "✏️" };
      case "DELETE":
        return { label: "Xóa", color: "bg-red-100 text-red-700", icon: "🗑️" };
      default:
        return { label: type, color: "bg-gray-100 text-gray-700", icon: "❓" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📋 Yêu cầu thay đổi lịch chờ phê duyệt
            </h2>
            <p className="text-sm text-gray-600">
              Các yêu cầu thay đổi lịch làm việc cần sự phê duyệt của bạn
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-indigo-600">{requests.length}</div>
            <div className="text-sm text-gray-600 mt-1">Yêu cầu chờ</div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không có yêu cầu nào chờ phê duyệt
          </h3>
          <p className="text-gray-600">Tất cả yêu cầu thay đổi lịch đã được xử lý</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const changeType = getChangeTypeLabel(request.changeType);
            const approvedCount = request.approvedDoctorIds?.length || 0;
            const totalCount = request.affectedDoctorIds?.length || 1;
            const isApprovedByMe = request.approvedDoctorIds?.includes(doctorId) || false;

            return (
              <div
                key={request.id}
                className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${
                  isApprovedByMe ? "border-green-300 bg-green-50" : "border-gray-200"
                }`}
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${changeType.color}`}>
                          {changeType.icon} {changeType.label}
                        </span>
                        <span className="text-xs text-gray-500">#{request.id.slice(0, 8)}</span>
                      </div>

                      {/* ← DATE & TIME HIỂN THỊ RÕ RÀNG */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h3 className="text-lg font-bold text-gray-900">
                            {getDayName(request.dateChange)}, {formatDate(request.dateChange)}
                          </h3>
                        </div>

                        {/* THỜI GIAN HIỂN THỊ RÕ RÀNG */}
                        {request.changeType === "CREATE" && request.newStartTime && request.newEndTime && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 rounded-xl border-2 border-green-300">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-green-700 font-semibold mb-1">
                                  ➕ TẠO LỊCH MỚI
                                </p>
                                <p className="text-3xl font-black text-green-900 tracking-tight">
                                  {formatTime(request.newStartTime)} - {formatTime(request.newEndTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.changeType === "UPDATE" && request.newStartTime && request.newEndTime && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 rounded-xl border-2 border-blue-300">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-blue-700 font-semibold mb-1">
                                  ✏️ CẬP NHẬT THỜI GIAN
                                </p>
                                <p className="text-3xl font-black text-blue-900 tracking-tight">
                                  {formatTime(request.newStartTime)} - {formatTime(request.newEndTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.changeType === "DELETE" && request.newStartTime && request.newEndTime && (
                          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4 rounded-xl border-2 border-red-300">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-red-700 font-semibold mb-1">
                                  🗑️ XÓA LỊCH LÀM VIỆC
                                </p>
                                <p className="text-3xl font-black text-red-900 tracking-tight">
                                  {formatTime(request.newStartTime)} - {formatTime(request.newEndTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>
                            Khoa: <strong className="text-gray-900">{request.department}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Approval Status */}
                    <div className="text-right ml-4">
                      {isApprovedByMe ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold text-green-700">Đã phê duyệt</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold text-orange-700">Chờ phê duyệt</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason/Note */}
                  {request.reason && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>📝 Lý do:</strong> {request.reason}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isApprovedByMe && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Phê duyệt
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Từ chối
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tạo lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}
                    </div>
                    <div className="text-indigo-600 font-medium">
                      {approvedCount}/{totalCount} phê duyệt
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
              <h3 className="text-xl font-bold text-gray-900">❌ Từ chối yêu cầu</h3>
              <p className="text-sm text-gray-600 mt-1">
                Vui lòng cung cấp lý do từ chối để gửi cho staff
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Ví dụ: Tôi đã có lịch cá nhân vào ngày này..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Lưu ý:</strong> Khi từ chối, yêu cầu này sẽ bị hủy ngay lập tức và
                  staff sẽ nhận được thông báo qua email.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionNote("");
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionNote.trim()}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  rejectionNote.trim()
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
