import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navigator from "../../components/Navigator";



interface MedicalExamination {
  id: string;
  name: string;
  price: number;
}

interface MedicalServicesRequest {
  id: string;
  patient: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
  };
  medicalExaminations: MedicalExamination[];
  medicalSpecialty: string;
  status: boolean;
  createdAt: string | null;
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
  imageUrl?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string; // "Tuần này" or "Tuần sau"
  slots: TimeSlot[];
  hasApiSchedule?: boolean; // true if this day has schedule from API
}

interface WeeklySchedule {
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

function BookingSchedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const specialty = searchParams.get('specialty');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<MedicalExamination[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [viewDoctorProfile, setViewDoctorProfile] = useState<string | null>(null);
  const [medicalRequests, setMedicalRequests] = useState<MedicalServicesRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MedicalServicesRequest | null>(null);

  // Check for existing medical service requests
  useEffect(() => {
    const checkMedicalRequests = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        
        if (!userId || !token) return;

        const response = await axios.get(
          `http://localhost:8080/medical-requests/patient/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Filter only active requests (status = true) and matching specialty
          const activeRequests = response.data.filter((req: MedicalServicesRequest) => 
            req.status === true && req.medicalSpecialty === specialty
          );
          
          if (activeRequests.length > 0) {
            setMedicalRequests(activeRequests);
            setShowRequestModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching medical requests:', error);
      }
    };

    checkMedicalRequests();
  }, []);

  // Handle using existing medical request
  const handleUseExistingRequest = async (request: MedicalServicesRequest) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Update status to false
      await axios.put(
        `http://localhost:8080/medical-requests/${request.id}/status`,
        { status: false },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Set selected services from the request
      const serviceIds = request.medicalExaminations.map(exam => exam.id);
      setSelectedServices(serviceIds);

      setShowRequestModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error using existing request:', error);
      alert('Có lỗi xảy ra khi sử dụng yêu cầu này. Vui lòng thử lại.');
    }
  };

  // Handle declining existing medical request
  const handleDeclineRequest = () => {
    setShowRequestModal(false);
    setSelectedRequest(null);
  };

  // Fetch services by specialty
  useEffect(() => {
    const fetchServices = async () => {
      if (!specialty) return;
      
      try {
        const response = await axios.post(
          'http://localhost:8080/medical-examination/by-specialty',
          {
            specility: specialty 
          }
        );
        
        if (response.data?.results) {
          setServices(response.data.results);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, [specialty]);

  // Fetch doctors by specialty
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!specialty) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `http://localhost:8080/users/getListDoctor`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
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

  // Fetch doctor's schedule when doctor is selected
  useEffect(() => {
    const fetchDoctorSchedule = async () => {
      if (!selectedDoctor) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        // Call API lấy weekly schedule
        const scheduleResponse = await axios.get(
          `http://localhost:8080/schedule/${selectedDoctor.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (scheduleResponse.data?.code === 200 && scheduleResponse.data?.results) {
          console.log('Weekly schedule fetched successfully:', scheduleResponse.data.results);
          
          const weeklySchedules: WeeklySchedule[] = scheduleResponse.data.results;
          
          // Generate week schedule từ weekly schedules
          const schedule = await generateWeekScheduleFromAPI(weeklySchedules, selectedDoctor.id, token);
          setWeekSchedule(schedule);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setWeekSchedule([]);
      }
    };

    fetchDoctorSchedule();
  }, [selectedDoctor]);

  // Generate week schedule từ API data
  const generateWeekScheduleFromAPI = async (
    weeklySchedules: WeeklySchedule[],
    doctorId: string,
    token: string
  ): Promise<DaySchedule[]> => {
    // Helper: build a week dates array (Mon-Fri only) starting from a reference date
    const buildWeekDates = (refDate: Date) => {
      const d = new Date(refDate);
      // move to Monday
      const day = d.getDay();
      // const d = new Date(2025, 9, 16); // Tháng 10 (index 9), ngày 16, năm 2025
      // const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day; // if Sunday(0) -> previous Monday = -6
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekDates: Date[] = [];
      for (let i = 0; i < 5; i++) {  // Changed from 7 to 5 (Mon-Fri only)
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        weekDates.push(dt);
      }
      return weekDates;
    };

    // Build slots for a day given working intervals (could be one or multiple intervals)
    const buildSlotsForIntervals = (intervals: {startTime: string; endTime:string}[], appointments: Appointment[]) => {
      const slots: TimeSlot[] = [];
      for (const interval of intervals) {
        const startParts = interval.startTime.split(':').map(x => parseInt(x));
        const endParts = interval.endTime.split(':').map(x => parseInt(x));
        const startTotal = startParts[0] * 60 + (startParts[1] || 0);
        const endTotal = endParts[0] * 60 + (endParts[1] || 0);

        for (let minutes = startTotal; minutes < endTotal; minutes += 30) {
          const sh = Math.floor(minutes / 60);
          const sm = minutes % 60;
          const em = minutes + 30;
          const eh = Math.floor(em / 60);
          const emm = em % 60;
          const startTime = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`;
          const endTime = `${String(eh).padStart(2,'0')}:${String(emm).padStart(2,'0')}:00`;

          const isBooked = appointments.some(apt => apt.startTime === startTime && apt.endTime === endTime && apt.status !== 'CANCELLED');
          slots.push({ startTime, endTime, available: !isBooked });
        }
      }
      return slots;
    };

    // Normalize weeklySchedules by date -> array of intervals
    const schedulesMap = weeklySchedules.reduce((acc, sch) => {
      if (!acc[sch.workDate]) acc[sch.workDate] = [];
      acc[sch.workDate].push({ startTime: sch.startTime, endTime: sch.endTime });
      return acc;
    }, {} as Record<string, {startTime:string; endTime:string}[]>);

    // Fetch appointments helper for a list of date strings
    const fetchAppointmentsForDates = async (dates: string[]) => {
      const map: Record<string, Appointment[]> = {};
      for (const date of dates) {
        try {
          const response = await axios.get(`http://localhost:8080/appointments/doctor/${doctorId}/date/${date}`, { headers: { 'Authorization': `Bearer ${token}` } });
          const appts = Array.isArray(response.data) ? response.data : response.data?.results || [];
          map[date] = appts;
        } catch (err) {
          console.error(`Error fetching appointments for ${date}:`, err);
          map[date] = [];
        }
      }
      return map;
    };

    // Get both current week and next week
    const today = new Date();
    const thisWeekDates = buildWeekDates(today);
    const nextWeekStart = new Date(thisWeekDates[0]);
    nextWeekStart.setDate(thisWeekDates[0].getDate() + 7);
    const nextWeekDates = buildWeekDates(nextWeekStart);

    // Convert to yyyy-mm-dd strings
    const toYMD = (d: Date) => d.toISOString().slice(0,10);
    const thisWeekStrs = thisWeekDates.map(toYMD);
    const nextWeekStrs = nextWeekDates.map(toYMD);
    const allWeeksStrs = [...thisWeekStrs, ...nextWeekStrs];

    // Determine if there are schedules in provided weeklySchedules for each week
    const hasSchedulesInWeek = (weekStrs: string[]) => weekStrs.some(s => !!schedulesMap[s]);
    const hasSchedulesThisWeek = hasSchedulesInWeek(thisWeekStrs);
    const hasSchedulesNextWeek = hasSchedulesInWeek(nextWeekStrs);
    const useDefault = !hasSchedulesThisWeek && !hasSchedulesNextWeek;

    // Fetch appointments for all dates
    const appointmentsMap = await fetchAppointmentsForDates(allWeeksStrs);

    const schedule: DaySchedule[] = [];
    const todayStr = toYMD(today);

    // Process this week
    for (const dateStr of thisWeekStrs) {
      const dateObj = new Date(dateStr);
      const label = formatDayLabel(dateObj);
      let slots: TimeSlot[] = [];
      const hasApiScheduleForDay = !!schedulesMap[dateStr];

      if (useDefault) {
        // Create default Mon-Fri 07:00-17:00 (only weekdays)
        const dayOfWeek = dateObj.getDay(); // 0 Sun .. 6 Sat
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
          const appts = appointmentsMap[dateStr] || [];
          slots = buildSlotsForIntervals(intervals, appts);
        } else {
          slots = [];
        }
      } else {
        const intervals = schedulesMap[dateStr] || [];
        const appts = appointmentsMap[dateStr] || [];
        if (intervals.length > 0) {
          slots = buildSlotsForIntervals(intervals, appts);
        } else {
          slots = [];
        }
      }

      // Only add if date is today or in the future, and not Sunday
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1-6 = Mon-Sat
      if (dateStr >= todayStr && dayOfWeek !== 0) {
        schedule.push({ date: dateStr, label, weekLabel: 'Tuần này', slots, hasApiSchedule: hasApiScheduleForDay });
      }
    }

    // Process next week - apply limiting logic
    for (const dateStr of nextWeekStrs) {
      const dateObj = new Date(dateStr);
      const label = formatDayLabel(dateObj);
      let slots: TimeSlot[] = [];
      const hasApiScheduleForDay = !!schedulesMap[dateStr];

      if (useDefault) {
        // Create default Mon-Fri 07:00-17:00 (only weekdays)
        const dayOfWeek = dateObj.getDay(); // 0 Sun .. 6 Sat
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
          const appts = appointmentsMap[dateStr] || [];
          slots = buildSlotsForIntervals(intervals, appts);
        } else {
          slots = [];
        }
      } else {
        // Nếu tuần sau có schedule từ API thì chỉ hiển thị ngày có schedule
        // Nếu tuần sau không có schedule từ API thì hiển thị bình thường (default)
        if (hasSchedulesNextWeek) {
          // Giới hạn: chỉ hiển thị ngày có schedule từ API
          if (hasApiScheduleForDay) {
            const intervals = schedulesMap[dateStr] || [];
            const appts = appointmentsMap[dateStr] || [];
            if (intervals.length > 0) {
              slots = buildSlotsForIntervals(intervals, appts);
            } else {
              slots = [];
            }
          } else {
            // Ngày này không có schedule từ API, không tạo slot
            slots = [];
          }
        } else {
          // Tuần sau không có schedule, dùng default
          const dayOfWeek = dateObj.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
            const appts = appointmentsMap[dateStr] || [];
            slots = buildSlotsForIntervals(intervals, appts);
          } else {
            slots = [];
          }
        }
      }

      schedule.push({ date: dateStr, label, weekLabel: 'Tuần sau', slots, hasApiSchedule: hasApiScheduleForDay });
    }

    // Filter out Sundays from schedule
    const filteredSchedule = schedule.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate.getDay() !== 0; // 0 = Sunday
    });

    const todayIndex = filteredSchedule.findIndex(d => d.date === todayStr);

    if (todayIndex >= 0 && filteredSchedule[todayIndex].slots && filteredSchedule[todayIndex].slots.length > 0) {
      // Nếu ngày hiện tại có trong lịch và có slot → chọn ngày đó
      setSelectedDay(todayIndex);
    } else {
      // Nếu không, chọn ngày đầu tiên có slot available
      const firstAvailableIndex = filteredSchedule.findIndex(d => d.slots && d.slots.some(s => s.available));
      if (firstAvailableIndex >= 0) {
        setSelectedDay(firstAvailableIndex);
      } else {
        setSelectedDay(0);
      }
    }

    return filteredSchedule;
  };

