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
}

interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string; // "Tuần này" or "Tuần sau"
  slots: TimeSlot[];
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

// Tạo apiClient BÊN NGOÀI component
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

  // Fetch service "Tư vấn online"
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

  // Fetch doctors by specialty
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

  // Fetch doctor's schedule when doctor is selected
  useEffect(() => {
    const fetchDoctorSchedule = async () => {
      if (!selectedDoctor) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          return;
        }
        
        console.log('Fetching schedules for doctor:', selectedDoctor.id);
        
        // 1. Gọi API lấy weekly schedule (tuần này)
        const weeklyResponse = await apiClient.get(
          `/schedule/doctor/${selectedDoctor.id}/weekly`
        );
        
        console.log('Weekly schedule response:', weeklyResponse.data);
        
        // 2. Gọi API lấy next-week schedule (tuần sau)
        const nextWeekResponse = await apiClient.get(
          `/schedule/doctor/${selectedDoctor.id}/next-week`
        );
        
        console.log('Next week schedule response:', nextWeekResponse.data);
        
        // Lấy data từ responses
        const thisWeekSchedules: WeeklySchedule[] = weeklyResponse.data?.code === 200 
          ? (weeklyResponse.data?.results || []) 
          : [];
          
        const nextWeekSchedules: WeeklySchedule[] = nextWeekResponse.data?.code === 200 
          ? (nextWeekResponse.data?.results || []) 
          : [];
        
        console.log('This week schedules:', thisWeekSchedules);
        console.log('Next week schedules:', nextWeekSchedules);
        
        // Generate combined schedule
        const schedule = await generateCombinedSchedule(
          thisWeekSchedules,
          nextWeekSchedules,
          selectedDoctor.id,
          token
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

  // Generate combined schedule from both weeks
  const generateCombinedSchedule = async (
    thisWeekSchedules: WeeklySchedule[],
    nextWeekSchedules: WeeklySchedule[],
    doctorId: string,
    token: string
  ): Promise<DaySchedule[]> => {
    
    const buildWeekDates = (refDate: Date) => {
      const d = new Date(refDate);
      const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekDates: Date[] = [];
      for (let i = 0; i < 5; i++) {  // Mon-Fri only
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        weekDates.push(dt);
      }
      return weekDates;
    };

    // Build slots for given intervals
    const buildSlotsForIntervals = (
      intervals: {startTime: string; endTime: string}[], 
      appointments: Appointment[]
    ) => {
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

          const isBooked = appointments.some(
            apt => apt.startTime === startTime && apt.status !== 'CANCELLED'
          );
          slots.push({ startTime, endTime, available: !isBooked });
        }
      }
      return slots;
    };

    // Convert schedules to map by date
    const toScheduleMap = (schedules: WeeklySchedule[]) => {
      return schedules.reduce((acc, sch) => {
        if (!acc[sch.workDate]) acc[sch.workDate] = [];
        acc[sch.workDate].push({ startTime: sch.startTime, endTime: sch.endTime });
        return acc;
      }, {} as Record<string, {startTime:string; endTime:string}[]>);
    };

    const thisWeekMap = toScheduleMap(thisWeekSchedules);
    const nextWeekMap = toScheduleMap(nextWeekSchedules);

    // Fetch appointments for dates
    const fetchAppointmentsForDates = async (dates: string[]) => {
      const map: Record<string, Appointment[]> = {};
      for (const date of dates) {
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
      }
      return map;
    };

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeekDates = buildWeekDates(today);
    const nextWeekStart = new Date(thisWeekDates[0]);
    nextWeekStart.setDate(thisWeekDates[0].getDate() + 7);
    const nextWeekDates = buildWeekDates(nextWeekStart);

    const toYMD = (d: Date) => d.toISOString().slice(0,10);
    const thisWeekStrs = thisWeekDates.map(toYMD);
    const nextWeekStrs = nextWeekDates.map(toYMD);
    const allWeeksStrs = [...thisWeekStrs, ...nextWeekStrs];

    // Fetch all appointments
    const appointmentsMap = await fetchAppointmentsForDates(allWeeksStrs);

    const schedule: DaySchedule[] = [];
    const todayStr = toYMD(today);

    // Check if next week has any schedules from API
    const hasNextWeekSchedules = nextWeekStrs.some(date => !!nextWeekMap[date]);

    // Process this week
    for (const dateStr of thisWeekStrs) {
      const dateObj = new Date(dateStr);
      // Skip past dates and Sundays
      if (dateStr < todayStr || dateObj.getDay() === 0) continue;

      const label = formatDayLabel(dateObj);
      const intervals = thisWeekMap[dateStr] || [];
      const appts = appointmentsMap[dateStr] || [];
      const slots = intervals.length > 0 ? buildSlotsForIntervals(intervals, appts) : [];

      schedule.push({ 
        date: dateStr, 
        label, 
        weekLabel: 'Tuần này', 
        slots 
      });
    }

    // Process next week with special logic
    if (!hasNextWeekSchedules) {
      // Nếu next-week API RỖNG -> tạo default Mon-Fri 07:00-17:00
      console.log('Next week has no schedules, creating default Mon-Fri slots');
      
      for (const dateStr of nextWeekStrs) {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();
        
        // Only Mon-Fri (1-5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const label = formatDayLabel(dateObj);
          const defaultIntervals = [{ startTime: '07:00:00', endTime: '17:00:00' }];
          const appts = appointmentsMap[dateStr] || [];
          const slots = buildSlotsForIntervals(defaultIntervals, appts);

          schedule.push({ 
            date: dateStr, 
            label, 
            weekLabel: 'Tuần sau', 
            slots 
          });
        }
      }
    } else {
      // Nếu next-week API CÓ DATA -> chỉ hiển thị ngày có trong schedule
      console.log('Next week has schedules, showing only scheduled days');
      
      for (const dateStr of nextWeekStrs) {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();
        
        // Skip Sundays
        if (dayOfWeek === 0) continue;

        // Chỉ hiển thị ngày có schedule từ API
        if (nextWeekMap[dateStr]) {
          const label = formatDayLabel(dateObj);
          const intervals = nextWeekMap[dateStr];
          const appts = appointmentsMap[dateStr] || [];
          const slots = buildSlotsForIntervals(intervals, appts);

          schedule.push({ 
            date: dateStr, 
            label, 
            weekLabel: 'Tuần sau', 
            slots 
          });
        }
      }
    }

    // Auto-select first available day
    const todayIndex = schedule.findIndex(d => d.date === todayStr);
    if (todayIndex >= 0 && schedule[todayIndex].slots.length > 0) {
      setSelectedDay(todayIndex);
    } else {
      const firstAvailableIndex = schedule.findIndex(
        d => d.slots && d.slots.some(s => s.available)
      );
      setSelectedDay(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
    }

    return schedule;
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedSlot || !service) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    // Build booking payload compatible with PaymentCallback
    const amount = service.price || 0;
    const discount = 0; // currently no discount selection in this flow
    const deposit = Math.round(amount * 0.5); // default 50% deposit

    const bookingData = {
      bookingType: 'CONSULTATION_ONLY', // online consult is consultation-only
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

    // Persist pending booking so PaymentCallback can finalize appointment after payment
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    try {
      // Call payment init endpoint (backend should return paymentUrl in results.paymentUrl)
      const response = await axios.get('http://localhost:8080/api/v1/payment/vn-pay', {
        params: {
          amount: amount,
          bankCode: 'NCB'
        }
      });

      if (response.data?.results?.paymentUrl) {
        // Redirect user to payment provider
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigator />
      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "32px 0" }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          padding: 32
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Chọn thời gian tư vấn online
          </div>
          <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 24 }}>
            Chuyên khoa: {specialty}
          </div>

          {/* Hiển thị dịch vụ */}
          {service && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>1. Dịch vụ</div>
              <div style={{
                padding: "16px",
                background: "#eff6ff",
                border: "2px solid #2563eb",
                borderRadius: 12
              }}>
                <div style={{ fontWeight: 600 }}>{service.name}</div>
                <div style={{ color: "#2563eb", marginTop: 4 }}>{formatPrice(service.price)}</div>
              </div>
            </div>
          )}

          {/* Chọn bác sĩ */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>2. Chọn bác sĩ</div>
            <button
              onClick={() => setShowDoctorModal(true)}
              style={{
                width: "100%",
                padding: "16px",
                background: "#f1f5f9",
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              {selectedDoctor ? (
                <div>
                  <div style={{ fontWeight: 600 }}>BS. {selectedDoctor.username}</div>
                  <div style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>{selectedDoctor.medicleSpecially}</div>
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>Nhấn để chọn bác sĩ</div>
              )}
            </button>
          </div>

          {/* Chọn thời gian */}
          {selectedDoctor && weekSchedule.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>3. Chọn thời gian</div>
              
              {/* Tabs ngày - grouped by week */}
              <div style={{ marginBottom: 16 }}>
                {['Tuần này', 'Tuần sau'].map(week => {
                  const weekDays = weekSchedule.filter(d => d.weekLabel === week);
                  if (weekDays.length === 0) return null;

                  return (
                    <div key={week} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>
                        {week}
                      </div>
                      <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                        {weekDays.map((day) => {
                          const actualIdx = weekSchedule.indexOf(day);
                          const hasSlots = day.slots && day.slots.length > 0;
                          const availableCount = day.slots.filter(s => s.available).length;

                          return (
                            <button
                              key={day.date}
                              onClick={() => {
                                if (hasSlots) {
                                  setSelectedDay(actualIdx);
                                  setSelectedSlot(null);
                                }
                              }}
                              disabled={!hasSlots}
                              style={{
                                padding: "10px 18px",
                                border: "none",
                                borderBottom: actualIdx === selectedDay ? "3px solid #0ea5e9" : "3px solid transparent",
                                background: "none",
                                fontWeight: 600,
                                color: actualIdx === selectedDay ? "#0ea5e9" : hasSlots ? "#334155" : "#94a3b8",
                                cursor: hasSlots ? "pointer" : "not-allowed",
                                fontSize: 16,
                                whiteSpace: "nowrap",
                                opacity: hasSlots ? 1 : 0.5
                              }}
                            >
                              {day.label} 
                              {hasSlots && (
                                <span style={{ color: "#22c55e", fontWeight: 400, fontSize: 13 }}>
                                  {" "}{availableCount} khung
                                </span>
                              )}
                              {!hasSlots && (
                                <span style={{ color: "#ef4444", fontWeight: 400, fontSize: 13 }}>
                                  {" "}Không có
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Khung giờ */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 12,
                maxHeight: 300,
                overflowY: "auto"
              }}>
                {weekSchedule[selectedDay]?.slots.filter(slot => slot.available).map(slot => (
                  <button
                    key={slot.startTime}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: "12px 0",
                      background: selectedSlot?.startTime === slot.startTime ? "#2563eb" : "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontWeight: 500,
                      color: selectedSlot?.startTime === slot.startTime ? "white" : "#0f172a",
                      cursor: "pointer"
                    }}
                  >
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nút đặt khám */}
          <button 
            onClick={handleBooking}
            disabled={!selectedDoctor || !selectedSlot || !service}
            style={{
              width: "100%",
              background: selectedDoctor && selectedSlot && service ? "#2563eb" : "#9ca3af",
              color: "white",
              fontWeight: 700,
              fontSize: 18,
              border: "none",
              borderRadius: 8,
              padding: "16px 0",
              cursor: selectedDoctor && selectedSlot && service ? "pointer" : "not-allowed"
            }}
          >
            THANH TOÁN {service && formatPrice(service.price)} VÀ ĐẶT KHÁM
          </button>
        </div>
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}>
          <div style={{
            background: "white",
            borderRadius: 16,
            maxWidth: 700,
            width: "90%",
            maxHeight: "80vh",
            overflow: "hidden"
          }}>
            <div style={{ padding: 24, borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Chọn bác sĩ</h3>
            </div>
            <div style={{ padding: 24, maxHeight: 400, overflowY: "auto" }}>
              {doctors.map(doctor => (
                <div
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    border: selectedDoctor?.id === doctor.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: selectedDoctor?.id === doctor.id ? "#eff6ff" : "white"
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16 }}>BS. {doctor.username}</div>
                  <div style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>{doctor.medicleSpecially}</div>
                  <div style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>
                    ⭐ {doctor.rating} • {doctor.patients}+ bệnh nhân
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 24, borderTop: "1px solid #e5e7eb", textAlign: "right" }}>
              <button
                onClick={() => setShowDoctorModal(false)}
                disabled={!selectedDoctor}
                style={{
                  padding: "12px 24px",
                  background: selectedDoctor ? "#2563eb" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: selectedDoctor ? "pointer" : "not-allowed"
                }}
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
