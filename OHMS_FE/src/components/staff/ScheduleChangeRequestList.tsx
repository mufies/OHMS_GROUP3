// import { useState, useEffect } from "react";
// import { toast } from "react-toastify";
// import {
//   scheduleChangeRequestService,
//   ScheduleChangeRequestResponse,
// } from "../../services/scheduleChangeRequestService";

// interface ScheduleChangeRequestListProps {
//   staffInfo: {
//     id: string;
//     medicleSpecially: string[];
//   };
// }

// const formatTime = (timeStr?: string): string => {
//   if (!timeStr) return "";
//   return timeStr.substring(0, 5);
// };

// const formatDate = (dateStr: string): string => {
//   const [year, month, day] = dateStr.split("-");
//   return `${day}/${month}/${year}`;
// };

// const getDayName = (dateStr: string): string => {
//   const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
//   const [year, month, day] = dateStr.split("-").map(Number);
//   const date = new Date(year, month - 1, day);
//   return days[date.getDay()];
// };

// export default function ScheduleChangeRequestList({ staffInfo }: ScheduleChangeRequestListProps) {
//   const [requests, setRequests] = useState<ScheduleChangeRequestResponse[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
//   const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");

//   useEffect(() => {
//     fetchRequests();
//   }, [selectedStatus, selectedDepartment]);

//   const fetchRequests = async () => {
//     setLoading(true);
//     try {
//       let response;
      
//       if (selectedStatus === "ALL" && selectedDepartment === "ALL") {
//         response = await scheduleChangeRequestService.getAllRequests();
//       } else if (selectedStatus !== "ALL" && selectedDepartment === "ALL") {
//         response = await scheduleChangeRequestService.getRequestsByStatus(selectedStatus);
//       } else if (selectedStatus === "ALL" && selectedDepartment !== "ALL") {
//         response = await scheduleChangeRequestService.getRequestsByDepartment(selectedDepartment);
//       } else {
//         // Both filters active - need to filter client-side
//         response = await scheduleChangeRequestService.getAllRequests();
//         const filtered = response.results.filter(
//           (r: ScheduleChangeRequestResponse) =>
//             r.status === selectedStatus && r.department === selectedDepartment
//         );
//         setRequests(filtered);
//         setLoading(false);
//         return;
//       }

//       setRequests(response.results || []);
//     } catch (error) {
//       console.error("Error fetching requests:", error);
//       toast.error("Không thể tải danh sách yêu cầu");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getChangeTypeLabel = (type: string) => {
//     switch (type) {
//       case "CREATE":
//         return { label: "Tạo mới", color: "bg-green-100 text-green-700", icon: "➕" };
//       case "UPDATE":
//         return { label: "Cập nhật", color: "bg-blue-100 text-blue-700", icon: "✏️" };
//       case "DELETE":
//         return { label: "Xóa", color: "bg-red-100 text-red-700", icon: "🗑️" };
//       default:
//         return { label: type, color: "bg-gray-100 text-gray-700", icon: "❓" };
//     }
//   };

//   const getStatusLabel = (status: string) => {
//     switch (status) {
//       case "PENDING":
//         return { label: "Chờ phê duyệt", color: "bg-yellow-100 text-yellow-700", icon: "⏳" };
//       case "APPROVED":
//         return { label: "Đã phê duyệt", color: "bg-green-100 text-green-700", icon: "✅" };
//       case "APPLIED":
//         return { label: "Đã áp dụng", color: "bg-indigo-100 text-indigo-700", icon: "🎯" };
//       case "REJECTED":
//         return { label: "Đã từ chối", color: "bg-red-100 text-red-700", icon: "❌" };
//       default:
//         return { label: status, color: "bg-gray-100 text-gray-700", icon: "❓" };
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center py-12">
//         <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
//         <h2 className="text-2xl font-bold text-gray-900 mb-2">
//           📋 Danh sách yêu cầu thay đổi lịch
//         </h2>
//         <p className="text-sm text-gray-600">
//           Quản lý tất cả các yêu cầu thay đổi lịch làm việc của bác sĩ
//         </p>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl border border-gray-200 p-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Status Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Trạng thái
//             </label>
//             <select
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//             >
//               <option value="ALL">Tất cả</option>
//               <option value="PENDING">⏳ Chờ phê duyệt</option>
//               <option value="APPROVED">✅ Đã phê duyệt</option>
//               <option value="APPLIED">🎯 Đã áp dụng</option>
//               <option value="REJECTED">❌ Đã từ chối</option>
//             </select>
//           </div>

