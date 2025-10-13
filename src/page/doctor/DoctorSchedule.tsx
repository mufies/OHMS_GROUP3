import Navigator from "../../compoment/doctor/navigator.tsx";
import ScheduleCalendar from "../../compoment/doctor/schedule/scheduleCalendar.tsx";
function DoctorSchedule() {
    return (
        <div className="flex-col min-h-screen  bg-white">
            <Navigator
                doctorSpecialty="Cardiology"
            />
            <div className="flex-1 ml-64" style={{minWidth: 'calc(99vw - 16rem)'}}>
                <div className="p-6">
                    <ScheduleCalendar/>
                </div>
            </div>

            </div>
    );

}
export default DoctorSchedule;