import { useState, useEffect } from "react";
import axios from "axios";
import Navigator from "../../components/Navigator";

interface MedicalExamination {
  id: string;
  name: string;
  price: number;
  minDuration?: number; // Thời gian tối thiểu (phút)
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string;
  slots: TimeSlot[];
}

interface Appointment {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

function BookingPreventive() {
  const [services, setServices] = useState<MedicalExamination[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  // Helper: Decode JWT token to get userId
  const decodeJWT = (token: string) => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  // Fetch patient appointments on mount
  useEffect(() => {
    const fetchPatientAppointments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          return;
        }

        const decodedToken = decodeJWT(token);
        const userId = decodedToken?.userId;

        if (!userId) {
          console.error('No userId found in token');
          return;
        }

        const response = await axios.get(
          `http://localhost:8080/appointments/patient/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Patient appointments:', response.data);
        setPatientAppointments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
        setPatientAppointments([]);
      }
    };

    fetchPatientAppointments();
  }, []);

  // Helper: Check if slot conflicts with patient's existing appointments
  const isSlotConflictingWithPatient = (date: string, startTime: string, endTime: string): boolean => {
    return patientAppointments.some(apt => {
      if (apt.workDate !== date || apt.status !== 'Schedule') return false;
      
      const aptStart = apt.startTime;
      const aptEnd = apt.endTime;
      
      return startTime < aptEnd && endTime > aptStart;
    });
  };

  // Helper: Check if slot is in the past
  const isSlotInPast = (date: string, startTime: string): boolean => {
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const slotDate = new Date(year, month - 1, day, hours, minutes);
    
    return slotDate < now;
  };

  // Generate default schedule (Mon-Sat, 8:00-17:00, 30-min slots)
  const generateDefaultSchedule = (): DaySchedule[] => {
    const buildWeekDates = (refDate: Date) => {
      const d = new Date(refDate);
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const day = localDate.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(localDate);
      monday.setDate(localDate.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekDates: Date[] = [];
      for (let i = 0; i < 6; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        weekDates.push(dt);
      }
      return weekDates;
    };

    const buildDefaultSlots = () => {
      const slots: TimeSlot[] = [];
      // Changed from 7:00 to 8:00
      for (let hour = 8; hour < 17; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const startHour = hour;
          const startMin = min;
          const endMin = min + 30;
          const endHour = endMin >= 60 ? hour + 1 : hour;
          const adjustedEndMin = endMin % 60;
          
          const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
          const endTime = `${String(endHour).padStart(2, '0')}:${String(adjustedEndMin).padStart(2, '0')}:00`;
          
          slots.push({ startTime, endTime, available: true });
        }
      }
      return slots;
    };

    const formatDayLabel = (date: Date): string => {
      const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const dayOfWeek = days[date.getDay()];
      return `${dayOfWeek}, ${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`;
    };

    const today = new Date();
    const thisWeekDates = buildWeekDates(today);
    const nextWeekStart = new Date(thisWeekDates[0]);
    nextWeekStart.setDate(thisWeekDates[0].getDate() + 7);
    const nextWeekDates = buildWeekDates(nextWeekStart);

    const toYMD = (d: Date) => d.toISOString().slice(0, 10);
    const todayStr = toYMD(today);

    const schedule: DaySchedule[] = [];

    // This week
    thisWeekDates.forEach(dateObj => {
      const dateStr = toYMD(dateObj);
      const dayOfWeek = dateObj.getDay();
      
      if (dateStr >= todayStr && dayOfWeek !== 0) {
        schedule.push({
          date: dateStr,
          label: formatDayLabel(dateObj),
          weekLabel: 'Tuần này',
          slots: buildDefaultSlots()
        });
      }
    });

    // Next week
    nextWeekDates.forEach(dateObj => {
      const dateStr = toYMD(dateObj);
      const dayOfWeek = dateObj.getDay();
      
      if (dayOfWeek !== 0) {
        schedule.push({
          date: dateStr,
          label: formatDayLabel(dateObj),
          weekLabel: 'Tuần sau',
          slots: buildDefaultSlots()
        });
      }
    });

    return schedule;
  };

  // Fetch preventive services (tiêm chủng, đo huyết áp, etc.)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.post('http://localhost:8080/medical-examination/by-specialty', {
          specility: 'PREVENTIVE_MEDICINE'
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data?.results) {
          setServices(response.data.results);
        }
      } catch (error) {
        console.error('Error fetching preventive services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Generate schedule on mount
  useEffect(() => {
    const schedule = generateDefaultSchedule();
    setWeekSchedule(schedule);
    if (schedule.length > 0) {
      setSelectedDay(0);
    }
  }, []);

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  // Calculate total duration for selected services
  const getTotalDuration = () => {
    // Separate services by duration requirement
    const longServices = selectedServices.filter(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return service && service.minDuration && service.minDuration >= 30;
    });
    
    const shortServices = selectedServices.filter(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return service && (!service.minDuration || service.minDuration < 30);
    });

    // Long services (>= 30 min) must be done sequentially
    const longServiceTime = longServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.minDuration || 0);
    }, 0);

    // Short services (< 30 min) can be done simultaneously, so we take the max
    const shortServiceTime = shortServices.length > 0 
      ? Math.max(...shortServices.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          return service?.minDuration || 0;
        }))
      : 0;

    // Total time = sequential long services + max of short services (if they happen after)
    return longServiceTime + shortServiceTime;
  };

  // Apply 10% discount for online booking
  const applyDiscount = (totalPrice: number): number => {
    return Math.round(totalPrice * 0.9); // 10% discount
  };

  // Calculate deposit (50% of discounted price)
  const calculateDeposit = (discountedPrice: number): number => {
    return Math.round(discountedPrice / 2);
  };

  const handlePayment = async () => {
    if (selectedServices.length === 0 || !selectedSlot) {
      alert('Vui lòng chọn dịch vụ và thời gian!');
      return;
    }

    // Calculate prices with discount and deposit
    const totalAmount = getTotalPrice();
    const discountedAmount = applyDiscount(totalAmount);
    const depositAmount = calculateDeposit(discountedAmount);

    const bookingData = {
      bookingType: 'PREVENTIVE_SERVICE',
      workDate: weekSchedule[selectedDay].date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      medicalExaminationIds: selectedServices,
      totalAmount,
      discount: 10, // 10% discount for online booking
      deposit: depositAmount,
      depositStatus: 'PENDING'
    };

    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    try {
      // Use deposit amount for payment (50% of discounted price)
      const response = await axios.get('http://localhost:8080/api/v1/payment/vn-pay', {
        params: {
          amount: depositAmount, // Pay deposit instead of full price
          bankCode: 'NCB'
        }
      });

      if (response.data?.results?.paymentUrl) {
        window.location.href = response.data.results.paymentUrl;
      } else {
        alert('Không thể tạo link thanh toán. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Lỗi khi khởi tạo thanh toán. Vui lòng thử lại!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigator />
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto flex gap-8 mt-8">
          {/* Main content */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold">Dịch vụ y tế dự phòng</div>
                  <div className="text-sm text-gray-500">Tiêm chủng, đo huyết áp, kiểm tra sức khỏe</div>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-orange-800">
                    ✅ Không cần bác sĩ - Thực hiện bởi điều dưỡng chuyên nghiệp (8h-17h hàng ngày)
                  </span>
                </div>
              </div>
            </div>

            {/* Service Selection */}
            <div className="mb-8">
              <div 
                onClick={() => setShowServiceModal(true)}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 cursor-pointer hover:border-orange-500 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900">Chọn dịch vụ</div>
                      <div className="text-sm text-gray-500">Chọn dịch vụ y tế dự phòng</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                {selectedServices.length > 0 ? (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-orange-900">
                      Đã chọn {selectedServices.length} dịch vụ
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      Tổng: {formatPrice(getTotalPrice())}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Chưa chọn dịch vụ nào</div>
                )}
              </div>
            </div>

            {/* Time Selection */}
            {selectedServices.length > 0 && weekSchedule.length > 0 && (
              <div>
                <div className="text-2xl font-bold mb-4">Chọn thời gian</div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="font-semibold text-lg mb-4">Ngày và giờ</div>
                  
                  {/* Days selector */}
                  <div className="space-y-4">
                    {['Tuần này', 'Tuần sau'].map(week => {
                      const weekDays = weekSchedule.filter(d => d.weekLabel === week);
                      if (weekDays.length === 0) return null;

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      return (
                        <div key={week}>
                          <div className="text-sm font-semibold text-gray-700 mb-3">{week}</div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {weekDays.map((day) => {
                              const hasSlots = day.slots && day.slots.length > 0;
                              const [year, month, dayNum] = day.date.split('-').map(Number);
                              const dayDate = new Date(year, month - 1, dayNum);
                              const isPast = dayDate < today;
                              const isDisabled = isPast || !hasSlots;
                              const actualIdx = weekSchedule.indexOf(day);
                              
                              return (
                                <div
                                  key={day.date}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setSelectedDay(actualIdx);
                                      setSelectedSlot(null);
                                    }
                                  }}
                                  className={`p-4 rounded-xl text-center min-w-[110px] flex-shrink-0 ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                  } ${
                                    actualIdx === selectedDay
                                      ? "border-2 border-orange-600 font-bold shadow-md bg-orange-50"
                                      : "border border-gray-200 font-medium bg-white"
                                  } text-gray-900`}
                                >
                                  {day.label}
                                  <div className={`text-sm mt-1 ${isPast ? 'text-gray-400' : 'text-orange-500'}`}>
                                    {hasSlots ? `${day.slots.length} khung giờ` : 'Không có'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots */}
                  <div className="mt-6">
                    <div className="font-semibold text-lg mb-3">Khung giờ</div>
                    {(() => {
                      const selectedDayData = weekSchedule[selectedDay];
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dateStr = selectedDayData.date;
                      const [year, month, dayNum] = dateStr.split('-').map(Number);
                      const dayDate = new Date(year, month - 1, dayNum);
                      const isDayPast = dayDate < today;
                      const hasSlots = selectedDayData?.slots && selectedDayData.slots.length > 0;
                      
                      if (isDayPast || !hasSlots) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              {isDayPast ? 'Ngày này đã trôi qua' : 'Không có khung giờ trống'}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="bg-white rounded-lg border-2 border-orange-200 p-4">
                          <div className="max-h-[200px] overflow-y-auto pr-2">
                            <div className="grid grid-cols-4 gap-3">
                              {selectedDayData.slots.map(slot => {
                                const isPast = isSlotInPast(dateStr, slot.startTime);
                                const hasConflict = isSlotConflictingWithPatient(dateStr, slot.startTime, slot.endTime);
                                const isDisabled = isPast || hasConflict;
                                
                                return (
                                  <button
                                    key={slot.startTime}
                                    onClick={() => !isDisabled && setSelectedSlot(slot)}
                                    disabled={isDisabled}
                                    className={`py-4 px-6 rounded-lg font-semibold text-base transition-all relative ${
                                      selectedSlot?.startTime === slot.startTime
                                        ? "border-2 border-orange-600 bg-orange-600 text-white"
                                        : isDisabled
                                        ? "border border-gray-300 bg-black text-white cursor-not-allowed opacity-70"
                                        : "border border-gray-200 bg-gray-100 text-gray-900 hover:border-orange-300 hover:bg-orange-50"
                                    }`}
                                    title={
                                      isPast 
                                        ? 'Đã qua giờ' 
                                        : hasConflict 
                                        ? 'Bạn đã có lịch khám trong khung giờ này' 
                                        : ''
                                    }
                                  >
                                    {formatTime(slot.startTime)}
                                    {hasConflict && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-[380px] bg-white rounded-2xl shadow-lg p-8 h-fit sticky top-8">
            <div className="font-bold text-xl mb-4">Thông tin đặt lịch</div>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ đã chọn:</div>
                <div className="space-y-2">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId);
                    return (
                      <div key={serviceId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-900">{service?.name}</span>
                          <span className="font-semibold text-gray-900">{formatPrice(service?.price || 0)}</span>
                        </div>
                        {/* Duration badge in sidebar */}
                        {service?.minDuration && (
                          <div className="flex items-center text-xs">
                            <span className={`px-2 py-0.5 rounded ${
                              service.minDuration < 30 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-orange-50 text-orange-700'
                            }`}>
                              ⏱ {service.minDuration} phút {service.minDuration < 30 ? '(Nhanh)' : '(Cần thời gian)'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Duration Summary */}
                {getTotalDuration() > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tổng thời gian:</span>
                    <span className="font-semibold text-orange-600">{getTotalDuration()} phút</span>
                  </div>
                )}
                
                {/* Price Summary with Discount */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tổng giá dịch vụ:</span>
                    <span className="font-medium text-gray-900">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600">Giảm 10% (online):</span>
                    <span className="font-medium text-green-600">-{formatPrice(getTotalPrice() - applyDiscount(getTotalPrice()))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-semibold">Sau giảm giá:</span>
                    <span className="text-base font-bold text-orange-600">{formatPrice(applyDiscount(getTotalPrice()))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-orange-50 -mx-2 px-2 py-2 rounded">
                    <span className="text-orange-700 font-semibold">Cần đặt cọc (50%):</span>
                    <span className="text-base font-bold text-orange-600">{formatPrice(calculateDeposit(applyDiscount(getTotalPrice())))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Time */}
            {selectedSlot && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">Thời gian:</div>
                <div className="text-sm text-gray-900">
                  <div className="font-medium">{weekSchedule[selectedDay].label}</div>
                  <div className="text-orange-600 font-semibold mt-1">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handlePayment}
              className={`w-full font-bold text-base border-none rounded-lg py-4 mb-3 transition-all ${
                selectedSlot && selectedServices.length > 0
                  ? "bg-orange-600 text-white cursor-pointer hover:bg-orange-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!selectedSlot || selectedServices.length === 0}
            >
              {selectedServices.length > 0 
                ? `Đặt cọc ${formatPrice(calculateDeposit(applyDiscount(getTotalPrice())))} và xác nhận`
                : 'Thanh toán và đặt lịch'
              }
            </button>
            <div className="text-xs text-gray-500 text-center leading-relaxed">
              {selectedServices.length > 0 
                ? 'Bạn chỉ cần thanh toán 50% giá trị đơn hàng để giữ lịch hẹn. Số tiền còn lại sẽ thanh toán khi đến khám.'
                : 'Bằng cách nhấn nút thanh toán, bạn đã đồng ý với các điều khoản đặt lịch'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-gray-200/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chọn dịch vụ y tế dự phòng</h2>
                <p className="text-sm text-gray-500 mt-1">Chọn một hoặc nhiều dịch vụ</p>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Info Banner */}
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-orange-900 mb-1">Ưu đãi đặt lịch online:</div>
                    <ul className="text-xs text-orange-800 space-y-1">
                      <li>✓ Giảm 10% tổng giá trị dịch vụ</li>
                      <li>✓ Chỉ cần đặt cọc 50% để giữ lịch hẹn</li>
                      <li>✓ Thanh toán số tiền còn lại khi đến khám</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? "border-orange-600 bg-orange-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{service.name}</div>
                        <div className="text-orange-600 font-bold mt-1">{formatPrice(service.price)}</div>
                        
                        {/* Duration Badge */}
                        {service.minDuration && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              service.minDuration < 30 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {service.minDuration} phút
                            </span>
                            <span className={`text-xs ${
                              service.minDuration < 30 
                                ? 'text-green-600' 
                                : 'text-orange-600'
                            }`}>
                              {service.minDuration < 30 
                                ? '(Có thể rời khỏi chờ kết quả)' 
                                : '(Phải ở tại chỗ)'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedServices.includes(service.id)
                          ? "bg-orange-600 border-orange-600"
                          : "border-gray-300"
                      }`}>
                        {selectedServices.includes(service.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">Đã chọn {selectedServices.length} dịch vụ</div>
                
                {/* Duration Info */}
                {selectedServices.length > 0 && getTotalDuration() > 0 && (
                  <div className="mb-2">
                    <div className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tổng thời gian: <span className="font-semibold ml-1">{getTotalDuration()} phút</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-5">
                      {(() => {
                        const longServices = selectedServices.filter(sid => {
                          const s = services.find(x => x.id === sid);
                          return s && s.minDuration && s.minDuration >= 30;
                        });
                        const shortServices = selectedServices.filter(sid => {
                          const s = services.find(x => x.id === sid);
                          return s && (!s.minDuration || s.minDuration < 30);
                        });
                        if (longServices.length > 0 && shortServices.length > 0) {
                          return '⚡ Dịch vụ nhanh có thể làm đồng thời, dịch vụ lâu làm tuần tự';
                        } else if (longServices.length > 1) {
                          return '⏱️ Các dịch vụ sẽ được thực hiện tuần tự';
                        } else {
                          return '✓ Thời gian ước tính cho tất cả dịch vụ';
                        }
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Price Breakdown */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng giá dịch vụ:</span>
                    <span className="font-medium text-gray-900">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Giảm giá (10% đặt online):</span>
                    <span className="font-medium text-green-600">-{formatPrice(getTotalPrice() - applyDiscount(getTotalPrice()))}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Sau giảm giá:</span>
                    <span className="font-semibold text-orange-600">{formatPrice(applyDiscount(getTotalPrice()))}</span>
                  </div>
                  <div className="flex justify-between text-sm pb-1">
                    <span className="text-orange-600">Cần đặt cọc (50%):</span>
                    <span className="font-bold text-orange-600">{formatPrice(calculateDeposit(applyDiscount(getTotalPrice())))}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="ml-6 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
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

export default BookingPreventive;
