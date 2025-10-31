import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { MEDICAL_SPECIALTY_LABELS } from "../../constant/medicalSpecialty";

interface Doctor {
  id: string;
  username: string;
  email: string;
  imageUrl: string | null;
  medicleSpecially: string[] | null;
}

interface Schedule {
  id?: string;
  workDate: string;
  startTime: string;
  endTime: string;
  userId?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  schedules: (Schedule & { doctorName: string; doctorId: string })[];
}

interface StaffInfo {
  id: string;
  username: string;
  email: string;
  phone: number;
  medicleSpecially: string[];
  imageUrl: string | null;
}

interface WeekScheduleManagerProps {
  staffInfo: StaffInfo | null;
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
  parentAppointmentId: string | null;
  serviceAppointments: ServiceAppointment[] | null;
  discount: number | null;
  deposit: number | null;
  depositStatus: string | null;
  cancelTime: string | null;
}
interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
}

// Helper functions remain the same
const formatTime = (timeStr: string): string => {
  return timeStr.substring(0, 5);
};

const formatDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
};

const getDayName = (dateStr: string): string => {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return days[date.getDay()];
};

const getWeekDates = (referenceDate: Date = new Date()): string[] => {
  const dates: string[] = [];
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(current);
  monday.setDate(current.getDate() - daysToMonday);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
};

