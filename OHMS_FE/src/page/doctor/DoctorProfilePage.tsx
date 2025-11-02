import Navigator from "../../components/doctor/navigator.tsx";
import DoctorProfile from "../../components/doctor/profile/DoctorProfile.tsx";

function DoctorProfilePage() {
    return (
        <div className="flex-col min-h-screen bg-gray-50">
            <Navigator
                doctorSpecialty="Cardiology"
            />
            <div className="flex-1 ml-64" style={{minWidth: 'calc(99vw - 16rem)'}}>
                <div className="p-6">
                    <DoctorProfile />
                </div>
            </div>
        </div>
    );
}

export default DoctorProfilePage;