  const formatDayLabel = (date: Date): string => {
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = days[date.getDay()];
    
    return `${dayOfWeek}, ${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`;
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const handlePayment = async () => {
    if (!selectedDoctor || !selectedSlot || selectedServices.length === 0) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    const totalAmount = getTotalPrice();
    const bookingData = {
      doctorId: selectedDoctor.id,
      workDate: weekSchedule[selectedDay].date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      medicalExaminationIds: selectedServices
    };

    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    try {
      const response = await axios.get('http://localhost:8080/api/v1/payment/vn-pay', {
        params: {
          amount: totalAmount,
          bankCode: 'NCB'
        }
      });

      if (response.data?.results?.paymentUrl) {
        window.location.href = response.data.results.paymentUrl;
      } else {
        alert('Không thể tạo link thanh toán. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Lỗi khi khởi tạo thanh toán. Vui lòng thử lại!');
    }
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
  };

  const handleDoctorModalClose = () => {
    setShowDoctorModal(false);
    setViewDoctorProfile(null);
  };

  const handleViewDoctorProfile = (doctorId: string) => {
    setViewDoctorProfile(doctorId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!specialty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Vui lòng chọn chuyên khoa</p>
      </div>
    );
  }

  return (
    <>
      <Navigator />
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto flex gap-8 mt-8">
          {/* Main content */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            {/* Service and Doctor Selection */}
            <div className="mb-8">
              <div className="text-2xl font-bold mb-4">
                1&nbsp; Chọn dịch vụ và bác sĩ - {specialty}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {/* Service Selection Card */}
                <div 
                  onClick={() => setShowServiceModal(true)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900">Dịch vụ khám</div>
                        <div className="text-sm text-gray-500">Chọn dịch vụ phù hợp</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {selectedServices.length > 0 ? (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900">
                        Đã chọn {selectedServices.length} dịch vụ
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        Tổng: {formatPrice(getTotalPrice())}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Chưa chọn dịch vụ nào</div>
                  )}
                </div>

                {/* Doctor Selection Card */}
                <div 
                  onClick={() => setShowDoctorModal(true)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900">Bác sĩ</div>
                        <div className="text-sm text-gray-500">Chọn bác sĩ khám bệnh</div>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {selectedDoctor ? (
                    <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold">
                          {selectedDoctor.username.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-green-900 truncate">
                          BS. {selectedDoctor.username}
                        </div>
                        <div className="text-xs text-green-700">
                          {selectedDoctor.medicleSpecially}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Chưa chọn bác sĩ</div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Selection */}
            {selectedDoctor && weekSchedule.length > 0 && (
              <div>
                <div className="text-2xl font-bold mb-4">
                  2&nbsp; Thời gian khám
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="font-semibold text-lg mb-4">
                    Ngày và giờ khám
                  </div>
                  
                  {/* Days selector - both weeks */}
                  <div className="space-y-4">
                    {['Tuần này', 'Tuần sau'].map(week => {
                      const weekDays = weekSchedule.filter(d => d.weekLabel === week);
                      if (weekDays.length === 0) return null;

                      const today = new Date();

                      return (
                        <div key={week}>
                          <div className="text-sm font-semibold text-gray-700 mb-3">
                            {week}
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {weekDays.map((day) => {
                              const hasSlots = day.slots && day.slots.length > 0;
                              const dayDate = new Date(day.date);
                              const isPast = dayDate < today;
                              const isDisabled = isPast || !hasSlots;
                              const actualIdx = weekSchedule.indexOf(day);
                              
                              return (
                                <div
                                  key={day.date}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setSelectedDay(actualIdx);
                                      setSelectedSlot(null);
                                    }
                                  }}
                                  className={`p-4 rounded-xl text-center min-w-[110px] flex-shrink-0 ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                  } ${
                                    actualIdx === selectedDay
                                      ? "border-2 border-gray-900 font-bold shadow-md"
                                      : "border border-gray-200 font-medium"
                                  } bg-white text-gray-900`}
                                  title={isPast ? 'Ngày đã trôi qua' : !hasSlots ? 'Không có khung giờ' : ''}
                                >
                                  {day.label}
                                  <div className={`text-sm mt-1 ${isPast ? 'text-gray-400' : 'text-green-500'}`}>
                                    {hasSlots ? `${day.slots.filter(s => s.available).length} khung giờ` : 'Không có'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots */}
                  <div className="font-semibold text-lg mb-3 mt-6">
                    <span className="inline-block w-6 h-6 rounded-full bg-gray-900 text-white text-center leading-6 font-bold mr-2">O</span>
                    Khung giờ khám
                  </div>
                  {(() => {
                    const selectedDayData = weekSchedule[selectedDay];
                    const today = new Date();
                    const dayDate = new Date(selectedDayData?.date || '');
                    const isDayPast = dayDate < today;
                    const hasSlots = selectedDayData?.slots && selectedDayData.slots.length > 0;
                    
                    if (isDayPast || !hasSlots) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            {isDayPast ? 'Ngày này đã trôi qua' : 'Không có khung giờ trống trong ngày này'}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="flex flex-wrap gap-4">
                        {selectedDayData?.slots.map(slot => (
                          <button
                            key={slot.startTime}
                            onClick={() => setSelectedSlot(slot)}
                            disabled={!slot.available}
                            className={`py-4 px-6 rounded-lg font-semibold text-base cursor-pointer transition-all ${
                              selectedSlot?.startTime === slot.startTime
                                ? "border-2 border-blue-600 bg-blue-600 text-white"
                                : slot.available
                                ? "border border-gray-200 bg-gray-100 text-gray-900 hover:border-gray-300"
                                : "border border-gray-200 bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-[380px] bg-white rounded-2xl shadow-lg p-8 h-fit sticky top-8">
            <div className="font-bold text-xl mb-4">
              Thông tin đặt khám
            </div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ đã chọn:</div>
                <div className="space-y-2">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId);
                    return (
                      <div key={serviceId} className="flex justify-between items-start text-sm">
                        <span className="text-gray-600 flex-1 pr-2">{service?.name}</span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(service?.price || 0)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Tổng cộng:</span>
                  <span className="text-base font-bold text-blue-600">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            )}

            {/* Selected Doctor */}
            {selectedDoctor && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Bác sĩ:</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-lg font-semibold">
                      {selectedDoctor.username.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      BS. {selectedDoctor.username}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {selectedDoctor.medicleSpecially}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {selectedDoctor.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Time */}
            {selectedSlot && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">Thời gian khám:</div>
                <div className="text-sm text-gray-900">
                  <div className="font-medium">{weekSchedule[selectedDay].label}</div>
                  <div className="text-blue-600 font-semibold mt-1">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </div>
                </div>
              </div>
            )}

            {/* Clinic Info */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-3">Địa điểm khám:</div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">Phòng khám Đa khoa</div>
                  <div className="text-xs text-gray-600 mt-1">
                    53 Phạm Hữu Chí, Phường 12, Quận 5, Hồ Chí Minh
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className={`w-full font-bold text-base border-none rounded-lg py-4 mb-3 transition-all ${
                selectedSlot && selectedServices.length > 0 && selectedDoctor
                  ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!selectedSlot || selectedServices.length === 0 || !selectedDoctor}
            >
              Thanh toán và đặt khám
            </button>
            <div className="text-xs text-gray-500 text-center leading-relaxed">
              Bằng cách nhấn nút thanh toán, bạn đã đồng ý với các điều khoản và điều kiện đặt khám
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chọn dịch vụ khám</h2>
                <p className="text-sm text-gray-500 mt-1">Chọn một hoặc nhiều dịch vụ phù hợp</p>
              </div>
              <button
                onClick={handleServiceModalClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">{service.name}</div>
                        <div className="text-sm text-blue-600 font-medium mt-1">{formatPrice(service.price)}</div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedServices.includes(service.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}>
                        {selectedServices.includes(service.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div>
                <div className="text-sm text-gray-600">Đã chọn {selectedServices.length} dịch vụ</div>
                <div className="text-lg font-bold text-blue-600">Tổng: {formatPrice(getTotalPrice())}</div>
              </div>
              <button
                onClick={handleServiceModalClose}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Selection Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chọn bác sĩ</h2>
                <p className="text-sm text-gray-500 mt-1">Chọn bác sĩ phù hợp với nhu cầu của bạn</p>
              </div>
              <button
                onClick={handleDoctorModalClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-3">
                {doctors.map(doctor => (
                  <div
                    key={doctor.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                          <span className="text-gray-400 text-2xl font-semibold">
                            {doctor.username.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-gray-900">BS. {doctor.username}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {doctor.medicleSpecially} • {doctor.experience}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium text-gray-900">{doctor.rating}</span>
                            </div>
                            <div className="text-sm text-gray-600">{doctor.patients}+ bệnh nhân</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDoctorProfile(doctor.id)}
                        className="ml-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!viewDoctorProfile && (
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {selectedDoctor ? `Đã chọn: BS. ${selectedDoctor.username}` : 'Chưa chọn bác sĩ'}
                </div>
                <button
                  onClick={handleDoctorModalClose}
                  disabled={!selectedDoctor}
                  className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                    selectedDoctor
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical Service Request Modal */}
      {showRequestModal && medicalRequests.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Yêu cầu khám bệnh từ bác sĩ</h2>
                <p className="text-sm text-gray-500 mt-1">Bạn có yêu cầu khám bệnh từ bác sĩ. Bạn có muốn sử dụng yêu cầu này?</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              <div className="space-y-4">
                {medicalRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedRequest?.id === request.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="space-y-3">
                      {/* Doctor Info */}
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Bác sĩ chỉ định</div>
                          <div className="font-semibold text-gray-900">BS. {request.doctor.name}</div>
                        </div>
                      </div>

                      {/* Services List */}
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Dịch vụ khám ({request.medicalExaminations.length}):</div>
                        <div className="space-y-2">
                          {request.medicalExaminations.map((exam) => (
                            <div key={exam.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">{exam.name}</span>
                              <span className="text-sm font-medium text-blue-600">{formatPrice(exam.price)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Tổng chi phí dự kiến:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(request.medicalExaminations.reduce((sum, exam) => sum + exam.price, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleDeclineRequest}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tự chọn dịch vụ
              </button>
              <button
                onClick={() => selectedRequest && handleUseExistingRequest(selectedRequest)}
                disabled={!selectedRequest}
                className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-colors ${
                  selectedRequest
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Sử dụng yêu cầu này
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookingSchedule;
