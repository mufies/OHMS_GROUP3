import { axiosInstance } from "../utils/fetchFromAPI";

export interface BulkScheduleItem {
  doctorId: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleChangeRequestRequest {
  targetDoctorId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  dateChange: string;
  startTime?: string;
  endTime?: string;
  department: string;
  note?: string;
  affectedDoctorIds: string[];
  createdByStaffId: string;
  bulkSchedules?: BulkScheduleItem[]; // Thêm field cho bulk create
}

export interface ScheduleChangeRequestResponse {
  id: string;
  targetDoctorId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  dateChange: string;
  newStartTime?: string; // Backend trả về newStartTime
  newEndTime?: string;   // Backend trả về newEndTime
  department: string;
  reason?: string;       // Backend trả về reason
  rejectionNote?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "APPLIED";
  affectedDoctorIds: string[];
  approvedDoctorIds: string[];
  rejectedByDoctorId?: string;
  createdByStaffId: string;
  targetScheduleId?: string;
  createdAt: string;
  updatedAt: string;
}

export const scheduleChangeRequestService = {
  // Tạo schedule change request mới
  createRequest: async (request: ScheduleChangeRequestRequest) => {
    const response = await axiosInstance.post("/schedule-change-requests", request);
    return response.data;
  },

  // Tạo nhiều schedule requests cùng lúc (bulk create)
  createBulkRequests: async (request: ScheduleChangeRequestRequest) => {
    const response = await axiosInstance.post("/schedule-change-requests/bulk", request);
    return response.data;
  },

  // Lấy tất cả requests
  getAllRequests: async () => {
    const response = await axiosInstance.get("/schedule-change-requests");
    return response.data;
  },

  // Lấy request theo ID
  getRequestById: async (requestId: string) => {
    const response = await axiosInstance.get(`/schedule-change-requests/${requestId}`);
    return response.data;
  },

  // Lấy requests theo ngày và department
  getRequestsByDateAndDepartment: async (dateChange: string, department: string) => {
    const response = await axiosInstance.get(
      `/schedule-change-requests/date/${dateChange}/department/${department}`
    );
    return response.data;
  },

  // Lấy requests theo ngày, department và status
  getRequestsByDateAndDepartmentAndStatus: async (
    dateChange: string,
    department: string,
    status: string
  ) => {
    const response = await axiosInstance.get(
      `/schedule-change-requests/date/${dateChange}/department/${department}/status/${status}`
    );
    return response.data;
  },

  // Lấy requests theo ngày
  getRequestsByDate: async (dateChange: string) => {
    const response = await axiosInstance.get(`/schedule-change-requests/date/${dateChange}`);
    return response.data;
  },

  // Lấy requests theo department
  getRequestsByDepartment: async (department: string) => {
    const response = await axiosInstance.get(`/schedule-change-requests/department/${department}`);
    return response.data;
  },

  // Lấy pending requests của doctor
  getPendingRequestsForDoctor: async (doctorId: string) => {
    const response = await axiosInstance.get(
      `/schedule-change-requests/doctor/${doctorId}/pending-for-approval`
    );
    return response.data;
  },

  // Doctor approve request
  approveRequestByDoctor: async (requestId: string, doctorId: string) => {
    const response = await axiosInstance.post(
      `/schedule-change-requests/${requestId}/approve/doctor/${doctorId}`
    );
    return response.data;
  },

  // Doctor reject request
  rejectRequestByDoctor: async (requestId: string, doctorId: string, rejectionNote?: string) => {
    const params = rejectionNote ? `?note=${encodeURIComponent(rejectionNote)}` : "";
    const response = await axiosInstance.post(
      `/schedule-change-requests/${requestId}/reject/doctor/${doctorId}${params}`
    );
    return response.data;
  },

  // Lấy requests by status
  getRequestsByStatus: async (status: string) => {
    const response = await axiosInstance.get(`/schedule-change-requests/status/${status}`);
    return response.data;
  },

  // Update request (chỉ khi PENDING)
  updateRequest: async (requestId: string, request: Partial<ScheduleChangeRequestRequest>) => {
    const response = await axiosInstance.patch(`/schedule-change-requests/${requestId}`, request);
    return response.data;
  },
};
