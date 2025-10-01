import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function DashboardCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [noteData] = useState([
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
        <div className="bg-[#eafdff] rounded-lg shadow max-w-[60w] mx-auto min-h-[70vh] max-h-[50vh] flex flex-col">
            <div className="px-6 py-4 border-b sticky top-0 bg-[#eafdff] z-10">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-sm" />
                    </button>

                    <h2 className="text-lg font-semibold text-gray-800">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>

                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-sm" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[35vh]">
                <div className="grid grid-cols-7 border-b  ">
                    {weekDays.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {days.map((date, index) => (
                        <div
                            key={index}
                            className="h-12 border-r border-b last:border-r-0 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => date && setSelectedDate(date)}
                        >
                            {date && (
                                <div className="h-full flex items-center justify-center">
                                    <div className={`flex items-center justify-center w-8 h-8 text-sm rounded-full ${
                                        isToday(date) 
                                            ? 'bg-[#0085b9] text-white font-semibold' 
                                            : isSelected(date)
                                            ? 'bg-blue-100 text-[#0085b9] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className=" bg-[#eafdff] p-4 min-h-[28vh] overflow-y-auto text-gray-600">
                <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">
                    Notes for {selectedDate.toLocaleDateString()}
                </h3>
                    <button className="mb-4 px-3 py-1 text-xs rounded-lg bg-[#0085b9] text-white hover:bg-[#006f8f] transition-colors cursor-pointer" onClick={() => setShowModal(true)} >
                        Add Note
                    </button>
                </div>

                {noteData.filter(n => n.date === dateKey(selectedDate)).map((n, idx) => (
                <div key={idx} className="mb-2 p-3 bg-white rounded-lg shadow flex ">
                    <p className="text-sm">{n.note}</p>
                    <button  className="ml-4 px-3 py-1 text-xs rounded-lg   transition-colors text-gray-600 cursor-pointer">
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${
                        n.status === "Scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : n.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : n.status === "In Progress"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                    }`}>
                        {n.status} at {n.time}
                    </span>
                    </button>
                </div>
                ))}


            </div>

            {addNoteModal()}

        </div>
    );
}
