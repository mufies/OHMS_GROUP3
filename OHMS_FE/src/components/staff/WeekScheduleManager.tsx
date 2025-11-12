import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { MEDICAL_SPECIALTY_LABELS } from "../../constant/medicalSpecialty";
import { scheduleChangeRequestService } from "../../services/scheduleChangeRequestService";

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
  const [scheduleList, setScheduleList] = useState<Array<{
  doctorId: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  }>>([]);



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

  // States cho bulk edit modal
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditSchedules, setBulkEditSchedules] = useState<
    Array<Schedule & { doctorName: string; doctorId: string }>
  >([]);
  const [bulkEditDate, setBulkEditDate] = useState<string>("");
  const [bulkEditAppointments, setBulkEditAppointments] = useState<{
    [doctorId: string]: Appointment[];
  }>({});

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

  // // Fetch appointments chưa có doctor (doctorId = null) trong khoảng thời gian
  // const fetchAppointmentsNeedSchedule = async (startDate: string, endDate: string) => {
  //   try {
  //     // Lấy tất cả appointments trong khoảng ngày
  //     const start = new Date(startDate);
  //     const end = new Date(endDate);
  //     const allAppointments: Appointment[] = [];

  //     // Fetch appointments cho từng ngày trong khoảng thời gian
  //     for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
  //       const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
  //       try {
  //         const res = await axiosInstance.get(`/appointments/date/${dateStr}`);
  //         const dayAppointments: Appointment[] = res.data || [];
          
  //         // Lọc những appointment chưa có doctor HOẶC có doctor nhưng doctor chưa có schedule
  //         // Cần check xem doctor đã có schedule trong ngày đó chưa
  //         const unassignedAppointments = dayAppointments.filter(apt => {
  //           // Nếu chưa có doctor thì chắc chắn cần schedule
  //           if (apt.doctorId === null || apt.doctorId === undefined) {
  //             return true;
  //           }

  //           return false;
  //         });
          
  //         allAppointments.push(...unassignedAppointments);
  //       } catch (error) {
  //         console.error(`Error fetching appointments for ${dateStr}:`, error);
  //       }
  //     }

  //     return allAppointments;
  //   } catch (error) {
  //     console.error("Error in fetchAppointmentsNeedSchedule:", error);
  //     return [];
  //   }
  // };

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

// const handleOpenEditModal = (
//   schedule: Schedule & { doctorName: string; doctorId: string }
// ) => {
//   setSelectedSchedule(schedule);
//   setEditScheduleForm({
//     workDate: schedule.workDate,
//     startTime: formatTime(schedule.startTime),
//     endTime: formatTime(schedule.endTime),
//   });
//   setSelectedDate(schedule.workDate);
//   fetchDaySchedules(schedule.workDate); // THÊM DÒNG NÀY
//   fetchAppointmentList(schedule.doctorId, schedule.workDate, schedule.startTime, schedule.endTime);
//   setShowEditModal(true);
// };

// Handler mở bulk edit modal - sửa tất cả lịch trong ngày
const handleOpenBulkEditModal = async (date: string) => {
  setBulkEditDate(date);
  
  // Fetch tất cả schedules của ngày này
  await fetchDaySchedules(date);
  
  const selectedDaySchedules = weekSchedules.find(day => day.date === date);
  if (selectedDaySchedules && selectedDaySchedules.schedules.length > 0) {
    // Clone schedules để edit
    const schedulesToEdit = selectedDaySchedules.schedules.map(s => ({...s}));
    setBulkEditSchedules(schedulesToEdit);
    
    // Fetch appointments cho tất cả doctors trong ngày này
    const appointmentsMap: { [doctorId: string]: Appointment[] } = {};
    
    for (const schedule of schedulesToEdit) {
      try {
        const res = await axiosInstance.get(`/appointments/doctor/${schedule.doctorId}/date/${date}`);
        const appointments = res.data?.results || res.data || [];
        
        // Filter appointments trong khoảng thời gian schedule
        const normalizedStartTime = schedule.startTime.length === 5 ? schedule.startTime + ":00" : schedule.startTime;
        const normalizedEndTime = schedule.endTime.length === 5 ? schedule.endTime + ":00" : schedule.endTime;
        
        const filteredAppointments = appointments.filter((appointment: Appointment) => {
          return (
            appointment.startTime < normalizedEndTime && normalizedStartTime < appointment.endTime
          );
        });
        
        appointmentsMap[schedule.doctorId] = filteredAppointments;
      } catch (error) {
        console.error(`Error fetching appointments for doctor ${schedule.doctorId}:`, error);
        appointmentsMap[schedule.doctorId] = [];
      }
    }
    
    setBulkEditAppointments(appointmentsMap);
    setShowBulkEditModal(true);
  } else {
    toast.info("Ngày này chưa có lịch nào để sửa!");
  }
};

