import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigator from "../../components/Navigator";
import { MEDICAL_SPECIALTY_LABELS } from "../../constant/medicalSpecialty";
import { useBookingSchedule } from "../../hooks/useBookingSchedule";
import { 
  BookingTypeModal, 
  ServiceSelectionModal, 
  DoctorSelectionModal, 
  BookingSummary,
  MedicalRequestModal,
  TimeSlotPicker 
} from "../../components/booking";
import { MedicalExamination } from "../../types/booking.types";
import { applyDiscount, calculateDeposit } from "../../utils/bookingHelpers";

function BookingSchedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const specialty = searchParams.get('specialty');

  // Use custom hook for all data and state management
  const {
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
    medicalRequests,
    setMedicalRequests
  } = useBookingSchedule(specialty);

  // UI state
  const [showBookingTypeModal, setShowBookingTypeModal] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Calculate total duration helper
  const getTotalDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.minDuration || 0);
    }, 0);
  };

  // Handler: Booking type selected
  const handleBookingTypeSelect = (type: 'CONSULTATION_ONLY' | 'SERVICE_AND_CONSULTATION' | null) => {
    if (!type) return;
    
    setBookingType(type);
    setShowBookingTypeModal(false);
    
    if (type === 'SERVICE_AND_CONSULTATION') {
      // Check for medical requests first
      if (medicalRequests.length > 0) {
        setShowRequestModal(true);
      } else {
        setShowServiceModal(true);
      }
    } else {
      // For consultation only, go directly to doctor selection
      setShowDoctorModal(true);
    }
  };

  // Handler: Services loaded from BookingTypeModal
  const handleServicesLoaded = (loadedServices: MedicalExamination[]) => {
    setServices(loadedServices);
  };

  // Handler: Selected services updated from BookingTypeModal
  const handleSelectedServicesUpdate = (serviceIds: string[]) => {
    setSelectedServices(serviceIds);
  };

  // Handler: Toggle service selection
  const handleToggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Handler: Service selection confirmed
  const handleServiceSelectionConfirm = () => {
    setShowServiceModal(false);
    setShowDoctorModal(true);
  };

  // Handler: Doctor selected
  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(false);
  };

  // Handler: Use medical request
  const handleUseRequest = (request: any) => {
    const serviceIds = request.medicalExaminations.map((me: MedicalExamination) => me.id);
    setSelectedServices(serviceIds);
    setShowRequestModal(false);
    setShowDoctorModal(true);
  };

  // Handler: Decline medical request
  const handleDeclineRequest = () => {
    setShowRequestModal(false);
    setShowServiceModal(true);
    setMedicalRequests([]);
  };

  // Handler: Payment button clicked
  const handlePayment = async () => {
    if (!selectedDoctor || !weekSchedule[selectedDay]) return;

    const selectedDayData = weekSchedule[selectedDay];
    const totalPrice = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const discountedPrice = applyDiscount(totalPrice);
    const depositAmount = calculateDeposit(discountedPrice);

    let bookingData;

    if (bookingType === 'SERVICE_AND_CONSULTATION') {
      // Multi-step booking with diagnostic and consultation
      const diagnosticStartTime = diagnosticSlots[0]?.startTime;
      const diagnosticEndTime = diagnosticSlots[diagnosticSlots.length - 1]?.endTime;

      bookingData = {
        bookingType: 'SERVICE_AND_CONSULTATION',
        doctorId: selectedDoctor.id,
        workDate: selectedDayData.date,
        startTime: diagnosticStartTime,
        endTime: consultationSlot?.endTime || diagnosticEndTime,
        medicalExaminationIds: selectedServices,
        totalAmount: totalPrice,
        discount: totalPrice - discountedPrice,
        deposit: depositAmount,
        depositStatus: 'PENDING',
        diagnosticSlots: diagnosticSlots.map(ds => ({
          serviceId: ds.serviceId,
          startTime: ds.startTime,
          endTime: ds.endTime
        })),
        consultationSlot: consultationSlot ? {
          startTime: consultationSlot.startTime,
          endTime: consultationSlot.endTime
        } : null
      };
    } else {
      // Simple consultation booking - find "Khám bệnh" service
      const consultService = services.find(s => s.name === "Khám bệnh");
      const consultServiceIds = consultService ? [consultService.id] : [];
      
      bookingData = {
        bookingType: 'CONSULTATION_ONLY',
        doctorId: selectedDoctor.id,
        workDate: selectedDayData.date,
        startTime: selectedSlot?.startTime || consultationSlot?.startTime,
        endTime: selectedSlot?.endTime || consultationSlot?.endTime,
        medicalExaminationIds: consultServiceIds,
        totalAmount: totalPrice || consultService?.price || 0,
        discount: totalPrice - discountedPrice,
        deposit: depositAmount,
        depositStatus: 'PENDING'
      };
    }

    // Store in session and navigate to payment
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    navigate('/payment', { state: { bookingData, depositAmount } });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigator />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigator />
      
      <div className="max-w-7xl mx-auto px-4 py-10 mt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Đặt lịch khám - {MEDICAL_SPECIALTY_LABELS[specialty as keyof typeof MEDICAL_SPECIALTY_LABELS]}
          </h1>
          <p className="text-gray-600 mt-2">
            Chọn bác sĩ, dịch vụ và thời gian khám phù hợp
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Time Slot Picker */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {selectedDoctor ? (
                <TimeSlotPicker
                  weekSchedule={weekSchedule}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  bookingType={bookingType}
                  selectedServices={selectedServices}
                  services={services}
                  diagnosticSlots={diagnosticSlots}
                  setDiagnosticSlots={setDiagnosticSlots}
                  consultationSlot={consultationSlot}
                  setConsultationSlot={setConsultationSlot}
                  getTotalDuration={getTotalDuration}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">
                    Vui lòng chọn bác sĩ để xem lịch khám
                  </div>
                  <button
                    onClick={() => setShowDoctorModal(true)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Chọn bác sĩ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              selectedServices={selectedServices}
              services={services}
              selectedDoctor={selectedDoctor}
              selectedSlot={selectedSlot}
              weekSchedule={weekSchedule}
              selectedDay={selectedDay}
              diagnosticSlots={diagnosticSlots}
              consultationSlot={consultationSlot}
              bookingType={bookingType}
              getTotalDuration={getTotalDuration}
              onPayment={handlePayment}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowBookingTypeModal(true)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Thay đổi loại đặt khám
          </button>
          <button
            onClick={() => setShowServiceModal(true)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={bookingType === 'CONSULTATION_ONLY'}
          >
            Chọn lại dịch vụ
          </button>
          <button
            onClick={() => setShowDoctorModal(true)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Chọn lại bác sĩ
          </button>
        </div>
      </div>

      {/* Modals */}
      <BookingTypeModal
        show={showBookingTypeModal}
        specialty={specialty}
        onSelectType={handleBookingTypeSelect}
        onServicesLoaded={handleServicesLoaded}
        onSelectedServicesUpdate={handleSelectedServicesUpdate}
      />

      <ServiceSelectionModal
        show={showServiceModal}
        services={services}
        selectedServices={selectedServices}
        onToggleService={handleToggleService}
        onClose={handleServiceSelectionConfirm}
        getTotalDuration={getTotalDuration}
      />

      <DoctorSelectionModal
        show={showDoctorModal}
        doctors={doctors}
        selectedDoctor={selectedDoctor}
        onSelectDoctor={handleDoctorSelect}
        onClose={() => setShowDoctorModal(false)}
      />

      <MedicalRequestModal
        show={showRequestModal}
        requests={medicalRequests}
        onUseRequest={handleUseRequest}
        onDecline={handleDeclineRequest}
      />
    </div>
  );
}

export default BookingSchedule;
