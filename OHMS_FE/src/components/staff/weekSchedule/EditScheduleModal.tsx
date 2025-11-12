import React, { useState, useEffect } from "react";
import { Doctor, Appointment } from "./scheduleType";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  schedule: any;
  affectedAppointments: Appointment[];
  onSubmit: (scheduleData: {
    id: string;
    userId: string;
    workDate: string;
    startTime: string;
    endTime: string;
  }) => void;
}

export default function EditScheduleModal({
  isOpen,
  onClose,
  doctors,
  schedule,
  affectedAppointments,
  onSubmit,
}: EditScheduleModalProps) {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (schedule) {
      setSelectedDoctor(schedule.userId || schedule.doctorId || "");
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor || !startTime || !endTime) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (startTime >= endTime) {
      alert("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }

    onSubmit({
      id: schedule.id,
      userId: selectedDoctor,
      workDate: schedule.workDate,
      startTime,
      endTime,
    });
  };

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Chỉnh sửa lịch làm việc</h3>

        {affectedAppointments.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Có {affectedAppointments.length} lịch hẹn sẽ bị ảnh hưởng
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bác sĩ
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Chọn bác sĩ</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày làm việc
              </label>
              <input
                type="text"
                value={schedule.workDate}
                disabled
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
