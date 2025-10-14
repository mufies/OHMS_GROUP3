import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function DashboardCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [noteData, setNoteData] = useState([
        { date: '2025-09-15', note: 'Follow up with patient John Doe regarding test results.',time:'12:00',status:'Scheduled' },
        { date: '2025-09-19', note: 'Team meeting at 3 PM to discuss new protocols.',time:'12:00',status:'Scheduled' },
        { date: '2025-09-22', note: 'Review patient Jane Smith\'s MRI scans.' ,time:'12:00',status:'Scheduled'},
        { date: '2025-09-25', note: 'Prepare presentation for the upcoming medical conference.',time:'12:00',status:'Scheduled' },
        { date: '2025-09-28', note: 'Annual health check-up for staff members.' ,time:'12:00',status:'Scheduled'},
    ]);
    

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const isToday = (date: Date) => {
        const today = new Date();
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return todayLocal.getTime() === dateLocal.getTime();
    };

    const isSelected = (date: Date) => {
        const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return selectedLocal.getTime() === dateLocal.getTime();
    };

    const dateKey = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(currentDate.getMonth() - 1);
        } else {
            newDate.setMonth(currentDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };



    const handleCancelNote = () => {
        setNewNote('');
        setShowModal(false);
    };

    const handleToggleNote = (index: number) => {
        const updatedNotes = [...noteData];
        updatedNotes[index].status = updatedNotes[index].status === 'Completed' ? 'Scheduled' : 'Completed';
        setNoteData(updatedNotes);
    };

    // const handleStatusChange = (index: number, status: string) => {
    //     const updatedNotes = [...noteData];
    //     updatedNotes[index].status = status;
    //     setNoteData(updatedNotes);
    // }

    const addNoteModal = () => (
        showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-99">
              <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                    <h2 className="text-lg font-semibold mb-4 text-gray-600">Add Note for {selectedDate.toLocaleDateString()}</h2>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full h-24 p-2 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your note here..."
                    />

                    <div className="mt-4 flex justify-end space-x-2">
                        <button
                            onClick={handleCancelNote}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            // onClick={handleSaveNote}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        )
    );


    const days = getDaysInMonth(currentDate);

    return (
        <div className="bg-white rounded-lg shadow max-w-[60w] mx-auto flex flex-col">
            <div className="px-6 py-4 border-b bg-white rounded-t-2xl shadow-sm ">
                {/* navigator */}
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Calendar</h2>

                    <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="w-8 h-8 flex items-center justify-center bg-white border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-xs" />
                    </button>

                    <button
                        onClick={() => navigateMonth('next')}
                        className="w-8 h-8 flex items-center justify-center bg-white border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-xs" />
                    </button>
                    </div>
                </div>

                {/* Hàng thứ hai: tháng và năm */}
                <div className="mt-2 text-center">
                    <h2 className="text-sm font-medium text-gray-800">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>
            </div>


            <div className="overflow-y-auto h-[48vh]">
            <div className="grid grid-cols-7 border-b bg-white">
                {weekDays.map(day => (
                <div
                    key={day}
                    className="p-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wide"
                >
                    {day}
                </div>
                ))}
            </div>

            <div className="grid grid-cols-7 bg-white">
                {days.map((date, index) => (
                <div
                    key={index}
                    className="h-16 border-r border-b last:border-r-0 p-2 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                    onClick={() => date && setSelectedDate(date)}
                >
                    {date && (
                    <div className="h-full flex items-center justify-center">
                        <div
                        className={`flex items-center justify-center w-11 h-11 text-base rounded-2xl font-bold transition-all duration-300 ${
                            isToday(date)
                            ? 'bg-[#0085b9] text-white shadow-md scale-105'
                            : isSelected(date)
                            ? 'bg-blue-100 text-[#0085b9] shadow-sm scale-105'
                            : 'text-gray-700 hover:bg-blue-50 hover:scale-105'
                        }`}
                        >
                        {date.getDate()}
                        </div>
                    </div>
                    )}
                </div>
                ))}
            </div>
            </div>


            <div className="bg-white p-6  border-t border-gray-200 ">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-lg">Today's Notes</h3>
                <button className="px-3 py-1 text-sm rounded-md bg-[#0085b9] text-white hover:bg-[#006f8f] transition-colors">
                + Add Note
                </button>
            </div>

            <div className="space-y-3">
                {noteData.map((n, i) => (
                <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                    n.status === "Completed" ? "bg-[#f9f9f9]" : "bg-[#fdfefe]"
                    } flex items-start gap-3`}
                >
                    <input
                    type="checkbox"
                    checked={n.status === "Completed"}
                    onChange={() => handleToggleNote(i)}
                    className="mt-[2px] w-4 h-4 appearance-none bg-white border-2 border-gray-300 rounded-sm checked:bg-[#0085b9] checked:border-[#0085b9] checked:before:content-['✓'] checked:before:text-white checked:before:text-xs checked:before:flex checked:before:items-center checked:before:justify-center checked:before:w-full checked:before:h-full cursor-pointer"
                    />
                    <div className="flex flex-col">
                    <p
                        className={`text-sm leading-snug ${
                        n.status === "Completed" ? "text-gray-500" : "text-gray-800"
                        }`}
                        style={n.status === "Completed" ? { textDecoration: 'line-through' } : {}}
                    >
                        {n.note}
                    </p>
                    <span className="text-xs text-gray-400 mt-1">{n.time}</span>
                    </div>
                </div>
                ))}
            </div>
            </div>



            {addNoteModal()}

        </div>
    );
}