export default function WeekScheduleManager({ staffInfo }: WeekScheduleManagerProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<DaySchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule & { doctorName: string; doctorId: string } | null>(null); // New state for selected schedule
  const [appointmentList, setAppointmentList] = useState<any[]>([]);

  // Form state for add
  const [scheduleForm, setScheduleForm] = useState({
    doctorId: "",
    startTime: "",
    endTime: "",
  });

  // Form state for edit
  const [editScheduleForm, setEditScheduleForm] = useState({
    workDate: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    if (staffInfo) {
      fetchDoctors();
    }
  }, [staffInfo]);

  useEffect(() => {
    if (doctors.length > 0) {
      fetchWeekSchedules();
    }
  }, [doctors, currentWeekStart]);

  const fetchAppointmentList = async (doctorId: string, date: string, startTime: string, endTime: string) => {
    if (!doctorId || !date) return;
    
    try {
      const res = await axiosInstance.get(`/appointments/doctor/${doctorId}/date/${date}`);
      
      const appointments = res.data?.results || res.data || [];
      
      if (!Array.isArray(appointments)) {
        console.warn("Unexpected API response format:", res.data);
        setAppointmentList([]);
        return;
      }
      
      const normalizedStartTime = startTime.length === 5 ? startTime + ":00" : startTime;
      const normalizedEndTime = endTime.length === 5 ? endTime + ":00" : endTime;
      
      const filteredAppointments = appointments.filter((appointment: Appointment) => {
        return appointment.startTime < normalizedEndTime && normalizedStartTime < appointment.endTime;
      });
      
      setAppointmentList(filteredAppointments);
      
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Không thể tải danh sách lịch hẹn");
      setAppointmentList([]); 
    }
  };



  const fetchDoctors = async () => {
    try {
      const res = await axiosInstance.get("/users/getListDoctor");
      const allDoctors = res.data.results;
      
      if (staffInfo && staffInfo.medicleSpecially && staffInfo.medicleSpecially.length > 0) {
        const filteredDoctors = allDoctors.filter((doctor: Doctor) => {
          if (!doctor.medicleSpecially || doctor.medicleSpecially.length === 0) {
            return false;
          }
          return doctor.medicleSpecially.some((spec) =>
            staffInfo.medicleSpecially.includes(spec)
          );
        });
        setDoctors(filteredDoctors);
      } else {
        const doctorsWithSpecialty = allDoctors.filter((doctor: Doctor) => 
          doctor.medicleSpecially && doctor.medicleSpecially.length > 0
        );
        setDoctors(doctorsWithSpecialty);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Không thể tải danh sách bác sĩ");
    }
  };

  const fetchWeekSchedules = async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(currentWeekStart);
      const schedulesData: DaySchedule[] = weekDates.map((date: string) => ({
        date,
        dayName: getDayName(date),
        schedules: []
      }));

      await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const res = await axiosInstance.get(`/schedule/${doctor.id}`);
            const schedules = res.data.results || [];
            
            // Debug log
            
            schedules.forEach((schedule: Schedule) => {
              console.log('Processing schedule:', schedule); // Debug each schedule
              const dayIndex = weekDates.indexOf(schedule.workDate);
              if (dayIndex !== -1) {
                const scheduleWithDoctor = {
                  ...schedule,
                  doctorName: doctor.username,
                  doctorId: doctor.id
                };
                console.log('Adding to day:', scheduleWithDoctor); // Debug what's being added
                schedulesData[dayIndex].schedules.push(scheduleWithDoctor);
              }
            });
          } catch (error) {
            console.error(`Error fetching schedule for doctor ${doctor.username}:`, error);
          }
        })
      );

      schedulesData.forEach(day => {
        day.schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      setWeekSchedules(schedulesData);
    } catch (error) {
      console.error("Error fetching week schedules:", error);
      toast.error("Không thể tải lịch tuần");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (date: string) => {
    setSelectedDate(date);
    setScheduleForm({ doctorId: "", startTime: "", endTime: "" });
    setShowAddModal(true);
  };

  // New function to open edit modal
  const handleOpenEditModal = (schedule: Schedule & { doctorName: string; doctorId: string }) => {
    setSelectedSchedule(schedule);
    setEditScheduleForm({
      workDate: schedule.workDate,
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
    });
    // set selected date and load appointments for this doctor/date
    // IMPORTANT: Load appointments trong OLD time range để biết appointments nào sẽ bị ảnh hưởng
    setSelectedDate(schedule.workDate);
    fetchAppointmentList(schedule.doctorId, schedule.workDate, schedule.startTime, schedule.endTime);
    setShowEditModal(true);
  };

  const handleAddSchedule = async () => {
    if (!scheduleForm.doctorId || !scheduleForm.startTime || !scheduleForm.endTime) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (scheduleForm.startTime >= scheduleForm.endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }

    try {
      await axiosInstance.post(`/schedule/${scheduleForm.doctorId}`, {
        workDate: selectedDate,
        startTime: scheduleForm.startTime + ":00",
        endTime: scheduleForm.endTime + ":00"
      });

      toast.success("Thêm lịch làm việc thành công!");
      setShowAddModal(false);
      fetchWeekSchedules();
    } catch (error: any) {
      console.error("Error adding schedule:", error);
      toast.error(error.response?.data?.message || "Không thể thêm lịch làm việc");
    }
  };

  // New function to handle edit schedule
  const handleEditSchedule = async () => {
    if (!editScheduleForm.workDate || !editScheduleForm.startTime || !editScheduleForm.endTime) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (editScheduleForm.startTime >= editScheduleForm.endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }

    if (!selectedSchedule || !selectedSchedule.id) {
      toast.error("Không tìm thấy lịch cần sửa!");
      return;
    }

    // Check if there are affected appointments and show warning
    if (appointmentList.length > 0) {
      const confirmMessage = `⚠️ CÓ ${appointmentList.length} LỊCH HẸN SẼ BỊ ẢNH HƯỞNG!\n\n` +
        `Khi bạn thay đổi lịch làm việc này, các bệnh nhân sau sẽ bị HỦY bác sĩ:\n\n` +
        appointmentList.map((apt, idx) => 
          `${idx + 1}. ${apt.patientName} - ${apt.startTime.substring(0, 5)}-${apt.endTime.substring(0, 5)}`
        ).join('\n') +
        `\n\nHệ thống sẽ:\n` +
        `✅ Gửi email thông báo cho bệnh nhân\n` +
        `✅ Cho phép họ chọn bác sĩ khác hoặc hoàn tiền\n` +
        `✅ Tự động tìm bác sĩ thay thế nếu có\n\n` +
        `Bạn có chắc chắn muốn tiếp tục?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await axiosInstance.patch(`/schedule/${selectedSchedule.id}`, {
        workDate: editScheduleForm.workDate,
        startTime: editScheduleForm.startTime + ":00",
        endTime: editScheduleForm.endTime + ":00"
      });

      if (appointmentList.length > 0) {
        toast.success(`Cập nhật lịch thành công! Đã gửi email thông báo tới ${appointmentList.length} bệnh nhân.`);
      } else {
        toast.success("Cập nhật lịch làm việc thành công!");
      }
      
      setShowEditModal(false);
      setAppointmentList([]);
      fetchWeekSchedules();
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật lịch làm việc");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, schedule?: Schedule & { doctorName: string; doctorId: string }) => {
    // Nếu có schedule info, check appointments trước
    if (schedule) {
      try {
        const res = await axiosInstance.get(`/appointments/doctor/${schedule.doctorId}/date/${schedule.workDate}`);
        const appointments = res.data?.results || res.data || [];
        
        if (Array.isArray(appointments) && appointments.length > 0) {
          const normalizedStartTime = schedule.startTime.length === 5 ? schedule.startTime + ":00" : schedule.startTime;
          const normalizedEndTime = schedule.endTime.length === 5 ? schedule.endTime + ":00" : schedule.endTime;
          
          const affectedAppointments = appointments.filter((apt: Appointment) => {
            return apt.startTime < normalizedEndTime && normalizedStartTime < apt.endTime;
          });

          if (affectedAppointments.length > 0) {
            const confirmMessage = `⚠️ CÓ ${affectedAppointments.length} LỊCH HẸN SẼ BỊ ẢNH HƯỞNG!\n\n` +
              `Khi bạn XÓA lịch làm việc này, các bệnh nhân sau sẽ bị HỦY bác sĩ:\n\n` +
              affectedAppointments.map((apt: Appointment, idx: number) => 
                `${idx + 1}. ${apt.patientName} - ${apt.startTime.substring(0, 5)}-${apt.endTime.substring(0, 5)}`
              ).join('\n') +
              `\n\nHệ thống sẽ:\n` +
              `✅ Gửi email thông báo cho bệnh nhân\n` +
              `✅ Cho phép họ chọn bác sĩ khác hoặc hoàn tiền\n\n` +
              `Bạn có chắc chắn muốn XÓA lịch này?`;

            if (!window.confirm(confirmMessage)) {
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking appointments:", error);
        // Continue with deletion even if check fails
      }
    }

    // Final confirmation
    if (!window.confirm("Xác nhận lần cuối: Bạn có chắc muốn xóa lịch này?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/schedule/${scheduleId}`);
      toast.success("Xóa lịch thành công!");
      fetchWeekSchedules();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error(error.response?.data?.message || "Không thể xóa lịch");
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  const getWeekLabel = () => {
    const weekDates = getWeekDates(currentWeekStart);
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];
    
    const [yearFirst, monthFirst, dayFirst] = firstDate.split('-');
    const [, monthLast, dayLast] = lastDate.split('-');
    
    if (monthFirst === monthLast) {
      return `${dayFirst}-${dayLast}/${monthFirst}/${yearFirst}`;
    }
    return `${dayFirst}/${monthFirst} - ${dayLast}/${monthLast}/${yearFirst}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lịch tuần bác sĩ</h2>
          {staffInfo && staffInfo.medicleSpecially && staffInfo.medicleSpecially.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Chuyên khoa: {staffInfo.medicleSpecially.map(spec => 
                MEDICAL_SPECIALTY_LABELS[spec as keyof typeof MEDICAL_SPECIALTY_LABELS] || spec
              ).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tuần trước
          </button>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">{getWeekLabel()}</h3>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-indigo-600 hover:text-indigo-700 mt-1"
            >
              Về tuần hiện tại
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            Tuần sau
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Week Calendar */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekSchedules.map((day) => {
            const isToday = day.date === new Date().toISOString().split('T')[0];
            // Fix isPast logic
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayDate = new Date(day.date + 'T00:00:00');
            const isPast = dayDate < today;

            return (
              <div
                key={day.date}
                className={`bg-white rounded-lg border-2 min-h-[400px] flex flex-col ${
                  isToday ? 'border-indigo-500 shadow-lg' : 'border-gray-200'
                } ${isPast ? 'opacity-60' : ''}`}
              >
                {/* Day Header */}
                <div className={`p-3 border-b ${isToday ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600">{day.dayName}</div>
                    <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {formatDate(day.date)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal(day.date)}
                    disabled={isPast}
                    className={`w-full mt-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isPast
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    + Thêm lịch
                  </button>
                </div>

                {/* Schedules List */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {day.schedules.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                      Chưa có lịch
                    </div>
                  ) : (
                    day.schedules.map((schedule, idx) => {
                      return (
                      <div
                        key={schedule.id ?? `${day.date}-${idx}`}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200 hover:shadow-md transition-shadow group relative"
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <svg className="w-3 h-3 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-xs font-semibold text-gray-900 truncate">
                                {schedule.doctorName}
                              </span>
                            </div>
                          </div>
                          {/* Show edit/delete buttons if has ID and not past date */}
                          {schedule.id && !isPast && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEditModal(schedule);
                              }}
                              className="p-1.5 rounded hover:bg-blue-100 transition-colors bg-blue-50 cursor-pointer"
                              title="Sửa lịch"
                            >
                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteSchedule(schedule.id!, schedule);
                              }}
                              className="p-1.5 rounded hover:bg-red-100 transition-colors bg-red-50 cursor-pointer"
                              title="Xóa lịch"
                            >
                              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          )}


                        </div>
                        <div className="flex items-center gap-1 text-xs text-indigo-700 bg-white rounded px-2 py-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Thêm lịch làm việc</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ngày: {getDayName(selectedDate)}, {formatDate(selectedDate)}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn bác sĩ <span className="text-red-500">*</span>
                </label>
                <select
                  value={scheduleForm.doctorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, doctorId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      BS. {doctor.username}
                      {doctor.medicleSpecially && doctor.medicleSpecially.length > 0 && 
                        ` - ${doctor.medicleSpecially.map(s => 
                          MEDICAL_SPECIALTY_LABELS[s as keyof typeof MEDICAL_SPECIALTY_LABELS] || s
                        ).join(', ')}`
                      }
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddSchedule}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Thêm lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
{showEditModal && selectedSchedule && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl max-h-[90vh] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Sửa lịch làm việc</h3>
            <p className="text-sm text-gray-600 mt-1">
              BS. {selectedSchedule.doctorName} - {getDayName(selectedDate)}, {formatDate(selectedDate)}
            </p>
          </div>
          <button
            onClick={() => setShowEditModal(false)}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Split Layout: Form + Appointments */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Edit Form */}
        <div className="w-1/2 p-6 space-y-4 overflow-y-auto border-r border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày làm việc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={editScheduleForm.workDate}
              onChange={(e) => {
                setEditScheduleForm({ ...editScheduleForm, workDate: e.target.value });
                // REMOVED: Don't refetch when changing date
                // We keep showing OLD schedule's appointments
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={editScheduleForm.startTime}
              onChange={(e) => {
                setEditScheduleForm({ ...editScheduleForm, startTime: e.target.value });
                // REMOVED: Don't refetch when changing time
                // We keep showing OLD schedule's appointments to see which will be affected
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={editScheduleForm.endTime}
              onChange={(e) => {
                setEditScheduleForm({ ...editScheduleForm, endTime: e.target.value });
                // REMOVED: Don't refetch when changing time
                // We keep showing OLD schedule's appointments
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Lưu ý khi sửa lịch:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Danh sách bên phải hiển thị lịch hẹn trong <strong>khoảng thời gian CŨ</strong></li>
                  <li>Khi thay đổi thời gian, các appointment NGOÀI khoảng mới sẽ bị ảnh hưởng</li>
                  <li>Hệ thống sẽ tự động gửi email cho bệnh nhân bị ảnh hưởng</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Appointments List */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">
                Lịch hẹn trong lịch CŨ
              </h4>
              <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {appointmentList.length} lịch hẹn
              </span>
            </div>
            {selectedSchedule && (
              <p className="text-xs text-gray-600 mt-1">
                <strong>Thời gian CŨ:</strong> {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}
              </p>
            )}
            <p className="text-xs text-orange-600 mt-1 font-medium">
              ⚠️ Tất cả appointments này sẽ bị unassign nếu NGOÀI khoảng thời gian MỚI
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {appointmentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Không có lịch hẹn nào</p>
                <p className="text-xs mt-1">Trong khoảng thời gian này</p>
              </div>
            ) : (
              appointmentList.map((appointment: Appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Appointment Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {appointment.status === 'CONFIRMED' ? 'Đã xác nhận' :
                       appointment.status === 'PENDING' ? 'Chờ xác nhận' :
                       appointment.status === 'CANCELLED' ? 'Đã hủy' :
                       appointment.status}
                    </span>
                    <span className="text-xs text-gray-500">#{appointment.id.slice(0, 8)}</span>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{appointment.patientName}</span>
                    </div>

                    {appointment.patientPhone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm text-gray-600">{appointment.patientPhone}</span>
                      </div>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </span>
                    </div>

                    {/* Medical Examinations */}
                    {appointment.medicalExaminations && appointment.medicalExaminations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Dịch vụ khám:</p>
                        <div className="space-y-1">
                          {appointment.medicalExaminations.map((exam) => (
                            <div key={exam.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{exam.name}</span>
                              <span className="font-medium text-gray-900">
                                {exam.price.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Appointments */}
                    {appointment.serviceAppointments && appointment.serviceAppointments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Lịch dịch vụ:</p>
                        <div className="space-y-1">
                          {appointment.serviceAppointments.map((service) => (
                            <div key={service.id} className="text-xs bg-purple-50 px-2 py-1 rounded">
                              {formatTime(service.startTime)} - {formatTime(service.endTime)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200">
        {/* Warning Banner if has appointments */}
        {appointmentList.length > 0 && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ Có {appointmentList.length} lịch hẹn sẽ bị ảnh hưởng!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Khi bạn cập nhật lịch này, hệ thống sẽ tự động gửi email thông báo cho {appointmentList.length} bệnh nhân 
                  và cho phép họ chọn bác sĩ khác hoặc hoàn tiền.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={() => {
              setShowEditModal(false);
              setAppointmentList([]);
            }}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleEditSchedule}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              appointmentList.length > 0 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {appointmentList.length > 0 
              ? `⚠️ Cập nhật và thông báo ${appointmentList.length} bệnh nhân` 
              : 'Cập nhật lịch'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
