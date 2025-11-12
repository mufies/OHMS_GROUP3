import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { getUserIdFromToken } from "../../hook/useAuth";
import Navigator from "../../components/Navigator";
import { MEDICAL_SPECIALTY_LABELS, MedicalSpecialtyType } from "../../constant/medicalSpecialty";

interface MedicalExamination {
  id: string;
  name: string;
  price: number;
  minDuration?: number; // Thời gian tối thiểu (phút)
  category?: 'CLINICAL' | 'DIAGNOSTIC';
  estimatedDuration?: number;
  requiresResultWaitTime?: number;
  type?: 'WAIT' | 'STAY' | null;  // ← THÊM FIELD NÀY

}

interface ServiceStep {
  service: MedicalExamination;
  slot: TimeSlot;
  room?: string;
  estimatedResultTime?: string;
}

interface MultiStepSchedule {
  steps: ServiceStep[];
  totalDuration: number;
  totalWaitTime: number;
  startTime: string;
  endTime: string;
  isValid: boolean;
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
  certifications: string;
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
  weekLabel: string;
  slots: TimeSlot[];
  hasApiSchedule?: boolean;
}

interface WeeklySchedule {
  workDate: string;
  startTime: string;
  endTime: string;
}

interface ServiceAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExamination[];
}

interface Appointment {
  id: string;
  
  // Patient info
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  
  // Doctor info
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  
  // Time & status
  workDate: string;
  startTime: string;
  endTime: string;
  status: string; // 'Schedule' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  
  // Medical services
  medicalExaminations: MedicalExamination[];
  
  // Appointment hierarchy
  parentAppointmentId: string | null;
  serviceAppointments?: ServiceAppointment[];
  
  // Payment
  discount: number;
  deposit: number;
  depositStatus: string; // 'DEPOSIT' | 'PAID' | 'REFUNDED'
  
  // Cancel tracking
  cancelTime: string | null;
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
  const [multiStepSchedules, setMultiStepSchedules] = useState<MultiStepSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<MultiStepSchedule | null>(null);
  const [showMultiStepModal, setShowMultiStepModal] = useState(false);
  const [bookingType, setBookingType] = useState<'CONSULTATION_ONLY' | 'SERVICE_AND_CONSULTATION' | null>(null);
  const [showBookingTypeModal, setShowBookingTypeModal] = useState(true);
  const [diagnosticSlots, setDiagnosticSlots] = useState<{service: MedicalExamination, slot: TimeSlot, resultTime: string}[]>([]);
  const [consultationSlot, setConsultationSlot] = useState<TimeSlot | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [dateAppointments, setDateAppointments] = useState<Appointment[]>([]);
  // Helpers to normalize and convert specialty codes to Vietnamese labels
  const normalizeSpecialties = (spec?: string | string[] | null): string[] => {
    if (!spec) return [];
    if (Array.isArray(spec)) return spec.map(s => s.trim()).filter(Boolean);
    // split by common separators (comma, semicolon, pipe, slash)
    return spec.split(/[,;|\/]+/).map(s => s.trim()).filter(Boolean);
  };

  const getSpecialtyInVietnamese = (spec?: string | string[] | null): string => {
    const list = normalizeSpecialties(spec);
    if (list.length === 0) return '';
    const mapped = list.map(s => MEDICAL_SPECIALTY_LABELS[s as MedicalSpecialtyType] || s);
    return mapped.join(', ');
  };

  const sortServicesByType = (servicesArray: MedicalExamination[]): MedicalExamination[] => {
  const waitServices = servicesArray.filter(s => !s.type || s.type === 'WAIT');
  const stayServices = servicesArray.filter(s => s.type === 'STAY');
  
  return [...waitServices, ...stayServices];  
};


  // Fetch patient appointments on mount
  useEffect(() => {
    const fetchPatientAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const userId = getUserIdFromToken();
        if (!userId) return;

        const response = await axiosInstance.get(
          `/appointments/patient/${userId}`
        );

        console.log('Patient appointments:', response.data);
        setPatientAppointments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
        setPatientAppointments([]);
      }
    };

    fetchPatientAppointments();
  }, []);

  // Fetch appointments for the selected date to check conflicts
  useEffect(() => {
    const fetchDateAppointments = async () => {
      if (weekSchedule.length === 0 || !weekSchedule[selectedDay]) return;
      
      const selectedDate = weekSchedule[selectedDay].date;
      
      try {
        const response = await axiosInstance.get(
          `/appointments/date/${selectedDate}`
        );

        const appointments: Appointment[] = Array.isArray(response.data) ? response.data : [];
        setDateAppointments(appointments);
      } catch (error) {
        console.error('Error fetching date appointments:', error);
        setDateAppointments([]);
      }
    };

    fetchDateAppointments();
  }, [selectedDay, weekSchedule]);

