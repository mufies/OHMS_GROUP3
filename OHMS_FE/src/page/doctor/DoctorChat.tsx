import Navigator from "../../compoment/doctor/navigator.tsx";
import DoctorChatPage from "../../compoment/doctor/chat/doctorChat.tsx";
function DoctorChat() {
    return (
        <div className="flex min-h-screen bg-white">
            <Navigator
                doctorSpecialty="Cardiology"
            />
            <div className="flex-1 ml-64 flex  justify-center" style={{minWidth: 'calc(99vw - 16rem)'}}>
                <div className="w-full  p-6 min-h-[100vh] max-h-[90vh]">
                    <DoctorChatPage />
                </div>
            </div>
        </div>
    );
}
export default DoctorChat;
