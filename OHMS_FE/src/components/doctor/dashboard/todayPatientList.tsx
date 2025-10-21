import "./TodayPatientList.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faEye } from '@fortawesome/free-solid-svg-icons';

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

    // Get userId from token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));
                setUserId(decodedPayload.userId);
            } catch (err) {
                console.error('Error decoding token:', err);
                setError('Invalid authentication token');
            }
        } else {
            setError('No authentication token found');
        }
    }, []);

    // Fetch appointments when userId is available
// Fetch appointments when userId is available with polling every 10 seconds
useEffect(() => {
    if (!userId) return;

    const fetchAppointments = async () => {
        // Only show loading on first fetch
        if (data.length === 0) {
            setLoading(true);
        }
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                throw new Error('No authentication token');
            }

            console.log('Fetching appointments for doctor:', userId);

            const response = await axios.get(
                `http://localhost:8080/appointments/doctor/${userId}/today`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('API Response:', response.data);

            // Transform API data to Patient format
            const appointments: Appointment[] = Array.isArray(response.data) 
                ? response.data 
                : response.data.results || [];

            const transformedData: Patient[] = appointments.map(apt => {
                // Calculate age (mock - you might want to get real age from patient data)
                const age = Math.floor(Math.random() * 50) + 20;
                
                // Format time from "14:00:00" to "02:00 PM"
                const formatTime = (timeString: string) => {
                    if (!timeString) return 'N/A';
                    const [hours, minutes] = timeString.split(':');
                    const hour = parseInt(hours);
                    const period = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
                };

                // Get services list - HANDLE NULL/UNDEFINED
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

            // Sort by time
            transformedData.sort((a, b) => {
                const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
                const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
                return timeA - timeB;
            });

            setData(transformedData);
            setLoading(false);

        } catch (err: any) {
            console.error('Error fetching appointments:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch appointments');
            setLoading(false);
        }
    };

    // Initial fetch
    fetchAppointments();
    
    // Set up polling interval - fetch every 10 seconds
    const intervalId = setInterval(() => {
        fetchAppointments();
    }, 10000); 

    // Cleanup interval on component unmount or userId change
    return () => {
        clearInterval(intervalId);
    };
}, [userId]);


const changeStatus = async (appointmentId: string, newStatus: PatientStatus) => {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        // Update status via API - Dùng PUT với params
        await axios.put(
            `http://localhost:8080/appointments/${appointmentId}/status`,
            null, // không có request body
            {
                params: {
                    status: newStatus // query parameter
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        // Update local state
        setData(prev =>
            prev.map(p => (p.appointmentId === appointmentId ? {...p, status: newStatus} : p))
        );
        setOpenId(null);

    } catch (err: any) {
        console.error('Error updating status:', err);
        alert('Failed to update appointment status');
    }
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
                    <p className="text-gray-600">Loading appointments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg max-w-[60w] mx-auto min-h-[55vh] max-h-[70vh] flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p className="text-lg font-semibold mb-2">Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-white rounded-xl shadow-lg max-w-[60w] mx-auto min-h-[55vh] max-h-[70vh] overflow-hidden"
            onClick={handleClickOutside}
        >
            <div className="px-6 py-4 sticky top-0 bg-white z-10 shadow">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Today's Patients</h2>
                    <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                        {data.length} {data.length === 1 ? 'appointment' : 'appointments'}
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
                                onClick={e => e.stopPropagation()}
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
                                        onClick={() => window.location.href="/doctor/chat/"}
                                        title="Chat"
                                    >
                                        <FontAwesomeIcon icon={faComments} />
                                    </button>
                                    <button
                                        className="px-3 py-1 text-xs rounded-lg hover:bg-[#006f8f] hover:text-white transition-colors text-gray-600 cursor-pointer"
                                        onClick={() => setOpenId(openId === patient.appointmentId ? null : patient.appointmentId)}
                                        title="View Options"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                </div>

                                {openId === patient.appointmentId && (
                                    <div className="absolute right-0 top-14 bg-white border border-gray-300 rounded-lg shadow-lg p-2 w-40 z-20">
                                        {[
                                            { label: "Lên lịch", value: "SCHEDULED" as PatientStatus },
                                            { label: "Đang khám", value: "IN_PROGRESS" as PatientStatus },
                                            { label: "Hoàn thành", value: "COMPLETED" as PatientStatus },
                                            { label: "Hủy bỏ", value: "CANCELLED" as PatientStatus }
                                        ].map(({ label, value }) => (
                                            <button
                                                key={value}
                                                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-xs cursor-pointer text-gray-700"
                                                onClick={() => changeStatus(patient.appointmentId, value)}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <button
                                            className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-xs cursor-pointer text-gray-700"
                                            onClick={() => window.location.href="/doctor/chat/"}
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
    );
}
