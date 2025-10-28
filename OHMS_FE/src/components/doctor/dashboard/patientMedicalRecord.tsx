// MedicalRecord.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faCalendar, faUser, faStethoscope, faPills, faFileAlt, faTrash, faFlask } from '@fortawesome/free-solid-svg-icons';

type Medicine = {
    id: string;
    name: string;
    quantity: number;
    type: string;
};

type MedicinePrescriptionItem = {
    medicineId: string;
    amount: number;
    instruction: string;
};

type PrescriptionMedicine = {
    id: string;
    name: string;
    dosage: string;
    instructions: string;
};

type MedicalExamination = {
    id: string;
    name: string;
    description?: string;
    price?: number;
};

type ServiceAppointment = {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    medicalExaminations?: MedicalExamination[];
};

type Prescription = {
    id: string;
    amount: number;
    status: string;
    medicines: PrescriptionMedicine[];
    createdAt?: string;
};

type MedicalRecord = {
    id: string;
    appointmentId: string;
    appointmentDate: string;
    appointmentTime: string;
    patientId: string;
    patientName: string;
    patientEmail: string | null;
    patientPhone: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string | null;
    symptoms: string;
    diagnosis: string;
    prescription: Prescription;
    medicalExaminations: MedicalExamination[];
    createdAt: string;
};

type MedicalRecordModalProps = {
    patientId: string;
    patientName: string;
    appointmentId?: string;
    isOpen: boolean;
    onClose: () => void;
};

