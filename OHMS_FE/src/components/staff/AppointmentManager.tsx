import { useState, useEffect } from "react";
import { axiosInstance } from "../../utils/fetchFromAPI";
import { toast } from "sonner";
import { MEDICAL_SPECIALTY_LABELS } from "../../constant/medicalSpecialty";

interface Doctor {
  id: string;
  username: string;
  medicleSpecially: string[];
}

interface Schedule {
  workDate: string;
  startTime: string;
  endTime: string;
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
  patientName: string;
  patientPhone: string;
  doctorId: string | null;
  doctorName: string | null;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface AppointmentManagerProps {
  staffInfo: StaffInfo | null;
}

// Helper: Format time
const formatTime = (timeStr: string): string => {
  return timeStr.substring(0, 5); // HH:mm
};

// Helper: Format date
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export default function AppointmentManager({ staffInfo }: AppointmentManagerProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [unassignedAppointments, setUnassignedAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<{ [doctorId: string]: Schedule[] }>({});

  useEffect(() => {
    if (staffInfo) {
      fetchDoctors();
      fetchUnassignedAppointments();
    }
  }, [staffInfo]);

  useEffect(() => {
    if (selectedDate) {
      fetchUnassignedAppointments();
    }
  }, [selectedDate]);

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

  const fetchUnassignedAppointments = async () => {
    if (!staffInfo || !staffInfo.medicleSpecially || staffInfo.medicleSpecially.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Fetch all appointments for the date
      const res = await axiosInstance.get(`/appointments/date/${selectedDate}`);
      const allAppointments = res.data;
      
      // Filter appointments without doctor and matching staff specialty
      const unassigned = allAppointments.filter((apt: Appointment) => {
        if (apt.doctorId) return false;
        
        // Check if appointment's medical examinations match staff's specialty
        // This assumes the appointment has specialty info or we check via services
        return true; // For now, show all unassigned
      });
      
      setUnassignedAppointments(unassigned);
    } catch (error) {
      console.error("Error fetching unassigned appointments:", error);
      toast.error("Không thể tải lịch hẹn chưa phân công");
      setUnassignedAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSchedule = async (doctorId: string, date: string) => {
    try {
      const res = await axiosInstance.get(`/schedule/${doctorId}`);
      const schedules = res.data.results || [];
      
      // Filter schedules for the selected date
      const dateSchedules = schedules.filter((s: Schedule) => s.workDate === date);
      
      return dateSchedules;
    } catch (error) {
      console.error(`Error fetching schedule for doctor ${doctorId}:`, error);
      return [];
    }
  };

  const handleOpenAssignModal = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAssignModal(true);
    
    // Fetch schedules for all doctors on the appointment date
    const schedules: { [doctorId: string]: Schedule[] } = {};
    await Promise.all(
      doctors.map(async (doctor) => {
        const doctorSchedule = await fetchDoctorSchedule(doctor.id, appointment.workDate);
        schedules[doctor.id] = doctorSchedule;
      })
    );
    
    setDoctorSchedules(schedules);
  };

  const handleAssignDoctor = async (doctorId: string) => {
    if (!selectedAppointment) return;

    try {
      await axiosInstance.put(
        `/appointments/${selectedAppointment.id}/assign-doctor/${doctorId}`
      );

      toast.success("Phân công bác sĩ thành công!");
      setShowAssignModal(false);
      setSelectedAppointment(null);
      fetchUnassignedAppointments();
    } catch (error: any) {
      console.error("Error assigning doctor:", error);
      toast.error(error.response?.data?.message || "Không thể phân công bác sĩ");
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });
    }
    return dates;
  };

  // Check if doctor is available for the appointment time
  const isDoctorAvailable = (doctorId: string, appointment: Appointment): boolean => {
    const schedules = doctorSchedules[doctorId] || [];
    
    if (schedules.length === 0) return false;
    
    // Check if any schedule overlaps with appointment time
    return schedules.some((schedule) => {
      return schedule.startTime <= appointment.startTime && 
             schedule.endTime >= appointment.endTime;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Phân công bác sĩ</h2>
        {staffInfo && staffInfo.medicleSpecially && staffInfo.medicleSpecially.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Chuyên khoa: {staffInfo.medicleSpecially.map(spec => 
              MEDICAL_SPECIALTY_LABELS[spec as keyof typeof MEDICAL_SPECIALTY_LABELS] || spec
            ).join(', ')}
          </p>
        )}
      </div>

      {/* Date selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn ngày
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Quick date selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {getWeekDates().map((date) => (
          <button
            key={date.value}
            onClick={() => setSelectedDate(date.value)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedDate === date.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {date.label}
          </button>
        ))}
      </div>

      {/* Unassigned Appointments */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : unassignedAppointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">Không có lịch hẹn chưa phân công trong ngày này</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Lịch hẹn chưa phân công: {unassignedAppointments.length}
            </h3>
          </div>

          {unassignedAppointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-lg border-2 border-orange-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{apt.patientName}</h4>
                      <p className="text-sm text-gray-600">📞 {apt.patientPhone || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    Chưa phân công
                  </span>
                  <button
                    onClick={() => handleOpenAssignModal(apt)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                  >
                    Phân công bác sĩ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(apt.workDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                </div>
              </div>

              {apt.medicalExaminations && apt.medicalExaminations.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-900 mb-2">Dịch vụ khám:</p>
                  <div className="space-y-1">
                    {apt.medicalExaminations.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{exam.name}</span>
                        <span className="font-semibold text-indigo-600">
                          {exam.price.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Doctor Modal */}
      {showAssignModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Phân công bác sĩ
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Bệnh nhân: <strong>{selectedAppointment.patientName}</strong> - {formatDate(selectedAppointment.workDate)} ({formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAppointment(null);
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
              <div className="space-y-3">
                {doctors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có bác sĩ nào khả dụng
                  </div>
                ) : (
                  doctors.map((doctor) => {
                    const isAvailable = isDoctorAvailable(doctor.id, selectedAppointment);
                    const schedules = doctorSchedules[doctor.id] || [];
                    
                    return (
                      <div
                        key={doctor.id}
                        className={`rounded-lg border-2 p-4 transition-all ${
                          isAvailable
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.username)}&background=4F46E5&color=fff`}
                                alt={doctor.username}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <h4 className="font-semibold text-gray-900">{doctor.username}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {doctor.medicleSpecially && doctor.medicleSpecially.map((spec, idx) => (
                                    <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                      {MEDICAL_SPECIALTY_LABELS[spec as keyof typeof MEDICAL_SPECIALTY_LABELS] || spec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Schedule Info */}
                            <div className="text-sm mt-2">
                              {schedules.length === 0 ? (
                                <div className="text-red-600 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Không có lịch làm việc
                                </div>
                              ) : (
                                <div className={isAvailable ? "text-green-700" : "text-gray-600"}>
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Lịch làm việc:
                                  </div>
                                  {schedules.map((schedule, idx) => (
                                    <div key={idx} className="ml-5">
                                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAssignDoctor(doctor.id)}
                            disabled={!isAvailable}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              isAvailable
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {isAvailable ? "Chọn" : "Không khả dụng"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
