import React from "react";
import { Appointment } from "./scheduleType";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: any;
  affectedAppointments: Appointment[];
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  schedule,
  affectedAppointments,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-red-600">
          Xác nhận xóa lịch làm việc
        </h3>

        <div className="mb-4">
          <p className="text-gray-700">
            Bạn có chắc chắn muốn xóa lịch làm việc của{" "}
            <strong>{schedule.doctorName}</strong> vào ngày{" "}
            <strong>{schedule.workDate}</strong> ({schedule.startTime} -{" "}
            {schedule.endTime})?
          </p>
        </div>

        {affectedAppointments.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-medium mb-2">
              ⚠️ Có {affectedAppointments.length} lịch hẹn sẽ bị ảnh hưởng:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {affectedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="text-sm bg-white p-2 rounded border border-red-100"
                >
                  <p className="font-medium">{apt.patientName}</p>
                  <p className="text-gray-600">{apt.patientEmail}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-700 mt-2">
              Hệ thống sẽ tự động gửi email thông báo cho các bệnh nhân này.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
