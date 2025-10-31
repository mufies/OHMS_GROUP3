import { useState, useEffect } from "react";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";
import { MEDICAL_SPECIALTY_LABELS } from "../../constant/medicalSpecialty";

interface Doctor {
  id: string;
  username: string;
  email: string;
  imageUrl: string | null;
  medicleSpecially: string[] | null;
}

interface Schedule {
  workDate: string;
  startTime: string;
  endTime: string;
}

interface DoctorScheduleMap {
  [doctorId: string]: {
    doctorName: string;
    schedules: Schedule[];
  };
}

interface StaffInfo {
  id: string;
  username: string;
  email: string;
  phone: number;
  medicleSpecially: string[];
  imageUrl: string | null;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface DoctorScheduleManagerProps {
  staffInfo: StaffInfo | null;
}

// Helper: Format date to display
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Helper: Format time
const formatTime = (timeStr: string): string => {
  return timeStr.substring(0, 5); // HH:mm
};

// Helper: Get day of week in Vietnamese
const getDayOfWeek = (dateStr: string): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return days[date.getDay()];
};

// Helper: Get next 7 days
const getNext7Days = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
};

export default function DoctorScheduleManager({ staffInfo }: DoctorScheduleManagerProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<Schedule[]>([]);
  const [allDoctorSchedules, setAllDoctorSchedules] = useState<DoctorScheduleMap>({});
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [scheduleForm, setScheduleForm] = useState({
    workDate: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    if (staffInfo) {
      fetchDoctors();
    }
  }, [staffInfo]);

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
        console.log('Filtered doctors:', filteredDoctors.length, 'out of', allDoctors.length);
      } else {
        const doctorsWithSpecialty = allDoctors.filter((doctor: Doctor) => 
          doctor.medicleSpecially && doctor.medicleSpecially.length > 0
        );
        setDoctors(doctorsWithSpecialty);
        console.log('Showing all doctors with specialties:', doctorsWithSpecialty.length);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Không thể tải danh sách bác sĩ");
    }
  };

  const fetchDoctorSchedule = async (doctorId: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/schedule/${doctorId}`);
      const schedules = res.data.results || [];
      
      schedules.sort((a: Schedule, b: Schedule) => 
        a.workDate.localeCompare(b.workDate)
      );
      
      setDoctorSchedules(schedules);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Không thể tải lịch làm việc");
      setDoctorSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDoctorSchedules = async () => {
    try {
      const scheduleMap: DoctorScheduleMap = {};
      
      await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const res = await axiosInstance.get(`/schedule/${doctor.id}`);
            const schedules = res.data.results || [];
            
            if (schedules.length > 0) {
              scheduleMap[doctor.id] = {
                doctorName: doctor.username,
                schedules: schedules
              };
            }
          } catch (error) {
            console.error(`Error fetching schedule for ${doctor.username}:`, error);
          }
        })
      );
      
      setAllDoctorSchedules(scheduleMap);
    } catch (error) {
      console.error("Error fetching all schedules:", error);
    }
  };

  const fetchUpcomingAppointments = async (doctorId: string) => {
    try {
      const res = await axiosInstance.get(`/appointments/doctor/${doctorId}/upcoming`);
      setUpcomingAppointments(res.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setUpcomingAppointments([]);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    fetchDoctorSchedule(doctor.id);
    fetchUpcomingAppointments(doctor.id);
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchAllDoctorSchedules();
  };

  const handleCreateSchedule = async () => {
    if (!selectedDoctor) return;

    if (!scheduleForm.workDate || !scheduleForm.startTime || !scheduleForm.endTime) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (scheduleForm.startTime >= scheduleForm.endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }

    try {
      await axiosInstance.post(`/schedule/${selectedDoctor.id}`, {
        workDate: scheduleForm.workDate,
        startTime: scheduleForm.startTime + ":00",
        endTime: scheduleForm.endTime + ":00"
      });

      toast.success("Tạo lịch làm việc thành công!");
      setShowCreateModal(false);
      setScheduleForm({ workDate: "", startTime: "", endTime: "" });
      fetchDoctorSchedule(selectedDoctor.id);
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      toast.error(error.response?.data?.message || "Không thể tạo lịch làm việc");
    }
  };

  // Group schedules by week
  const groupSchedulesByWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek: Schedule[] = [];
    const nextWeek: Schedule[] = [];
    const later: Schedule[] = [];

    doctorSchedules.forEach((schedule) => {
      const [year, month, day] = schedule.workDate.split('-').map(Number);
      const scheduleDate = new Date(year, month - 1, day);
      
      const diffDays = Math.floor((scheduleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return;
      } else if (diffDays < 7) {
        thisWeek.push(schedule);
      } else if (diffDays < 14) {
        nextWeek.push(schedule);
      } else {
        later.push(schedule);
      }
    });

    return { thisWeek, nextWeek, later };
  };

  // Group schedules by date for modal view
  const groupSchedulesByDate = () => {
    const next7Days = getNext7Days();
    const schedulesByDate: { [date: string]: { doctor: string; schedules: Schedule[]; doctorId: string }[] } = {};
    
    next7Days.forEach(date => {
      schedulesByDate[date] = [];
    });
    
    Object.entries(allDoctorSchedules).forEach(([doctorId, data]) => {
      data.schedules.forEach(schedule => {
        if (next7Days.includes(schedule.workDate)) {
          if (!schedulesByDate[schedule.workDate]) {
            schedulesByDate[schedule.workDate] = [];
          }
          
          const existingDoctor = schedulesByDate[schedule.workDate].find(s => s.doctorId === doctorId);
          if (existingDoctor) {
            existingDoctor.schedules.push(schedule);
          } else {
            schedulesByDate[schedule.workDate].push({
              doctor: data.doctorName,
              doctorId: doctorId,
              schedules: [schedule]
            });
          }
        }
      });
    });
    
    return schedulesByDate;
  };

  // Group appointments by date
  const groupAppointmentsByDate = () => {
    const next7Days = getNext7Days();
    const appointmentsByDate: { [date: string]: Appointment[] } = {};
    
    next7Days.forEach(date => {
      appointmentsByDate[date] = [];
    });
    
    upcomingAppointments.forEach(apt => {
      if (next7Days.includes(apt.workDate)) {
        appointmentsByDate[apt.workDate].push(apt);
      }
    });
    
    return appointmentsByDate;
  };

  const { thisWeek, nextWeek, later } = selectedDoctor ? groupSchedulesByWeek() : { thisWeek: [], nextWeek: [], later: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý lịch làm việc bác sĩ</h2>
          {staffInfo && (
            <div className="mt-2">
              {staffInfo.medicleSpecially && staffInfo.medicleSpecially.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Chuyên khoa của bạn:</span>
                  <div className="flex flex-wrap gap-1">
                    {staffInfo.medicleSpecially.map((spec, idx) => (
                      <span key={idx} className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded">
                        {MEDICAL_SPECIALTY_LABELS[spec as keyof typeof MEDICAL_SPECIALTY_LABELS] || spec}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm text-yellow-800">
                    Bạn chưa được gán chuyên khoa. Vui lòng liên hệ admin.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        {selectedDoctor && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm lịch làm việc
          </button>
        )}
      </div>

      {/* Doctors Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Chọn bác sĩ {doctors.length > 0 && `(${doctors.length})`}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Không có bác sĩ nào trong chuyên khoa của bạn</p>
              <p className="text-sm text-gray-400 mt-1">
                {staffInfo?.medicleSpecially && staffInfo.medicleSpecially.length > 0
                  ? `Chuyên khoa: ${staffInfo.medicleSpecially.map(spec => 
                      MEDICAL_SPECIALTY_LABELS[spec as keyof typeof MEDICAL_SPECIALTY_LABELS] || spec
                    ).join(', ')}`
                  : 'Bạn chưa được gán chuyên khoa'
                }
              </p>
            </div>
          ) : (
            doctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => handleDoctorSelect(doctor)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedDoctor?.id === doctor.id
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 bg-white hover:shadow"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={doctor.imageUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(doctor.username) + "&background=4F46E5&color=fff"}
                      alt={doctor.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    {selectedDoctor?.id === doctor.id && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{doctor.username}</h3>
                    <p className="text-xs text-gray-500 truncate">{doctor.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doctor.medicleSpecially && doctor.medicleSpecially.length > 0 ? (
                        <>
                          {doctor.medicleSpecially.slice(0, 2).map((spec, idx) => (
                            <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              {MEDICAL_SPECIALTY_LABELS[spec as keyof typeof MEDICAL_SPECIALTY_LABELS] || spec}
                            </span>
                          ))}
                          {doctor.medicleSpecially.length > 2 && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              +{doctor.medicleSpecially.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded italic">
                          Chưa có chuyên khoa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Doctor Schedule Calendar */}
      {selectedDoctor && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              📅 Lịch làm việc - BS. {selectedDoctor.username}
            </h3>
            <span className="text-sm text-gray-600">
              Tổng: {doctorSchedules.length} ngày
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : doctorSchedules.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 font-medium">Chưa có lịch làm việc nào</p>
              <p className="text-sm text-gray-400 mt-1">Nhấn "Thêm lịch làm việc" để tạo lịch mới</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* This Week */}
              {thisWeek.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Tuần này</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {thisWeek.map((schedule, idx) => (
                      <div key={idx} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-green-700">
                            {getDayOfWeek(schedule.workDate)}
                          </span>
                          <span className="text-xs text-green-600">
                            {formatDate(schedule.workDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Week */}
              {nextWeek.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Tuần sau</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {nextWeek.map((schedule, idx) => (
                      <div key={idx} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-blue-700">
                            {getDayOfWeek(schedule.workDate)}
                          </span>
                          <span className="text-xs text-blue-600">
                            {formatDate(schedule.workDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Later */}
              {later.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Các tuần tiếp theo</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {later.map((schedule, idx) => (
                      <div key={idx} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-gray-700">
                            {getDayOfWeek(schedule.workDate)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatDate(schedule.workDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Appointments */}
      {selectedDoctor && upcomingAppointments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🩺 Lịch hẹn sắp tới ({upcomingAppointments.length})
          </h3>
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-gray-900">{apt.patientName}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>📅 {formatDate(apt.workDate)}</span>
                    <span>🕐 {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'Schedule' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Schedule Modal - Enhanced with dim background and schedule overview */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Thêm lịch làm việc - BS. {selectedDoctor?.username}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Xem lịch 7 ngày tới và đặt lịch mới</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setScheduleForm({ workDate: "", startTime: "", endTime: "" });
                  }}
                  className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Left Column - Create Form */}
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo lịch mới
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày làm việc
                        </label>
                        <input
                          type="date"
                          value={scheduleForm.workDate}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, workDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giờ bắt đầu
                          </label>
                          <input
                            type="time"
                            value={scheduleForm.startTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giờ kết thúc
                          </label>
                          <input
                            type="time"
                            value={scheduleForm.endTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Lưu ý:</strong> Lịch làm việc sẽ được tạo cho bác sĩ trong khoảng thời gian được chọn. Kiểm tra lịch các bác sĩ khác bên phải để tránh trùng lặp.
                    </p>
                  </div>
                </div>

                {/* Right Column - Schedules Overview */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Lịch làm việc 7 ngày tới
                    </h4>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {getNext7Days().map((date) => {
                        const schedulesByDate = groupSchedulesByDate();
                        const daySchedules = schedulesByDate[date] || [];
                        const appointmentsByDate = groupAppointmentsByDate();
                        const dayAppointments = appointmentsByDate[date] || [];
                        
                        return (
                          <div key={date} className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                  {getDayOfWeek(date)}
                                </span>
                                <span className="text-sm text-gray-600">{formatDate(date)}</span>
                              </div>
                              {daySchedules.length === 0 && dayAppointments.length === 0 && (
                                <span className="text-xs text-gray-400 italic">Trống</span>
                              )}
                            </div>

                            {/* Doctor Schedules */}
                            {daySchedules.length > 0 && (
                              <div className="space-y-1 mb-2">
                                {daySchedules.map((docSchedule, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className={`font-medium ${docSchedule.doctorId === selectedDoctor?.id ? 'text-indigo-600' : 'text-gray-600'}`}>
                                      {docSchedule.doctorId === selectedDoctor?.id ? '👤 ' : ''}{docSchedule.doctor}:
                                    </span>
                                    {docSchedule.schedules.map((sched, sidx) => (
                                      <span key={sidx} className="ml-1 text-gray-500">
                                        {formatTime(sched.startTime)}-{formatTime(sched.endTime)}
                                        {sidx < docSchedule.schedules.length - 1 && ', '}
                                      </span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Appointments */}
                            {dayAppointments.length > 0 && (
                              <div className="border-t border-gray-100 pt-2 mt-2">
                                <div className="text-xs text-orange-600 font-medium mb-1">
                                  📋 Lịch hẹn ({dayAppointments.length})
                                </div>
                                {dayAppointments.slice(0, 2).map((apt) => (
                                  <div key={apt.id} className="text-xs text-gray-600 ml-2">
                                    • {apt.patientName} ({formatTime(apt.startTime)})
                                  </div>
                                ))}
                                {dayAppointments.length > 2 && (
                                  <div className="text-xs text-gray-400 ml-2 italic">
                                    +{dayAppointments.length - 2} lịch hẹn khác
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setScheduleForm({ workDate: "", startTime: "", endTime: "" });
                }}
                className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSchedule}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Tạo lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
