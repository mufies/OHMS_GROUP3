import React, { useState, useEffect } from "react";
import { Doctor, Appointment } from "./scheduleType";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  selectedDate: string;
  unassignedAppointments: Appointment[];
  onSubmit: (scheduleData: {
    userId: string;
    workDate: string;
    startTime: string;
    endTime: string;
  }) => void;
}

export default function AddScheduleModal({
  isOpen,
  onClose,
  doctors,
  selectedDate,
  unassignedAppointments,
  onSubmit,
}: AddScheduleModalProps) {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (isOpen && selectedDate && unassignedAppointments.length > 0) {
      const dateAppointments = unassignedAppointments.filter((apt) => {
        const aptDate = new Date(apt.serviceAppointments[0].startTime)
          .toISOString()
          .split("T")[0];
        return aptDate === selectedDate;
      });

      if (dateAppointments.length > 0) {
        const times = dateAppointments.flatMap((apt) =>
          apt.serviceAppointments.map((sa) => ({
            start: sa.startTime,
            end: sa.endTime,
          }))
        );

        const earliestStart = times.reduce(
          (min, t) => (t.start < min ? t.start : min),
          times[0].start
        );
        const latestEnd = times.reduce(
          (max, t) => (t.end > max ? t.end : max),
          times[0].end
        );

        setStartTime(earliestStart);
        setEndTime(latestEnd);
      }
    }
  }, [isOpen, selectedDate, unassignedAppointments]);

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
      userId: selectedDoctor,
      workDate: selectedDate,
      startTime,
      endTime,
    });

    setSelectedDoctor("");
    setStartTime("");
    setEndTime("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Thêm lịch làm việc</h3>

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
                value={selectedDate}
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
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
