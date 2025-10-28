package com.example.ohms.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.ohms.entity.Appointment;

import jakarta.transaction.Transactional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    
    // Find appointments by patient ID
    List<Appointment> findByPatientId(String patientId);
    
    // Find appointments by doctor ID
    List<Appointment> findByDoctorId(String doctorId);
    
    // Find appointments by date
    List<Appointment> findByWorkDate(LocalDate workDate);
    
    // Find appointments by patient and date
    List<Appointment> findByPatientIdAndWorkDate(String patientId, LocalDate workDate);
    
    // Find appointments by doctor and date
    List<Appointment> findByDoctorIdAndWorkDate(String doctorId, LocalDate workDate);
    
    // Find appointments by date range
    List<Appointment> findByWorkDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Find appointments by doctor and date range
    List<Appointment> findByDoctorIdAndWorkDateBetween(String doctorId, LocalDate startDate, LocalDate endDate);
    
    // Find appointments by patient and date range
    List<Appointment> findByPatientIdAndWorkDateBetween(String patientId, LocalDate startDate, LocalDate endDate);
    
    // Check if doctor has appointment at specific time
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate = :workDate AND " +
           "((a.startTime <= :startTime AND a.endTime > :startTime) OR " +
           "(a.startTime < :endTime AND a.endTime >= :endTime) OR " +
           "(a.startTime >= :startTime AND a.endTime <= :endTime))")
    boolean existsByDoctorAndTimeSlot(@Param("doctorId") String doctorId, 
                                     @Param("workDate") LocalDate workDate,
                                     @Param("startTime") LocalTime startTime, 
                                     @Param("endTime") LocalTime endTime);
    
    // Check if patient has appointment at specific time
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.patient.id = :patientId AND a.workDate = :workDate AND " +
           "((a.startTime <= :startTime AND a.endTime > :startTime) OR " +
           "(a.startTime < :endTime AND a.endTime >= :endTime) OR " +
           "(a.startTime >= :startTime AND a.endTime <= :endTime))")
    boolean existsByPatientAndTimeSlot(@Param("patientId") String patientId, 
                                      @Param("workDate") LocalDate workDate,
                                      @Param("startTime") LocalTime startTime, 
                                      @Param("endTime") LocalTime endTime);
    
    // Find appointments for today by doctor
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate = CURRENT_DATE ORDER BY a.startTime")
    List<Appointment> findTodayAppointmentsByDoctor(@Param("doctorId") String doctorId);
    
    // Find upcoming appointments by patient
    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId AND a.workDate >= CURRENT_DATE ORDER BY a.workDate, a.startTime")
    List<Appointment> findUpcomingAppointmentsByPatient(@Param("patientId") String patientId);
    
    // Find upcoming appointments by doctor
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate >= CURRENT_DATE ORDER BY a.workDate, a.startTime")
    List<Appointment> findUpcomingAppointmentsByDoctor(@Param("doctorId") String doctorId);
    
    // Find past appointments by patient
    @Query("SELECT a FROM Appointment a WHERE a.patient.id = :patientId AND a.workDate < CURRENT_DATE ORDER BY a.workDate DESC, a.startTime DESC")
    List<Appointment> findPastAppointmentsByPatient(@Param("patientId") String patientId);
    
    // Find past appointments by doctor
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate < CURRENT_DATE ORDER BY a.workDate DESC, a.startTime DESC")
    List<Appointment> findPastAppointmentsByDoctor(@Param("doctorId") String doctorId);
    
    // Find appointments with patient and doctor details
    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient WHERE a.id = :appointmentId")
    Optional<Appointment> findByIdWithDetails(@Param("appointmentId") String appointmentId);
    
    // Find appointments by doctor with patient details for a specific date
    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient WHERE a.doctor.id = :doctorId AND a.workDate = :workDate ORDER BY a.startTime")
    List<Appointment> findByDoctorAndDateWithPatientDetails(@Param("doctorId") String doctorId, @Param("workDate") LocalDate workDate);
    
    // Find appointments by patient with all details for a specific date
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.doctor WHERE a.patient.id = :patientId AND a.workDate = :workDate AND a.status = 'Schedule' ORDER BY a.startTime")
    List<Appointment> findByPatientAndDate(@Param("patientId") String patientId, @Param("workDate") LocalDate workDate);
    
    // Count appointments by doctor for a specific date
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate = :workDate")
    long countByDoctorAndDate(@Param("doctorId") String doctorId, @Param("workDate") LocalDate workDate);
    
    // Count appointments by patient for a specific date
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.id = :patientId AND a.workDate = :workDate")
    long countByPatientAndDate(@Param("patientId") String patientId, @Param("workDate") LocalDate workDate);
    
    // Find appointments within time range for a specific date and doctor
    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate = :workDate AND " +
           "a.startTime >= :startTime AND a.endTime <= :endTime ORDER BY a.startTime")
    List<Appointment> findByDoctorDateAndTimeRange(@Param("doctorId") String doctorId, 
                                                  @Param("workDate") LocalDate workDate,
                                                  @Param("startTime") LocalTime startTime, 
                                                  @Param("endTime") LocalTime endTime);
    
    // Delete appointments by patient ID
    void deleteByPatientId(String patientId);
    
    // Delete appointments by doctor ID
    void deleteByDoctorId(String doctorId);
    
    // Custom method to create appointment with conflict validation
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN false ELSE true END FROM Appointment a " +
           "WHERE (a.doctor.id = :doctorId OR a.patient.id = :patientId) AND a.workDate = :workDate AND " +
           "((a.startTime <= :startTime AND a.endTime > :startTime) OR " +
           "(a.startTime < :endTime AND a.endTime >= :endTime) OR " +
           "(a.startTime >= :startTime AND a.endTime <= :endTime))")
    boolean canCreateAppointment(@Param("doctorId") String doctorId,
                                @Param("patientId") String patientId,
                                @Param("workDate") LocalDate workDate,
                                @Param("startTime") LocalTime startTime,
                                @Param("endTime") LocalTime endTime);
    
    // Find available time slots for a doctor on a specific date
    @Query("SELECT a.startTime, a.endTime FROM Appointment a WHERE a.doctor.id = :doctorId AND a.workDate = :workDate ORDER BY a.startTime")
    List<Object[]> findBookedTimeSlotsByDoctorAndDate(@Param("doctorId") String doctorId, @Param("workDate") LocalDate workDate);

    /**
     * Gán một bác sĩ cho một cuộc hẹn đã tồn tại.
     * @param appointmentId ID của cuộc hẹn cần cập nhật.
     * @param doctorId ID của bác sĩ để gán vào.
     * @return Số lượng bản ghi đã được cập nhật (thường là 1 hoặc 0).
     */
    @Transactional
    @Modifying
    @Query("UPDATE Appointment a SET a.doctor.id = :doctorId WHERE a.id = :appointmentId")
    int assignDoctorToAppointment(@Param("appointmentId") String appointmentId, @Param("doctorId") String doctorId);

    
}