//           {/* Department Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Chuyên khoa
//             </label>
//             <select
//               value={selectedDepartment}
//               onChange={(e) => setSelectedDepartment(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//             >
//               <option value="ALL">Tất cả</option>
//               {staffInfo.medicleSpecially.map((dept) => (
//                 <option key={dept} value={dept}>
//                   {dept}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Statistics */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs text-gray-600">Tổng số</p>
//               <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
//             </div>
//             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
//               <span className="text-2xl">📋</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-yellow-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs text-yellow-600">Chờ duyệt</p>
//               <p className="text-2xl font-bold text-yellow-700">
//                 {requests.filter((r) => r.status === "PENDING").length}
//               </p>
//             </div>
//             <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
//               <span className="text-2xl">⏳</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-green-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs text-green-600">Đã áp dụng</p>
//               <p className="text-2xl font-bold text-green-700">
//                 {requests.filter((r) => r.status === "APPLIED").length}
//               </p>
//             </div>
//             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
//               <span className="text-2xl">✅</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-red-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs text-red-600">Đã từ chối</p>
//               <p className="text-2xl font-bold text-red-700">
//                 {requests.filter((r) => r.status === "REJECTED").length}
//               </p>
//             </div>
//             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
//               <span className="text-2xl">❌</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Requests List */}
//       {requests.length === 0 ? (
//         <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
//           <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg
//               className="w-12 h-12 text-gray-400"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//               />
//             </svg>
//           </div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có yêu cầu nào</h3>
//           <p className="text-gray-600">Thử thay đổi bộ lọc hoặc tạo yêu cầu mới</p>
//         </div>
//       ) : (
//         <div className="grid gap-4">
//           {requests.map((request) => {
//             const changeType = getChangeTypeLabel(request.changeType);
//             const status = getStatusLabel(request.status);
//             const approvedCount = request.approvedDoctorIds.length;
//             const totalCount = request.affectedDoctorIds.length;
//             const progressPercent = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

//             return (
//               <div
//                 key={request.id}
//                 className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all"
//               >
//                 <div className="p-6">
//                   {/* Header Row */}
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2 flex-wrap">
//                         <span
//                           className={`px-3 py-1 rounded-full text-xs font-bold ${changeType.color}`}
//                         >
//                           {changeType.icon} {changeType.label}
//                         </span>
//                         <span
//                           className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
//                         >
//                           {status.icon} {status.label}
//                         </span>
//                         <span className="text-xs text-gray-500">#{request.id.slice(0, 8)}</span>
//                       </div>
//                       <h3 className="text-lg font-bold text-gray-900">
//                         {getDayName(request.dateChange)} - {formatDate(request.dateChange)}
//                       </h3>
//                       <p className="text-sm text-gray-600 mt-1">
//                         🏥 Department: <strong>{request.department}</strong>
//                       </p>
//                     </div>

//                     {/* Approval Progress (chỉ hiện nếu PENDING) */}
//                     {request.status === "PENDING" && (
//                       <div className="text-right">
//                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-lg">
//                           <svg
//                             className="w-5 h-5 text-indigo-600"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                             />
//                           </svg>
//                           <span className="text-sm font-bold text-indigo-700">
//                             {approvedCount}/{totalCount} phê duyệt
//                           </span>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Schedule Details */}
//                   {(request.startTime || request.endTime) && (
//                     <div className="bg-gray-50 rounded-lg p-4 mb-4">
//                       <div className="flex items-center gap-2 text-gray-700">
//                         <svg
//                           className="w-5 h-5 text-gray-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//                           />
//                         </svg>
//                         <span className="font-semibold">
//                           Thời gian: {formatTime(request.startTime)} - {formatTime(request.endTime)}
//                         </span>
//                       </div>
//                     </div>
//                   )}

//                   {/* Note */}
//                   {request.note && (
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
//                       <p className="text-sm text-blue-800">
//                         <strong>📝 Ghi chú:</strong> {request.note}
//                       </p>
//                     </div>
//                   )}

//                   {/* Progress Bar (chỉ hiện nếu PENDING) */}
//                   {request.status === "PENDING" && (
//                     <div className="mb-4">
//                       <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
//                         <span>Tiến độ phê duyệt</span>
//                         <span>{Math.round(progressPercent)}%</span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div
//                           className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
//                           style={{ width: `${progressPercent}%` }}
//                         ></div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Timestamp */}
//                   <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
//                     <span>Tạo lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}</span>
//                     {request.status === "APPLIED" && (
//                       <span className="text-green-600 font-semibold">
//                         ✅ Đã áp dụng vào lịch làm việc
//                       </span>
//                     )}
//                     {request.status === "REJECTED" && request.rejectedByDoctorId && (
//                       <span className="text-red-600 font-semibold">
//                         ❌ Bị từ chối bởi bác sĩ
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }
