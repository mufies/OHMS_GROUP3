import "./TodayPatientList.css";
import {useState} from "react";

type Patient = {
    id: number;
    name: string;
    time: string;
    status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
};

export default function TodayPatientList() {
    const [data, setData] = useState<Patient[]>([
        {id: 1,  name: "John Doe",       time: "08:00 AM", status: "Completed"},
        {id: 2,  name: "Jane Smith",     time: "08:30 AM", status: "Completed"},
        {id: 3,  name: "Mike Johnson",   time: "09:00 AM", status: "Completed"},
        {id: 4,  name: "Sarah Wilson",   time: "09:30 AM", status: "Completed"},
        {id: 5,  name: "David Brown",    time: "10:00 AM", status: "In Progress"},
        {id: 6,  name: "Emily Davis",    time: "10:30 AM", status: "Scheduled"},
        {id: 7,  name: "Robert Garcia",  time: "11:00 AM", status: "Scheduled"},
        {id: 8,  name: "Lisa Rodriguez", time: "11:30 AM", status: "Scheduled"},
        {id: 9,  name: "James Wilson",   time: "01:00 PM", status: "Scheduled"},
        {id: 10, name: "Maria Martinez", time: "01:30 PM", status: "Scheduled"},
        {id: 11, name: "Christopher Lee", time: "02:00 PM", status: "Scheduled"},
        {id: 12, name: "Jennifer Taylor", time: "02:30 PM", status: "Scheduled"},
        {id: 13, name: "Michael Anderson", time: "03:00 PM", status: "Scheduled"},
        {id: 14, name: "Ashley Thomas", time: "03:30 PM", status: "Scheduled"},
        {id: 15, name: "Daniel Jackson", time: "04:00 PM", status: "Scheduled"},
        {id: 16, name: "Amanda White",  time: "04:30 PM", status: "Scheduled"},
        {id: 17, name: "Ryan Harris",   time: "05:00 PM", status: "Scheduled"},
        {id: 18, name: "Nicole Clark",  time: "05:30 PM", status: "Scheduled"},
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
            className="bg-[#eafdff] rounded-lg shadow max-w-[60w] mx-auto min-h-[90vh] max-h-[50vh] overflow-y-auto custom-scrollbar"
            onClick={handleClickOutside}
        >
            <div className="px-6 py-4 border-b sticky top-0 bg-[#eafdff] z-10">
                <h2 className="text-lg font-semibold text-gray-800">Today patients</h2>
            </div>

            <div className="p-6 space-y-4">
                {data.map(patient => (
                    <div
                        key={patient.id}
                        className="relative flex items-center p-4 bg-[#eafdff] rounded-lg cursor-pointer"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{patient.name}</p>
                            <p className="text-xs text-gray-500">{patient.time}</p>
                        </div>

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

                        <button
                            className="ml-4 px-3 py-1 text-xs rounded-lg hover:bg-[#006f8f] hover:text-white transition-colors text-gray-600 cursor-pointer"
                            onClick={() => setOpenId(openId === patient.id ? null : patient.id)}
                        >
                            ...
                        </button>

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
    );
}
