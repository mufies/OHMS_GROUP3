import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Doctor,
  MedicalExamination,
  DaySchedule,
  WeeklySchedule,
  Appointment,
  TimeSlot,
  DiagnosticSlot,
  MedicalServicesRequest,
  BookingType
} from '../types/booking.types';
import { buildWeekDates, toYMD, formatDayLabel } from '../utils/bookingHelpers';
import { getUserIdFromToken } from '../hook/useAuth';

export const useBookingSchedule = (specialty: string | null) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<MedicalExamination[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState<BookingType>(null);
  const [diagnosticSlots, setDiagnosticSlots] = useState<DiagnosticSlot[]>([]);
  const [consultationSlot, setConsultationSlot] = useState<TimeSlot | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [medicalRequests, setMedicalRequests] = useState<MedicalServicesRequest[]>([]);

  // Fetch patient appointments
  useEffect(() => {
    const fetchPatientAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userId = getUserIdFromToken();
        
        if (!userId || !token) return;

        const response = await axios.get(
          `http://localhost:8080/appointments/patient/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setPatientAppointments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
        setPatientAppointments([]);
      }
    };

    fetchPatientAppointments();
  }, []);

  // Fetch medical requests
  useEffect(() => {
    const checkMedicalRequests = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userId = getUserIdFromToken();
        
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
          const activeRequests = response.data.filter((req: MedicalServicesRequest) => 
            req.status === true && req.medicalSpecialty === specialty
          );
          
          if (activeRequests.length > 0) {
            setMedicalRequests(activeRequests);
          }
        }
      } catch (error) {
        console.error('Error fetching medical requests:', error);
      }
    };

    if (specialty) {
      checkMedicalRequests();
    }
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

  // Generate week schedule from API
  const generateWeekScheduleFromAPI = async (
    weeklySchedules: WeeklySchedule[],
    doctorId: string,
    token: string
  ): Promise<DaySchedule[]> => {
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

          // Only check parent appointments (parentAppointment = null) for conflicts
          const isBooked = appointments.some(apt => 
            !apt.parentAppointment && 
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
          const response = await axios.get(`http://localhost:8080/appointments/doctor/${doctorId}/date/${date}`, 
            { headers: { 'Authorization': `Bearer ${token}` } });
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
        }
      } else {
        const intervals = schedulesMap[dateStr] || [];
        const appts = appointmentsMap[dateStr] || [];
        if (intervals.length > 0) {
          slots = buildSlotsForIntervals(intervals, appts);
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
        }
      } else {
        if (hasSchedulesNextWeek) {
          if (hasApiScheduleForDay) {
            const intervals = schedulesMap[dateStr] || [];
            const appts = appointmentsMap[dateStr] || [];
            if (intervals.length > 0) {
              slots = buildSlotsForIntervals(intervals, appts);
            }
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

      schedule.push({ date: dateStr, label, weekLabel: 'Tuần sau', slots, hasApiSchedule: hasApiScheduleForDay });
    }

    const todayIndex = schedule.findIndex(d => d.date === todayStr);
    if (todayIndex >= 0 && schedule[todayIndex].slots?.length > 0) {
      setSelectedDay(todayIndex);
    } else {
      const firstAvailableIndex = schedule.findIndex(d => d.slots?.some(s => s.available));
      setSelectedDay(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
    }

    return schedule;
  };

  // Fetch doctor's schedule when doctor is selected
  useEffect(() => {
    const fetchDoctorSchedule = async () => {
      if (!selectedDoctor) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
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
          const weeklySchedules: WeeklySchedule[] = scheduleResponse.data.results;
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

  return {
    doctors,
    services,
    setServices,
    selectedDoctor,
    setSelectedDoctor,
    selectedServices,
    setSelectedServices,
    weekSchedule,
    selectedDay,
    setSelectedDay,
    selectedSlot,
    setSelectedSlot,
    loading,
    bookingType,
    setBookingType,
    diagnosticSlots,
    setDiagnosticSlots,
    consultationSlot,
    setConsultationSlot,
    patientAppointments,
    medicalRequests,
    setMedicalRequests
  };
};
