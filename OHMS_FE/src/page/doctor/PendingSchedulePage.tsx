import { useState, useEffect } from "react";
import Navigator from "../../components/doctor/navigator.tsx";
import PendingScheduleRequests from "../../components/doctor/PendingScheduleRequests.tsx";

function PendingSchedulePage() {
    const [doctorId, setDoctorId] = useState<string>('');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));
                setDoctorId(decodedPayload.userId);
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Navigator doctorSpecialty="Cardiology" />

            <div className="flex-1 ml-64" style={{minWidth: 'calc(99vw - 16rem)'}}>
                <div className="p-6 bg-[#f9fcff] min-h-screen">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Yêu cầu thay đổi lịch làm việc
                        </h1>
                        <p className="text-gray-600">
                            Quản lý các yêu cầu thay đổi lịch làm việc từ staff
                        </p>
                    </div>

                    {/* Pending Schedule Requests Component */}
                    {doctorId ? (
                        <PendingScheduleRequests doctorId={doctorId} />
                    ) : (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Đang tải thông tin...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PendingSchedulePage;
