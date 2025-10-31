import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navigator from "../../components/Navigator";

interface MedicalExamination {
  id: string;
  name: string;
  price: number;
}

interface Doctor {
  id: string;
  username: string;
  email: string;
  phone: string;
  medicleSpecially: string;
  experience: string;
  rating: number;
  patients: number;
  description: string;
  education: string;
  certifications: string[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  isPast?: boolean;
}

interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string;
  slots: TimeSlot[];
  isPastDate?: boolean;
}

interface WeeklySchedule {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
}

interface Appointment {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function OnlineConsultTime() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const specialty = params.get("specialty") || "";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [service, setService] = useState<MedicalExamination | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await apiClient.post('/medical-examination/by-name', {
          name: "Tư vấn online"
        });
        
        if (response.data?.code === 200 && response.data?.results) {
          setService(response.data.results);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      }
    };

    fetchService();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!specialty) return;
      
      try {
        const response = await apiClient.get('/users/getListDoctor');
        
        if (response.data?.results) {
          const filteredDoctors = response.data.results.filter(
            (doc: Doctor) => doc.medicleSpecially?.includes(specialty)
          );
          setDoctors(filteredDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialty]);

  useEffect(() => {
    const fetchDoctorSchedule = async () => {
      if (!selectedDoctor) return;
      
      setWeekSchedule([]);
      setSelectedSlot(null);
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          return;
        }
        
        console.log('Fetching schedules for doctor:', selectedDoctor.id);
        
        const [weeklyResponse, nextWeekResponse] = await Promise.all([
          apiClient.get(`/schedule/doctor/${selectedDoctor.id}/weekly`),
          apiClient.get(`/schedule/doctor/${selectedDoctor.id}/next-week`)
        ]);
        
        console.log('Weekly response:', weeklyResponse.data);
        console.log('Next week response:', nextWeekResponse.data);
        
        const thisWeekSchedules: WeeklySchedule[] = weeklyResponse.data?.code === 200 
          ? (weeklyResponse.data?.results || []) 
          : [];
          
        const nextWeekSchedules: WeeklySchedule[] = nextWeekResponse.data?.code === 200 
          ? (nextWeekResponse.data?.results || []) 
          : [];
        
        console.log('This week schedules:', thisWeekSchedules);
        console.log('Next week schedules:', nextWeekSchedules);
        
        const schedule = await generateCombinedSchedule(
          thisWeekSchedules,
          nextWeekSchedules,
          selectedDoctor.id
        );
        
        console.log('Final generated schedule:', schedule);
        setWeekSchedule(schedule);
        
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setWeekSchedule([]);
      }
    };

    fetchDoctorSchedule();
  }, [selectedDoctor]);

  // Get current date/time in local timezone
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return {
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hours}:${minutes}:${seconds}`
    };
  };

  // Check if a time slot is in the past (with 10 minute buffer)
  const isTimeSlotPast = (date: string, startTime: string): boolean => {
    const { dateStr: todayStr, timeStr: nowTimeStr } = getCurrentDateTime();
    
    // Past date
    if (date < todayStr) return true;
    
    // Future date
    if (date > todayStr) return false;
    
    // Today - compare times with 10 minute buffer
    const [nowH, nowM] = nowTimeStr.split(':').map(Number);
    const [slotH, slotM] = startTime.split(':').map(Number);
    
    const nowTotalMinutes = nowH * 60 + nowM;
    const slotTotalMinutes = slotH * 60 + slotM;
    
    // Slot is past if it starts more than 10 minutes ago
    return slotTotalMinutes < (nowTotalMinutes - 10);
  };

  const generateCombinedSchedule = async (
    thisWeekSchedules: WeeklySchedule[],
    nextWeekSchedules: WeeklySchedule[],
    doctorId: string
  ): Promise<DaySchedule[]> => {
    
    // Build week dates (Mon-Fri)
    const buildWeekDates = (refDate: Date) => {
      const d = new Date(refDate);
      const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekDates: Date[] = [];
      for (let i = 0; i < 5; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        weekDates.push(dt);
      }
      return weekDates;
    };

    // Build 30-minute slots from schedule intervals
    const buildSlotsForIntervals = (
      intervals: {startTime: string; endTime: string}[], 
      appointments: Appointment[],
      dateStr: string
    ): TimeSlot[] => {
      const slots: TimeSlot[] = [];
      
      for (const interval of intervals) {
        const [startH, startM] = interval.startTime.split(':').map(x => parseInt(x));
        const [endH, endM] = interval.endTime.split(':').map(x => parseInt(x));
        
        const startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = endH * 60 + endM;
        
        console.log(`Processing interval: ${interval.startTime} - ${interval.endTime}`);
        console.log(`Start minutes: ${startTotalMinutes}, End minutes: ${endTotalMinutes}`);
        
        // Generate slots directly from start time
        for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
          const nextMinutes = minutes + 30;
          
          // Stop if next slot would exceed schedule end
          if (nextMinutes > endTotalMinutes) {
            break;
          }
          
          const sh = Math.floor(minutes / 60);
          const sm = minutes % 60;
          const eh = Math.floor(nextMinutes / 60);
          const em = nextMinutes % 60;
          
          const slotStart = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`;
          const slotEnd = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00`;
          
          console.log(`Generated slot: ${slotStart} - ${slotEnd}`);
          
          const isBooked = appointments.some(
            apt => apt.startTime === slotStart && apt.status !== 'CANCELLED'
          );
          
          const isPast = isTimeSlotPast(dateStr, slotStart);
          
          console.log(`Slot ${slotStart}: booked=${isBooked}, isPast=${isPast}`);
          
          slots.push({ 
            startTime: slotStart, 
            endTime: slotEnd, 
            available: !isBooked && !isPast,
            isPast 
          });
        }
      }
      
      console.log(`Total slots generated: ${slots.length}`);
      return slots;
    };

    // Group schedules by date
    const toScheduleMap = (schedules: WeeklySchedule[]) => {
      return schedules.reduce((acc, sch) => {
        if (!acc[sch.workDate]) acc[sch.workDate] = [];
        acc[sch.workDate].push({ startTime: sch.startTime, endTime: sch.endTime });
        return acc;
      }, {} as Record<string, {startTime:string; endTime:string}[]>);
    };

    const thisWeekMap = toScheduleMap(thisWeekSchedules);
    const nextWeekMap = toScheduleMap(nextWeekSchedules);

    // Fetch appointments for all dates
    const fetchAppointmentsForDates = async (dates: string[]) => {
      const map: Record<string, Appointment[]> = {};
      
      await Promise.all(dates.map(async (date) => {
        try {
          const response = await apiClient.get(
            `/appointments/doctor/${doctorId}/date/${date}`
          );
          const appts = Array.isArray(response.data) 
            ? response.data 
            : response.data?.results || [];
          map[date] = appts;
        } catch (err) {
          console.error(`Error fetching appointments for ${date}:`, err);
          map[date] = [];
        }
      }));
      
      return map;
    };

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeekDates = buildWeekDates(today);
    const nextWeekStart = new Date(thisWeekDates[0]);
    nextWeekStart.setDate(thisWeekDates[0].getDate() + 7);
    const nextWeekDates = buildWeekDates(nextWeekStart);

    const toYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const thisWeekStrs = thisWeekDates.map(toYMD);
    const nextWeekStrs = nextWeekDates.map(toYMD);
    const allWeeksStrs = [...thisWeekStrs, ...nextWeekStrs];

    console.log('This week dates:', thisWeekStrs);
    console.log('Next week dates:', nextWeekStrs);

    // Fetch appointments
    const appointmentsMap = await fetchAppointmentsForDates(allWeeksStrs);

    const schedule: DaySchedule[] = [];
    const { dateStr: todayStr } = getCurrentDateTime();

    // Process this week
    for (const dateStr of thisWeekStrs) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const isPastDate = dateStr < todayStr;
      
      // Skip Sundays
      if (dateObj.getDay() === 0) continue;

      const label = formatDayLabel(dateObj);
      const intervals = thisWeekMap[dateStr] || [];
      const appts = appointmentsMap[dateStr] || [];
      const slots = intervals.length > 0 ? buildSlotsForIntervals(intervals, appts, dateStr) : [];

      schedule.push({ 
        date: dateStr, 
        label, 
        weekLabel: 'Tuần này', 
        slots,
        isPastDate 
      });
    }

    // Process next week
    for (const dateStr of nextWeekStrs) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      
      // Skip Sundays
      if (dateObj.getDay() === 0) continue;

      const label = formatDayLabel(dateObj);
      const intervals = nextWeekMap[dateStr] || [];
      const appts = appointmentsMap[dateStr] || [];
      const slots = intervals.length > 0 ? buildSlotsForIntervals(intervals, appts, dateStr) : [];

      schedule.push({ 
        date: dateStr, 
        label, 
        weekLabel: 'Tuần sau', 
        slots,
        isPastDate: false 
      });
    }

    console.log('Generated schedule:', schedule);

    // Auto-select first available day
    const firstAvailableIndex = schedule.findIndex(
      d => d.slots && d.slots.some(s => s.available) && !d.isPastDate
    );
    
    if (firstAvailableIndex >= 0) {
      setSelectedDay(firstAvailableIndex);
    } else {
      setSelectedDay(0);
    }

    return schedule;
  };

  const formatDayLabel = (date: Date): string => {
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = days[date.getDay()];
    
    return `${dayOfWeek}, ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedSlot || !service) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    const amount = service.price || 0;
    const discount = 0;
    const deposit = Math.round(amount * 0.5);

    const bookingData = {
      bookingType: 'CONSULTATION_ONLY',
      doctorId: selectedDoctor.id,
      workDate: weekSchedule[selectedDay].date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      medicalExaminationIds: [service.id],
      totalAmount: amount,
      discount: discount,
      deposit: deposit,
      depositStatus: 'PENDING'
    };

    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    try {
      const response = await axios.get('http://localhost:8080/api/v1/payment/vn-pay', {
        params: {
          amount: amount,
          bankCode: 'NCB'
        }
      });

      if (response.data?.results?.paymentUrl) {
        window.location.href = response.data.results.paymentUrl;
      } else {
        console.error('Payment init response:', response.data);
        alert('Không thể tạo link thanh toán!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Lỗi khi khởi tạo thanh toán!');
    }
  };

  if (loading) {
    return (
      <>
        <Navigator />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigator />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Đặt lịch tư vấn online</h1>
                <p className="text-blue-600 font-semibold mt-1">Chuyên khoa: {specialty}</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Service & Doctor */}
            <div className="lg:col-span-1 space-y-6">
              {/* Service */}
              {service && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">1</span>
                    <h2 className="text-xl font-bold text-gray-900">Dịch vụ</h2>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">{formatPrice(service.price)}</p>
                      </div>
                      <svg className="w-12 h-12 text-green-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</span>
                  <h2 className="text-xl font-bold text-gray-900">Chọn bác sĩ</h2>
                </div>
                <button
                  onClick={() => setShowDoctorModal(true)}
                  className="w-full group hover:shadow-xl transition-all duration-300"
                >
                  {selectedDoctor ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-xl p-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {selectedDoctor.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">BS. {selectedDoctor.username}</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedDoctor.medicleSpecially}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                              ⭐ {selectedDoctor.rating}
                            </span>
                            <span className="text-xs text-gray-500">{selectedDoctor.patients}+ bệnh nhân</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-gray-600 font-medium">Nhấn để chọn bác sĩ</p>
                    </div>
                  )}
                </button>
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-purple-900 mb-2">Lưu ý:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Vui lòng có mặt đúng giờ đã đặt</li>
                      <li>• Chuẩn bị sẵn kết quả xét nghiệm (nếu có)</li>
                      <li>• Liên hệ hotline nếu cần hỗ trợ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Time Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">3</span>
                  <h2 className="text-xl font-bold text-gray-900">Chọn thời gian</h2>
                </div>

                {selectedDoctor && weekSchedule.length > 0 ? (
                  <div className="space-y-6">
                    {/* Week Tabs */}
                    {['Tuần này', 'Tuần sau'].map(week => {
                      const weekDays = weekSchedule.filter(d => d.weekLabel === week);
                      if (weekDays.length === 0) return null;

                      return (
                        <div key={week} className="space-y-3">
                          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">{week}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {weekDays.map((day) => {
                              const actualIdx = weekSchedule.indexOf(day);
                              const availableCount = day.slots.filter(s => s.available).length;
                              const isSelected = actualIdx === selectedDay;
                              const hasAvailable = availableCount > 0;

                              return (
                                <button
                                  key={day.date}
                                  onClick={() => {
                                    if (hasAvailable) {
                                      setSelectedDay(actualIdx);
                                      setSelectedSlot(null);
                                    }
                                  }}
                                  disabled={!hasAvailable}
                                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                    isSelected 
                                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 shadow-lg scale-105' 
                                      : hasAvailable 
                                        ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md' 
                                        : 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  <div className={`text-center ${isSelected ? 'text-white' : hasAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                    <p className={`text-xs font-semibold mb-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                      {day.label.split(',')[0]}
                                    </p>
                                    <p className="text-2xl font-bold mb-2">
                                      {day.label.split(',')[1].trim().split('/')[0]}
                                    </p>
                                    {hasAvailable ? (
                                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                        isSelected ? 'bg-white/20' : 'bg-green-100 text-green-700'
                                      }`}>
                                        {availableCount} khung
                                      </div>
                                    ) : (
                                      <div className="text-xs font-semibold text-red-500">Hết chỗ</div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Time Slots */}
                    {weekSchedule[selectedDay] && (
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Khung giờ khả dụng - {weekSchedule[selectedDay].label}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {weekSchedule[selectedDay].slots.filter(slot => slot.available).length > 0 ? (
                            weekSchedule[selectedDay].slots
                              .filter(slot => slot.available)
                              .map(slot => (
                                <button
                                  key={slot.startTime}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`p-3 rounded-lg border-2 font-semibold transition-all duration-200 ${
                                    selectedSlot?.startTime === slot.startTime
                                      ? 'bg-gradient-to-br from-orange-500 to-red-500 border-orange-600 text-white shadow-lg scale-105'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50'
                                  }`}
                                >
                                  <div className="text-sm">{formatTime(slot.startTime)}</div>
                                  <div className="text-xs opacity-75 mt-0.5">{formatTime(slot.endTime)}</div>
                                </button>
                              ))
                          ) : (
                            <div className="col-span-full text-center py-12">
                              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-500 font-medium">Không có khung giờ khả dụng</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium text-lg">Vui lòng chọn bác sĩ để xem lịch khả dụng</p>
                  </div>
                )}
              </div>

              {/* Booking Button */}
              <div className="mt-6">
                <button 
                  onClick={handleBooking}
                  disabled={!selectedDoctor || !selectedSlot || !service}
                  className={`w-full py-5 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 ${
                    selectedDoctor && selectedSlot && service
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-2xl hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {selectedDoctor && selectedSlot && service ? (
                    <>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        THANH TOÁN {service && formatPrice(service.price)}
                      </span>
                    </>
                  ) : (
                    'Vui lòng chọn đầy đủ thông tin'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Chọn bác sĩ tư vấn</h3>
                  <p className="text-blue-100 mt-1">{doctors.length} bác sĩ khả dụng</p>
                </div>
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[500px] overflow-y-auto">
              <div className="space-y-4">
                {doctors.map(doctor => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                      selectedDoctor?.id === doctor.id
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-lg scale-102'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
                        selectedDoctor?.id === doctor.id ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                        {doctor.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-gray-900">BS. {doctor.username}</h4>
                          {selectedDoctor?.id === doctor.id && (
                            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{doctor.medicleSpecially}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {doctor.rating}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">{doctor.patients}+</span> bệnh nhân
                          </div>
                          {doctor.experience && (
                            <div className="text-sm text-gray-600">
                              <span className="font-semibold">{doctor.experience}</span> kinh nghiệm
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowDoctorModal(false)}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (selectedDoctor) setShowDoctorModal(false);
                }}
                disabled={!selectedDoctor}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedDoctor
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OnlineConsultTime;
