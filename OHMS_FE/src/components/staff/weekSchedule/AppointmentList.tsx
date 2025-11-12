import React from "react";
import { Appointment } from "./scheduleType";

interface AppointmentListProps {
  appointments: Appointment[];
  selectedSchedule: any;
}

export default function AppointmentList({
  appointments,
  selectedSchedule,
}: AppointmentListProps) {
  if (!selectedSchedule) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        Chọn một lịch làm việc để xem các cuộc hẹn
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ xử lý";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Danh sách lịch hẹn - {selectedSchedule.doctorName}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {selectedSchedule.workDate} ({selectedSchedule.startTime} -{" "}
        {selectedSchedule.endTime})
      </p>

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Không có lịch hẹn nào trong khung giờ này
        </p>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {apt.patientName}
                  </p>
                  <p className="text-sm text-gray-600">{apt.patientEmail}</p>
                  {apt.patientPhone && (
                    <p className="text-sm text-gray-600">{apt.patientPhone}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {apt.serviceAppointments.map((service) => (
                  <div
                    key={service.id}
                    className="bg-gray-50 p-3 rounded border-l-4 border-indigo-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {service.startTime} - {service.endTime}
                        </p>
                        <div className="mt-1">
                          {service.medicalExaminations.map((exam) => (
                            <span
                              key={exam.id}
                              className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2"
                            >
                              {exam.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {getStatusLabel(service.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
