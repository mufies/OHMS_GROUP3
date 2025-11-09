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

interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
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

// Helper functions
const formatTime = (timeStr: string): string => {
  return timeStr.substring(0, 5);
};

const formatDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

const getDayName = (dateStr: string): string => {
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const [year, month, day] = dateStr.split("-").map(Number);
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

  // Chỉ lấy 5 ngày từ Thứ 2 đến Thứ 6
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<(Schedule & { doctorName: string; doctorId: string }) | null>(null);
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [daySchedules, setDaySchedules] = useState<(Schedule & { doctorName: string; doctorId: string })[]>([]);



// Thêm function để fetch schedules của ngày cụ thể
const fetchDaySchedules = async (date: string) => {
  try {
    const schedulesForDate: (Schedule & { doctorName: string; doctorId: string })[] = [];
    
    await Promise.all(
      doctors.map(async (doctor) => {
        try {
          const res = await axiosInstance.get(`/schedule/${doctor.id}`);
          const schedules = res.data.results || [];
          
          schedules.forEach((schedule: Schedule) => {
            if (schedule.workDate === date) {
              schedulesForDate.push({
                ...schedule,
                doctorName: doctor.username,
                doctorId: doctor.id,
              });
            }
          });
        } catch (error) {
          console.error(`Error fetching schedule for doctor ${doctor.username}:`, error);
        }
      })
    );
    
    // Sort theo startTime
    schedulesForDate.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setDaySchedules(schedulesForDate);
  } catch (error) {
    console.error("Error fetching day schedules:", error);
  }
};

// Cập nhật handleOpenAddModal
const handleOpenAddModal = (date: string) => {
  setSelectedDate(date);
  setScheduleForm({ doctorId: "", startTime: "", endTime: "" });
  setAppointmentList([]);
  setDaySchedules([]); // Reset
  fetchDaySchedules(date); // Fetch schedules của ngày này
  setShowAddModal(true);
};


  // States cho unassigned appointments
  const [appointmentsByDate, setAppointmentsByDate] = useState<{
    [date: string]: Appointment[];
  }>({});
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [selectedUnassignedDate, setSelectedUnassignedDate] = useState<string>("");
  
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    scheduleId: string;
    schedule?: Schedule & { doctorName: string; doctorId: string };
    affectedAppointments: Appointment[];
  } | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    doctorId: "",
    startTime: "",
    endTime: "",
  });

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
      checkFutureWeekAppointments();
    }
  }, [doctors, currentWeekStart]);

  // Fetch appointments chưa có doctor (doctorId = null) trong khoảng thời gian
  const fetchAppointmentsNeedSchedule = async (startDate: string, endDate: string) => {
    try {
      // Lấy tất cả appointments trong khoảng ngày
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allAppointments: Appointment[] = [];

      // Fetch appointments cho từng ngày trong khoảng thời gian
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        try {
          const res = await axiosInstance.get(`/appointments/date/${dateStr}`);
          const dayAppointments: Appointment[] = res.data || [];
          
          // Lọc những appointment chưa có doctor HOẶC có doctor nhưng doctor chưa có schedule
          // Cần check xem doctor đã có schedule trong ngày đó chưa
          const unassignedAppointments = dayAppointments.filter(apt => {
            // Nếu chưa có doctor thì chắc chắn cần schedule
            if (apt.doctorId === null || apt.doctorId === undefined) {
              return true;
            }

            return false;
          });
          
          allAppointments.push(...unassignedAppointments);
        } catch (error) {
          console.error(`Error fetching appointments for ${dateStr}:`, error);
        }
      }

      return allAppointments;
    } catch (error) {
      console.error("Error in fetchAppointmentsNeedSchedule:", error);
      return [];
    }
  };

  // Check nếu xem tuần tới, hiển thị banner appointments cần assign
  const checkFutureWeekAppointments = async () => {
    const weekDates = getWeekDates(currentWeekStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(weekDates[0] + "T00:00:00");
    const isFutureWeek = weekStart > today;

    if (isFutureWeek) {
      try {
        // Lấy tất cả appointments trong tuần
        const allAppointmentsPromises = weekDates.map(async (dateStr) => {
          try {
            const res = await axiosInstance.get(`/appointments/date/${dateStr}`);
            return { date: dateStr, appointments: res.data || [] };
          } catch (error) {
            console.error(`Error fetching appointments for ${dateStr}:`, error);
            return { date: dateStr, appointments: [] };
          }
        });

        const allAppointmentsData = await Promise.all(allAppointmentsPromises);

        // Lấy tất cả schedules trong tuần
        const allSchedulesPromises = doctors.map(async (doctor) => {
          try {
            const res = await axiosInstance.get(`/schedule/${doctor.id}`);
            const schedules = res.data.results || [];
            return schedules.filter((sch: Schedule) => weekDates.includes(sch.workDate));
          } catch (error) {
            console.error(`Error fetching schedule for doctor ${doctor.username}:`, error);
            return [];
          }
        });

        const allSchedulesData = await Promise.all(allSchedulesPromises);
        const allSchedules = allSchedulesData.flat();

        // Nhóm schedules theo ngày
        const schedulesByDate: { [date: string]: Schedule[] } = {};
        allSchedules.forEach((schedule: Schedule) => {
          if (!schedulesByDate[schedule.workDate]) {
            schedulesByDate[schedule.workDate] = [];
          }
          schedulesByDate[schedule.workDate].push(schedule);
        });

        // Nhóm appointments chưa được assign theo ngày
        const groupedByDate: { [date: string]: Appointment[] } = {};

        allAppointmentsData.forEach(({ date, appointments }) => {
          const daySchedules = schedulesByDate[date] || [];
          
          // Lọc appointments cần assign
          const unassignedAppointments = appointments.filter((apt: Appointment) => {
            // Bỏ qua nếu có parentAppointmentId
            if (apt.parentAppointmentId !== null && apt.parentAppointmentId !== undefined) {
              return false;
            }

            // Kiểm tra xem appointment có nằm trong bất kỳ schedule nào không
            const isInSchedule = daySchedules.some((schedule: Schedule) => {
              return (
                apt.startTime < schedule.endTime && 
                schedule.startTime < apt.endTime
              );
            });

            // Chỉ hiện những appointment KHÔNG nằm trong schedule
            return !isInSchedule;
          });

          if (unassignedAppointments.length > 0) {
            groupedByDate[date] = unassignedAppointments;
          }
        });

        setAppointmentsByDate(groupedByDate);
      } catch (error) {
        console.error("Error in checkFutureWeekAppointments:", error);
        setAppointmentsByDate({});
      }
    } else {
      setAppointmentsByDate({});
    }
  };

  const fetchAppointmentList = async (
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => {
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
        return (
          appointment.startTime < normalizedEndTime && normalizedStartTime < appointment.endTime
        );
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
        const doctorsWithSpecialty = allDoctors.filter(
          (doctor: Doctor) => doctor.medicleSpecially && doctor.medicleSpecially.length > 0
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
        schedules: [],
      }));

      await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const res = await axiosInstance.get(`/schedule/${doctor.id}`);
            const schedules = res.data.results || [];

            schedules.forEach((schedule: Schedule) => {
              const dayIndex = weekDates.indexOf(schedule.workDate);
              if (dayIndex !== -1) {
                const scheduleWithDoctor = {
                  ...schedule,
                  doctorName: doctor.username,
                  doctorId: doctor.id,
                };
                schedulesData[dayIndex].schedules.push(scheduleWithDoctor);
              }
            });
          } catch (error) {
            console.error(
              `Error fetching schedule for doctor ${doctor.username}:`,
              error
            );
          }
        })
      );

      schedulesData.forEach((day) => {
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

  // const handleOpenAddModal = (date: string) => {
  //   setSelectedDate(date);
  //   setScheduleForm({ doctorId: "", startTime: "", endTime: "" });
  //   setAppointmentList([]);
  //   setShowAddModal(true);
  // };

const handleOpenEditModal = (
  schedule: Schedule & { doctorName: string; doctorId: string }
) => {
  setSelectedSchedule(schedule);
  setEditScheduleForm({
    workDate: schedule.workDate,
    startTime: formatTime(schedule.startTime),
    endTime: formatTime(schedule.endTime),
  });
  setSelectedDate(schedule.workDate);
  fetchDaySchedules(schedule.workDate); // THÊM DÒNG NÀY
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

    const selectedDaySchedules = weekSchedules.find(day => day.date === selectedDate);
    if (selectedDaySchedules) {
      const doctorSchedulesOnDay = selectedDaySchedules.schedules.filter(
        schedule => schedule.doctorId === scheduleForm.doctorId
      );

      const newStartTime = scheduleForm.startTime + ":00";
      const newEndTime = scheduleForm.endTime + ":00";

      for (const existingSchedule of doctorSchedulesOnDay) {
        const existingStart = existingSchedule.startTime.length === 5 
          ? existingSchedule.startTime + ":00" 
          : existingSchedule.startTime;
        const existingEnd = existingSchedule.endTime.length === 5 
          ? existingSchedule.endTime + ":00" 
          : existingSchedule.endTime;

        // Check time overlap: (StartA < EndB) and (StartB < EndA)
        if (newStartTime < existingEnd && existingStart < newEndTime) {
          const doctorName = existingSchedule.doctorName;
          toast.error(
            `⚠️ Trùng giờ làm việc! BS. ${doctorName} đã có lịch từ ${formatTime(existingStart)} - ${formatTime(existingEnd)}`
          );
          return;
        }
      }
    }

    try {
      await axiosInstance.post(`/schedule/${scheduleForm.doctorId}`, {
        workDate: selectedDate,
        startTime: scheduleForm.startTime + ":00",
        endTime: scheduleForm.endTime + ":00",
      });

      toast.success("Thêm lịch làm việc thành công!");
      setShowAddModal(false);
      fetchWeekSchedules();
      checkFutureWeekAppointments();
    } catch (error: any) {
      console.error("Error adding schedule:", error);
      toast.error(error.response?.data?.message || "Không thể thêm lịch làm việc");
    }
  };

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


    try {
      await axiosInstance.patch(`/schedule/${selectedSchedule.id}`, {
        workDate: editScheduleForm.workDate,
        startTime: editScheduleForm.startTime + ":00",
        endTime: editScheduleForm.endTime + ":00",
      });

      if (appointmentList.length > 0) {
        toast.success(
          `Cập nhật lịch thành công! Đã gửi email thông báo tới ${appointmentList.length} bệnh nhân.`
        );
      } else {
        toast.success("Cập nhật lịch làm việc thành công!");
      }

      setShowEditModal(false);
      setAppointmentList([]);
      fetchWeekSchedules();
      checkFutureWeekAppointments();
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật lịch làm việc");
    }
  };

  const handleDeleteSchedule = async (
    scheduleId: string,
    schedule?: Schedule & { doctorName: string; doctorId: string }
  ) => {
    if (schedule) {
      try {
        const res = await axiosInstance.get(
          `/appointments/doctor/${schedule.doctorId}/date/${schedule.workDate}`
        );
        const appointments = res.data?.results || res.data || [];

        if (Array.isArray(appointments) && appointments.length > 0) {
          const normalizedStartTime =
            schedule.startTime.length === 5 ? schedule.startTime + ":00" : schedule.startTime;
          const normalizedEndTime =
            schedule.endTime.length === 5 ? schedule.endTime + ":00" : schedule.endTime;

          const affectedAppointments = appointments.filter((apt: Appointment) => {
            return apt.startTime < normalizedEndTime && normalizedStartTime < apt.endTime;
          });

          // Hiển thị modal xác nhận với danh sách appointments bị ảnh hưởng
          setScheduleToDelete({
            scheduleId,
            schedule,
            affectedAppointments,
          });
          setShowDeleteConfirmModal(true);
          return;
        }
      } catch (error) {
        console.error("Error checking appointments:", error);
      }
    }

    // Nếu không có appointments bị ảnh hưởng, hiển thị modal xác nhận đơn giản
    setScheduleToDelete({
      scheduleId,
      schedule,
      affectedAppointments: [],
    });
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    try {
      await axiosInstance.delete(`/schedule/${scheduleToDelete.scheduleId}`);
      toast.success("Xóa lịch thành công!");
      setShowDeleteConfirmModal(false);
      setScheduleToDelete(null);
      fetchWeekSchedules();
      checkFutureWeekAppointments();
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
  const lastDate = weekDates[4]; // Thay đổi từ [6] thành [4]

  const [yearFirst, monthFirst, dayFirst] = firstDate.split("-");
  const [, monthLast, dayLast] = lastDate.split("-");

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
              Chuyên khoa:{" "}
              {staffInfo.medicleSpecially
                .map(
                  (spec) =>
                    MEDICAL_SPECIALTY_LABELS[
                      spec as keyof typeof MEDICAL_SPECIALTY_LABELS
                    ] || spec
                )
                .join(", ")}
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
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
        <div className="grid grid-cols-5 gap-3">
          {weekSchedules.map((day) => {
            const isToday = day.date === new Date().toISOString().split("T")[0];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayDate = new Date(day.date + "T00:00:00");
            const isPast = dayDate < today;
            const unassignedCount = appointmentsByDate[day.date]?.length || 0;

            return (
              <div
                key={day.date}
                className={`bg-white rounded-lg border-2 min-h-[400px] flex flex-col ${
                  isToday ? "border-indigo-500 shadow-lg" : "border-gray-200"
                } ${isPast ? "opacity-60" : ""}`}
              >
                {/* Day Header */}
                <div className={`p-3 border-b ${isToday ? "bg-indigo-50" : "bg-gray-50"}`}>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600">{day.dayName}</div>
                    <div
                      className={`text-lg font-bold ${
                        isToday ? "text-indigo-600" : "text-gray-900"
                      }`}
                    >
                      {formatDate(day.date)}
                    </div>
                  </div>
                  
                  {unassignedCount > 0 && !isPast && (
                    <div 
                      onClick={() => {
                        setSelectedUnassignedDate(day.date);
                        setShowUnassignedModal(true);
                      }}
                      className="mt-2 mb-2 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-md px-2 py-2 cursor-pointer hover:from-orange-500 hover:to-red-600 transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold">{unassignedCount} lịch hẹn</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-medium opacity-90">Cần tạo schedule</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleOpenAddModal(day.date)}
                    disabled={isPast}
                    className={`w-full mt-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isPast
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
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
                    day.schedules.map((schedule, idx) => (
                      <div
                        key={schedule.id ?? `${day.date}-${idx}`}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200 hover:shadow-md transition-shadow group relative"
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <svg
                                className="w-3 h-3 text-indigo-600 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-gray-900 truncate">
                                {schedule.doctorName}
                              </span>
                            </div>
                          </div>
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
                                <svg
                                  className="w-3.5 h-3.5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
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
                                <svg
                                  className="w-3.5 h-3.5 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-indigo-700 bg-white rounded px-2 py-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

{showAddModal && (() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const isFutureDate = selectedDateObj > today;
  const daysUntil = Math.ceil(
    (selectedDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Thêm lịch làm việc</h3>
              <p className="text-sm text-gray-600 mt-1">
                Ngày: {getDayName(selectedDate)}, {formatDate(selectedDate)}
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddModal(false);
                setAppointmentList([]);
                setDaySchedules([]);
              }}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {isFutureDate && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">
                   Đang assign lịch cho tương lai
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Ngày này còn <strong>{daysUntil} ngày</strong> nữa. Bạn đang assign lịch
                  trước cho bác sĩ. 
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Layout: Form + Schedules + Appointments */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Form (30%) */}
          <div className="w-[30%] p-6 space-y-4 overflow-y-auto border-r border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn bác sĩ <span className="text-red-500">*</span>
              </label>
              <select
                value={scheduleForm.doctorId}
                onChange={(e) => {
                  const newDoctorId = e.target.value;
                  setScheduleForm({ ...scheduleForm, doctorId: newDoctorId });
                  
                  if (newDoctorId && selectedDate) {
                    fetchAppointmentList(newDoctorId, selectedDate, "00:00", "23:59");
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    BS. {doctor.username}
                    {doctor.medicleSpecially && doctor.medicleSpecially.length > 0 &&
                      ` - ${doctor.medicleSpecially
                        .map((s) => MEDICAL_SPECIALTY_LABELS[s as keyof typeof MEDICAL_SPECIALTY_LABELS] || s)
                        .join(", ")}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Calculate Time Button */}
            {scheduleForm.doctorId && appointmentList.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const times = appointmentList.map(apt => ({
                      start: apt.startTime,
                      end: apt.endTime
                    }));
                    
                    const allStartTimes = times.map(t => t.start).sort();
                    const allEndTimes = times.map(t => t.end).sort();
                    
                    const earliestStart = allStartTimes[0];
                    const latestEnd = allEndTimes[allEndTimes.length - 1];
                    
                    const startTime = earliestStart.substring(0, 5);
                    const endTime = latestEnd.substring(0, 5);
                    
                    setScheduleForm({
                      ...scheduleForm,
                      startTime,
                      endTime
                    });
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>⚡ Tự động ({appointmentList.length} lịch hẹn)</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={scheduleForm.startTime}
                onChange={(e) => {
                  setScheduleForm({ ...scheduleForm, startTime: e.target.value });
                }}
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
                onChange={(e) => {
                  setScheduleForm({ ...scheduleForm, endTime: e.target.value });
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-indigo-800">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Xem lịch đã assign bên giữa</li>
                    <li>Chọn bác sĩ xem lịch hẹn bên phải</li>
                    <li>Click lịch hẹn tự động set giờ</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[35%] bg-purple-50 flex flex-col border-r border-gray-200">
            <div className="px-6 py-4 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-indigo-100 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">📅 Lịch đã assign trong ngày</h4>
                <span className="text-xs font-medium px-2.5 py-1 bg-purple-600 text-white rounded-full">
                  {daySchedules.length} lịch
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Tất cả bác sĩ đã được phân lịch ngày này
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {daySchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs font-medium">Chưa có lịch nào</p>
                  <p className="text-xs mt-1">Ngày này chưa assign bác sĩ</p>
                </div>
              ) : (
                daySchedules.map((schedule, idx) => {
                  // Kiểm tra conflict chỉ dựa trên thời gian (bất kể bác sĩ nào)
                  const hasConflict =
                    scheduleForm.startTime &&
                    scheduleForm.endTime &&
                    schedule.startTime < scheduleForm.endTime + ":00" &&
                    scheduleForm.startTime + ":00" < schedule.endTime;

                  return (
                    <div
                      key={schedule.id ?? `schedule-${idx}`}
                      className={`rounded-lg border p-3 transition-all ${
                        hasConflict
                          ? "bg-red-100 border-red-400 ring-2 ring-red-300"
                          : "bg-white border-purple-200 hover:border-purple-400"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-900 truncate">
                            BS. {schedule.doctorName}
                          </span>
                        </div>
                        {hasConflict && (
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-1.5 text-xs rounded px-2 py-1.5 ${
                        hasConflict ? "bg-red-200 text-red-900 font-bold" : "bg-purple-100 text-purple-800"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </span>
                      </div>

                      {hasConflict && (
                        <div className="mt-2 text-xs text-red-700 font-semibold flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          ⚠️ Trùng giờ với BS. {schedule.doctorName}! Chọn giờ khác
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Appointments (35%) */}
          <div className="w-[35%] bg-gray-50 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {!scheduleForm.doctorId ? "Lịch hẹn" : "Lịch hẹn bác sĩ"}
                </h4>
                <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  {appointmentList.length} lịch
                </span>
              </div>

              {scheduleForm.doctorId && (
                <p className="text-xs text-gray-600">
                  <strong>Bác sĩ:</strong> {doctors.find(d => d.id === scheduleForm.doctorId)?.username}
                </p>
              )}

              {scheduleForm.doctorId && scheduleForm.startTime && scheduleForm.endTime && (
                <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="text-xs text-orange-800">
                    <strong>🎯 Khung giờ schedule:</strong> {scheduleForm.startTime} - {scheduleForm.endTime}
                  </p>
                </div>
              )}

              {appointmentList.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  💡 Click lịch hẹn để tự động set giờ
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!scheduleForm.doctorId ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-xs font-medium">Chưa chọn bác sĩ</p>
                  <p className="text-xs mt-1">Chọn bác sĩ để xem lịch hẹn</p>
                </div>
              ) : appointmentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium">Ngày trống</p>
                  <p className="text-xs mt-1">Chưa có lịch hẹn</p>
                </div>
              ) : (
                appointmentList.map((appointment: Appointment) => {
                  const isConflict =
                    scheduleForm.startTime &&
                    scheduleForm.endTime &&
                    appointment.startTime < scheduleForm.endTime + ":00" &&
                    scheduleForm.startTime + ":00" < appointment.endTime;

                  return (
                    <div
                      key={appointment.id}
                      onClick={() => {
                        const startTime = formatTime(appointment.startTime);
                        const endTime = formatTime(appointment.endTime);
                        setScheduleForm({
                          ...scheduleForm,
                          startTime,
                          endTime,
                        });
                      }}
                      className={`rounded-lg border p-3 hover:shadow-md transition-all cursor-pointer text-xs ${
                        isConflict
                          ? "bg-green-50 border-green-300 ring-2 ring-green-200"
                          : "bg-white border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isConflict
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {isConflict ? "✅ Khớp" : appointment.status === "CONFIRMED" ? "✅" : "⏳"}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">{appointment.patientName}</div>
                        <div className={`font-semibold ${isConflict ? "text-green-600" : "text-gray-600"}`}>
                          ⏰ {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                        {appointment.patientPhone && (
                          <div className="text-gray-600">📞 {appointment.patientPhone}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => {
              setShowAddModal(false);
              setAppointmentList([]);
              setDaySchedules([]);
            }}
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
  );
})()}


      {showEditModal && selectedSchedule && (() => {
        const otherSchedulesOnDay = daySchedules.filter(s => s.id !== selectedSchedule.id);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Sửa lịch làm việc</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      BS. {selectedSchedule.doctorName} - {getDayName(selectedDate)},{" "}
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Edit Form (30%) */}
                <div className="w-[30%] p-6 space-y-4 overflow-y-auto border-r border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày làm việc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={editScheduleForm.workDate}
                      onChange={(e) => {
                        setEditScheduleForm({
                          ...editScheduleForm,
                          workDate: e.target.value,
                        });
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
                        setEditScheduleForm({
                          ...editScheduleForm,
                          startTime: e.target.value,
                        });
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
                        setEditScheduleForm({
                          ...editScheduleForm,
                          endTime: e.target.value,
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Lưu ý khi sửa lịch:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Panel giữa: lịch bác sĩ khác trong ngày</li>
                          <li>Panel phải: lịch hẹn của bác sĩ này</li>
                          <li>Hệ thống tự động gửi email cho BN bị ảnh hưởng</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Panel - Other Schedules on Same Day (35%) */}
                <div className="w-[35%] bg-purple-50 flex flex-col border-r border-gray-200">
                  <div className="px-6 py-4 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-indigo-100 sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">📅 Lịch bác sĩ khác trong ngày</h4>
                      <span className="text-xs font-medium px-2.5 py-1 bg-purple-600 text-white rounded-full">
                        {otherSchedulesOnDay.length} lịch
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Kiểm tra trùng giờ với các bác sĩ khác
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {otherSchedulesOnDay.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-medium">Chưa có bác sĩ khác</p>
                        <p className="text-xs mt-1">Ngày này chỉ có bác sĩ đang sửa</p>
                      </div>
                    ) : (
                      otherSchedulesOnDay.map((schedule, idx) => {
                        // Kiểm tra conflict chỉ dựa trên thời gian
                        const hasConflict =
                          editScheduleForm.startTime &&
                          editScheduleForm.endTime &&
                          schedule.startTime < editScheduleForm.endTime + ":00" &&
                          editScheduleForm.startTime + ":00" < schedule.endTime;

                        return (
                          <div
                            key={schedule.id ?? `schedule-${idx}`}
                            className={`rounded-lg border p-3 transition-all ${
                              hasConflict
                                ? "bg-red-100 border-red-400 ring-2 ring-red-300"
                                : "bg-white border-purple-200 hover:border-purple-400"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-xs font-semibold text-gray-900 truncate">
                                  BS. {schedule.doctorName}
                                </span>
                              </div>
                              {hasConflict && (
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            
                            <div className={`flex items-center gap-1.5 text-xs rounded px-2 py-1.5 ${
                              hasConflict ? "bg-red-200 text-red-900 font-bold" : "bg-purple-100 text-purple-800"
                            }`}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </span>
                            </div>

                            {hasConflict && (
                              <div className="mt-2 text-xs text-red-700 font-semibold flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                ⚠️ Trùng giờ với BS. {schedule.doctorName}!
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Panel - Appointments (35%) */}
                <div className="w-[35%] bg-gray-50 flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Lịch hẹn trong lịch CŨ</h4>
                      <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {appointmentList.length} lịch hẹn
                      </span>
                    </div>
                    {selectedSchedule && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Thời gian CŨ:</strong> {formatTime(selectedSchedule.startTime)}{" "}
                        - {formatTime(selectedSchedule.endTime)}
                      </p>
                    )}
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      ⚠️ Tất cả appointments này sẽ bị unassign nếu NGOÀI khoảng thời gian MỚI
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {appointmentList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg
                          className="w-16 h-16 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
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
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                appointment.status === "CONFIRMED"
                                  ? "bg-green-100 text-green-700"
                                  : appointment.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : appointment.status === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {appointment.status === "CONFIRMED"
                                ? "Đã xác nhận"
                                : appointment.status === "PENDING"
                                ? "Chờ xác nhận"
                                : appointment.status === "CANCELLED"
                                ? "Đã hủy"
                                : appointment.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              #{appointment.id.slice(0, 8)}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="text-sm font-medium text-gray-900">
                                {appointment.patientName}
                              </span>
                            </div>

                            {appointment.patientPhone && (
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                <span className="text-sm text-gray-600">
                                  {appointment.patientPhone}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {formatTime(appointment.startTime)} -{" "}
                                {formatTime(appointment.endTime)}
                              </span>
                            </div>

                            {appointment.medicalExaminations &&
                              appointment.medicalExaminations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-500 mb-2">
                                    Dịch vụ khám:
                                  </p>
                                  <div className="space-y-1">
                                    {appointment.medicalExaminations.map((exam) => (
                                      <div
                                        key={exam.id}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-gray-700">{exam.name}</span>
                                        <span className="font-medium text-gray-900">
                                          {exam.price.toLocaleString("vi-VN")}đ
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {appointment.serviceAppointments &&
                              appointment.serviceAppointments.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    Lịch dịch vụ:
                                  </p>
                                  <div className="space-y-1">
                                    {appointment.serviceAppointments.map((service) => (
                                      <div
                                        key={service.id}
                                        className="text-xs bg-purple-50 px-2 py-1 rounded"
                                      >
                                        {formatTime(service.startTime)} -{" "}
                                        {formatTime(service.endTime)}
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

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
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
                  onClick={() => {
                    if (appointmentList.length > 0) {
                      // Hiển thị modal xác nhận nếu có appointments bị ảnh hưởng
                      setShowEditConfirmModal(true);
                    } else {
                      // Cập nhật trực tiếp nếu không có appointments bị ảnh hưởng
                      handleEditSchedule();
                    }
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    appointmentList.length > 0
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {appointmentList.length > 0
                    ? `⚠️ Xem ảnh hưởng (${appointmentList.length} bệnh nhân)`
                    : "Cập nhật lịch"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Confirmation Modal - Hiển thị khi có appointments bị ảnh hưởng */}
      {showEditConfirmModal && appointmentList.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[85vh] flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-5 border-b border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    ⚠️ Cảnh báo: Có {appointmentList.length} lịch hẹn sẽ bị ảnh hưởng!
                  </h3>
                  <p className="text-sm text-gray-700">
                    Khi bạn cập nhật lịch làm việc này, các bệnh nhân sau sẽ bị hủy bác sĩ và cần được assign lại.
                  </p>
                </div>
                <button
                  onClick={() => setShowEditConfirmModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - List of affected appointments */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Danh sách {appointmentList.length} bệnh nhân bị ảnh hưởng:
              </h4>

              <div className="space-y-3">
                {appointmentList.map((appointment, idx) => (
                  <div
                    key={appointment.id}
                    className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900">{appointment.patientName}</span>
                      </div>
                      <span className="text-xs text-gray-500">#{appointment.id.slice(0, 8)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 ml-8">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-orange-700">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                      </div>

                      {appointment.patientPhone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {appointment.patientPhone}
                        </div>
                      )}
                    </div>

                    {appointment.medicalExaminations && appointment.medicalExaminations.length > 0 && (
                      <div className="ml-8 mt-2 pt-2 border-t border-red-200">
                        <p className="text-xs text-gray-600 mb-1">
                          Dịch vụ: {appointment.medicalExaminations.map(e => e.name).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  ← Quay lại chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    setShowEditConfirmModal(false);
                    handleEditSchedule();
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  ✅ Xác nhận cập nhật và gửi thông báo
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Email thông báo sẽ được gửi tự động cho {appointmentList.length} bệnh nhân
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && scheduleToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[85vh] flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="px-6 py-5 border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {scheduleToDelete.affectedAppointments.length > 0 
                      ? `⚠️ Xác nhận xóa lịch (${scheduleToDelete.affectedAppointments.length} bệnh nhân bị ảnh hưởng)`
                      : "🗑️ Xác nhận xóa lịch làm việc"}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {scheduleToDelete.schedule 
                      ? `BS. ${scheduleToDelete.schedule.doctorName} - ${getDayName(scheduleToDelete.schedule.workDate)}, ${formatDate(scheduleToDelete.schedule.workDate)}`
                      : "Bạn có chắc chắn muốn xóa lịch này?"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setScheduleToDelete(null);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {scheduleToDelete.affectedAppointments.length > 0 ? (
                <>
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      ⚠️ Khi xóa lịch này, {scheduleToDelete.affectedAppointments.length} bệnh nhân sẽ bị hủy bác sĩ!
                    </p>
                    <p className="text-xs text-red-700">
                      Hệ thống sẽ tự động gửi email thông báo và cho phép họ chọn bác sĩ khác hoặc yêu cầu hoàn tiền.
                    </p>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-3">
                    Danh sách bệnh nhân bị ảnh hưởng:
                  </h4>

                  <div className="space-y-3">
                    {scheduleToDelete.affectedAppointments.map((appointment, idx) => (
                      <div
                        key={appointment.id}
                        className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-gray-900">{appointment.patientName}</span>
                          </div>
                          <span className="text-xs text-gray-500">#{appointment.id.slice(0, 8)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 ml-8">
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-red-700">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </span>
                          </div>

                          {appointment.patientPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {appointment.patientPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Xóa lịch làm việc này?</p>
                  <p className="text-sm text-gray-600">
                    Không có lịch hẹn nào bị ảnh hưởng. Bạn có thể xóa an toàn.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setScheduleToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  ← Hủy
                </button>
                <button
                  onClick={confirmDeleteSchedule}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                    scheduleToDelete.affectedAppointments.length > 0
                      ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                      : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                  }`}
                >
                  {scheduleToDelete.affectedAppointments.length > 0
                    ? `🗑️ Xác nhận xóa và thông báo ${scheduleToDelete.affectedAppointments.length} bệnh nhân`
                    : "🗑️ Xác nhận xóa lịch"}
                </button>
              </div>
              {scheduleToDelete.affectedAppointments.length > 0 && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Email thông báo sẽ được gửi tự động cho {scheduleToDelete.affectedAppointments.length} bệnh nhân
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