// Handler thêm lịch vào danh sách (thay vì submit ngay)
const handleAddToScheduleList = () => {
  if (!scheduleForm.doctorId || !scheduleForm.startTime || !scheduleForm.endTime) {
    toast.error("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (scheduleForm.startTime >= scheduleForm.endTime) {
    toast.error("Giờ kết thúc phải sau giờ bắt đầu!");
    return;
  }

  // Kiểm tra doctor đã có trong list chưa
  if (scheduleList.some(s => s.doctorId === scheduleForm.doctorId)) {
    toast.error("Bác sĩ này đã có trong danh sách!");
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

      if (newStartTime < existingEnd && existingStart < newEndTime) {
        const doctorName = existingSchedule.doctorName;
        toast.error(
          `⚠️ Trùng giờ làm việc! BS. ${doctorName} đã có lịch từ ${formatTime(existingStart)} - ${formatTime(existingEnd)}`
        );
        return;
      }
    }
  }

  // Kiểm tra conflict với các lịch đã thêm trong list
  const newStartTime = scheduleForm.startTime + ":00";
  const newEndTime = scheduleForm.endTime + ":00";

  for (const schedule of scheduleList) {
    if (schedule.doctorId === scheduleForm.doctorId) {
      if (newStartTime < schedule.endTime && schedule.startTime < newEndTime) {
        toast.error(`⚠️ Trùng giờ với lịch đã thêm của BS. ${schedule.doctorName}!`);
        return;
      }
    }
  }

  const doctor = doctors.find(d => d.id === scheduleForm.doctorId);
  if (!doctor) return;

  // Thêm vào list
  setScheduleList([...scheduleList, {
    doctorId: scheduleForm.doctorId,
    doctorName: doctor.username,
    startTime: scheduleForm.startTime + ":00",
    endTime: scheduleForm.endTime + ":00",
  }]);

  // Reset form
  setScheduleForm({
    doctorId: "",
    startTime: "",
    endTime: "",
  });

  toast.success(`✅ Đã thêm lịch cho BS. ${doctor.username}`);
};

// Handler xóa khỏi list
const handleRemoveFromList = (doctorId: string) => {
  setScheduleList(scheduleList.filter(s => s.doctorId !== doctorId));
  toast.info("Đã xóa lịch khỏi danh sách");
};

