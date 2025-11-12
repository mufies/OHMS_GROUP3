import React from "react";
import { Schedule } from "./scheduleType";

interface ScheduleCardProps {
  schedule: Schedule & { doctorName: string; doctorId: string };
  hasConflict: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function ScheduleCard({
  schedule,
  hasConflict,
  onEdit,
  onDelete,
  onClick,
}: ScheduleCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
        hasConflict
          ? "bg-red-50 border-red-500"
          : "bg-gray-50 border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {schedule.doctorName}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {schedule.startTime} - {schedule.endTime}
          </p>
          {hasConflict && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠️ Trùng giờ
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Sửa
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