export default function MedicalRecordModal({ 
    patientId, 
    patientName, 
    appointmentId,
    isOpen, 
    onClose 
}: MedicalRecordModalProps) {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        appointmentId: appointmentId || '',
        symptoms: '',
        diagnosis: ''
    });

    // Medicine states
    const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
    const [selectedMedicines, setSelectedMedicines] = useState<MedicinePrescriptionItem[]>([]);
    const [loadingMedicines, setLoadingMedicines] = useState(false);

    // Medical Examination states for current appointment only
    const [availableMedicalExaminations, setAvailableMedicalExaminations] = useState<MedicalExamination[]>([]);
    const [selectedMedicalExaminations, setSelectedMedicalExaminations] = useState<string[]>([]);
    const [loadingMedicalExams, setLoadingMedicalExams] = useState(false);
    const [updatingMedicalExams, setUpdatingMedicalExams] = useState(false);

    // Service Appointments state
    const [serviceAppointments, setServiceAppointments] = useState<ServiceAppointment[]>([]);
    const [searchServiceFilter, setSearchServiceFilter] = useState<string>('');
    const [searchMedicineFilter, setSearchMedicineFilter] = useState<string>('');

    // Current appointment info (from props, not from clicking records)
    const [currentAppointment, setCurrentAppointment] = useState<{
        appointmentId: string;
        appointmentDate: string;
        appointmentTime: string;
        existingExaminations: MedicalExamination[];
    } | null>(null);

    // Combined useEffect - Handle modal opening and data fetching
    useEffect(() => {
        if (!isOpen) return;

        // Auto-fill appointmentId if provided
        if (appointmentId) {
            setFormData(prev => ({
                ...prev,
                appointmentId: appointmentId
            }));
            
            // Load medical examinations for right panel
            fetchMedicalExaminations();
        }

        // Fetch medical records
        fetchMedicalRecords();

        // Cleanup when modal closes
        return () => {
            // Reset form when modal closes
            if (!isOpen) {
                setFormData({
                    appointmentId: appointmentId || '',
                    symptoms: '',
                    diagnosis: ''
                });
                setSelectedMedicines([]);
                setShowCreateModal(false);
                setCurrentAppointment(null);
            }
        };
    }, [isOpen, patientId, appointmentId]);

    // Load current appointment info when appointmentId is provided
    useEffect(() => {
        if (!isOpen || !appointmentId) return;

        // Fetch appointment details
        const fetchAppointmentDetails = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(
                    `http://localhost:8080/appointments/${appointmentId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log('📦 Appointment response:', response.data);
                
                // Response trả về trực tiếp appointment object
                const appointment = response.data;
                
                if (!appointment || !appointment.id) {
                    console.error('❌ Invalid appointment data:', appointment);
                    return;
                }

                // Set service appointments from API response
                if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
                    setServiceAppointments(appointment.serviceAppointments);
                    console.log('🔬 Service Appointments loaded:', appointment.serviceAppointments);
                }

                setCurrentAppointment({
                    appointmentId: appointment.id,
                    appointmentDate: appointment.workDate,
                    appointmentTime: appointment.startTime,
                    existingExaminations: appointment.medicalExaminations || []
                });
            } catch (err: any) {
                console.error('Error fetching appointment details:', err);
                console.error('Error response:', err.response?.data);
            }
        };

        fetchAppointmentDetails();
    }, [isOpen, appointmentId]);

    // Fetch medicines only when create modal opens
    useEffect(() => {
        if (showCreateModal && availableMedicines.length === 0) {
            fetchMedicines();
        }
    }, [showCreateModal]);

    const fetchMedicalRecords = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `http://localhost:8080/medical-records/patient/${patientId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Medical Records:', response.data);
            setRecords(response.data.results || []);
        } catch (err: any) {
            console.error('Error fetching medical records:', err);
            setError(err.response?.data?.message || 'Failed to fetch medical records');
        } finally {
            setLoading(false);
        }
    };

    const fetchMedicines = async () => {
        setLoadingMedicines(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                'http://localhost:8080/medicine',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Medicines:', response.data);
            setAvailableMedicines(response.data.results || []);
        } catch (err: any) {
            console.error('Error fetching medicines:', err);
            alert('Failed to fetch medicines');
        } finally {
            setLoadingMedicines(false);
        }
    };

    const fetchMedicalExaminations = async () => {
        setLoadingMedicalExams(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                'http://localhost:8080/medical-examination',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Medical Examinations:', response.data);
            setAvailableMedicalExaminations(response.data.results || []);
        } catch (err: any) {
            console.error('Error fetching medical examinations:', err);
            alert('Failed to fetch medical examinations');
        } finally {
            setLoadingMedicalExams(false);
        }
    };

    const updateAppointmentMedicalExams = async () => {
        if (!currentAppointment) return;

        try {
            const token = localStorage.getItem('accessToken');
            
            if (selectedMedicalExaminations.length === 0) {
                alert('Please select at least one medical examination');
                return;
            }

            setUpdatingMedicalExams(true);

            // Get current time + 5 minutes as base time
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5);
            
            // Get today's date in YYYY-MM-DD format
            const workDate = now.toISOString().split('T')[0];

            // Helper function to format time as HH:MM:SS
            const formatTime = (date: Date) => {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                return `${hours}:${minutes}:${seconds}`;
            };

            // Create service appointments for each selected medical examination
            const appointmentPromises = selectedMedicalExaminations.map(async (examId, index) => {
                // Calculate start time: base time + (index * 5 minutes)
                const startDateTime = new Date(now);
                startDateTime.setMinutes(startDateTime.getMinutes() + (index * 5));
                
                // Calculate end time: start time + 1 hour
                const endDateTime = new Date(startDateTime);
                endDateTime.setHours(endDateTime.getHours() + 1);

                const appointmentData = {
                    patientId: patientId,
                    workDate: workDate,
                    startTime: formatTime(startDateTime),
                    endTime: formatTime(endDateTime),
                    parentAppointmentId: currentAppointment.appointmentId,
                    medicalExaminationIds: [examId]
                };

                console.log(`📅 Creating service appointment ${index + 1}:`, appointmentData);

                return axios.post(
                    `http://localhost:8080/appointments`,
                    appointmentData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
            });

            // Wait for all appointments to be created
            await Promise.all(appointmentPromises);

            console.log('✅ All service appointments created successfully!');
            alert(`Đã tạo ${selectedMedicalExaminations.length} lịch khám dịch vụ thành công!`);
            
            // Refresh appointment details to show updated service appointments
            const response = await axios.get(
                `http://localhost:8080/appointments/${currentAppointment.appointmentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            const appointment = response.data;
            
            // Update service appointments
            if (appointment.serviceAppointments && appointment.serviceAppointments.length > 0) {
                setServiceAppointments(appointment.serviceAppointments);
            }
            
            setCurrentAppointment({
                appointmentId: appointment.id,
                appointmentDate: appointment.workDate,
                appointmentTime: appointment.startTime,
                existingExaminations: appointment.medicalExaminations || []
            });
            
            // Clear selected examinations
            setSelectedMedicalExaminations([]);
            
            fetchMedicalRecords(); // Refresh records
        } catch (err: any) {
            console.error('Error creating service appointments:', err);
            alert(err.response?.data?.message || 'Failed to create service appointments');
        } finally {
            setUpdatingMedicalExams(false);
        }
    };

    const toggleMedicalExamination = (examId: string) => {
        setSelectedMedicalExaminations(prev =>
            prev.includes(examId)
                ? prev.filter(id => id !== examId)
                : [...prev, examId]
        );
    };

    const addMedicine = () => {
        setSelectedMedicines([
            ...selectedMedicines,
            { medicineId: '', amount: 1, instruction: '' }
        ]);
    };

    const removeMedicine = (index: number) => {
        setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
    };

    const updateMedicine = (index: number, field: keyof MedicinePrescriptionItem, value: string | number) => {
        const updated = [...selectedMedicines];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedMedicines(updated);
    };

    const handleCreateRecord = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            
            // Validate form
            if (!formData.appointmentId || !formData.symptoms || !formData.diagnosis) {
                alert('Please fill in all required fields (Appointment ID, Symptoms, Diagnosis)');
                return;
            }

            let prescriptionId = null;

            if (selectedMedicines.length > 0) {
                if (!selectedMedicines.every(m => m.medicineId)) {
                    alert('Please select medicine for all prescription items');
                    return;
                }

                console.log('Creating prescription with medicines:', selectedMedicines);
                const createPrescriptionResponse = await axios.post(
                    `http://localhost:8080/prescription/${patientId}`,
                    {
                        medicinePrescription: selectedMedicines
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                // Debug: Log full response structure
                console.log('📦 Full response:', createPrescriptionResponse);
                console.log('📦 Response data:', createPrescriptionResponse.data);
                console.log('📦 Response results:', createPrescriptionResponse.data?.results);
                
                // Get prescription ID from response
                const results = createPrescriptionResponse.data?.results;
                
                // Check if results is an array or object
                if (Array.isArray(results)) {
                    // If it's an array, get the first item
                    prescriptionId = results[0]?.id;
                    console.log('⚠️ Results is array, taking first item:', results[0]);
                } else if (results?.id) {
                    // If it's an object with id
                    prescriptionId = results.id;
                    console.log('✅ Results is object with id:', results.id);
                } else {
                    console.error('❌ Unexpected response structure:', results);
                    throw new Error('Failed to get prescription ID from response');
                }
                
                if (prescriptionId) {
                    console.log('✅ Prescription created successfully!');
                    console.log('Prescription ID:', prescriptionId);
                } else {
                    throw new Error('Prescription ID is null or undefined');
                }
            }

            // Step 3: Create medical record
            console.log('Creating medical record...');
            const medicalRecordPayload: any = {
                appointmentId: formData.appointmentId,
                symptoms: formData.symptoms,
                diagnosis: formData.diagnosis
            };

            // Add prescriptionId if exists
            if (prescriptionId) {
                medicalRecordPayload.prescriptionId = prescriptionId;
            }

            await axios.post(
                'http://localhost:8080/medical-records',
                medicalRecordPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Reset form
            setFormData({
                appointmentId: appointmentId || '',
                symptoms: '',
                diagnosis: ''
            });
            setSelectedMedicines([]);
            
            setShowCreateModal(false);
            fetchMedicalRecords(); // Refresh records
            alert('Medical record created successfully!');
        } catch (err: any) {
            console.error('Error creating medical record:', err);
            alert(err.response?.data?.message || 'Failed to create medical record');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Modal with Split View */}
            <div 
                className="fixed inset-0 bg-blue-100/80 backdrop-blur-md z-50 flex items-center justify-center"
                onClick={onClose}
            >
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-7xl max-h-[90vh] overflow-hidden flex"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Left Side - Medical Records */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#0a5c87] to-[#046791] px-8 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-white text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Medical Records</h2>
                                    <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faUser} className="text-xs" />
                                        {patientName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-white text-[#046791] px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    New Record
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-white hover:bg-white/20 p-3 rounded-xl transition-all duration-200"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>
                        </div>

                        {/* Content - Medical Records List */}
                        <div className="overflow-y-auto flex-1 p-8 bg-gray-50">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#046791] border-t-transparent mx-auto mb-4"></div>
                                        <p className="text-gray-600 font-medium">Loading medical records...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center py-20">
                                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                                        <p className="text-xl font-semibold text-red-700 mb-2">Error Loading Records</p>
                                        <p className="text-red-600">{error}</p>
                                    </div>
                                </div>
                            ) : records.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 max-w-md mx-auto">
                                        <FontAwesomeIcon icon={faStethoscope} className="text-7xl mb-6 text-gray-300" />
                                        <p className="text-xl font-semibold text-gray-700 mb-2">No Medical Records Found</p>
                                        <p className="text-gray-500">Create a new record to get started</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {records.map((record) => (
                                        <div 
                                            key={record.id} 
                                            className="bg-white border-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-gray-200"
                                        >
                                            {/* Record Header */}
                                            <div className="bg-gradient-to-r from-[#EEFAFE] to-[#e3f2fd] px-6 py-4 border-b-2 border-[#046791]/10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-[#046791] p-2.5 rounded-lg">
                                                            <FontAwesomeIcon icon={faCalendar} className="text-white text-sm" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-gray-800 text-lg">
                                                                {formatDate(record.appointmentDate)}
                                                            </span>
                                                            <span className="text-gray-600 ml-3 text-sm">
                                                                {formatTime(record.appointmentTime)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
                                                        <span className="text-gray-500">Bác sĩ: </span>
                                                        <span className="font-semibold text-[#046791]">{record.doctorName}</span>
                                                        {record.doctorSpecialty && (
                                                            <span className="text-gray-500 ml-2">• {record.doctorSpecialty}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Record Body */}
                                            <div className="p-6 space-y-4">
                                                {/* Symptoms */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FontAwesomeIcon icon={faStethoscope} className="text-gray-600 text-sm" />
                                                        <h4 className="text-sm font-semibold text-gray-700">Triệu chứng</h4>
                                                    </div>
                                                    <div className="bg-gray-50 border-l-3 border-gray-400 px-4 py-3 rounded">
                                                        <p className="text-gray-800 text-sm">{record.symptoms}</p>
                                                    </div>
                                                </div>

                                                {/* Diagnosis */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FontAwesomeIcon icon={faFileAlt} className="text-gray-600 text-sm" />
                                                        <h4 className="text-sm font-semibold text-gray-700">Chẩn đoán</h4>
                                                    </div>
                                                    <div className="bg-gray-50 border-l-3 border-gray-400 px-4 py-3 rounded">
                                                        <p className="text-gray-800 text-sm">{record.diagnosis}</p>
                                                    </div>
                                                </div>

                                                {/* Prescription */}
                                                {record.prescription && record.prescription.medicines.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <FontAwesomeIcon icon={faPills} className="text-gray-600 text-sm" />
                                                                <h4 className="text-sm font-semibold text-gray-700">Đơn thuốc</h4>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs px-3 py-1 rounded font-medium ${
                                                                    record.prescription.status === 'PENDING' 
                                                                        ? 'bg-gray-100 text-gray-700' 
                                                                        : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                    {record.prescription.status === 'PENDING' ? 'Chờ xử lý' : record.prescription.status}
                                                                </span>
                                                                <span className="text-sm font-semibold text-gray-800">
                                                                    {record.prescription.amount.toLocaleString('vi-VN')} ₫
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded border border-gray-200">
                                                            <table className="w-full">
                                                                <thead className="bg-gray-100 border-b border-gray-200">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Tên thuốc</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Số lượng</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Hướng dẫn</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {record.prescription.medicines.map((medicine, index) => (
                                                                        <tr 
                                                                            key={medicine.id} 
                                                                            className={`${index !== 0 ? 'border-t border-gray-100' : ''}`}
                                                                        >
                                                                            <td className="px-4 py-2 text-sm font-medium text-gray-800">{medicine.name}</td>
                                                                            <td className="px-4 py-2 text-sm text-gray-600">{medicine.dosage}</td>
                                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                                {medicine.instructions || 'Không có'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Medical Examinations */}
                                                {record.medicalExaminations && record.medicalExaminations.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FontAwesomeIcon icon={faFlask} className="text-gray-600 text-sm" />
                                                            <h4 className="text-sm font-semibold text-gray-700">Chỉ định cận lâm sàng</h4>
                                                        </div>
                                                        <div className="bg-gray-50 border-l-3 border-gray-400 px-4 py-3 rounded">
                                                            <div className="space-y-2">
                                                                {record.medicalExaminations.map((exam: MedicalExamination) => (
                                                                    <div key={exam.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200">
                                                                        <div className="flex items-center gap-2">
                                                                            <FontAwesomeIcon icon={faFlask} className="text-gray-600 text-sm" />
                                                                            <span className="text-sm text-gray-800">{exam.name}</span>
                                                                        </div>
                                                                        {exam.price && (
                                                                            <span className="text-sm text-gray-700 font-medium">
                                                                                {exam.price.toLocaleString('vi-VN')} ₫
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Current Appointment Medical Examinations Panel */}
                    {currentAppointment && (
                        <div className="w-[500px] border-l-2 border-gray-300 bg-white flex flex-col">
                            {/* Right Panel Header */}
                            <div className="bg-gray-100 px-6 py-5 border-b border-gray-300">
                                <div className="flex items-center gap-3 mb-2">
                                    <FontAwesomeIcon icon={faFlask} className="text-gray-700 text-xl" />
                                    <h3 className="text-xl font-semibold text-gray-800">Chỉ định cận lâm sàng</h3>
                                </div>
                                
  
                            </div>

                            {/* Medical Examinations List */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                {serviceAppointments.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
                                            Lịch khám dịch vụ ({serviceAppointments.length})
                                        </h4>
                                        <div className="space-y-3 bg-white rounded p-4 border border-gray-200">
                                            {serviceAppointments.map((serviceApp) => (
                                                <div key={serviceApp.id} className="border-l-4 border-blue-500 pl-3 py-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-gray-600">
                                                            {serviceApp.startTime} - {serviceApp.endTime}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            serviceApp.status === 'Schedule' 
                                                                ? 'bg-green-100 text-green-700'
                                                                : serviceApp.status === 'Completed'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {serviceApp.status}
                                                        </span>
                                                    </div>
                                                    {serviceApp.medicalExaminations && serviceApp.medicalExaminations.length > 0 && (
                                                        <div className="space-y-1">
                                                            {serviceApp.medicalExaminations.map((exam) => (
                                                                <div key={exam.id} className="flex items-center gap-2 text-sm">
                                                                    <FontAwesomeIcon icon={faFlask} className="text-blue-600 text-xs" />
                                                                    <span className="text-gray-800">{exam.name}</span>
                                                                    {exam.price && (
                                                                        <span className="text-gray-600 text-xs ml-auto">
                                                                            {exam.price.toLocaleString('vi-VN')} ₫
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Existing Medical Examinations - HIDDEN */}
                                {/* {currentAppointment.existingExaminations && currentAppointment.existingExaminations.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <span className="bg-gray-600 w-2 h-2 rounded-full"></span>
                                            Dịch vụ đã chọn
                                        </h4>
                                        <div className="space-y-2 bg-white rounded p-4 border border-gray-200">
                                            {currentAppointment.existingExaminations.map((exam: MedicalExamination) => (
                                                <div key={exam.id} className="flex items-center gap-2 text-sm">
                                                    <FontAwesomeIcon icon={faFlask} className="text-gray-600" />
                                                    <span className="text-gray-800">{exam.name}</span>
                                                    {exam.price && (
                                                        <span className="text-gray-700 font-medium ml-auto">
                                                            {exam.price.toLocaleString('vi-VN')} ₫
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )} */}

                                {/* Search Filter - CHỈ CHO PHẦN DƯỚI */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm dịch vụ..."
                                        value={searchServiceFilter}
                                        onChange={(e) => setSearchServiceFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                                    />
                                </div>

                                {/* Available Medical Examinations - CHỈ PHẦN NÀY BỊ FILTER */}
                                <div className="min-h-[300px]">
                                    {loadingMedicalExams ? (
                                        <div className="flex items-center justify-center py-20">
                                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-400 border-t-transparent"></div>
                                        </div>
                                    ) : availableMedicalExaminations.length === 0 ? (
                                        <div className="text-center py-10">
                                            <p className="text-gray-500">Không có dịch vụ khả dụng</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex-shrink-0">
                                                Chọn thêm dịch vụ ({(() => {
                                                    // Get all exam IDs from service appointments
                                                    const selectedExamIds = new Set(
                                                        serviceAppointments.flatMap(sa => 
                                                            sa.medicalExaminations?.map(e => e.id) || []
                                                        )
                                                    );
                                                    
                                                    return availableMedicalExaminations
                                                        .filter(exam => !selectedExamIds.has(exam.id))
                                                        .filter(exam =>
                                                            searchServiceFilter === '' ||
                                                            exam.name.toLowerCase().includes(searchServiceFilter.toLowerCase()) ||
                                                            exam.description?.toLowerCase().includes(searchServiceFilter.toLowerCase())
                                                        ).length;
                                                })()}/{availableMedicalExaminations.filter(exam => {
                                                    const selectedExamIds = new Set(
                                                        serviceAppointments.flatMap(sa => 
                                                            sa.medicalExaminations?.map(e => e.id) || []
                                                        )
                                                    );
                                                    return !selectedExamIds.has(exam.id);
                                                }).length})
                                            </h4>
                                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                                {(() => {
                                                    // Get all exam IDs from service appointments
                                                    const selectedExamIds = new Set(
                                                        serviceAppointments.flatMap(sa => 
                                                            sa.medicalExaminations?.map(e => e.id) || []
                                                        )
                                                    );
                                                    
                                                    const filteredExams = availableMedicalExaminations
                                                        .filter(exam => !selectedExamIds.has(exam.id))
                                                        .filter(exam =>
                                                            searchServiceFilter === '' ||
                                                            exam.name.toLowerCase().includes(searchServiceFilter.toLowerCase()) ||
                                                            exam.description?.toLowerCase().includes(searchServiceFilter.toLowerCase())
                                                        );
                                                    
                                                    if (filteredExams.length === 0) {
                                                        return (
                                                            <div className="text-center py-10">
                                                                <p className="text-gray-500">
                                                                    {searchServiceFilter ? 'Không tìm thấy dịch vụ phù hợp' : 'Tất cả dịch vụ đã được chọn'}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return filteredExams.map((exam: MedicalExamination) => (
                                                        <label 
                                                            key={exam.id} 
                                                            className={`flex items-start gap-3 p-4 rounded border cursor-pointer transition-all duration-200 ${
                                                                selectedMedicalExaminations.includes(exam.id) 
                                                                    ? 'bg-gray-100 border-gray-400' 
                                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMedicalExaminations.includes(exam.id)}
                                                                onChange={() => toggleMedicalExamination(exam.id)}
                                                                className="mt-1 w-5 h-5 text-gray-600 rounded cursor-pointer"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-800">{exam.name}</p>
                                                                {exam.description && (
                                                                    <p className="text-xs text-gray-600 mt-1">{exam.description}</p>
                                                                )}
                                                                {exam.price && (
                                                                    <p className="text-sm text-gray-700 font-medium mt-2">
                                                                        {exam.price.toLocaleString('vi-VN')} ₫
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Action Buttons */}
                            <div className="p-6 bg-white border-t border-gray-200">
                                <button
                                    onClick={updateAppointmentMedicalExams}
                                    disabled={updatingMedicalExams || selectedMedicalExaminations.length === 0}
                                    className="w-full px-4 py-3 text-white bg-gray-700 rounded hover:bg-gray-800 disabled:bg-gray-300 transition-all duration-200 font-medium"
                                >
                                    {updatingMedicalExams ? 'Đang cập nhật...' : `Thêm dịch vụ (${selectedMedicalExaminations.length})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create New Record Modal */}
            {showCreateModal && (
                <div 
                    className="fixed inset-0 bg-blue-100/80 backdrop-blur-md flex items-center justify-center z-[60]"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-[90%] max-w-3xl max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Create Modal Header */}
                        <div className="bg-gray-100 px-6 py-5 flex items-center justify-between border-b border-gray-300">
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon icon={faPlus} className="text-gray-700 text-lg" />
                                <h3 className="text-xl font-semibold text-gray-800">Tạo bệnh án mới</h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-600 hover:bg-gray-200 p-2 rounded transition-all duration-200"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-lg" />
                            </button>
                        </div>

                        {/* Create Modal Body - Scrollable */}
                        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-7 space-y-5 bg-gray-50">
                            {/* Basic Information */}
                            <div className="bg-white rounded p-5 border border-gray-200">
                                <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-600" />
                                    Thông tin cơ bản
                                </h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Triệu chứng *
                                        </label>
                                        <textarea
                                            value={formData.symptoms}
                                            onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 resize-none"
                                            placeholder="Mô tả triệu chứng của bệnh nhân..."
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Chẩn đoán *
                                        </label>
                                        <textarea
                                            value={formData.diagnosis}
                                            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 resize-none"
                                            placeholder="Nhập chẩn đoán..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Section */}
                            <div className="bg-white rounded p-5 border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPills} className="text-gray-600" />
                                        Đơn thuốc (Tùy chọn)
                                    </h4>
                                    <button
                                        onClick={addMedicine}
                                        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        Thêm thuốc
                                    </button>
                                </div>

                                {/* Search Filter for Medicines */}
                                {/* {selectedMedicines.length > 0 && (
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm thuốc..."
                                            value={searchMedicineFilter}
                                            onChange={(e) => setSearchMedicineFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                                        />
                                    </div>
                                )} */}

                                {loadingMedicines ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mx-auto"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedMedicines.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                                                Chưa có thuốc nào. Nhấn "Thêm thuốc" để bắt đầu.
                                            </div>
                                        ) : (
                                            selectedMedicines.map((med, index) => (
                                                <div key={index} className="bg-gray-50 p-4 rounded border border-gray-200">
                                                    <div className="flex gap-3">
                                                        <div className="flex-1 space-y-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Tên thuốc *
                                                                </label>
                                                                <select
                                                                    value={med.medicineId}
                                                                    onChange={(e) => updateMedicine(index, 'medicineId', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm"
                                                                >
                                                                    <option value="">Chọn thuốc</option>
                                                                    {availableMedicines
                                                                        .filter(medicine =>
                                                                            searchMedicineFilter === '' ||
                                                                            medicine.name.toLowerCase().includes(searchMedicineFilter.toLowerCase()) ||
                                                                            medicine.type.toLowerCase().includes(searchMedicineFilter.toLowerCase())
                                                                        )
                                                                        .map((medicine) => (
                                                                            <option key={medicine.id} value={medicine.id}>
                                                                                {medicine.name} ({medicine.type}) - Tồn kho: {medicine.quantity}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Số lượng *
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={med.amount}
                                                                        onChange={(e) => updateMedicine(index, 'amount', parseInt(e.target.value) || 1)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Hướng dẫn
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.instruction}
                                                                        onChange={(e) => updateMedicine(index, 'instruction', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm"
                                                                        placeholder="VD: 1 viên sáng"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeMedicine(index)}
                                                            className="text-red-600 hover:bg-red-100 p-2 rounded transition-all duration-200 h-10"
                                                            title="Xóa thuốc"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Create Modal Footer */}
                        <div className="bg-white px-6 py-5 flex justify-end gap-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2.5 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-all duration-200 font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateRecord}
                                className="px-6 py-2.5 text-white bg-gray-700 rounded hover:bg-gray-800 transition-all duration-200 font-medium"
                            >
                                Tạo bệnh án
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