// Handler submit tất cả
const handleSubmitAllSchedules = async () => {
  if (scheduleList.length === 0) {
    toast.error("Vui lòng thêm ít nhất một lịch!");
    return;
  }

  if (!staffInfo || !staffInfo.id) {
    toast.error("Không tìm thấy thông tin staff!");
    return;
  }

  try {
    // Lấy tất cả doctors trong ngày (bao gồm cả doctors đã có lịch + doctors mới thêm)
    const selectedDaySchedules = weekSchedules.find(day => day.date === selectedDate);
    const existingDoctorIds = selectedDaySchedules?.schedules.map(s => s.doctorId) || [];
    const newDoctorIds = scheduleList.map(s => s.doctorId);
    const affectedDoctorIds = Array.from(new Set([...existingDoctorIds, ...newDoctorIds]));

    // Lấy department
    const firstDoctor = doctors.find(d => d.id === scheduleList[0].doctorId);
    const department = firstDoctor?.medicleSpecially?.[0] || staffInfo.medicleSpecially[0];

    // Tạo bulk request
    const requestData = {
      targetDoctorId: scheduleList[0].doctorId,
      changeType: "CREATE" as const,
      dateChange: selectedDate,
      department: department,
      note: `Tạo ${scheduleList.length} lịch mới cho ngày ${selectedDate}`,
      affectedDoctorIds: affectedDoctorIds,
      createdByStaffId: staffInfo.id,
      bulkSchedules: scheduleList.map(s => ({
        doctorId: s.doctorId,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };

    await scheduleChangeRequestService.createBulkRequests(requestData);

    toast.success(
      `✅ Đã tạo ${scheduleList.length} yêu cầu thay đổi lịch! Cần ${affectedDoctorIds.length} bác sĩ phê duyệt.`,
      { autoClose: 5000 }
    );
    toast.info(
      `📧 Email thông báo đã được gửi tới ${affectedDoctorIds.length} bác sĩ để phê duyệt.`,
      { autoClose: 5000 }
    );

    setShowAddModal(false);
    setScheduleList([]);
    setScheduleForm({ doctorId: "", startTime: "", endTime: "" });
    fetchWeekSchedules();
    checkFutureWeekAppointments();
  } catch (error: any) {
    console.error("Error creating bulk schedule requests:", error);
    toast.error(error.response?.data?.message || "Không thể tạo yêu cầu thay đổi lịch");
  }
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

    if (!staffInfo || !staffInfo.id) {
      toast.error("Không tìm thấy thông tin staff!");
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
      // Lấy tất cả doctors trong cùng department có lịch trong ngày này
      const doctorsInDaySchedules = selectedDaySchedules?.schedules.map(s => s.doctorId) || [];
      
      // Lấy thông tin doctor được chọn
      const selectedDoctor = doctors.find(d => d.id === scheduleForm.doctorId);
      const department = selectedDoctor?.medicleSpecially?.[0] || staffInfo.medicleSpecially[0];
      
      // Tạo danh sách affected doctors (tất cả doctors có lịch trong ngày + doctor được chọn)
      const affectedDoctorIds = Array.from(new Set([...doctorsInDaySchedules, scheduleForm.doctorId]));

      // Tạo schedule change request thay vì tạo schedule trực tiếp
      const requestData = {
        targetDoctorId: scheduleForm.doctorId,
        changeType: "CREATE" as const,
        dateChange: selectedDate,
        startTime: scheduleForm.startTime + ":00",
        endTime: scheduleForm.endTime + ":00",
        department: department,
        note: `Tạo lịch mới cho ngày ${selectedDate}`,
        affectedDoctorIds: affectedDoctorIds,
        createdByStaffId: staffInfo.id,
      };

      await scheduleChangeRequestService.createRequest(requestData);

      toast.success(
        `✅ Đã tạo yêu cầu thay đổi lịch! Cần ${affectedDoctorIds.length} bác sĩ phê duyệt.`,
        { autoClose: 5000 }
      );
      toast.info(
        `📧 Email thông báo đã được gửi tới ${affectedDoctorIds.length} bác sĩ để phê duyệt.`,
        { autoClose: 5000 }
      );
      
      setShowAddModal(false);
      fetchWeekSchedules();
      checkFutureWeekAppointments();
    } catch (error: any) {
      console.error("Error creating schedule change request:", error);
      toast.error(error.response?.data?.message || "Không thể tạo yêu cầu thay đổi lịch");
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

  if (!staffInfo || !staffInfo.id) {
    toast.error("Không tìm thấy thông tin staff!");
    return;
  }

  try {
    // Lấy tất cả doctors có lịch trong ngày đang sửa
    const selectedDaySchedules = weekSchedules.find((day) => day.date === editScheduleForm.workDate);
    const doctorsInDaySchedules = selectedDaySchedules?.schedules.map((s) => s.doctorId) || [];

    // Lấy thông tin doctor của schedule đang sửa
    const selectedDoctor = doctors.find((d) => d.id === selectedSchedule.doctorId);
    const department = selectedDoctor?.medicleSpecially?.[0] || staffInfo.medicleSpecially[0];

    const affectedDoctorIds = Array.from(new Set(doctorsInDaySchedules));

    const requestData = {
      targetDoctorId: selectedSchedule.doctorId,
      targetScheduleId: selectedSchedule.id, // ← THÊM FIELD NÀY
      changeType: "UPDATE" as const,
      dateChange: editScheduleForm.workDate,
      startTime: editScheduleForm.startTime + ":00",
      endTime: editScheduleForm.endTime + ":00",
      department: department,
      note: appointmentList.length > 0
        ? `Cập nhật lịch từ ${formatTime(selectedSchedule.startTime)}-${formatTime(selectedSchedule.endTime)} thành ${editScheduleForm.startTime}-${editScheduleForm.endTime}. Có ${appointmentList.length} bệnh nhân bị ảnh hưởng.`
        : `Cập nhật lịch từ ${formatTime(selectedSchedule.startTime)}-${formatTime(selectedSchedule.endTime)} thành ${editScheduleForm.startTime}-${editScheduleForm.endTime}`,
      affectedDoctorIds: affectedDoctorIds,
      createdByStaffId: staffInfo.id,
    };

    await scheduleChangeRequestService.createRequest(requestData);

    toast.success(`✅ Đã tạo yêu cầu cập nhật lịch! Cần ${affectedDoctorIds.length} bác sĩ phê duyệt.`, {
      autoClose: 5000,
    });

    if (appointmentList.length > 0) {
      toast.warning(`⚠️ Có ${appointmentList.length} bệnh nhân sẽ bị ảnh hưởng nếu yêu cầu được phê duyệt.`, {
        autoClose: 5000,
      });
    }

    toast.info(`📧 Email thông báo đã được gửi tới ${affectedDoctorIds.length} bác sĩ phê duyệt.`, {
      autoClose: 5000,
    });

    setShowEditModal(false);
    setAppointmentList([]);
    fetchWeekSchedules();
    checkFutureWeekAppointments();
  } catch (error: any) {
    console.error("Error creating schedule change request:", error);
    toast.error(error.response?.data?.message || "Không thể tạo yêu cầu cập nhật lịch");
  }
};


  // Handler submit bulk edit - gửi request cập nhật nhiều lịch cùng lúc
  const handleBulkEditSubmit = async () => {
    if (!staffInfo || !staffInfo.id) {
      toast.error("Không tìm thấy thông tin staff!");
      return;
    }

    // Validate tất cả schedules
    for (const schedule of bulkEditSchedules) {
      if (!schedule.startTime || !schedule.endTime) {
        toast.error(`Vui lòng điền đầy đủ thời gian cho BS. ${schedule.doctorName}!`);
        return;
      }
      if (schedule.startTime >= schedule.endTime) {
        toast.error(`Giờ kết thúc phải sau giờ bắt đầu cho BS. ${schedule.doctorName}!`);
        return;
      }
    }

    try {
      // Lấy department từ staff hoặc từ doctor đầu tiên
      const firstDoctor = doctors.find(d => d.id === bulkEditSchedules[0]?.doctorId);
      const department = firstDoctor?.medicleSpecially?.[0] || staffInfo.medicleSpecially[0];
      
      // Tất cả affected doctors là tất cả doctors có lịch trong ngày
      const affectedDoctorIds = Array.from(new Set(bulkEditSchedules.map(s => s.doctorId)));

      // Tạo note tổng hợp
      const changesNote = bulkEditSchedules.map(s => 
        `BS. ${s.doctorName}: ${formatTime(s.startTime)}-${formatTime(s.endTime)}`
      ).join("; ");

      // Tạo bulk request với bulkSchedules array
      const requestData = {
        targetDoctorId: affectedDoctorIds[0], // Doctor đầu tiên làm target
        changeType: "UPDATE" as const,
        dateChange: bulkEditDate,
        department: department,
        note: `Cập nhật lịch tổng hợp cho ${bulkEditSchedules.length} bác sĩ: ${changesNote}`,
        affectedDoctorIds: affectedDoctorIds,
        createdByStaffId: staffInfo.id,
        bulkSchedules: bulkEditSchedules.map(s => ({
          doctorId: s.doctorId,
          scheduleId: s.id, 
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      };

      // Sử dụng endpoint bulk
      await scheduleChangeRequestService.createBulkRequests(requestData);

      toast.success(
        `✅ Đã tạo yêu cầu cập nhật lịch cho ${bulkEditSchedules.length} bác sĩ! Cần ${affectedDoctorIds.length} bác sĩ phê duyệt.`,
        { autoClose: 5000 }
      );

      toast.info(
        `📧 Email thông báo đã được gửi tới ${affectedDoctorIds.length} bác sĩ để phê duyệt.`,
        { autoClose: 5000 }
      );

      setShowBulkEditModal(false);
      setBulkEditSchedules([]);
      fetchWeekSchedules();
      checkFutureWeekAppointments();
    } catch (error: any) {
      console.error("Error creating bulk schedule change request:", error);
      toast.error(error.response?.data?.message || "Không thể tạo yêu cầu cập nhật lịch");
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

  if (!scheduleToDelete.schedule) {
    toast.error("Không tìm thấy thông tin lịch!");
    return;
  }

  if (!staffInfo || !staffInfo.id) {
    toast.error("Không tìm thấy thông tin staff!");
    return;
  }

  try {
    const schedule = scheduleToDelete.schedule;

    // Lấy tất cả doctors có lịch trong ngày
    const selectedDaySchedules = weekSchedules.find((day) => day.date === schedule.workDate);
    const doctorsInDaySchedules = selectedDaySchedules?.schedules.map((s) => s.doctorId) || [];

    // Lấy thông tin doctor
    const selectedDoctor = doctors.find((d) => d.id === schedule.doctorId);
    const department = selectedDoctor?.medicleSpecially?.[0] || staffInfo.medicleSpecially[0];

    // Tạo danh sách affected doctors
    const affectedDoctorIds = Array.from(new Set(doctorsInDaySchedules));

    // Tạo schedule change request với changeType = DELETE
    const requestData = {
      targetDoctorId: schedule.doctorId,
      targetScheduleId: schedule.id, // ← THÊM FIELD NÀY
      changeType: "DELETE" as const,
      dateChange: schedule.workDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      department: department,
      note: scheduleToDelete.affectedAppointments.length > 0
        ? `Xóa lịch ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}. Có ${scheduleToDelete.affectedAppointments.length} bệnh nhân bị ảnh hưởng sẽ được thông báo.`
        : `Xóa lịch ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`,
      affectedDoctorIds: affectedDoctorIds,
      createdByStaffId: staffInfo.id,
    };

    await scheduleChangeRequestService.createRequest(requestData);

    toast.success(`✅ Đã tạo yêu cầu xóa lịch! Cần ${affectedDoctorIds.length} bác sĩ phê duyệt.`, {
      autoClose: 5000,
    });

    if (scheduleToDelete.affectedAppointments.length > 0) {
      toast.warning(`⚠️ Có ${scheduleToDelete.affectedAppointments.length} bệnh nhân sẽ bị ảnh hưởng khi yêu cầu được phê duyệt.`, {
        autoClose: 5000,
      });
    }

    toast.info(`📧 Email thông báo đã được gửi tới ${affectedDoctorIds.length} bác sĩ phê duyệt.`, {
      autoClose: 5000,
    });

    setShowDeleteConfirmModal(false);
    setScheduleToDelete(null);
    fetchWeekSchedules();
    checkFutureWeekAppointments();
  } catch (error: any) {
    console.error("Error creating delete schedule request:", error);
    toast.error(error.response?.data?.message || "Không thể tạo yêu cầu xóa lịch");
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
                  <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenAddModal(day.date)}
                    disabled={isPast}
                    className={`w-full mt-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isPast
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    Thêm lịch
                  </button>
                  <button
                    onClick={() => handleOpenBulkEditModal(day.date)}
                    disabled={isPast || day.schedules.length === 0}
                    className={`w-full mt-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isPast || day.schedules.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    title={day.schedules.length === 0 ? "Chưa có lịch để sửa" : "Sửa tất cả lịch trong ngày"}
                  >
                    Sửa lịch
                  </button>

                  </div>
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
              <h3 className="text-xl font-bold text-gray-900">Thêm lịch làm việc cho cả ngày</h3>
              <p className="text-sm text-gray-600 mt-1">
                Ngày: {getDayName(selectedDate)}, {formatDate(selectedDate)}
                {scheduleList.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    {scheduleList.length} lịch đã thêm
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddModal(false);
                setScheduleList([]);
                setScheduleForm({ doctorId: "", startTime: "", endTime: "" });
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

        {/* 4-Column Layout: Form + Schedules Added + Day Schedules + Appointments */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Form (25%) */}
          <div className="w-[25%] p-6 space-y-4 overflow-y-auto border-r border-gray-200">
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

          {/* Second Panel - Schedules Added to List (25%) */}
          <div className="w-[25%] bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col border-r border-gray-200">
            <div className="px-6 py-4 border-b border-green-200 bg-gradient-to-r from-green-100 to-emerald-100 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">✅ Danh sách sẽ tạo</h4>
                <span className="text-xs font-medium px-2.5 py-1 bg-green-600 text-white rounded-full">
                  {scheduleList.length} lịch
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Lịch đã thêm, chờ submit
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {scheduleList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-xs font-medium">Chưa thêm lịch nào</p>
                  <p className="text-xs mt-1 text-center px-4">Chọn bác sĩ và thời gian, rồi click "Thêm vào danh sách"</p>
                </div>
              ) : (
                scheduleList.map((schedule, idx) => (
                  <div
                    key={`${schedule.doctorId}-${idx}`}
                    className="bg-white rounded-lg border-2 border-green-300 p-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          BS. {schedule.doctorName}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromList(schedule.doctorId)}
                        className="p-1 rounded hover:bg-red-100 transition-colors flex-shrink-0"
                        title="Xóa khỏi danh sách"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs rounded px-2 py-1.5 bg-green-100 text-green-800">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

          {/* Third Panel - Day Schedules (25%) */}
          <div className="w-[25%] bg-purple-50 flex flex-col border-r border-gray-200">
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

          {/* Right Panel - Appointments (25%) */}
          <div className="w-[25%] bg-gray-50 flex flex-col">
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
              setScheduleList([]);
              setScheduleForm({ doctorId: "", startTime: "", endTime: "" });
              setAppointmentList([]);
              setDaySchedules([]);
            }}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleAddToScheduleList}
            disabled={!scheduleForm.doctorId || !scheduleForm.startTime || !scheduleForm.endTime}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ➕ Thêm vào danh sách
          </button>
          <button
            onClick={handleSubmitAllSchedules}
            disabled={scheduleList.length === 0}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ✅ Tạo tất cả ({scheduleList.length})
          </button>
        </div>
      </div>
    </div>
  );
})()}


{showEditModal && selectedSchedule && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
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

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Edit Form (30%) */}
        <div className="w-[30%] p-6 space-y-4 overflow-y-auto border-r border-gray-200">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày làm việc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={editScheduleForm.workDate}
              onChange={(e) =>
                setEditScheduleForm({ ...editScheduleForm, workDate: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={editScheduleForm.startTime}
              onChange={(e) =>
                setEditScheduleForm({ ...editScheduleForm, startTime: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={editScheduleForm.endTime}
              onChange={(e) =>
                setEditScheduleForm({ ...editScheduleForm, endTime: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Affected Appointments Warning */}
          {appointmentList.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-orange-800">
                  <p className="font-medium">⚠️ Có {appointmentList.length} lịch hẹn bị ảnh hưởng</p>
                  <p className="mt-1">Xem danh sách → (panel bên phải)</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {editScheduleForm.startTime >= editScheduleForm.endTime && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Giờ kết thúc phải sau giờ bắt đầu!
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Lưu ý</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Appointments ngoài khung giờ mới sẽ bị unassign</li>
                  <li>Yêu cầu cần được bác sĩ phê duyệt</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Appointments (70%) */}
        <div className="w-[70%] bg-gray-50 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Lịch hẹn trong lịch cũ</h4>
              <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {appointmentList.length} lịch hẹn
              </span>
            </div>
            {selectedSchedule && (
              <>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Thời gian Cũ:</strong> {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}
                </p>
                <p className="text-xs text-orange-600 mt-1 font-medium">
                  ⚠️ Tất cả appointments này sẽ bị unassign nếu NGOÀI khung thời gian MỚI
                </p>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {appointmentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">Không có lịch hẹn</p>
                <p className="text-xs mt-1">Lịch này chưa có appointment nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointmentList.map((appointment, idx) => (
                  <div
                    key={appointment.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900">{appointment.patientName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{appointment.id.slice(0, 8)}</span>
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
                  </div>
                ))}
              </div>
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

        {/* ← THÊM NÚT DELETE */}
        <button
          onClick={() => {
            setShowEditModal(false);
            handleDeleteSchedule(selectedSchedule.id!, selectedSchedule);
          }}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Xóa lịch
        </button>

        <button
          onClick={() => {
            if (appointmentList.length > 0) {
              setShowEditConfirmModal(true);
            } else {
              handleEditSchedule();
            }
          }}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            appointmentList.length > 0
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {appointmentList.length > 0 ? `Cập nhật (${appointmentList.length} BN ảnh hưởng)` : "Cập nhật lịch"}
        </button>
      </div>
    </div>
  </div>
)}


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

      {/* Bulk Edit Modal - Sửa tất cả lịch trong ngày */}
      {showBulkEditModal && bulkEditSchedules.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    ✏️ Sửa tất cả lịch trong ngày
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getDayName(bulkEditDate)}, {formatDate(bulkEditDate)} - Sửa {bulkEditSchedules.length} lịch bác sĩ cùng lúc
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditSchedules([]);
                    setBulkEditAppointments({});
                  }}
                  className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">
                    📝 Chỉnh sửa hàng loạt
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Bạn có thể sửa thời gian làm việc của nhiều bác sĩ cùng lúc. Sau khi sửa xong, hệ thống sẽ gửi 1 yêu cầu duy nhất tới tất cả {bulkEditSchedules.length} bác sĩ để phê duyệt.
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column Layout: Schedules + Appointments */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Schedules List (50%) */}
              <div className="w-1/2 flex flex-col border-r border-gray-200">
                <div className="px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <h4 className="font-semibold text-gray-900 text-sm">📋 Danh sách lịch bác sĩ</h4>
                  <p className="text-xs text-gray-600 mt-1">Chỉnh sửa thời gian cho từng bác sĩ</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {bulkEditSchedules.map((schedule, index) => (
                      <div
                        key={schedule.id || index}
                        className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 hover:shadow-md transition-all"
                      >
                        {/* Doctor Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">BS. {schedule.doctorName}</h4>
                            <p className="text-xs text-gray-600">
                              Lịch cũ: {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex-shrink-0">
                            #{index + 1}
                          </span>
                        </div>

                        {/* Appointments Count Badge */}
                        {bulkEditAppointments[schedule.doctorId] && bulkEditAppointments[schedule.doctorId].length > 0 && (
                          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-orange-800">
                                {bulkEditAppointments[schedule.doctorId].length} lịch hẹn bị ảnh hưởng
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Time Edit Form */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Giờ bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={formatTime(schedule.startTime)}
                              onChange={(e) => {
                                const updated = [...bulkEditSchedules];
                                updated[index].startTime = e.target.value + ":00";
                                setBulkEditSchedules(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Giờ kết thúc <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={formatTime(schedule.endTime)}
                              onChange={(e) => {
                                const updated = [...bulkEditSchedules];
                                updated[index].endTime = e.target.value + ":00";
                                setBulkEditSchedules(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>

                        {/* Validation */}
                        {schedule.startTime >= schedule.endTime && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            ⚠️ Giờ kết thúc phải sau giờ bắt đầu!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - All Appointments (50%) */}
              <div className="w-1/2 bg-gray-50 flex flex-col">
                <div className="px-6 py-3 border-b border-gray-200 bg-white">
                  <h4 className="font-semibold text-gray-900 text-sm">📅 Lịch hẹn trong ngày</h4>
                  <p className="text-xs text-gray-600 mt-1">Tất cả lịch hẹn sẽ bị ảnh hưởng khi thay đổi</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {bulkEditSchedules.map((schedule, idx) => {
                    const appointments = bulkEditAppointments[schedule.doctorId] || [];
                    
                    if (appointments.length === 0) return null;

                    return (
                      <div key={schedule.id || idx} className="mb-6">
                        {/* Doctor Header */}
                        <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-50 pb-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-900 text-sm">BS. {schedule.doctorName}</h5>
                            <p className="text-xs text-gray-600">{appointments.length} lịch hẹn</p>
                          </div>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Appointments List */}
                        <div className="space-y-2">
                          {appointments.map((appointment: Appointment) => (
                            <div
                              key={appointment.id}
                              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
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
                                    ? "✅ Đã xác nhận"
                                    : appointment.status === "PENDING"
                                    ? "⏳ Chờ xác nhận"
                                    : appointment.status === "CANCELLED"
                                    ? "❌ Đã hủy"
                                    : appointment.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  #{appointment.id}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
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
                                  <span className="font-semibold text-gray-900">
                                    {appointment.patientName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <svg
                                    className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
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
                                  <span className="font-semibold text-blue-700">
                                    {formatTime(appointment.startTime)} -{" "}
                                    {formatTime(appointment.endTime)}
                                  </span>
                                </div>

                                {appointment.patientPhone && (
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
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
                                    <span className="text-gray-600">
                                      {appointment.patientPhone}
                                    </span>
                                  </div>
                                )}

                                {appointment.medicalExaminations &&
                                  appointment.medicalExaminations.length > 0 && (
                                    <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                                      <svg
                                        className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                      </svg>
                                      <div className="flex-1">
                                        <span className="text-purple-700 font-medium">
                                          {appointment.medicalExaminations.length} dịch vụ
                                        </span>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* No appointments message */}
                  {Object.values(bulkEditAppointments).every(arr => arr.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">Không có lịch hẹn nào</p>
                      <p className="text-xs mt-1">Ngày này chưa có lịch hẹn</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{bulkEditSchedules.length} bác sĩ</span> sẽ nhận được yêu cầu phê duyệt
                </div>
                <div className="text-xs text-gray-500">
                  Tất cả phải approve thì lịch mới được cập nhật
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditSchedules([]);
                    setBulkEditAppointments({});
                  }}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  ← Hủy
                </button>
                <button
                  onClick={handleBulkEditSubmit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  ✅ Gửi yêu cầu cập nhật cho {bulkEditSchedules.length} bác sĩ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