const isSlotConflictingWithPatient = (startTime: string, endTime: string): boolean => {
  // Check conflicts in dateAppointments (all appointments for selected date)
  const hasDateConflict = dateAppointments.some(apt => {
    // Only check parent appointments (not service appointments)
    if (apt.parentAppointmentId !== null) return false;
    
    // Skip cancelled appointments
    if (apt.status === 'CANCELLED') return false;
    
    // Check only the parent appointment's time range
    return startTime < apt.endTime && endTime > apt.startTime;
  });

  // Check conflicts in patientAppointments (patient's own appointments across all dates)
  const selectedDate = weekSchedule[selectedDay]?.date;
  const hasPatientConflict = patientAppointments.some(apt => {
    // Only check parent appointments (not service appointments)
    if (apt.parentAppointmentId !== null) return false;
    
    // Only check appointments on the selected date
    if (apt.workDate !== selectedDate) return false;
    
    // Skip cancelled appointments
    if (apt.status === 'CANCELLED') return false;
    
    // Check only the parent appointment's time range
    return startTime < apt.endTime && endTime > apt.startTime;
  });

  return hasDateConflict || hasPatientConflict;
};



  const isSlotInPast = (date: string, startTime: string): boolean => {
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const slotDate = new Date(year, month - 1, day, hours, minutes);
    
    return slotDate < now;
  };

  // Helper: Phân loại dịch vụ theo category
  const categorizeServices = () => {
    const diagnosticServices: MedicalExamination[] = [];
    const clinicalServices: MedicalExamination[] = [];

    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const diagnosticKeywords = ['siêu âm', 'xét nghiệm', 'chụp', 'X-quang', 'CT', 'MRI', 'điện tim', 'ECG'];
      const isDiagnostic = diagnosticKeywords.some(keyword => 
        service.name.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isDiagnostic) {
        diagnosticServices.push({
          ...service,
          category: 'DIAGNOSTIC',
          estimatedDuration: 30,
          requiresResultWaitTime: 20
        });
      } else {
        clinicalServices.push({
          ...service,
          category: 'CLINICAL',
          estimatedDuration: 10
        });
      }
    });

    return { diagnosticServices, clinicalServices };
  };

  // Helper: Tính toán time slot sau khoảng thời gian chờ
  const getSlotAfterWaitTime = (startSlot: TimeSlot, waitMinutes: number, daySlots: TimeSlot[]): TimeSlot | null => {
    const [startHour, startMin] = startSlot.startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const targetMinutes = startTotalMinutes + waitMinutes;
    
    const targetHour = Math.floor(targetMinutes / 60);
    const targetMin = targetMinutes % 60;
    const targetTime = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}:00`;

    return daySlots.find(slot => 
      slot.startTime >= targetTime && slot.available
    ) || null;
  };

  // Helper: Generate combo schedules cho multi-step booking
  const generateMultiStepSchedules = () => {
    const { diagnosticServices, clinicalServices } = categorizeServices();
    
    if (diagnosticServices.length === 0) {
      setMultiStepSchedules([]);
      return;
    }

    const currentDaySlots = weekSchedule[selectedDay]?.slots || [];
    if (currentDaySlots.length === 0) return;

    const schedules: MultiStepSchedule[] = [];
    const availableSlots = currentDaySlots.filter(slot => slot.available);

    availableSlots.forEach(diagnosticSlot => {
      const steps: ServiceStep[] = [];
      let currentTime = diagnosticSlot.startTime;
      let totalDuration = 0;
      let totalWaitTime = 0;

      diagnosticServices.forEach((service, index) => {
        const duration = service.estimatedDuration || 30;
        const waitTime = service.requiresResultWaitTime || 20;

        steps.push({
          service,
          slot: diagnosticSlot,
          room: `Phòng ${index + 1}`,
          estimatedResultTime: addMinutesToTime(diagnosticSlot.startTime, duration + waitTime)
        });

        totalDuration += duration;
        totalWaitTime += waitTime;
      });

      const minWaitTime = totalDuration + totalWaitTime;
      const clinicalSlot = getSlotAfterWaitTime(diagnosticSlot, minWaitTime, currentDaySlots);

      if (clinicalSlot && clinicalServices.length > 0) {
        clinicalServices.forEach(service => {
          steps.push({
            service,
            slot: clinicalSlot,
            room: 'Phòng khám'
          });
          totalDuration += service.estimatedDuration || 30;
        });

        const [endHour, endMin] = clinicalSlot.endTime.split(':').map(Number);
        const endTotalMin = endHour * 60 + endMin;
        const [startHour, startMin] = diagnosticSlot.startTime.split(':').map(Number);
        const startTotalMin = startHour * 60 + startMin;
        const actualTotalDuration = endTotalMin - startTotalMin;

        schedules.push({
          steps,
          totalDuration: actualTotalDuration,
          totalWaitTime,
          startTime: diagnosticSlot.startTime,
          endTime: clinicalSlot.endTime,
          isValid: true
        });
      }
    });

    setMultiStepSchedules(schedules.slice(0, 5));
  };

  // Helper: Tính toán slots cho các dịch vụ cận lâm sàng
const calculateDiagnosticSlots = (
  startSlot: TimeSlot,
  servicesArray: MedicalExamination[]
): { service: MedicalExamination; slot: TimeSlot; resultTime: string }[] => {
  const slots: { service: MedicalExamination; slot: TimeSlot; resultTime: string }[] = [];

  // Lọc CHỈ các service KHÔNG có chữ "khám" (đây là appointment con)
  const diagnosticServices = servicesArray.filter(s => !s.name.toLowerCase().includes('khám'));

  // Sort theo ưu tiên
  const sortedServices = [...diagnosticServices].sort((a, b) => {
    const aType = a.type || 'WAIT';
    const bType = b.type || 'WAIT';
    const aDuration = a.minDuration || 0;
    const bDuration = b.minDuration || 0;

    const getPriority = (type: string, duration: number) => {
      if (type === 'WAIT' && duration < 30) return 1;
      if (type === 'WAIT' && duration >= 30) return 2;
      if (type === 'STAY' && duration < 30) return 3;
      if (type === 'STAY' && duration >= 30) return 4;
      return 5;
    };

    const aPriority = getPriority(aType, aDuration);
    const bPriority = getPriority(bType, bDuration);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return aDuration - bDuration;
  });

  let currentStartTime = startSlot.startTime;

  sortedServices.forEach((service, index) => {
    const [hour, min] = currentStartTime.split(':').map(Number);
    const duration = service.minDuration || 30;
    
    // Tính endTime = startTime + duration
    const endTotalMinutes = hour * 60 + min + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMin = endTotalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

    slots.push({
      service,
      slot: {
        startTime: currentStartTime,
        endTime: endTime,
        available: true,
      },
      resultTime: endTime,
    });

    // Cập nhật thời gian bắt đầu cho service tiếp theo
    if (index < sortedServices.length - 1) {
      // Tất cả đều cách 5 phút (WAIT+WAIT, WAIT+STAY, STAY+STAY)
      const nextStartMinutes = hour * 60 + min + 5;
      const nextHour = Math.floor(nextStartMinutes / 60);
      const nextMin = nextStartMinutes % 60;
      currentStartTime = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}:00`;
    }
  });

  return slots;
};






  // Helper: Tính thời gian slot khám sau khi có kết quả dịch vụ cuối
  const calculateConsultationSlotsAfterDiagnostic = (lastResultTime: string, daySlots: TimeSlot[]): TimeSlot[] => {
    const [hour, min] = lastResultTime.split(':').map(Number);
    const minConsultationMinutes = hour * 60 + min + 5;
    const minHour = Math.floor(minConsultationMinutes / 60);
    const minMin = minConsultationMinutes % 60;
    const minConsultationTime = `${String(minHour).padStart(2, '0')}:${String(minMin).padStart(2, '0')}:00`;

    // Tìm service khám để lấy duration
    const consultationService = selectedServices
      .map(sid => services.find(s => s.id === sid))
      .find(s => s && s.name.toLowerCase().includes('khám'));
    
    const consultationDuration = consultationService?.minDuration || 10;

    return daySlots
      .filter(slot => slot.startTime >= minConsultationTime && slot.available)
      .map(slot => {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const endMinutes = sh * 60 + sm + consultationDuration;
        const eh = Math.floor(endMinutes / 60);
        const em = endMinutes % 60;
        return {
          ...slot,
          endTime: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`
        };
      });
  };

  // Helper: Add minutes to time string
  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hour, min] = timeStr.split(':').map(Number);
    const totalMinutes = hour * 60 + min + minutes;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
  };

  // Check for existing medical service requests
  useEffect(() => {
    const checkMedicalRequests = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const userId = getUserIdFromToken();
        if (!userId) return;

        const response = await axiosInstance.get(
          `/medical-requests/patient/${userId}`
        );

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
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

  // Generate multi-step schedules when services or day changes
  useEffect(() => {
    if (selectedServices.length > 0 && selectedDoctor && weekSchedule.length > 0) {
      generateMultiStepSchedules();
    }
  }, [selectedServices, selectedDay, weekSchedule]);

  // Handle using existing medical request
  const handleUseExistingRequest = async (request: MedicalServicesRequest) => {
    try {
      await axiosInstance.put(
        `/medical-requests/${request.id}/status`,
        { status: false }
      );

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
        const response = await axiosInstance.post(
          '/medical-examination/by-specialty',
          {
            specility: specialty 
          }
        );
        
        if (response.data?.results) {
          const sortedServices = sortServicesByType(response.data.results);
          setServices(sortedServices);
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
        const response = await axiosInstance.get(
          `/users/getListDoctor`
        );
        
        if (response.data?.results) {
          const filteredDoctors = response.data.results.filter((doc: Doctor) => {
            if (!specialty) return true;
            const codes = normalizeSpecialties(doc.medicleSpecially);
            return codes.includes(specialty);
          });
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
        const scheduleResponse = await axiosInstance.get(
          `/schedule/${selectedDoctor.id}`
        );
        
        if (scheduleResponse.data?.code === 200 && scheduleResponse.data?.results) {
          console.log('Weekly schedule fetched successfully:', scheduleResponse.data.results);
          
          const weeklySchedules: WeeklySchedule[] = scheduleResponse.data.results;
          const token = localStorage.getItem('accessToken') || '';
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

          const isBooked = appointments.some(apt => apt.startTime === startTime && apt.endTime === endTime && apt.status !== 'CANCELLED');
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
          console.error(`Error fetching appointments for ${date}:`, err);
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

    // Process this week
    for (const dateStr of thisWeekStrs) {
      const dateObj = new Date(dateStr);
      const label = formatDayLabel(dateObj);
      let slots: TimeSlot[] = [];
      const hasApiScheduleForDay = !!schedulesMap[dateStr];

      if (useDefault) {
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek >= 0 && dayOfWeek <= 5) {
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

      if (dateStr >= todayStr) {
        schedule.push({ date: dateStr, label, weekLabel: 'Tuần này', slots, hasApiSchedule: hasApiScheduleForDay });
      }
    }

    // Process next week
    for (const dateStr of nextWeekStrs) {
      const dateObj = new Date(dateStr);
      const label = formatDayLabel(dateObj);
      let slots: TimeSlot[] = [];
      const hasApiScheduleForDay = !!schedulesMap[dateStr];

      if (useDefault) {
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const intervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
          const appts = appointmentsMap[dateStr] || [];
          slots = buildSlotsForIntervals(intervals, appts);
        } else {
          slots = [];
        }
      } else {
        if (hasSchedulesNextWeek) {
          if (hasApiScheduleForDay) {
            const intervals = schedulesMap[dateStr] || [];
            const appts = appointmentsMap[dateStr] || [];
            if (intervals.length > 0) {
              slots = buildSlotsForIntervals(intervals, appts);
            } else {
              slots = [];
            }
          } else {
            slots = [];
          }
        } else {
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

    const filteredSchedule = schedule;

    const todayIndex = filteredSchedule.findIndex(d => d.date === todayStr);

    if (todayIndex >= 0 && filteredSchedule[todayIndex].slots && filteredSchedule[todayIndex].slots.length > 0) {
      setSelectedDay(todayIndex);
    } else {
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

  // Calculate total duration for selected services
  const getTotalDuration = () => {
    // Separate services by duration requirement
    const longServices = selectedServices.filter(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return service && service.minDuration && service.minDuration >= 30;
    });
    
    const shortServices = selectedServices.filter(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return service && (!service.minDuration || service.minDuration < 30);
    });

    // Long services (>= 30 min) must be done sequentially
    const longServiceTime = longServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.minDuration || 0);
    }, 0);

    // Short services (< 30 min) can be done simultaneously, so we take the max
    const shortServiceTime = shortServices.length > 0 
      ? Math.max(...shortServices.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          return service?.minDuration || 0;
        }))
      : 0;

    // Total time = sequential long services + max of short services (if they happen after)
    return longServiceTime + shortServiceTime;
  };

  // Apply 10% discount for online booking
  const applyDiscount = (totalPrice: number): number => {
    return Math.round(totalPrice * 0.9); // 10% discount
  };

  // Calculate deposit (50% of discounted price)
  const calculateDeposit = (discountedPrice: number): number => {
    return Math.round(discountedPrice / 2);
  };

  const handlePayment = async () => {
    if (!selectedDoctor || !selectedSlot) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    if (bookingType === 'SERVICE_AND_CONSULTATION' && selectedServices.length > 0 && !consultationSlot) {
      alert('Vui lòng chọn giờ khám bác sĩ!');
      return;
    }

    // Calculate prices with discount and deposit
    const totalAmount = getTotalPrice();
    const discountedAmount = applyDiscount(totalAmount);
    const depositAmount = calculateDeposit(discountedAmount);
    
    const bookingData: any = {
      doctorId: selectedDoctor.id,
      workDate: weekSchedule[selectedDay].date,
      bookingType: bookingType,
      discount: 10, // 10% discount for online booking
      deposit: depositAmount,
      depositStatus: 'PENDING'
    };

    if (bookingType === 'SERVICE_AND_CONSULTATION' && selectedServices.length > 0) {
      // Lọc service "Khám bệnh"
      const consultationServiceId = selectedServices.find(sid => {
        const service = services.find(s => s.id === sid);
        return service?.name.toLowerCase().includes('khám');
      });
      
      // Validation: Phải có ít nhất 1 service khám
      if (!consultationServiceId) {
        alert('Vui lòng chọn dịch vụ khám bệnh!');
        return;
      }
      
      // APPOINTMENT CON: các dịch vụ cận lâm sàng (không có "khám")
      bookingData.serviceSlots = diagnosticSlots.map(ds => ({
        serviceId: ds.service.id,
        startTime: ds.slot.startTime,
        endTime: ds.slot.endTime
      }));
      
      // APPOINTMENT CHA: khám bệnh (có chữ "khám")
      bookingData.consultationSlot = {
        startTime: consultationSlot!.startTime,
        endTime: consultationSlot!.endTime
      };
      
      // medicalExaminationIds cho appointment CHA = chỉ service "Khám bệnh"
      bookingData.medicalExaminationIds = [consultationServiceId];
    } else if (bookingType === 'CONSULTATION_ONLY') {
      bookingData.startTime = selectedSlot.startTime;
      bookingData.endTime = selectedSlot.endTime;
      bookingData.medicalExaminationIds = selectedServices;
    } else {
      bookingData.startTime = selectedSlot.startTime;
      bookingData.endTime = selectedSlot.endTime;
      bookingData.medicalExaminationIds = selectedServices; // Add this to include services in payment
    }

    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    try {
      // Generate unique order description (max 25 characters)
      const orderDesc = `DH${Date.now().toString().slice(-10)}`;
      
      // Use deposit amount for payment (50% of discounted price)
      const response = await axiosInstance.post('/api/v1/payos/create', {
        productName: 'Dat coc kham benh',
        description: orderDesc,
        price: depositAmount, // Pay deposit instead of full price
        returnUrl: `${window.location.origin}/payment-callback`,
        cancelUrl: `${window.location.origin}/payment-cancel`
      });

      if (response.data?.results?.checkoutUrl) {
        window.location.href = response.data.results.checkoutUrl;
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
              <div className="text-2xl font-bold mb-2">
                 {specialty ? MEDICAL_SPECIALTY_LABELS[specialty as MedicalSpecialtyType] || specialty : ''}
              </div>
              {bookingType && (
                <div className={`mb-4 p-3 rounded-lg ${
                  bookingType === 'CONSULTATION_ONLY' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-purple-50 border border-purple-200'
                }`}>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className={`w-5 h-5 ${bookingType === 'CONSULTATION_ONLY' ? 'text-green-600' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`font-medium ${bookingType === 'CONSULTATION_ONLY' ? 'text-green-800' : 'text-purple-800'}`}>
                      {bookingType === 'CONSULTATION_ONLY' 
                        ? `✅ Chế độ: Đặt khám trực tiếp (${(() => {
                            const consultationService = selectedServices
                              .map(sid => services.find(s => s.id === sid))
                              .find(s => s && s.name.toLowerCase().includes('khám'));
                            return consultationService?.minDuration || 10;
                          })()} phút/lượt khám)` 
                        : '✅ Chế độ: Dịch vụ + Khám (30 phút/dịch vụ, các dịch vụ cách nhau 5 phút, khám sau khi có kết quả 5 phút)'}
                    </span>
                  </div>
                </div>
              )}
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
                        <div className="font-semibold text-lg text-gray-900">
                          {bookingType === 'SERVICE_AND_CONSULTATION' ? 'Dịch vụ cận lâm sàng' : 'Loại khám bệnh'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bookingType === 'SERVICE_AND_CONSULTATION' ? 'Xét nghiệm, siêu âm...' : 'Chọn dịch vụ khám'}
                        </div>
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
                      {bookingType === 'SERVICE_AND_CONSULTATION' && (
                        <div className="text-xs text-blue-600 mt-1">
                          ⏱️ Thời gian dự kiến: {(() => {
                            const diagnosticServices = selectedServices.filter(sid => {
                              const service = services.find(s => s.id === sid);
                              return service?.name !== 'Khám bệnh';
                            });
                            return diagnosticServices.length * 30 + (diagnosticServices.length - 1) * 5;
                          })()} phút làm dịch vụ + {(() => {
                            const consultationService = selectedServices
                              .map(sid => services.find(s => s.id === sid))
                              .find(s => s && s.name.toLowerCase().includes('khám'));
                            return consultationService?.minDuration || 10;
                          })()} phút khám bác sĩ
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Chưa chọn dịch vụ nào</div>
                  )}
                </div>

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
                        <div className="font-semibold text-lg text-gray-900">Bác sĩ khám bệnh</div>
                        <div className="text-sm text-gray-500">
                          {bookingType === 'CONSULTATION_ONLY' ? 'Chọn bác sĩ để khám' : 'Chọn bác sĩ sau khi có kết quả'}
                        </div>
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
                          {getSpecialtyInVietnamese(selectedDoctor.medicleSpecially)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Chưa chọn bác sĩ</div>
                  )}
                </div>
              </div>
            </div>

            {selectedDoctor && weekSchedule.length > 0 && (
              <div>
                <div className="text-2xl font-bold mb-4">
                  Thời gian khám
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="font-semibold text-lg mb-4">
                    Ngày và giờ khám
                  </div>
                  
                  {/* Days selector */}
                  <div className="space-y-4">
                    {['Tuần này', 'Tuần sau'].map(week => {
                      const weekDays = weekSchedule.filter(d => d.weekLabel === week);
                      if (weekDays.length === 0) return null;

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      return (
                        <div key={week}>
                          <div className="text-sm font-semibold text-gray-700 mb-3">
                            {week}
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {weekDays.map((day) => {
                              const hasSlots = day.slots && day.slots.length > 0;
                              const [year, month, dayNum] = day.date.split('-').map(Number);
                              const dayDate = new Date(year, month - 1, dayNum);
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

                  {bookingType !== 'SERVICE_AND_CONSULTATION' && (
                    <div>
                      <div className="font-semibold text-lg mb-3 mt-6">
                        <span className="inline-block w-6 h-6 rounded-full bg-gray-900 text-white text-center leading-6 font-bold mr-2">O</span>
                        Khung giờ khám
                      </div>
                      {(() => {
                        const selectedDayData = weekSchedule[selectedDay];
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dateStr = selectedDayData?.date || '';
                        const [year, month, dayNum] = dateStr.split('-').map(Number);
                        const dayDate = new Date(year, month - 1, dayNum);
                        const isDayPast = dayDate < today;
                        const hasSlots = selectedDayData?.slots && selectedDayData.slots.length > 0;
                        
                        // Get duration from selected service
                        const consultationDuration = (() => {
                          const consultationService = selectedServices
                            .map(sid => services.find(s => s.id === sid))
                            .find(s => s && s.name.toLowerCase().includes('khám'));
                          return consultationService?.minDuration || 10;
                        })();
                        
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
                          <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
                            <div className="max-h-[200px] overflow-y-auto pr-2">
                              <div className="grid grid-cols-4 gap-3">
                                {selectedDayData?.slots.map(slot => {
                                  const isPast = isSlotInPast(dateStr, slot.startTime);
                                  
                                  // Calculate actual end time based on service duration
                                  const [sh, sm] = slot.startTime.split(':').map(Number);
                                  const endMinutes = sh * 60 + sm + consultationDuration;
                                  const eh = Math.floor(endMinutes / 60);
                                  const em = endMinutes % 60;
                                  const actualEndTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
                                  
                                  const hasConflict = isSlotConflictingWithPatient(slot.startTime, actualEndTime);
                                  const isDisabled = !slot.available || isPast || hasConflict;
                                  
                                  return (
                                    <button
                                      key={slot.startTime}
                                      onClick={() => !isDisabled && setSelectedSlot({
                                        ...slot,
                                        endTime: actualEndTime
                                      })}
                                      disabled={isDisabled}
                                      className={`py-4 px-6 rounded-lg font-semibold text-base transition-all relative ${
                                        selectedSlot?.startTime === slot.startTime
                                          ? "border-2 border-blue-600 bg-blue-600 text-white"
                                          : isDisabled
                                          ? "border border-gray-300 bg-black text-white cursor-not-allowed opacity-70"
                                          : "border border-gray-200 bg-gray-100 text-gray-900 hover:border-gray-300 hover:bg-blue-50 cursor-pointer"
                                      }`}
                                      title={
                                        isPast 
                                          ? 'Đã qua giờ' 
                                          : hasConflict 
                                          ? 'Bạn đã có lịch khám trong khung giờ này' 
                                          : !slot.available 
                                          ? 'Đã có người đặt' 
                                          : ''
                                      }
                                    >
                                      {formatTime(slot.startTime)} - {formatTime(actualEndTime)}
                                      {hasConflict && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Time slots - SERVICE_AND_CONSULTATION mode */}
                  {bookingType === 'SERVICE_AND_CONSULTATION' && selectedServices.length > 0 && (
                    <div>
                      <div className="font-semibold text-lg mb-3 mt-6">
                        <span className="inline-block w-6 h-6 rounded-full bg-purple-600 text-white text-center leading-6 font-bold mr-2">1</span>
                        Chọn giờ bắt đầu làm dịch vụ
                      </div>
                      {(() => {
                        const selectedDayData = weekSchedule[selectedDay];
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dateStr = selectedDayData?.date || '';
                        const [year, month, dayNum] = dateStr.split('-').map(Number);
                        const dayDate = new Date(year, month - 1, dayNum);
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
                          <div>
                            <div className="bg-white rounded-lg border-2 border-purple-200 p-4 mb-6">
                              <div className="max-h-[200px] overflow-y-auto pr-2">
                                <div className="grid grid-cols-4 gap-3">
                                  {selectedDayData?.slots.filter(s => s.available).map(slot => {
                                    const isPast = isSlotInPast(dateStr, slot.startTime);
                                    
                                    const diagServices = selectedServices
                                      .map(sid => services.find(s => s.id === sid)!)
                                      .filter(s => s && s.name !== 'Khám bệnh');
                                    
                                    const totalServiceTime = diagServices.length * 30;
                                    const gapTime = (diagServices.length - 1) * 5;
                                    const waitTime = 5;
                                    const consultTime = 10;
                                    const totalMinutes = totalServiceTime + gapTime + waitTime + consultTime;
                                    
                                    const [sh, sm] = slot.startTime.split(':').map(Number);
                                    const endTotalMinutes = sh * 60 + sm + totalMinutes;
                                    const eh = Math.floor(endTotalMinutes / 60);
                                    const em = endTotalMinutes % 60;
                                    const estimatedEndTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
                                    
                                    const hasConflict = isSlotConflictingWithPatient(slot.startTime, estimatedEndTime);
                                    const isDisabled = isPast || hasConflict;
                                    
                                    return (
                                      <button
                                        key={slot.startTime}
                                        onClick={() => {
                                          if (!isDisabled) {
                                            setSelectedSlot(slot);
                                            const diagSlots = calculateDiagnosticSlots(slot, diagServices);
                                            setDiagnosticSlots(diagSlots);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`py-4 px-6 rounded-lg font-semibold text-base transition-all relative ${
                                          selectedSlot?.startTime === slot.startTime
                                            ? "border-2 border-purple-600 bg-purple-600 text-white"
                                            : isDisabled
                                            ? "border border-gray-300 bg-black text-white cursor-not-allowed opacity-70"
                                            : "border border-gray-200 bg-gray-100 text-gray-900 hover:border-gray-300 hover:bg-purple-50 cursor-pointer"
                                        }`}
                                        title={
                                          isPast 
                                            ? 'Đã qua giờ' 
                                            : hasConflict 
                                            ? 'Bạn đã có lịch khám trong khung giờ này' 
                                            : ''
                                        }
                                      >
                                        {formatTime(slot.startTime)}
                                        {hasConflict && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Timeline */}
                            {selectedSlot && diagnosticSlots.length > 0 && (
                              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                <div className="font-semibold text-lg mb-4 text-purple-900">
                                  📋 Quy trình khám chi tiết
                                </div>
                                <div className="space-y-4">
                                  {diagnosticSlots.map((diagSlot, index) => {
                                    const serviceDuration = diagSlot.service.minDuration || 30;
                                    const isLongService = serviceDuration >= 30;
                                    
                                    return (
                                      <div key={index} className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isLongService ? 'bg-orange-600' : 'bg-purple-600'} text-white flex items-center justify-center font-bold text-sm`}>
                                          {index + 1}
                                        </div>
                                        <div className="flex-1 bg-white rounded-lg p-4 border border-purple-200">
                                          <div className="flex items-center gap-2">
                                            <div className="font-semibold text-gray-900">{diagSlot.service.name}</div>
                                            {diagSlot.service.minDuration && (
                                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                isLongService 
                                                  ? 'bg-orange-100 text-orange-800' 
                                                  : 'bg-green-100 text-green-800'
                                              }`}>
                                                {isLongService ? '⏱️ Phải ở tại chỗ' : '⚡ Có thể rời khỏi'}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            🕐 {formatTime(diagSlot.slot.startTime)} - {formatTime(diagSlot.slot.endTime)}
                                          </div>
                                          <div className="text-xs text-purple-700 mt-1">
                                            ⏱️ Thời gian làm: {serviceDuration} phút • Kết quả: {formatTime(diagSlot.resultTime)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <div className="flex items-center gap-4 ml-12">
                                    <div className="flex-1 border-l-4 border-dashed border-gray-300 pl-4 py-2">
                                      <div className="text-sm text-gray-600">
                                        ⏳ Chờ kết quả (~5 phút)
                                      </div>
                                    </div>
                                  </div>

                                  <div className="font-semibold text-base mb-3 text-gray-900 mt-4">
                                    <span className="inline-block w-6 h-6 rounded-full bg-green-600 text-white text-center leading-6 font-bold mr-2 text-sm">✓</span>
                                    Chọn giờ khám bác sĩ
                                  </div>
                                  {(() => {
                                    const lastResult = diagnosticSlots[diagnosticSlots.length - 1]?.resultTime;
                                    if (!lastResult) return null;
                                    
                                    const consultationSlots = calculateConsultationSlotsAfterDiagnostic(lastResult, selectedDayData.slots);
                                    
                                    return (
                                      <div className="ml-12 bg-white rounded-lg border-2 border-green-200 p-4">
                                        <div className="max-h-[200px] overflow-y-auto pr-2">
                                          <div className="grid grid-cols-4 gap-3">
                                            {consultationSlots.map((conSlot) => {
                                              const isPast = isSlotInPast(dateStr, conSlot.startTime);
                                              const hasConflict = isSlotConflictingWithPatient(conSlot.startTime, conSlot.endTime);
                                              const isDisabled = isPast || hasConflict;
                                              
                                              return (
                                                <button
                                                  key={conSlot.startTime}
                                                  onClick={() => !isDisabled && setConsultationSlot(conSlot)}
                                                  disabled={isDisabled}
                                                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all relative ${
                                                    consultationSlot?.startTime === conSlot.startTime
                                                      ? "border-2 border-green-600 bg-green-600 text-white"
                                                      : isDisabled
                                                      ? "border border-gray-300 bg-black text-white cursor-not-allowed opacity-70"
                                                      : "border border-gray-200 bg-gray-50 text-gray-900 hover:border-green-300 hover:bg-green-50 cursor-pointer"
                                                  }`}
                                                  title={
                                                    isPast 
                                                      ? 'Đã qua giờ' 
                                                      : hasConflict 
                                                      ? 'Bạn đã có lịch khám trong khung giờ này' 
                                                      : ''
                                                  }
                                                >
                                                  {formatTime(conSlot.startTime)}
                                                  {hasConflict && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-[380px] bg-white rounded-2xl shadow-lg p-8 h-fit sticky top-8">
            <div className="font-bold text-xl mb-4">
              Thông tin đặt khám
            </div>

            {selectedServices.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ đã chọn:</div>
                <div className="space-y-2">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId);
                    return (
                      <div key={serviceId} className="space-y-1">
                        <div className="flex justify-between items-start text-sm">
                          <span className="text-gray-600 flex-1 pr-2">{service?.name}</span>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(service?.price || 0)}</span>
                        </div>
                        {/* Duration badge in sidebar */}
                        {service?.minDuration && (
                          <div className="flex items-center text-xs">
                            <span className={`px-2 py-0.5 rounded ${
                              service.minDuration < 30 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-orange-50 text-orange-700'
                            }`}>
                              ⏱ {service.minDuration} phút {service.minDuration < 30 ? '(Nhanh)' : '(Cần thời gian)'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Duration Summary */}
                {getTotalDuration() > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tổng thời gian:</span>
                    <span className="font-semibold text-blue-600">{getTotalDuration()} phút</span>
                  </div>
                )}
                
                {/* Price Summary with Discount */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tổng giá dịch vụ:</span>
                    <span className="font-medium text-gray-900">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600">Giảm 10% (online):</span>
                    <span className="font-medium text-green-600">-{formatPrice(getTotalPrice() - applyDiscount(getTotalPrice()))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-semibold">Sau giảm giá:</span>
                    <span className="text-base font-bold text-blue-600">{formatPrice(applyDiscount(getTotalPrice()))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-orange-50 -mx-2 px-2 py-2 rounded">
                    <span className="text-orange-700 font-semibold">Cần đặt cọc (50%):</span>
                    <span className="text-base font-bold text-orange-600">{formatPrice(calculateDeposit(applyDiscount(getTotalPrice())))}</span>
                  </div>
                </div>
              </div>
            )}

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
                      {getSpecialtyInVietnamese(selectedDoctor.medicleSpecially)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {selectedDoctor.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bookingType === 'SERVICE_AND_CONSULTATION' && selectedServices.length > 0 ? (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Thời gian:</div>
                <div className="space-y-3">
                  {diagnosticSlots.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Làm dịch vụ:</div>
                      {diagnosticSlots.map((ds, idx) => (
                        <div key={idx} className="text-xs text-gray-900 mb-1">
                          <span className="font-medium">{ds.service.name}</span>
                          <span className="text-purple-600 ml-2">
                            {formatTime(ds.slot.startTime)} - {formatTime(ds.slot.endTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {consultationSlot && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Khám bác sĩ:</div>
                      <div className="text-sm font-medium text-gray-900">
                        <span>{weekSchedule[selectedDay].label}</span>
                        <div className="text-green-600 font-semibold mt-1">
                          {formatTime(consultationSlot.startTime)} - {formatTime(consultationSlot.endTime)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedSlot && (
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

            <button
              onClick={handlePayment}
              className={`w-full font-bold text-base border-none rounded-lg py-4 mb-3 transition-all ${
                (bookingType === 'CONSULTATION_ONLY' && selectedSlot) ||
                (bookingType === 'SERVICE_AND_CONSULTATION' && selectedSlot && consultationSlot)
                  ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={
                !(bookingType === 'CONSULTATION_ONLY' && selectedSlot) &&
                !(bookingType === 'SERVICE_AND_CONSULTATION' && selectedSlot && consultationSlot)
              }
            >
              {selectedServices.length > 0 
                ? `Đặt cọc ${formatPrice(calculateDeposit(applyDiscount(getTotalPrice())))} và xác nhận`
                : 'Thanh toán và đặt khám'
              }
            </button>
            <div className="text-xs text-gray-500 text-center leading-relaxed">
              {selectedServices.length > 0 
                ? 'Bạn chỉ cần thanh toán 50% giá trị đơn hàng để giữ lịch hẹn. Số tiền còn lại sẽ thanh toán khi đến khám.'
                : 'Bằng cách nhấn nút thanh toán, bạn đã đồng ý với các điều khoản và điều kiện đặt khám'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
              {/* Info Banner */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      {bookingType === 'SERVICE_AND_CONSULTATION' 
                        ? 'Ưu đãi đặt khám online:' 
                        : 'Chọn loại khám bệnh:'
                      }
                    </div>
                    {bookingType === 'SERVICE_AND_CONSULTATION' ? (
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>✓ Giảm 10% tổng giá trị dịch vụ</li>
                        <li>✓ Chỉ cần đặt cọc 50% để giữ lịch hẹn</li>
                        <li>✓ Thanh toán số tiền còn lại khi đến khám</li>
                      </ul>
                    ) : (
                      <p className="text-xs text-blue-800">
                        Chọn loại khám bệnh phù hợp với nhu cầu của bạn
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Phần 1: Khám bệnh (chỉ chọn 1) */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Loại khám</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Chọn 1</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {services.filter(s => s.name.toLowerCase().includes('khám')).map(service => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => {
                          if (bookingType === 'CONSULTATION_ONLY') {
                            // Chế độ CONSULTATION_ONLY: chỉ chọn 1 service khám
                            setSelectedServices([service.id]);
                          } else {
                            // Chế độ SERVICE_AND_CONSULTATION: bỏ chọn tất cả service khám khác, giữ lại các service cận lâm sàng
                            const otherServices = selectedServices.filter(id => {
                              const s = services.find(x => x.id === id);
                              return s && !s.name.toLowerCase().includes('khám');
                            });
                            setSelectedServices([...otherServices, service.id]);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-green-600 bg-green-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-base text-gray-900">{service.name}</div>
                            <div className="text-sm text-green-600 font-medium mt-1">{formatPrice(service.price)}</div>
                            
                            {service.minDuration && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {service.minDuration} phút
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-green-600 border-green-600"
                              : "border-gray-300"
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phần 2: Dịch vụ cận lâm sàng (chọn nhiều) */}
              {bookingType === 'SERVICE_AND_CONSULTATION' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Dịch vụ cận lâm sàng</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Chọn nhiều</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    💡 <strong>Lưu ý:</strong> Các dịch vụ sẽ được thực hiện TRƯỚC, sau đó bạn sẽ khám bác sĩ với kết quả đầy đủ
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  {services.filter(s => !s.name.toLowerCase().includes('khám')).map(service => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-base text-gray-900">{service.name}</div>
                            <div className="text-sm text-purple-600 font-medium mt-1">{formatPrice(service.price)}</div>
                            
                            {/* Duration Badge */}
                            {service.minDuration && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  service.minDuration < 30 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {service.minDuration} phút
                                </span>
                                <span className={`text-xs ${
                                  service.minDuration < 30 
                                    ? 'text-green-600' 
                                    : 'text-orange-600'
                                }`}>
                                  {service.minDuration < 30 
                                    ? '(Nhanh)' 
                                    : '(Cần thời gian)'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-purple-600 border-purple-600"
                              : "border-gray-300"
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">Đã chọn {selectedServices.length} dịch vụ</div>
                
                {/* Duration Info */}
                {selectedServices.length > 0 && getTotalDuration() > 0 && (
                  <div className="mb-2">
                    <div className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tổng thời gian: <span className="font-semibold ml-1">{getTotalDuration()} phút</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-5">
                      {(() => {
                        const longServices = selectedServices.filter(sid => {
                          const s = services.find(x => x.id === sid);
                          return s && s.minDuration && s.minDuration >= 30;
                        });
                        const shortServices = selectedServices.filter(sid => {
                          const s = services.find(x => x.id === sid);
                          return s && (!s.minDuration || s.minDuration < 30);
                        });
                        if (longServices.length > 0 && shortServices.length > 0) {
                          return '⚡ Dịch vụ nhanh có thể làm đồng thời, dịch vụ lâu làm tuần tự';
                        } else if (longServices.length > 1) {
                          return '⏱️ Các dịch vụ sẽ được thực hiện tuần tự';
                        } else {
                          return '✓ Thời gian ước tính cho tất cả dịch vụ';
                        }
                      })()}
                    </div>
                  </div>
                )}
                

              </div>
              <button
                onClick={handleServiceModalClose}
                className="ml-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Selection Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
              {viewDoctorProfile ? (
                // Doctor Profile Detail View
                (() => {
                  const doctor = doctors.find(d => d.id === viewDoctorProfile);
                  if (!doctor) return null;
                  
                  return (
                    <div className="space-y-6">
                      {/* Back Button */}
                      <button
                        onClick={() => setViewDoctorProfile(null)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại danh sách
                      </button>

                      {/* Doctor Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                        <div className="flex items-start gap-6">
                          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {doctor.imageUrl ? (
                              <img 
                                src={doctor.imageUrl} 
                                alt={doctor.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 text-4xl font-bold">
                                {doctor.username.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              Bác sĩ {doctor.username}
                            </h3>
                            <div className="flex flex-wrap gap-3 mb-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {getSpecialtyInVietnamese(doctor.medicleSpecially)}
                              </span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                {doctor.experience} năm kinh nghiệm
                              </span>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">


                              </div>

                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setViewDoctorProfile(null);
                            }}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Chọn bác sĩ
                          </button>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Thông tin liên hệ</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="text-sm font-medium text-gray-900">{doctor.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Điện thoại</p>
                              <p className="text-sm font-medium text-gray-900">{doctor.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Education */}
                      {doctor.education && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Học vấn</h4>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{doctor.education}</p>
                        </div>
                      )}

                      {/* Certifications */}
                      {doctor.certifications && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Chứng chỉ & Giấy phép hành nghề</h4>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line">
                            {doctor.certifications}
                          </p>
                        </div>
                      )}

                      {/* Description */}
                      {doctor.description && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Giới thiệu</h4>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{doctor.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                // Doctor List View
                <div className="space-y-3">
                  {doctors.map(doctor => (
                    <div
                      key={doctor.id}
                      className={`p-5 rounded-xl border-2 transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0">
                            {doctor.imageUrl ? (
                              <img 
                                src={doctor.imageUrl} 
                                alt={doctor.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-2xl font-bold">
                                {doctor.username.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-gray-900">BS. {doctor.username}</h3>
                              {selectedDoctor?.id === doctor.id && (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-600">Chuyên khoa: {getSpecialtyInVietnamese(doctor.medicleSpecially)}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-600">{doctor.experience} năm kinh nghiệm</span>
                            </div>

                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDoctorProfile(doctor.id)}
                          className="ml-4 px-5 py-2.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all font-medium text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Booking Type Selection Modal */}
      {showBookingTypeModal && (
        <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Chọn loại đặt lịch</h2>
              <p className="text-gray-600 mb-8">Vui lòng chọn hình thức đặt lịch phù hợp với nhu cầu của bạn</p>

              <div className="grid grid-cols-2 gap-6">
                {/* Consultation Only */}
                <div
                  onClick={async () => {
                    try {
                      const response = await axiosInstance.post(
                        '/medical-examination/by-specialty',
                        {
                          specility: specialty
                        }
                      );
                      
                      if (response.data?.results) {
                        const khamBenhService = response.data.results.find(
                          (service: any) => service.name === 'Khám bệnh'
                        );
                        
                        if (khamBenhService) {
                          setSelectedServices([khamBenhService.id]);
                          setBookingType('CONSULTATION_ONLY');
                          setShowBookingTypeModal(false);
                          console.log('Auto-assigned Khám bệnh service:', khamBenhService);
                        } else {
                          alert('Không tìm thấy dịch vụ "Khám bệnh" cho chuyên khoa này. Vui lòng liên hệ quản trị viên.');
                          return;
                        }
                      } else {
                        alert('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
                        return;
                      }
                    } catch (error) {
                      console.error('Error fetching Khám bệnh service:', error);
                      alert('Lỗi khi tải dịch vụ khám bệnh. Vui lòng thử lại.');
                      return;
                    }
                  }}
                  className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt khám</h3>
                  <p className="text-sm text-gray-600 mb-4">Khám bác sĩ trực tiếp</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Thời gian khám: ~{(() => {
                        const consultationService = services.find(s => s.name.toLowerCase().includes('khám'));
                        return consultationService?.minDuration || 10;
                      })()} phút</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Nhanh gọn, tiện lợi</span>
                    </div>
                  </div>
                </div>

                {/* Service + Consultation */}
                <div
                  onClick={async () => {
                    try {
                      const response = await axiosInstance.post(
                        '/medical-examination/by-specialty',
                        {
                          specility: specialty
                        }
                      );
                      
                      if (response.data?.results) {
                        const khamBenhService = response.data.results.find(
                          (service: any) => service.name === 'Khám bệnh'
                        );
                        
                        if (khamBenhService) {
                          setSelectedServices([khamBenhService.id]);
                          setBookingType('SERVICE_AND_CONSULTATION');
                          setShowBookingTypeModal(false);
                          console.log('Auto-assigned Khám bệnh service for SERVICE_AND_CONSULTATION:', khamBenhService);
                        } else {
                          alert('Không tìm thấy dịch vụ "Khám bệnh" cho chuyên khoa này. Vui lòng liên hệ quản trị viên.');
                          return;
                        }
                      } else {
                        alert('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
                        return;
                      }
                    } catch (error) {
                      console.error('Error fetching Khám bệnh service:', error);
                      alert('Lỗi khi tải dịch vụ khám bệnh. Vui lòng thử lại.');
                      return;
                    }
                  }}
                  className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Dịch vụ + Khám</h3>
                  <p className="text-sm text-gray-600 mb-4">Làm dịch vụ trước, sau đó khám</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Dịch vụ: 30 phút/dịch vụ</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Khám với kết quả đầy đủ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  💡 Chọn "Dịch vụ + Khám" nếu bạn cần làm xét nghiệm, siêu âm trước khi gặp bác sĩ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Service Request Modal */}
      {showRequestModal && medicalRequests.length > 0 && (
        <div className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
