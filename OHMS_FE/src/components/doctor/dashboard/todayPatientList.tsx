import "./TodayPatientList.css";
import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../../../utils/fetchFromAPI";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faEye } from '@fortawesome/free-solid-svg-icons';
import MedicalRecordModal from '../dashboard/patientMedicalRecord';

type PatientStatus = "Schedule" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "SCHEDULED";

type MedicalExamination = {
    id: string;
    name: string;
    price: number;
};

type Appointment = {
    id: string;
    patientId: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string | null;
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string | null;
    workDate: string;
    startTime: string;
    endTime: string;
    status: PatientStatus;
    medicalExaminations: MedicalExamination[];
};

type Patient = {
    id: string;
    name: string;
    time: string;
    status: PatientStatus;
    age?: number;
    gender?: "Male" | "Female" | "Other";
    email?: string;
    phone?: string;
    appointmentId: string;
    services?: string;
};

export default function TodayPatientList() {
    const [data, setData] = useState<Patient[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    
    // States for Medical Record Modal - THÊM appointmentId
    const [showMedicalRecords, setShowMedicalRecords] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<{
        id: string, 
        name: string, 
        appointmentId: string
    } | null>(null);

    const isInitialMount = useRef(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));
                setUserId(decodedPayload.userId);
            } catch (err) {
                console.error('Error decoding token:', err);
                setError('Token xác thực không hợp lệ');
            }
        } else {
            setError('Không tìm thấy token xác thực');
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchAppointments = async () => {
            if (isInitialMount.current) {
                setLoading(true);
            }
            setError(null);

            try {
                const token = localStorage.getItem('accessToken');
                
                if (!token) {
                    throw new Error('Không có token xác thực');
                }

                console.log('Fetching appointments for doctor:', userId);

                const response = await axiosInstance.get(
                    `/appointments/doctor/${userId}/today`
                );

                console.log('API Response:', response.data);

                const appointments: Appointment[] = Array.isArray(response.data) 
                    ? response.data 
                    : response.data.results || [];

                const transformedData: Patient[] = appointments
                    .filter(apt => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED') //apt.status !== 'COMPLETED &&'
                    .map(apt => {
                        const age = Math.floor(Math.random() * 50) + 20;
                        
                        const formatTime = (timeString: string) => {
                            if (!timeString) return 'N/A';
                            const [hours, minutes] = timeString.split(':');
                            const hour = parseInt(hours);
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
                        };

                        const services = apt.medicalExaminations && Array.isArray(apt.medicalExaminations)
                            ? apt.medicalExaminations.map(exam => exam.name).join(', ')
                            : 'No services';

                        return {
                            id: apt.patientId,
                            appointmentId: apt.id,
                            name: apt.patientName || 'Unknown Patient',
                            time: formatTime(apt.startTime),
                            status: apt.status,
                            age: age,
                            gender: Math.random() > 0.5 ? "Male" : "Female",
                            email: apt.patientEmail || undefined,
                            phone: apt.patientPhone || undefined,
                            services: services
                        };
                    });

                transformedData.sort((a, b) => {
                    const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
                    const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
                    return timeA - timeB;
                });

                setData(prevData => {
                    if (JSON.stringify(prevData) === JSON.stringify(transformedData)) {
                        return prevData;
                    }
                    return transformedData;
                });

                if (isInitialMount.current) {
                    setLoading(false);
                    isInitialMount.current = false;
                }

            } catch (err: any) {
                console.error('Error fetching appointments:', err);
                setError(err.response?.data?.message || err.message || 'Không thể lấy danh sách lịch hẹn');
                
                if (isInitialMount.current) {
                    setLoading(false);
                    isInitialMount.current = false;
                }
            }
        };

        fetchAppointments();
        
        const intervalId = setInterval(() => {
            fetchAppointments();
        }, 10000); 

        return () => {
            clearInterval(intervalId);
        };
    }, [userId]);

    const changeStatus = async (appointmentId: string, newStatus: PatientStatus) => {
        try {
            const token = localStorage.getItem('accessToken');
            
            await axiosInstance.put(
                `/appointments/${appointmentId}/status?status=${newStatus}`
            );

            setData(prev =>
                prev.map(p => (p.appointmentId === appointmentId ? {...p, status: newStatus} : p))
            );
            setOpenId(null);

        } catch (err: any) {
            console.error('Error updating status:', err);
            alert('Không thể cập nhật trạng thái lịch hẹn');
        }
    };

    const checkMedicalRecordExists = async (patientId: string, appointmentId: string): Promise<boolean> => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            
            const response = await axiosInstance.get(
                `/medical-records/patient/${patientId}`
            );

            // Response có cấu trúc: { code, message, results: [...] }
            const medicalRecords = response.data.results || [];
            return medicalRecords.some((record: any) => record.appointmentId === appointmentId);
        } catch (err: any) {
            console.error('Error checking medical record:', err);
            return false;
        }
    };

    const handlePatientClick = async (patient: Patient) => {
        // Nếu status là SCHEDULED hoặc Schedule, chuyển sang IN_PROGRESS
        if (patient.status === 'SCHEDULED' || patient.status === 'Schedule') {
            await changeStatus(patient.appointmentId, 'IN_PROGRESS');
            
            // Đợi một chút để status update xong
            setTimeout(async () => {
                // Kiểm tra xem có medical record chưa
                const hasRecord = await checkMedicalRecordExists(patient.id, patient.appointmentId);
                
                if (hasRecord) {
                    // Nếu có medical record, chuyển sang COMPLETED
                    await changeStatus(patient.appointmentId, 'COMPLETED');
                } else {
                    // Nếu chưa có, mở modal medical records
                    handleViewRecords(patient.id, patient.name, patient.appointmentId);
                }
            }, 500);
        } else {
            // Nếu đang IN_PROGRESS hoặc status khác, kiểm tra medical record
            const hasRecord = await checkMedicalRecordExists(patient.id, patient.appointmentId);
            
            if (hasRecord) {
                // Nếu có medical record rồi, chuyển sang COMPLETED
                await changeStatus(patient.appointmentId, 'COMPLETED');
                                // handleViewRecords(patient.id, patient.name, patient.appointmentId);

            } else {
                // Chưa có thì mở modal
                handleViewRecords(patient.id, patient.name, patient.appointmentId);
            }
        }
    };

    // Update function để pass thêm appointmentId
    const handleViewRecords = (patientId: string, patientName: string, appointmentId: string) => {
        setSelectedPatient({
            id: patientId, 
            name: patientName,
            appointmentId: appointmentId
        });
        setShowMedicalRecords(true);
    };

    const handleClickOutside = () => setOpenId(null);

    const getStatusDisplay = (status: PatientStatus) => {
        const statusMap: Record<PatientStatus, string> = {
            'Schedule': 'Lên lịch',
            'IN_PROGRESS': 'Đang tiến hành',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy',
            'SCHEDULED': 'Lên lịch'  
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: PatientStatus) => {
        switch(status) {
            case "SCHEDULED":
                return "bg-blue-100 text-blue-800";
            case "Schedule":
                return "bg-blue-100 text-blue-800";
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-800";
            case "CANCELLED":
                return "bg-gray-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg max-w-[60w] mx-auto min-h-[55vh] max-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải danh sách bệnh nhân...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg max-w-[60w] mx-auto min-h-[55vh] max-h-[70vh] flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p className="text-lg font-semibold mb-2">Lỗi</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="bg-white rounded-xl shadow-lg max-w-[60w] mx-auto min-h-[55vh] max-h-[70vh] overflow-hidden"
                onClick={handleClickOutside}
            >
                <div className="px-6 py-4 sticky top-0 bg-white z-10 shadow">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Bệnh nhân hôm nay</h2>
                        <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                            {data.length} {data.length === 1 ? 'lịch hẹn' : 'lịch hẹn'}
                        </span>
                    </div>
                </div>

                <div 
                    className="w-full overflow-y-scroll box-content"
                    style={{ 
                        height: 'calc(47vh)', 
                        paddingRight: '17px',
                        marginRight: '-17px'
                    }}
                >
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No appointments scheduled for today</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {data.map(patient => (
                                <div
                                    key={patient.appointmentId}
                                    className="relative flex items-center p-4 bg-white border border-[#d3e0ea] rounded-lg cursor-pointer gap-2 shadow-md hover:shadow-lg transition-shadow"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handlePatientClick(patient); 
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e6f5fc] mr-2">
                                        <span className="text-[#0085b9] font-semibold text-lg">
                                            {patient.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="flex-1 gap-2">
                                        <p className="text-sm font-medium text-gray-800 mb-1">{patient.name} - {patient.age}yo</p>
                                        <p className="text-xs text-gray-600">{patient.gender}</p>
                                        {patient.services && (
                                            <p className="text-xs text-gray-500 mt-1 truncate" title={patient.services}>
                                                {patient.services}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center items-center w-24 gap-2">
                                        <p className="text-sm font-medium text-gray-600">{patient.time}</p>
                                        <span
                                            className={`px-1 py-1 rounded-full text-xs font-semibold  ${getStatusColor(patient.status)}`}
                                        >
                                            {getStatusDisplay(patient.status)}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="px-3 py-1 text-xs rounded-lg hover:bg-[#006f8f] hover:text-white transition-colors text-gray-600 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href="/doctor/chat/";
                                            }}
                                            title="Chat"
                                        >
                                            <FontAwesomeIcon icon={faComments} />
                                        </button>
                                        <button
                                            className="px-3 py-1 text-xs rounded-lg hover:bg-[#006f8f] hover:text-white transition-colors text-gray-600 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenId(openId === patient.appointmentId ? null : patient.appointmentId);
                                            }}
                                            title="View Options"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                    </div>

                                    {openId === patient.appointmentId && (
                                        <div 
                                            className="absolute right-0 top-14 bg-white border border-gray-300 rounded-lg shadow-lg p-2 w-40 z-20"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {[
                                                { label: "Lên lịch", value: "SCHEDULED" as PatientStatus },
                                                { label: "Đang khám", value: "IN_PROGRESS" as PatientStatus },
                                                { label: "Hoàn thành", value: "COMPLETED" as PatientStatus },
                                                { label: "Hủy bỏ", value: "CANCELLED" as PatientStatus }
                                            ].map(({ label, value }) => (
                                                <button
                                                    key={value}
                                                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-xs cursor-pointer text-gray-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        changeStatus(patient.appointmentId, value);
                                                    }}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                            <div className="border-t border-gray-200 my-1"></div>
                                            <button
                                                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-xs cursor-pointer text-gray-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href="/doctor/chat/";
                                                }}
                                            >
                                                Chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Medical Record Modal - Pass appointmentId */}
            {selectedPatient && (
                <MedicalRecordModal
                    patientId={selectedPatient.id}
                    patientName={selectedPatient.name}
                    appointmentId={selectedPatient.appointmentId}
                    isOpen={showMedicalRecords}
                    onClose={() => setShowMedicalRecords(false)}
                />
            )}
        </>
    );
}
