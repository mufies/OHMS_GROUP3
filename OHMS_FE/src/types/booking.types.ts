export interface MedicalExamination {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
  category?: 'CLINICAL' | 'DIAGNOSTIC';
  estimatedDuration?: number;
  requiresResultWaitTime?: number;
}

export interface ServiceStep {
  service: MedicalExamination;
  slot: TimeSlot;
  room?: string;
  estimatedResultTime?: string;
}

export interface MultiStepSchedule {
  steps: ServiceStep[];
  totalDuration: number;
  totalWaitTime: number;
  startTime: string;
  endTime: string;
  isValid: boolean;
}

export interface MedicalServicesRequest {
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

export interface Doctor {
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
  imageUrl?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string;
  slots: TimeSlot[];
  hasApiSchedule?: boolean;
}

export interface WeeklySchedule {
  workDate: string;
  startTime: string;
  endTime: string;
}

export interface Appointment {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  parentAppointment?: string | null;
}

export type BookingType = 'CONSULTATION_ONLY' | 'SERVICE_AND_CONSULTATION' | null;

export interface DiagnosticSlot {
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  duration: number;
}
