import React, { useState, useEffect } from 'react';
import { DaySchedule, TimeSlot, MedicalExamination, DiagnosticSlot } from '../../types/booking.types';
import { formatTime, isSlotInPast, addMinutesToTime } from '../../utils/bookingHelpers';

interface TimeSlotPickerProps {
  weekSchedule: DaySchedule[];
  selectedDay: number;
  onSelectDay: (index: number) => void;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  bookingType: 'CONSULTATION_ONLY' | 'SERVICE_AND_CONSULTATION' | null;
  selectedServices: string[];
  services: MedicalExamination[];
  diagnosticSlots: DiagnosticSlot[];
  setDiagnosticSlots: (slots: DiagnosticSlot[]) => void;
  consultationSlot: TimeSlot | null;
  setConsultationSlot: (slot: TimeSlot | null) => void;
  getTotalDuration: () => number;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  weekSchedule,
  selectedDay,
  onSelectDay,
  onSelectSlot,
  bookingType,
  selectedServices,
  services,
  diagnosticSlots,
  setDiagnosticSlots,
  consultationSlot,
  setConsultationSlot,
}) => {
  const [showConsultationSlots, setShowConsultationSlots] = useState(false);

  const findService = (serviceId: string) => {
    return services.find(s => s.id === serviceId);
  };

  // ✅ FIX 1: Add all dependencies
  useEffect(() => {
    console.log('useEffect triggered:', { bookingType, selectedServices, selectedDay });
    
    if (bookingType === 'SERVICE_AND_CONSULTATION' && selectedServices.length > 0) {
      const day = weekSchedule[selectedDay];
      if (!day || !day.slots) {
        console.log('No day or slots available');
        return;
      }

      const newDiagnosticSlots: DiagnosticSlot[] = selectedServices.map(serviceId => {
        const service = findService(serviceId);
        console.log('Creating diagnostic slot for:', service?.name);
        return {
          serviceId,
          serviceName: service?.name || '',
          startTime: '',
          endTime: '',
          duration: service?.minDuration || 0
        };
      });
      
      setDiagnosticSlots(newDiagnosticSlots);
      setConsultationSlot(null);
      setShowConsultationSlots(false);
    } else if (bookingType === 'CONSULTATION_ONLY') {
      // ✅ FIX 2: Reset diagnostic slots when switching to consultation only
      setDiagnosticSlots([]);
      setShowConsultationSlots(false);
    }
  }, [bookingType, selectedServices, selectedDay, weekSchedule, services]);

  const handleDiagnosticSlotClick = (slot: TimeSlot, slotIndex: number) => {
    const day = weekSchedule[selectedDay];
    if (!day || !slot.available) return;
    if (isSlotInPast(day.date, slot.startTime)) return;

    const updatedSlots = [...diagnosticSlots];
    const currentSlot = updatedSlots[slotIndex];

    currentSlot.startTime = slot.startTime;
    currentSlot.endTime = addMinutesToTime(slot.startTime, currentSlot.duration);

    for (let i = slotIndex + 1; i < updatedSlots.length; i++) {
      const prevSlot = updatedSlots[i - 1];
      updatedSlots[i].startTime = prevSlot.endTime;
      updatedSlots[i].endTime = addMinutesToTime(prevSlot.endTime, updatedSlots[i].duration);
    }

    setDiagnosticSlots(updatedSlots);

    const allFilled = updatedSlots.every(s => s.startTime && s.endTime);
    console.log('All diagnostic slots filled:', allFilled);
    
    if (allFilled) {
      setShowConsultationSlots(true);
      setConsultationSlot(null);
    } else {
      setShowConsultationSlots(false);
    }
  };

  const handleConsultationSlotClick = (slot: TimeSlot) => {
    const day = weekSchedule[selectedDay];
    if (!day || !slot.available) return;
    if (isSlotInPast(day.date, slot.startTime)) return;

    if (bookingType === 'SERVICE_AND_CONSULTATION') {
      if (diagnosticSlots.length === 0 || !diagnosticSlots[diagnosticSlots.length - 1].endTime) {
        console.log('Cannot select consultation: diagnostic slots not complete');
        return;
      }
      const lastDiagnosticEndTime = diagnosticSlots[diagnosticSlots.length - 1].endTime;
      if (slot.startTime < lastDiagnosticEndTime) {
        console.log('Consultation slot must be after diagnostic slots');
        return;
      }
    }

    console.log('Selected consultation slot:', slot.startTime);
    setConsultationSlot(slot);
    onSelectSlot(slot);
  };

  const isDiagnosticSlotSelectable = (slot: TimeSlot, slotIndex: number) => {
    if (!slot.available) return false;
    const day = weekSchedule[selectedDay];
    if (isSlotInPast(day.date, slot.startTime)) return false;
    if (slotIndex === 0) return true;
    const prevSlot = diagnosticSlots[slotIndex - 1];
    if (!prevSlot.endTime) return false;
    return slot.startTime >= prevSlot.endTime;
  };

  const isConsultationSlotSelectable = (slot: TimeSlot) => {
    if (!slot.available) return false;
    const day = weekSchedule[selectedDay];
    if (isSlotInPast(day.date, slot.startTime)) return false;
    if (bookingType === 'SERVICE_AND_CONSULTATION') {
      if (diagnosticSlots.length === 0 || !diagnosticSlots[diagnosticSlots.length - 1].endTime) {
        return false;
      }
      const lastDiagnosticEndTime = diagnosticSlots[diagnosticSlots.length - 1].endTime;
      return slot.startTime >= lastDiagnosticEndTime;
    }
    return true;
  };

  if (weekSchedule.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Không có lịch khám cho bác sĩ này
      </div>
    );
  }

  const day = weekSchedule[selectedDay];
  
  // ✅ FIX 3: Add safety check
  if (!day) {
    return (
      <div className="p-8 text-center text-gray-500">
        Vui lòng chọn ngày khám
      </div>
    );
  }

  const currentWeekLabel = day?.weekLabel || 'Tuần này';
  
  const thisWeek = weekSchedule.filter(d => d.weekLabel === 'Tuần này');
  const nextWeek = weekSchedule.filter(d => d.weekLabel === 'Tuần sau');

  // ✅ FIX 4: Add debug logging
  console.log('Render state:', {
    bookingType,
    hasDay: !!day,
    hasSlots: day?.slots?.length || 0,
    diagnosticSlotsCount: diagnosticSlots.length,
    showConsultationSlots,
    consultationSlot: consultationSlot?.startTime
  });

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="flex gap-4 border-b border-gray-200">
        {['Tuần này', 'Tuần sau'].map((week) => {
          const weekDays = week === 'Tuần này' ? thisWeek : nextWeek;
          if (weekDays.length === 0) return null;
          
          return (
            <button
              key={week}
              onClick={() => {
                const firstDayIndex = weekSchedule.findIndex(d => d.weekLabel === week);
                if (firstDayIndex >= 0) onSelectDay(firstDayIndex);
              }}
              className={`px-6 py-3 font-medium transition-colors ${
                currentWeekLabel === week
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {week}
            </button>
          );
        })}
      </div>

      {/* Day Selector - Scrollable */}
      <div className="relative">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {(currentWeekLabel === 'Tuần này' ? thisWeek : nextWeek).map((dayData) => {
              const actualIndex = weekSchedule.findIndex(d => d.date === dayData.date);
              const hasSlots = dayData.slots && dayData.slots.length > 0;
              const hasAvailableSlots = dayData.slots?.some(s => s.available);
              
              return (
                <button
                  key={dayData.date}
                  onClick={() => hasSlots && onSelectDay(actualIndex)}
                  disabled={!hasSlots}
                  className={`p-4 rounded-lg text-center transition-all min-w-[120px] ${
                    selectedDay === actualIndex
                      ? 'bg-blue-600 text-white shadow-md'
                      : hasAvailableSlots
                      ? 'bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-sm font-medium">{dayData.label}</div>
                  <div className="text-xs mt-1">
                    {hasAvailableSlots ? `${dayData.slots.filter(s => s.available).length} slot` : 'Không có'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Slots Section */}
      {day && day.slots && day.slots.length > 0 ? (
        <div className="space-y-6">
          {/* ✅ FIX 5: Better condition check */}
          {bookingType === 'SERVICE_AND_CONSULTATION' && diagnosticSlots.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 sticky top-0 bg-white z-10 py-2">
                Chọn giờ làm dịch vụ
              </h3>
              
              {diagnosticSlots.map((diagSlot, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-700">
                      <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-center text-xs leading-6 mr-2">
                        {idx + 1}
                      </span>
                      {diagSlot.serviceName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {diagSlot.duration} phút
                      {diagSlot.startTime && (
                        <span className="ml-2 text-blue-600 font-medium">
                          {formatTime(diagSlot.startTime)} - {formatTime(diagSlot.endTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-[180px] overflow-y-auto border border-gray-200 rounded-md bg-white">
                    <div className="grid grid-cols-6 gap-2 p-3">
                      {day.slots.map((slot, slotIdx) => {
                        const selectable = isDiagnosticSlotSelectable(slot, idx);
                        const isSelected = diagSlot.startTime === slot.startTime;
                        const isPast = isSlotInPast(day.date, slot.startTime);

                        return (
                          <button
                            key={slotIdx}
                            onClick={() => selectable && handleDiagnosticSlotClick(slot, idx)}
                            disabled={!selectable}
                            className={`p-2 rounded text-sm transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white font-medium shadow-sm'
                                : selectable
                                ? 'bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                                : isPast
                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {formatTime(slot.startTime)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Consultation Slots */}
          {(bookingType === 'CONSULTATION_ONLY' || 
            (bookingType === 'SERVICE_AND_CONSULTATION' && showConsultationSlots)) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-gray-800 mb-3 sticky top-0 bg-green-50 z-10 py-2">
                {bookingType === 'SERVICE_AND_CONSULTATION' 
                  ? '🩺 Chọn giờ khám bệnh (sau dịch vụ)'
                  : '🩺 Chọn giờ khám'}
              </h3>
              
              <div className="max-h-[200px] overflow-y-auto border border-green-200 rounded-md bg-white">
                <div className="grid grid-cols-6 gap-2 p-3">
                  {day.slots.map((slot, idx) => {
                    const selectable = isConsultationSlotSelectable(slot);
                    const isSelected = consultationSlot?.startTime === slot.startTime;
                    const isPast = isSlotInPast(day.date, slot.startTime);

                    return (
                      <button
                        key={idx}
                        onClick={() => selectable && handleConsultationSlotClick(slot)}
                        disabled={!selectable}
                        className={`p-2 rounded text-sm transition-all ${
                          isSelected
                            ? 'bg-green-600 text-white font-medium shadow-sm'
                            : selectable
                            ? 'bg-white border border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-700'
                            : isPast
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Không có lịch khám cho ngày này</p>
        </div>
      )}
    </div>
  );
};
