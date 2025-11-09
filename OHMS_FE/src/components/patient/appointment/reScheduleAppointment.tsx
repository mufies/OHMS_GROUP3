import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../utils/fetchFromAPI";
import { toast } from "sonner";

// Interfaces
interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
}

interface ServiceAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExaminationInfo[];
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  doctorId: string | null;
  doctorName: string | null;
  doctorSpecialty: string | null;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExaminationInfo[] | null;
  serviceAppointments?: ServiceAppointment[] | null;
}

interface Doctor {
  id: string;
  username: string;
  email: string;
  medicleSpecially: string[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string;
  slots: TimeSlot[];
}

interface WeeklySchedule {
  id: string;
  doctorId: string;
  workDate: string;
  startTime: string;
  endTime: string;
}

interface RescheduleModalProps {
  appointment: Appointment;
  patientAppointments: Appointment[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({ 
  appointment, 
  patientAppointments,
  onClose, 
  onSuccess 
}: RescheduleModalProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<{startTime: string; endTime: string} | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Helper functions (giữ nguyên)
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDayLabel = (date: Date): string => {
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = days[date.getDay()];
    
    return `${dayOfWeek}, ${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`;
  };

  const isSlotInPast = (date: string, startTime: string): boolean => {
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const slotDate = new Date(year, month - 1, day, hours, minutes);
    
    return slotDate < now;
  };

  const isSlotConflictingWithPatient = (
    date: string, 
    startTime: string, 
    endTime: string,
    excludeAppointmentId?: string
  ): boolean => {
    return patientAppointments.some(apt => {
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      if (apt.workDate !== date || apt.status === 'CANCELLED') return false;
      
      return startTime < apt.endTime && endTime > apt.startTime;
    });
  };

  const generateWeekScheduleFromAPI = async (
    weeklySchedules: WeeklySchedule[],
    doctorId: string,
    token: string
  ): Promise<DaySchedule[]> => {
    const buildWeekDates = (refDate: Date) => {
      const d = new Date(refDate);
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const day = localDate.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      
      const monday = new Date(localDate);
      monday.setDate(localDate.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekDates: Date[] = [];
      for (let i = 0; i < 6; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        weekDates.push(dt);
      }
      return weekDates;
    };

    const buildSlotsForIntervals = (intervals: {startTime: string; endTime:string}[], appointments: Appointment[]) => {
      const slots: TimeSlot[] = [];
      for (const interval of intervals) {
        const startParts = interval.startTime.split(':').map(x => parseInt(x));
        const endParts = interval.endTime.split(':').map(x => parseInt(x));
        const startTotal = startParts[0] * 60 + (startParts[1] || 0);
        const endTotal = endParts[0] * 60 + (endParts[1] || 0);

        for (let minutes = startTotal; minutes < endTotal; minutes += 10) {
          const sh = Math.floor(minutes / 60);
          const sm = minutes % 60;
          const em = minutes + 10;
          const eh = Math.floor(em / 60);
          const emm = em % 60;
          const startTime = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`;
          const endTime = `${String(eh).padStart(2,'0')}:${String(emm).padStart(2,'0')}:00`;

          const isBooked = appointments.some(apt => 
            apt.startTime === startTime && 
            apt.endTime === endTime && 
            apt.status !== 'CANCELLED'
          );
          slots.push({ startTime, endTime, available: !isBooked });
        }
      }
      return slots;
    };

    const schedulesMap = weeklySchedules.reduce((acc, sch) => {
      if (!acc[sch.workDate]) acc[sch.workDate] = [];
      acc[sch.workDate].push({ startTime: sch.startTime, endTime: sch.endTime });
      return acc;
    }, {} as Record<string, {startTime:string; endTime:string}[]>);

    const fetchAppointmentsForDates = async (dates: string[]) => {
      const map: Record<string, Appointment[]> = {};
      for (const date of dates) {
        try {
          const response = await axiosInstance.get(`/appointments/doctor/${doctorId}/date/${date}`);
          const appts = Array.isArray(response.data) ? response.data : response.data?.results || [];
          map[date] = appts;
        } catch (err) {
          map[date] = [];
        }
      }
      return map;
    };

    const today = new Date();
    const thisWeekDates = buildWeekDates(today);
    const nextWeekStart = new Date(thisWeekDates[0]);
    nextWeekStart.setDate(thisWeekDates[0].getDate() + 7);
    const nextWeekDates = buildWeekDates(nextWeekStart);

    const toYMD = (d: Date) => d.toISOString().slice(0,10);
    const thisWeekStrs = thisWeekDates.map(toYMD);
    const nextWeekStrs = nextWeekDates.map(toYMD);
    const allWeeksStrs = [...thisWeekStrs, ...nextWeekStrs];

    const hasSchedulesInWeek = (weekStrs: string[]) => weekStrs.some(s => !!schedulesMap[s]);
    const hasSchedulesThisWeek = hasSchedulesInWeek(thisWeekStrs);
    const hasSchedulesNextWeek = hasSchedulesInWeek(nextWeekStrs);
    const useDefault = !hasSchedulesThisWeek && !hasSchedulesNextWeek;

    const appointmentsMap = await fetchAppointmentsForDates(allWeeksStrs);

    const schedule: DaySchedule[] = [];
    const todayStr = toYMD(today);

    for (const dateStr of thisWeekStrs) {
      const dateObj = new Date(dateStr);
      const label = formatDayLabel(dateObj);
      let slots: TimeSlot[] = [];

      if (useDefault) {
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
          const appts = appointmentsMap[dateStr] || [];
          slots = buildSlotsForIntervals(intervals, appts);
        }
      } else {
        const intervals = schedulesMap[dateStr] || [];
        const appts = appointmentsMap[dateStr] || [];
        if (intervals.length > 0) {
          slots = buildSlotsForIntervals(intervals, appts);
        }
      }

      if (dateStr >= todayStr) {
        schedule.push({ date: dateStr, label, weekLabel: 'Tuần này', slots });
      }
    }

    for (const dateStr of nextWeekStrs) {
      const dateObj = new Date(dateStr);
      const label = formatDayLabel(dateObj);
      let slots: TimeSlot[] = [];

      if (useDefault) {
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
          const appts = appointmentsMap[dateStr] || [];
          slots = buildSlotsForIntervals(intervals, appts);
        }
      } else {
        if (hasSchedulesNextWeek) {
          const intervals = schedulesMap[dateStr] || [];
          const appts = appointmentsMap[dateStr] || [];
          if (intervals.length > 0) {
            slots = buildSlotsForIntervals(intervals, appts);
          }
        } else {
          const dayOfWeek = dateObj.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
            const appts = appointmentsMap[dateStr] || [];
            slots = buildSlotsForIntervals(intervals, appts);
          }
        }
      }

      schedule.push({ date: dateStr, label, weekLabel: 'Tuần sau', slots });
    }

    return schedule;
  };

  // Fetch doctors by specialty
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!appointment.doctorSpecialty) return;

      setLoadingDoctors(true);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.get('/users/getListDoctor', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.data?.results) {
          const specialty = appointment.doctorSpecialty.replace(/[\[\]]/g, '');
          const filteredDoctors = response.data.results.filter(
            (doc: Doctor) => doc.medicleSpecially?.includes(specialty)
          );
          setDoctors(filteredDoctors);
          
          // Set default selected doctor to current doctor
          const currentDoctor = filteredDoctors.find((d: Doctor) => d.id === appointment.doctorId);
          if (currentDoctor) {
            setSelectedDoctor(currentDoctor);
          }
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error("Không thể tải danh sách bác sĩ!");
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [appointment.doctorSpecialty, appointment.doctorId]);

  // Fetch schedule when doctor changes
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedDoctor) return;

      setLoadingSchedule(true);
      setRescheduleDate('');
      setRescheduleSlot(null);
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const scheduleResponse = await axiosInstance.get(`/schedule/${selectedDoctor.id}`);
        
        if (scheduleResponse.data?.code === 200 && scheduleResponse.data?.results) {
          const weeklySchedules: WeeklySchedule[] = scheduleResponse.data.results;
          const schedule = await generateWeekScheduleFromAPI(weeklySchedules, selectedDoctor.id, token);
          setWeekSchedule(schedule);
        } else {
          toast.error("Không thể tải lịch bác sĩ!");
          setWeekSchedule([]);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error("Lỗi khi tải lịch bác sĩ!");
        setWeekSchedule([]);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [selectedDoctor]);

  // Confirm reschedule
const confirmReschedule = async () => {
  if (!selectedDoctor || !rescheduleDate || !rescheduleSlot) {
    toast.error("Vui lòng chọn bác sĩ, ngày và giờ khám mới!");
    return;
  }

  if (selectedDoctor.id === appointment.doctorId && 
      rescheduleDate === appointment.workDate && 
      rescheduleSlot.startTime === appointment.startTime) {
    toast.error("Vui lòng chọn thời gian hoặc bác sĩ khác!");
    return;
  }

  setRescheduling(true);
  try {
    // Tính toán timeline cho tất cả appointments
    let currentStartTime = rescheduleSlot.startTime;
    const [startHour, startMin] = currentStartTime.split(':').map(Number);
    let totalMinutes = startHour * 60 + startMin;

    // 1. Update tất cả serviceAppointments (nếu có)
    if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
      for (const service of appointment.serviceAppointments) {
        // Tính duration cho service này
        const serviceDuration = service.medicalExaminations.reduce(
          (sum, exam) => sum + (exam.minDuration || 30), 
          0
        );

        const serviceStartMinutes = totalMinutes;
        const serviceEndMinutes = totalMinutes + serviceDuration;

        const serviceStartHour = Math.floor(serviceStartMinutes / 60);
        const serviceStartMin = serviceStartMinutes % 60;
        const serviceEndHour = Math.floor(serviceEndMinutes / 60);
        const serviceEndMin = serviceEndMinutes % 60;

        const serviceStartTime = `${String(serviceStartHour).padStart(2, '0')}:${String(serviceStartMin).padStart(2, '0')}:00`;
        const serviceEndTime = `${String(serviceEndHour).padStart(2, '0')}:${String(serviceEndMin).padStart(2, '0')}:00`;

        // Update service appointment
        const serviceRequest = {
          patientId: appointment.patientId,
          doctorId: null, // Service không có bác sĩ
          workDate: rescheduleDate,
          startTime: serviceStartTime,
          endTime: serviceEndTime,
          medicalExaminationIds: service.medicalExaminations.map(e => e.id)
        };

        await axiosInstance.put(`/appointments/${service.id}`, serviceRequest);

        // Cộng dồn thời gian
        totalMinutes = serviceEndMinutes;
      }

      // Thêm 5 phút buffer sau khi làm xong services
      totalMinutes += 5;
    }

    // 2. Update parent appointment (khám bác sĩ)
    const parentStartMinutes = totalMinutes;
    const parentEndMinutes = totalMinutes + 10; // Khám bác sĩ 10 phút

    const parentStartHour = Math.floor(parentStartMinutes / 60);
    const parentStartMin = parentStartMinutes % 60;
    const parentEndHour = Math.floor(parentEndMinutes / 60);
    const parentEndMin = parentEndMinutes % 60;

    const parentStartTime = `${String(parentStartHour).padStart(2, '0')}:${String(parentStartMin).padStart(2, '0')}:00`;
    const parentEndTime = `${String(parentEndHour).padStart(2, '0')}:${String(parentEndMin).padStart(2, '0')}:00`;

    const parentRequest = {
      patientId: appointment.patientId,
      doctorId: selectedDoctor.id,
      workDate: rescheduleDate,
      startTime: parentStartTime,
      endTime: parentEndTime,
      medicalExaminationIds: appointment.medicalExaminations?.map(e => e.id) || []
    };

    await axiosInstance.put(`/appointments/${appointment.id}`, parentRequest);

    toast.success("Dời lịch thành công!");
    onSuccess();
    onClose();
  } catch (error: any) {
    console.error('Error rescheduling:', error);
    const errorMsg = error.response?.data?.message || "Dời lịch thất bại!";
    toast.error(errorMsg);
  } finally {
    setRescheduling(false);
  }
};



  const calculateTotalDuration = (): number => {
    let totalMinutes = 0;

    // 1. Tính thời gian cho tất cả serviceAppointments (nếu có)
    if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
      for (const service of appointment.serviceAppointments) {
        // Tính duration cho service này
        const serviceDuration = service.medicalExaminations.reduce(
          (sum, exam) => sum + (exam.minDuration || 30), 
          0
        );
        totalMinutes += serviceDuration;
      }
      
      // Thêm 5 phút buffer sau khi làm xong services
      totalMinutes += 5;
    }

    // 2. Cộng thêm 10 phút khám bác sĩ
    totalMinutes += 10;

    return totalMinutes;
  };

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Dời lịch khám</h3>
              <p className="text-sm text-gray-500 mt-1">
                Lịch cũ: {appointment.workDate} | {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Services */}
          {appointment.medicalExaminations && appointment.medicalExaminations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Dịch vụ khám chính</h4>
              <div className="space-y-2">
                {appointment.medicalExaminations.map((exam) => (
                  <div key={exam.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-900">{exam.name}</span>
                    <span className="text-sm font-semibold text-gray-700">{exam.price.toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Appointments */}
          {appointment.serviceAppointments && appointment.serviceAppointments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Dịch vụ bổ sung</h4>
              <div className="space-y-3">
                {appointment.serviceAppointments.map((service) => (
                  <div key={service.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-900">
                        {service.startTime} - {service.endTime}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {service.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {service.medicalExaminations.map((exam) => (
                        <div key={exam.id} className="flex items-center justify-between">
                          <span className="text-xs text-blue-900">{exam.name}</span>
                          <span className="text-xs font-semibold text-blue-700">{exam.price.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Chọn bác sĩ</h4>
            {loadingDoctors ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : doctors.length === 0 ? (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                <p className="text-sm text-yellow-800">Không tìm thấy bác sĩ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doctor) => {
                  const isSelected = selectedDoctor?.id === doctor.id;
                  const isCurrent = doctor.id === appointment.doctorId;
                  
                  return (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {doctor.username}
                            </p>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                                Hiện tại
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{doctor.email}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Loading State cho Schedule */}
          {loadingSchedule ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-600">Đang tải lịch bác sĩ...</p>
            </div>
          ) : !selectedDoctor ? (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
              <p className="text-sm text-blue-800">Vui lòng chọn bác sĩ để xem lịch làm việc</p>
            </div>
          ) : weekSchedule.length === 0 ? (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
              <p className="text-sm text-yellow-800">Bác sĩ này chưa có lịch làm việc</p>
            </div>
          ) : (
            <>
              {/* Date Selection */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Chọn ngày khám mới</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {weekSchedule.map((day, index) => {
                    const hasSlots = day.slots && day.slots.some(s => s.available);
                    const isPast = isSlotInPast(day.date, '23:59');
                    const isSelected = rescheduleDate === day.date;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (hasSlots && !isPast) {
                            setRescheduleDate(day.date);
                            setRescheduleSlot(null);
                          }
                        }}
                        disabled={!hasSlots || isPast}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : hasSlots && !isPast
                            ? 'border-gray-200 hover:border-blue-300 bg-white'
                            : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-1">{day.weekLabel}</div>
                        <div className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {hasSlots ? `${day.slots.filter(s => s.available).length} slot` : 'Không có lịch'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
            {rescheduleDate && (
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Chọn giờ khám</h4>
                
                {/* Hiển thị thông tin duration */}
                {appointment.serviceAppointments && appointment.serviceAppointments.length > 0 && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900">
                    <strong>Lưu ý:</strong> Lịch khám này bao gồm dịch vụ bổ sung. 
                    Thời gian dự kiến: <strong>{calculateTotalDuration()} phút</strong>
                    </p>
                </div>
                )}
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {weekSchedule
                    .find(d => d.date === rescheduleDate)
                    ?.slots.filter(slot => {
                    if (!slot.available) return false;
                    if (isSlotInPast(rescheduleDate, slot.startTime)) return false;
                    if (isSlotConflictingWithPatient(rescheduleDate, slot.startTime, slot.endTime, appointment.id)) return false;
                    
                    // Kiểm tra xem có đủ slot liên tiếp không (nếu có serviceAppointments)
                    if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
                        const totalDuration = calculateTotalDuration();
                        const requiredSlots = Math.ceil(totalDuration / 10);
                        
                        // Tìm index của slot hiện tại
                        const currentSlots = weekSchedule.find(d => d.date === rescheduleDate)?.slots || [];
                        const currentIndex = currentSlots.findIndex(s => s.startTime === slot.startTime);
                        
                        // Kiểm tra có đủ slot liên tiếp available không
                        if (currentIndex + requiredSlots > currentSlots.length) {
                        return false;
                        }
                        
                        for (let i = 0; i < requiredSlots; i++) {
                        const checkSlot = currentSlots[currentIndex + i];
                        if (!checkSlot || !checkSlot.available) {
                            return false;
                        }
                        
                        // Kiểm tra conflict với appointments khác
                        if (isSlotConflictingWithPatient(
                            rescheduleDate, 
                            checkSlot.startTime, 
                            checkSlot.endTime, 
                            appointment.id
                        )) {
                            return false;
                        }
                        }
                    }
                    
                    return true;
                    })
                    .map((slot, idx) => {
                    const isSelected = rescheduleSlot?.startTime === slot.startTime;
                    
                    // Tính endTime dựa trên total duration
                    let displayEndTime = slot.endTime;
                    if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
                        const totalDuration = calculateTotalDuration();
                        const [startHour, startMin] = slot.startTime.split(':').map(Number);
                        const endMinutes = startHour * 60 + startMin + totalDuration;
                        const endHour = Math.floor(endMinutes / 60);
                        const endMin = endMinutes % 60;
                        displayEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;
                    }
                    
                    return (
                        <button
                        key={idx}
                        onClick={() => setRescheduleSlot({
                            startTime: slot.startTime,
                            endTime: displayEndTime
                        })}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                        >
                        <div>{formatTime(slot.startTime)}</div>
                        {appointment.serviceAppointments && appointment.serviceAppointments.length > 0 && (
                            <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                            ~{formatTime(displayEndTime)}
                            </div>
                        )}
                        </button>
                    );
                    })}
                </div>
                {weekSchedule.find(d => d.date === rescheduleDate)?.slots.filter(s => s.available).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Không có slot trống trong ngày này</p>
                )}
            </div>
            )}


                {/* Summary */}
{selectedDoctor && rescheduleDate && rescheduleSlot && (
  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
    <div className="flex items-center gap-2 mb-3">
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-semibold text-green-900">Lịch khám mới</span>
    </div>
    <div className="space-y-3 text-sm text-green-800">
      <div className="flex justify-between">
        <span>Bác sĩ:</span>
        <span className="font-semibold">{selectedDoctor.username}</span>
      </div>
      <div className="flex justify-between">
        <span>Ngày khám:</span>
        <span className="font-semibold">{rescheduleDate}</span>
      </div>

      {/* Timeline chi tiết */}
      {(() => {
        const [startHour, startMin] = rescheduleSlot.startTime.split(':').map(Number);
        let currentMinutes = startHour * 60 + startMin;
        const timeline: {label: string; startTime: string; endTime: string}[] = [];

        // Add service appointments to timeline
        if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
          appointment.serviceAppointments.forEach((service, index) => {
            const serviceDuration = service.medicalExaminations.reduce(
              (sum, exam) => sum + (exam.minDuration || 30), 
              0
            );

            const startMinutes = currentMinutes;
            const endMinutes = currentMinutes + serviceDuration;

            const sh = Math.floor(startMinutes / 60);
            const sm = startMinutes % 60;
            const eh = Math.floor(endMinutes / 60);
            const em = endMinutes % 60;

            timeline.push({
              label: service.medicalExaminations.map(e => e.name).join(', '),
              startTime: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
              endTime: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
            });

            currentMinutes = endMinutes;
          });

          // Add buffer
          currentMinutes += 5;
        }

        // Add parent appointment (khám bác sĩ)
        const parentStart = currentMinutes;
        const parentEnd = currentMinutes + 10;
        const psh = Math.floor(parentStart / 60);
        const psm = parentStart % 60;
        const peh = Math.floor(parentEnd / 60);
        const pem = parentEnd % 60;

        timeline.push({
          label: 'Khám bác sĩ',
          startTime: `${String(psh).padStart(2, '0')}:${String(psm).padStart(2, '0')}`,
          endTime: `${String(peh).padStart(2, '0')}:${String(pem).padStart(2, '0')}`
        });

        return (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-900">Timeline:</p>
            {timeline.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-2 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-900">{item.label}</span>
                  <span className="text-xs font-mono text-green-700">
                    {item.startTime} - {item.endTime}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-green-300 flex justify-between">
              <span className="font-semibold">Tổng thời gian:</span>
              <span className="font-semibold">{calculateTotalDuration()} phút</span>
            </div>
          </div>
        );
      })()}
    </div>
  </div>
)}


            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={confirmReschedule}
            disabled={!selectedDoctor || !rescheduleDate || !rescheduleSlot || rescheduling}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {rescheduling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang dời lịch...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận dời lịch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
