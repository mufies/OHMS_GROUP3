import React from "react";
import { DaySchedule, Schedule } from "./scheduleType";
import ScheduleCard from "./ScheduleCard";

interface DayColumnProps {
  day: DaySchedule;
  unassignedCount: number;
  onAddSchedule: (date: string) => void;
  onEditSchedule: (schedule: Schedule & { doctorName: string; doctorId: string }) => void;
  onDeleteSchedule: (schedule: Schedule & { doctorName: string; doctorId: string }) => void;
  onScheduleClick: (schedule: Schedule & { doctorName: string; doctorId: string }) => void;
  checkTimeConflict: (schedules: any[], index: number) => boolean;
}

export default function DayColumn({
  day,
  unassignedCount,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onScheduleClick,
  checkTimeConflict,
}: DayColumnProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="font-semibold text-gray-900">{day.dayName}</h4>
          <p className="text-sm text-gray-600">{day.date}</p>
        </div>
        <button
          onClick={() => onAddSchedule(day.date)}
          className="text-indigo-600 hover:text-indigo-700 text-2xl"
        >
          +
        </button>
      </div>

      {unassignedCount > 0 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800">
            ⚠️ {unassignedCount} lịch hẹn chưa phân công
          </p>
        </div>
      )}

      <div className="space-y-2">
        {day.schedules.map((schedule, idx) => (
          <ScheduleCard
            key={schedule.id || idx}
            schedule={schedule}
            hasConflict={checkTimeConflict(day.schedules, idx)}
            onEdit={() => onEditSchedule(schedule)}
            onDelete={() => onDeleteSchedule(schedule)}
            onClick={() => onScheduleClick(schedule)}
          />
        ))}
      </div>
    </div>
  );
}
