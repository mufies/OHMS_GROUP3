import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../../utils/fetchFromAPI";

interface Shift {
  time: string;
  location: string;
}

interface DaySchedule {
  day: string;
  date: number;
  fullDate: string;
  shifts?: Shift[];
  off?: boolean;
}

interface ScheduleResponse {
  workDate: string;
  startTime: string;
  endTime: string;
}

const DutySchedule: React.FC = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Get doctor ID from token
        const token =localStorage.getItem('accessToken');
        if (!token) {
          console.error('No token found');
          setLoading(false);
          return;
        }

        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const doctorId = decodedPayload.userId;

        // Fetch schedule from API
        const response = await axiosInstance.get(
          `/schedule/doctor/${doctorId}/weekly`
        );

        console.log('Schedule API Response:', response.data);

        // Get current week days
        const weekSchedule = getCurrentWeekDays();

        // Map API data to schedule
        if (response.data?.results && Array.isArray(response.data.results)) {
          const apiSchedules: ScheduleResponse[] = response.data.results;

          // Update schedule with API data
          const updatedSchedule = weekSchedule.map(day => {
            const apiData = apiSchedules.find(s => s.workDate === day.fullDate);

            if (apiData) {
              return {
                ...day,
                shifts: [{
                  time: `${formatTime(apiData.startTime)}–${formatTime(apiData.endTime)}`,
                  location: "Main Clinic"
                }],
                off: false
              };
            }

            return {
              ...day,
              off: true
            };
          });

          setSchedule(updatedSchedule);
        } else {
          setSchedule(weekSchedule.map(day => ({ ...day, off: true })));
        }

        setLoading(false);

      } catch (error: any) {
        console.error('Error fetching schedule:', error);
        // Fallback to empty week schedule
        const weekSchedule = getCurrentWeekDays();
        setSchedule(weekSchedule.map(day => ({ ...day, off: true })));
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Get current week's days (Monday to Sunday)
  const getCurrentWeekDays = (): DaySchedule[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    
    // Adjust to Monday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);

    const weekDays: DaySchedule[] = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);

      weekDays.push({
        day: dayNames[i],
        date: currentDay.getDate(),
        fullDate: currentDay.toISOString().split('T')[0], // YYYY-MM-DD format
        off: true // Default to off, will be updated by API
      });
    }

    // Set current week text
    const startMonth = monthNames[monday.getMonth()];
    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 6);
    const endMonth = monthNames[endDate.getMonth()];
    const year = monday.getFullYear();

    if (startMonth === endMonth) {
      setCurrentWeek(`${monday.getDate()}-${endDate.getDate()} ${startMonth} ${year}`);
    } else {
      setCurrentWeek(`${monday.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth} ${year}`);
    }

    return weekDays;
  };

  // Format time from "09:00:00" to "09:00"
  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Get today's date for highlighting
  const getTodayDate = (): number => {
    return new Date().getDate();
  };

  const todayDate = getTodayDate();

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Lịch làm việc tuần này
        </h3>
        <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-3 py-1">
          {currentWeek}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Lịch làm việc được giao bởi nhân viên
      </p>

      <div className="grid grid-cols-7 gap-3">
        {schedule.map((day, idx) => {
          const isToday = day.date === todayDate;
          
          return (
            <div
              key={idx}
              className={`rounded-xl p-3 text-center border border-gray-200 ${
                isToday ? "bg-[#e9f7fd] ring-2 ring-[#0085b9]" : "bg-[#f9fcfd]"
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? "text-[#0085b9]" : "text-gray-700"
                }`}
              >
                {day.day}
              </div>
              <div
                className={`text-lg font-semibold mb-2 ${
                  isToday ? "text-[#0085b9]" : "text-gray-800"
                }`}
              >
                {day.date}
              </div>

              {day.off ? (
                <div className="text-xs text-gray-600 bg-gray-100 rounded-full py-1">
                  Nghỉ
                </div>
              ) : (
                <div className="space-y-2">
                  {day.shifts?.map((s, i) => (
                    <div
                      key={i}
                      className={`rounded-md py-2 text-xs font-medium shadow-sm ${
                        isToday 
                          ? "bg-[#0085b9] text-white" 
                          : "bg-[#dff4fb] text-gray-800"
                      }`}
                    >
                      <div>{s.time}</div>
                      <div className="text-[11px]">Phòng khám chính</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DutySchedule;
