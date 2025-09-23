import  { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faClock,
    faUser,
} from '@fortawesome/free-solid-svg-icons';

interface Appointment {
    id: string;
    time: string;
    patientName: string;
    type: 'consultation' | 'follow-up' | 'emergency';
    duration: number;
}

export default function ScheduleCalendar() {
    const [currentDate, setCurrentDate]   = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view] = useState<'month' | 'week' | 'day'>('month');

    const mockAppointments: Record<string, Appointment[]> = {
        '2025-09-21': [
            { id: '1', time: '09:00', patientName: 'John Doe',  type: 'consultation', duration: 30 },
            { id: '2', time: '10:30', patientName: 'Jane Smith',type: 'follow-up',   duration: 20 },
            { id: '3', time: '14:00', patientName: 'Mike Johnson',type:'emergency',  duration: 45 },
        ],
        '2025-09-22': [
            { id: '4', time: '08:30', patientName: 'Sarah Wilson',type:'consultation',duration: 30 },
            { id: '5', time: '11:00', patientName: 'David Brown', type:'follow-up',   duration: 20 },
        ],
    };

    const months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const weekDays = ['S','M','T','W','T','F','S'];

    const formatDate      = (d:Date)=> d.toISOString().split('T')[0];
    const getAppointments = (d:Date)=> mockAppointments[formatDate(d)] || [];
    const isToday         = (d:Date)=> d.toDateString() === new Date().toDateString();
    const isSelected      = (d:Date)=> d.toDateString() === selectedDate.toDateString();
    // const dateHaveAppointments = (d:Date)=> getAppointments(d).length > 0;

    const colorByType = (t:Appointment['type']) =>
        t==='consultation' ? 'bg-blue-500'
            :t==='follow-up'   ? 'bg-green-500'
                :t==='emergency'   ? 'bg-red-500'
                    :'bg-gray-500';

    const daysInMonth = (date:Date) => {
        const y=date.getFullYear(), m=date.getMonth();
        const first = new Date(y,m,1).getDay();
        const last  = new Date(y,m+1,0).getDate();
        return [...Array(first).fill(null), ...Array.from({length:last},(_,i)=>new Date(y,m,i+1))];
    };

    const changeMonth = (dir:'prev'|'next') => {
        const n = new Date(currentDate);
        n.setMonth(currentDate.getMonth() + (dir==='next'?1:-1));
        setCurrentDate(n);
    };

    const MonthView = () => (
        <div className="bg-[#ebfcff] rounded-lg shadow relative max-w-3xl">
            <div className="flex items-center justify-between p-4 border-b">
                <button onClick={()=>changeMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600" />
                </button>

                <h2 className="text-xl font-semibold text-gray-800">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>

                <button onClick={()=>changeMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                    <FontAwesomeIcon icon={faChevronRight} className="text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 border-b">
            {weekDays.map(d=>(
                <div key={d} className="p-3 text-center text-sm font-medium text-gray-600 last:border-r-0 flex justify-center items-center">
                    {d}
                </div>
            ))}
            </div>

            <div className="grid grid-cols-7">
                {daysInMonth(currentDate).map((d,i)=>(
                    <div
                        key={i}
                        className="flex h-24 border-r border-b last:border-r-0 p-1 cursor-pointer hover:bg-gray-50 justify-center "
                        onClick={()=>d && setSelectedDate(d)}
                        style={{ justifyItems: 'center', alignContent: 'center' }}
                    >
                        {d && (
                            <>
                                <div
                                    className={`flex items-center justify-center w-6 h-6 text-sm rounded-full mb-1 ${
                                        isToday(d)      ? 'bg-[#0085b9] text-white'
                                            : isSelected(d)   ? 'bg-blue-100 text-[#0085b9] font-semibold'
                                                : 'text-gray-700'
                                    }`}

                                >
                                    {d.getDate()}
                                </div>

                                <div className="space-y-1 space-x-1">
                                    {getAppointments(d).slice(0,2).map(a=>(
                                        <div key={a.id} className={`text-[10px] px-0.5 py-0.5 ml-1 rounded text-white truncate ${colorByType(a.type)}`}>
                                          {`${a.time} ${a.patientName}`.length > 18 ? `${a.time} ${a.patientName}`.slice(0, 15) + '...' : `${a.time} ${a.patientName}`}
                                        </div>
                                    ))}
                                    {getAppointments(d).length>2 && (
                                        <div className="text-xs text-gray-500">
                                            +{getAppointments(d).length-2} more
                                        </div>
                                    )}
                                </div>


                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const DaySchedule = () => {
        const list = getAppointments(selectedDate);
        return (
            <div className="bg-[#ebfcff] rounded-lg shadow">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {selectedDate.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
                    </h3>

                </div>

                <div className="p-4">
                    {list.length===0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FontAwesomeIcon icon={faClock} className="text-4xl mb-4 text-gray-300" />
                            <p>No appointments scheduled for this day</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {list.map(a=>(
                                <div key={a.id} className="flex items-center p-4 text-gray-500  rounded-lg hover:bg-[#0085b9] hover:text-white transition cursor-pointer">
                                    <div className={`w-4 h-4 rounded-full mr-4 ${colorByType(a.type)}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <span className="font-semibold ">{a.time}</span>
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faUser} className="" />
                                                    <span className="">{a.patientName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm  capitalize">{a.type}</span>
                                                <span className="text-sm ">{a.duration} min</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 items-center justify-center">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Schedule</h2>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full justify-center">
                <div className="lg:col-span-2">
                    <DaySchedule />
                </div>
                <div className="lg:col-span-2 min-h-[694px]">
                    {view==='month' && <MonthView />}
                </div>


            </div>
        </div>
    );
}
