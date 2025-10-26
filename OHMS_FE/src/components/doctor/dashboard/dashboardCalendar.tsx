import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteData, setNoteData] = useState<any[]>([]);

  // ✅ URL API backend (ví dụ)
  const BASE_URL = "http://localhost:8080/api/notes";

  // ==============================
  // 🔹 FETCH NOTES FROM BACKEND
  // ==============================
  const fetchNotes = async () => {
    try {
      const res = await axios.get(BASE_URL);
      setNoteData(res.data);
    } catch (error) {
      console.error("❌ Error fetching notes:", error);
    }
  };

  // ==============================
  // 🔹 ADD NEW NOTE
  // ==============================
  const handleSaveNote = async () => {
    if (!newNote.trim()) return;

    try {
      const payload = {
        date: selectedDate.toISOString().split("T")[0],
        note: newNote,
        time: "12:00",
        status: "Scheduled",
      };

      const res = await axios.post(BASE_URL, payload);
      setNoteData((prev) => [...prev, res.data]);

      setNewNote("");
      setShowModal(false);
    } catch (error) {
      console.error("❌ Error saving note:", error);
    }
  };

  // ==============================
  // 🔹 TOGGLE NOTE STATUS (update)
  // ==============================
  const handleToggleNote = async (index: number) => {
    const note = noteData[index];
    const updatedStatus = note.status === "Completed" ? "Scheduled" : "Completed";

    try {
      const res = await axios.put(`${BASE_URL}/${note.id}`, {
        ...note,
        status: updatedStatus,
      });

      const updatedNotes = [...noteData];
      updatedNotes[index] = res.data;
      setNoteData(updatedNotes);
    } catch (error) {
      console.error("❌ Error updating note:", error);
    }
  };

  // ==============================
  // 🔹 CANCEL ADD NOTE
  // ==============================
  const handleCancelNote = () => {
    setNewNote("");
    setShowModal(false);
  };

  // ==============================
  // 🔹 MONTH NAVIGATION
  // ==============================
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // ==============================
  // 🔹 DATE HELPERS
  // ==============================
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  const isSelected = (date: Date) => {
    return (
      selectedDate.getFullYear() === date.getFullYear() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getDate() === date.getDate()
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  // ==============================
  // 🔹 MODAL COMPONENT
  // ==============================
  const addNoteModal = () =>
    showModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
          <h2 className="text-lg font-semibold mb-4 text-gray-600">
            Add Note for {selectedDate.toLocaleDateString()}
          </h2>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full h-24 p-2 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your note here..."
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={handleCancelNote}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );

  const days = getDaysInMonth(currentDate);

  // ==============================
  // 🔹 USE EFFECT TO LOAD NOTES
  // ==============================
  useEffect(() => {
    fetchNotes();
  }, []);

  // ==============================
  // 🔹 JSX RETURN
  // ==============================
  return (
    <div className="bg-white rounded-lg shadow max-w-[60w] mx-auto flex flex-col">
      <div className="px-6 py-4 bg-white rounded-t-2xl shadow-sm">
        {/* navigator */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-xs" />
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-xs" />
            </button>
          </div>
        </div>

        <div className="mt-2 text-center">
          <h2 className="text-sm font-medium text-gray-800">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
      </div>

      <div className="overflow-y-auto h-[48vh]">
        <div className="grid grid-cols-7 bg-white">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-white">
          {days.map((date, index) => (
            <div
              key={index}
              className="h-16 p-2 cursor-pointer hover:bg-gray-50"
              onClick={() => date && setSelectedDate(date)}
            >
              {date && (
                <div className="h-full flex items-center justify-center">
                  <div
                    className={`flex items-center justify-center w-11 h-11 text-base rounded-2xl font-bold transition-all ${
                      isToday(date)
                        ? "bg-[#0085b9] text-white"
                        : isSelected(date)
                        ? "bg-blue-100 text-[#0085b9]"
                        : "text-gray-700 hover:bg-blue-50"
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

      {/* NOTES SECTION */}
      <div className="bg-white p-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">Today's Notes</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 text-sm rounded-md bg-[#0085b9] text-white hover:bg-[#006f8f]"
          >
            + Add Note
          </button>
        </div>

        <div className="space-y-3">
          {noteData.map((n, i) => (
            <div
              key={n.id || i}
              className={`p-3 rounded-lg border ${
                n.status === "Completed" ? "bg-[#f9f9f9]" : "bg-[#fdfefe]"
              } flex items-start gap-3`}
            >
              <input
                type="checkbox"
                checked={n.status === "Completed"}
                onChange={() => handleToggleNote(i)}
                className="mt-[2px] w-4 h-4 appearance-none bg-white border-2 border-gray-300 rounded-sm checked:bg-[#0085b9] checked:border-[#0085b9]"
              />
              <div className="flex flex-col">
                <p
                  className={`text-sm leading-snug ${
                    n.status === "Completed" ? "text-gray-500 line-through" : "text-gray-800"
                  }`}
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
