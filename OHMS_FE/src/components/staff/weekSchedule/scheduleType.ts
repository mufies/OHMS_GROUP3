export interface Doctor {
  id: string;
  username: string;
  email: string;
  imageUrl: string | null;
  medicleSpecially: string[] | null;
}

export interface Schedule {
  id?: string;
  workDate: string;
  startTime: string;
  endTime: string;
  userId?: string;
}

export interface DaySchedule {
  date: string;
  dayName: string;
  schedules: (Schedule & { doctorName: string; doctorId: string })[];
}

export interface StaffInfo {
  id: string;
  username: string;
  email: string;
  phone: number;
  medicleSpecially: string[];
  imageUrl: string | null;
}

export interface ServiceAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalExaminations: MedicalExaminationInfo[];
}

export interface MedicalExaminationInfo {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  doctorId: string;
  doctorName: string;
  scheduleId: string | null;
  serviceAppointments: ServiceAppointment[];
}
