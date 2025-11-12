import React from "react";
import { DaySchedule, Schedule } from "./scheduleType";
import DayColumn from "./DayColumn";

interface WeekCalendarProps {
  weekSchedules: DaySchedule[];
  appointmentsByDate: { [date: string]: any[] }; // Đổi từ unassignedAppointments
  onAddSchedule: (date: string) => void;
  onEditSchedule: (schedule: Schedule & { doctorName: string; doctorId: string }) => void;
  onDeleteSchedule: (schedule: Schedule & { doctorName: string; doctorId: string }) => void;
  onScheduleClick: (schedule: Schedule & { doctorName: string; doctorId: string }) => void;
  checkTimeConflict: (schedules: any[], index: number) => boolean;
}

export default function WeekCalendar({
  weekSchedules,
  appointmentsByDate,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onScheduleClick,
  checkTimeConflict,
}: WeekCalendarProps) {
  const getUnassignedCountForDate = (date: string) => {
    return appointmentsByDate[date]?.length || 0;
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {weekSchedules.map((day) => (
        <DayColumn
          key={day.date}
          day={day}
          unassignedCount={getUnassignedCountForDate(day.date)}
          onAddSchedule={onAddSchedule}
          onEditSchedule={onEditSchedule}
          onDeleteSchedule={onDeleteSchedule}
          onScheduleClick={onScheduleClick}
          checkTimeConflict={checkTimeConflict}
        />
      ))}
    </div>
  );
}
