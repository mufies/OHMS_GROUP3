import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faClock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

// Interface matching your API response
interface MedicalExamination {
  id: string;
  name: string;
  price: number;
}

type PatientStatus = "Schedule" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "SCHEDULED";

interface AppointmentResponse {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  workDate: string;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  status: PatientStatus;
  medicalExaminations: MedicalExamination[];
}

// Transformed appointment for display
interface Appointment {
  id: string;
  time: string;           // HH:mm
  patientName: string;
  status: PatientStatus;  // enum từ API
  duration: number;       // minutes
}

// Map status → Vietnamese label
const viStatusLabel = (status: PatientStatus | string) => {
    // Normalize status to uppercase for comparison
    const normalizedStatus = status.toUpperCase();
    
    const statusMap: Record<string, string> = {
        'SCHEDULED': 'Lên lịch',
        'SCHEDULE': 'Lên lịch',
        'IN_PROGRESS': 'Đang tiến hành',
        'INPROGRESS': 'Đang tiến hành',
        'COMPLETED': 'Hoàn thành',
        'COMPLETE': 'Hoàn thành',
        'CANCELLED': 'Đã hủy',
        'CANCEL': 'Đã hủy'
    };
    
    return statusMap[normalizedStatus] || status;
};

// Dot color by status
const dotColorByStatus = (s: PatientStatus) =>
  s === 'SCHEDULED' ? 'bg-blue-500'
  : s === 'IN_PROGRESS' ? 'bg-yellow-500'
  : s === 'COMPLETED' ? 'bg-green-500'
    : s === 'CANCELLED' ? 'bg-red-500'
    : s === 'Schedule' ? 'bg-blue-500'
  : 'bg-gray-500';

// Decode JWT to get userId
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return null;
  }
};

export default function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get doctorId from JWT token
  const getDoctorId = (): string => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found');
      return '36e0290a-53de-4333-b7e0-26f9ae8b967f'; // fallback
    }
    
    const decodedToken = decodeJWT(token);
    return decodedToken?.userId || '36e0290a-53de-4333-b7e0-26f9ae8b967f';
  };
  
  const doctorId = getDoctorId();

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['S','M','T','W','T','F','S'];

  // Format date to YYYY-MM-DD for API call
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate duration in minutes between two time strings
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  // Transform API response to display format
  const transformAppointments = (apiData: AppointmentResponse[]): Appointment[] => {
    return apiData.map(apt => ({
      id: apt.id,
      time: apt.startTime.substring(0, 5), // "09:00:00" -> "09:00"
      patientName: apt.patientName,
      status: apt.status,
      duration: calculateDuration(apt.startTime, apt.endTime),
    }));
  };

  // Fetch appointments from API
  const fetchAppointments = async (date: Date) => {
    setLoading(true);
    try {
      const formattedDate = formatDateForAPI(date);
      const response = await fetch(
        `http://localhost:8080/appointments/doctor/${doctorId}/date/${formattedDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data: AppointmentResponse[] = await response.json();
      const transformedData = transformAppointments(data)
        // sort by time ascending (HH:mm works lexicographically)
        .sort((a, b) => a.time.localeCompare(b.time));
      setAppointments(transformedData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments when selected date changes
  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const MonthView = () => {
    const days = getDaysInMonth(currentDate);

    return (
      <div className="bg-white rounded-lg shadow max-w-[60w] mx-auto flex flex-col">
        <div className="px-6 py-4 bg-white rounded-t-2xl shadow-sm">
          {/* Navigator */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Calendar</h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-xs" />
              </button>

              <button
                onClick={() => navigateMonth('next')}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-xs" />
              </button>
            </div>
          </div>

          <div className="mt-2 text-center">
            <h2 className="text-sm font-medium text-gray-800">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
        </div>

        <div className="overflow-y-auto h-[48vh]">
          {/* Week days header */}
          <div className="grid grid-cols-7 bg-white">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 bg-white">
            {days.map((date, index) => (
              <div
                key={index}
                className="h-16 p-2 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <div className="h-full flex items-center justify-center">
                    <div
                      className={`flex items-center justify-center w-11 h-11 text-base rounded-2xl font-bold transition-all duration-300 ${
                        isToday(date)
                          ? 'bg-[#0085b9] text-white shadow-md scale-105'
                          : isSelected(date)
                            ? 'bg-blue-100 text-[#0085b9] shadow-sm scale-105'
                            : 'text-gray-700 hover:bg-blue-50 hover:scale-105'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DaySchedule = () => {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faClock} className="text-4xl mb-4 text-gray-300" />
              <p>No appointments scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appointment => (
                <div 
                  key={appointment.id} 
                  className="flex items-center p-4 text-gray-500 rounded-lg hover:bg-[#0085b9] hover:text-white transition cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-full mr-4 ${dotColorByStatus(appointment.status)}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">{appointment.time}</span>
                        <div className="flex items-center space-x-2">
                          <FontAwesomeIcon icon={faUser} />
                          <span>{appointment.patientName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                          {viStatusLabel(appointment.status)}
                        </span>
                        <span className="text-sm">{appointment.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 items-center justify-center">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Schedule</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full justify-center">
        <div className="lg:col-span-2">
          <DaySchedule />
        </div>
        <div className="lg:col-span-2">
          <MonthView />
        </div>
      </div>
    </div>
  );
}
