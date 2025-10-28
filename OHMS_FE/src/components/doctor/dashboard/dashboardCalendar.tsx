import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

interface Note {
  id: number;
  date: string;
  note: string;
  time: string;
  status: string;
}

export default function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);

  const BASE_URL = "http://localhost:8080/notes";

  // ==============================
  // 🔹 FETCH NOTES
  // ==============================
  const fetchNotes = async () => {
    try {
      const res = await axios.get<Note[]>(BASE_URL);
      setNotes(res.data);
    } catch (error) {
      console.error("❌ Error fetching notes:", error);
    }
  };

  // ==============================
  // 🔹 ADD NEW NOTE
  // ==============================
  const handleSaveNote = async () => {
    if (!newNote.trim()) return;

    const payload = {
      date: selectedDate.toISOString().split("T")[0],
      note: newNote,
      time: "12:00",
      status: "Scheduled",
    };

    try {
      const res = await axios.post<Note>(BASE_URL, payload);
      setNotes((prev) => [...prev, res.data]);
      setNewNote("");
      setShowModal(false);
    } catch (error) {
      console.error("❌ Error saving note:", error);
    }
  };

  // ==============================
  // 🔹 TOGGLE NOTE STATUS
  // ==============================
  const handleToggleNote = async (note: Note) => {
    const updatedStatus = note.status === "Completed" ? "Scheduled" : "Completed";

    try {
      const res = await axios.put<Note>(`${BASE_URL}/${note.id}`, {
        ...note,
        status: updatedStatus,
      });

      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? res.data : n))
      );
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
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  // ==============================
  // 🔹 DATE HELPERS
  // ==============================
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
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

  const isSelected = (date: Date) =>
    selectedDate.toDateString() === date.toDateString();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const days = getDaysInMonth(currentDate);

  // ==============================
  // 🔹 LOAD NOTES ON START
  // ==============================
  useEffect(() => {
    fetchNotes();
  }, []);

  // ==============================
  // 🔹 FILTER NOTES BY SELECTED DATE
  // ==============================
  const filteredNotes = notes.filter(
    (n) => n.date === selectedDate.toISOString().split("T")[0]
  );

  // ==============================
  // 🔹 MODAL
  // ==============================
  const renderModal = () =>
    showModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 w-96">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Add Note for {selectedDate.toLocaleDateString()}
          </h2>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full h-24 p-2 border rounded-lg text-gray-700 border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter your note..."
          />
          <div className="mt-4 flex justify-end gap-2">
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

  // ==============================
  // 🔹 RENDER
  // ==============================
  return (
    <div className="bg-white rounded-lg shadow max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b">
        <div className="text-lg font-semibold text-gray-800">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600">
        {weekDays.map((day) => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date, i) => (
          <div
            key={i}
            onClick={() => date && setSelectedDate(date)}
            className="h-16 flex items-center justify-center cursor-pointer"
          >
            {date && (
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition ${
                  isToday(date)
                    ? "bg-blue-600 text-white"
                    : isSelected(date)
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {date.getDate()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="p-6 border-t">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">
            Notes for {selectedDate.toLocaleDateString()}
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            + Add Note
          </button>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="space-y-3">
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border flex items-start gap-3 ${
                  n.status === "Completed" ? "bg-gray-100" : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={n.status === "Completed"}
                  onChange={() => handleToggleNote(n)}
                  className="w-4 h-4 mt-1 accent-blue-600"
                />
                <div>
                  <p
                    className={`text-sm ${
                      n.status === "Completed"
                        ? "line-through text-gray-500"
                        : "text-gray-800"
                    }`}
                  >
                    {n.note}
                  </p>
                  <p className="text-xs text-gray-400">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No notes for this date.</p>
        )}
      </div>

      {renderModal()}
    </div>
  );
}
