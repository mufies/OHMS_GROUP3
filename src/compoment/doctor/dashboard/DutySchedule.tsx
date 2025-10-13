import React from "react";

interface Shift {
  time: string;
  location: string;
}

interface DaySchedule {
  day: string;
  date: number;
  shifts?: Shift[];
  off?: boolean;
}

const DutySchedule: React.FC = () => {
  const schedule: DaySchedule[] = [
    {
      day: "Mon",
      date: 13,
      shifts: [
        { time: "08:00–12:00", location: "Main Clinic" },
        { time: "14:00–18:00", location: "Main Clinic" },
      ],
    },
    {
      day: "Tue",
      date: 14,
      shifts: [
        { time: "09:00–13:00", location: "Hospital Ward" },
        { time: "15:00–19:00", location: "Main Clinic" },
      ],
    },
    {
      day: "Wed",
      date: 15,
      shifts: [{ time: "08:00–12:00", location: "Main Clinic" }],
    },
    {
      day: "Thu",
      date: 16,
      shifts: [
        { time: "10:00–14:00", location: "Surgery Center" },
        { time: "15:00–18:00", location: "Main Clinic" },
      ],
    },
    {
      day: "Fri",
      date: 17,
      shifts: [
        { time: "08:00–12:00", location: "Main Clinic" },
        { time: "13:00–16:00", location: "Main Clinic" },
      ],
    },
    {
      day: "Sat",
      date: 18,
      shifts: [{ time: "09:00–13:00", location: "Emergency" }],
    },
    { day: "Sun", date: 19, off: true },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          This Week&apos;s Duty Schedule
        </h3>
        {/* <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-3 py-1">
          Week 2, Jan 2025
        </span> */}
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Your work schedule assigned by staff
      </p>

      <div className="grid grid-cols-7 gap-3">
        {schedule.map((day, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-3 text-center border border-gray-200 ${
              day.day === "Tue" ? "bg-[#e9f7fd]" : "bg-[#f9fcfd]"
            }`}
          >
            <div
              className={`text-sm font-medium mb-1 ${
                day.day === "Tue" ? "text-[#0085b9]" : "text-gray-700"
              }`}
            >
              {day.day}
            </div>
            <div
              className={`text-lg font-semibold mb-2 ${
                day.day === "Tue" ? "text-[#0085b9]" : "text-gray-800"
              }`}
            >
              {day.date}
            </div>

            {day.off ? (
              <div className="text-xs text-gray-600 bg-gray-100 rounded-full py-1">
                Off
              </div>
            ) : (
              <div className="space-y-2">
                {day.shifts?.map((s, i) => (
                  <div
                    key={i}
                    className="bg-[#dff4fb] text-gray-800 rounded-md py-2 text-xs font-medium shadow-sm"
                  >
                    <div>{s.time}</div>
                    <div className="text-[11px]">{s.location}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DutySchedule;
