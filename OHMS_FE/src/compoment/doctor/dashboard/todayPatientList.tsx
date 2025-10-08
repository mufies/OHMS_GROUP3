import "./TodayPatientList.css";
import {useState} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faEye } from '@fortawesome/free-solid-svg-icons';

type PatientStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";
type AppointmentType = "video" | "call";

type Patient = {
    id: number;
    name: string;
    time: string;
    status: PatientStatus;
    type: AppointmentType;
    age?: number;
    gender?: "Male" | "Female" | "Other";
    condition?: string;
    contactNumber?: string;
    email?: string;
};

export default function TodayPatientList() {
    const [data, setData] = useState<Patient[]>([
        {id: 1,  name: "John Doe",       time: "08:00 AM", status: "Completed", type: "video", age: 45, gender: "Male"},
        {id: 2,  name: "Jane Smith",     time: "08:30 AM", status: "Completed", type: "call", age: 32, gender: "Female"},
        {id: 3,  name: "Mike Johnson",   time: "09:00 AM", status: "Completed", type: "video", age: 28, gender: "Male"},
        {id: 4,  name: "Sarah Wilson",   time: "09:30 AM", status: "Completed", type: "call", age: 41, gender: "Female"},
        {id: 5,  name: "David Brown",    time: "10:00 AM", status: "In Progress", type: "video", age: 37, gender: "Male"},
        {id: 6,  name: "Emily Davis",    time: "10:30 AM", status: "Scheduled", type: "call", age: 29, gender: "Female"},
        {id: 7,  name: "Robert Garcia",  time: "11:00 AM", status: "Scheduled", type: "video", age: 52, gender: "Male"},
        {id: 8,  name: "Lisa Rodriguez", time: "11:30 AM", status: "Scheduled", type: "call", age: 26, gender: "Female"},
        {id: 9,  name: "James Wilson",   time: "01:00 PM", status: "Scheduled", type: "video", age: 34, gender: "Male"},
        {id: 10, name: "Maria Martinez", time: "01:30 PM", status: "Scheduled", type: "call", age: 38, gender: "Female"},
        {id: 11, name: "Christopher Lee", time: "02:00 PM", status: "Scheduled", type: "video", age: 43, gender: "Male"},
        {id: 12, name: "Jennifer Taylor", time: "02:30 PM", status: "Scheduled", type: "call", age: 31, gender: "Female"},
        {id: 13, name: "Michael Anderson", time: "03:00 PM", status: "Scheduled", type: "video", age: 49, gender: "Male"},
        {id: 14, name: "Ashley Thomas", time: "03:30 PM", status: "Scheduled", type: "call", age: 27, gender: "Female"},
        {id: 15, name: "Daniel Jackson", time: "04:00 PM", status: "Scheduled", type: "video", age: 36, gender: "Male"},
        {id: 16, name: "Amanda White",  time: "04:30 PM", status: "Scheduled", type: "call", age: 33, gender: "Female"},
        {id: 17, name: "Ryan Harris",   time: "05:00 PM", status: "Scheduled", type: "video", age: 40, gender: "Male"},
        {id: 18, name: "Nicole Clark",  time: "05:30 PM", status: "Scheduled", type: "call", age: 35, gender: "Female"},
    ]);

    const [openId, setOpenId] = useState<number | null>(null);

    const changeStatus = (id: number, newStatus: Patient["status"]) => {
        setData(prev =>
            prev.map(p => (p.id === id ? {...p, status: newStatus} : p))
        );
        setOpenId(null);
    };

    const handleClickOutside = () => setOpenId(null);

    return (
        <div
            className="bg-white rounded-xl shadow-lg max-w-[60w] mx-auto min-h-[55vh] max-h-[70vh] overflow-hidden"
            onClick={handleClickOutside}
        >
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold text-gray-800">Today's patients</h2>
            </div>

            <div 
                className="w-full overflow-y-scroll box-content"
                style={{ 
                    height: 'calc(47vh)', 
                    paddingRight: '17px',
                    marginRight: '-17px'
                }}
            >
                <div className="p-6 space-y-4">
                {data.map(patient => (
                    <div
                    key={patient.id}
                    className="relative flex items-center p-4 bg-white border border-[#d3e0ea] rounded-lg cursor-pointer gap-2 shadow-md"
                    onClick={e => e.stopPropagation()}
                    >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e6f5fc] mr-2">
                    <span className="text-[#0085b9] font-sl text-lg">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                </div>
                <div className="flex-1 gap-2">
                    <p className="text-m font-medium text-gray-600 mb-1.5">{patient.name} - {patient.age}yo</p>
                    <p className="text-m font-sl text-gray-600">{patient.gender}</p>
                </div>
                <div className="flex flex-col justify-center items-center w-24 gap-2">
                <p className="text-sm font-medium text-gray-600">{patient.time}</p>
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    patient.status === "Scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : patient.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : patient.status === "In Progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {patient.status}
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
                        onClick={() => setOpenId(openId === patient.id ? null : patient.id)}
                        title="View Options"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                </div>

                {openId === patient.id && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-40 z-20 text-gray-600">
                    {["Scheduled","In Progress","Completed","Cancelled"].map(s => (
                        <button
                        key={s}
                        className="w-full text-left px-3 py-1 rounded hover:bg-gray-100 text-xs cursor-pointer text-black"
                        onClick={() => changeStatus(patient.id, s as Patient["status"])}
                        >
                        {s}
                        </button>
                    ))}
                    <button className="w-full text-left px-3 py-1 rounded hover:bg-gray-100 text-xs cursor-pointer text-gray-600"
                        onClick={() =>window.location.href="/doctor/chat/"}
                    >
                        Chat
                    </button>
                    </div>
                )}
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
}
