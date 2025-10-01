import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainApp from "./page/MainApp.tsx";
import Booking from "./page/Booking.tsx";
import DoctorDashboard from "./page/doctor/DoctorDashboard.tsx";
import DoctorSchedule from "./page/doctor/DoctorSchedule.tsx";
import ChatDemo from "./page/ChatDemo.tsx";
import PatientChatPage from './page/PatientChatPage.tsx';
import DoctorChatPage from './page/DoctorChatPage.tsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/chat-demo" element={<ChatDemo />} />
                <Route index element={<MainApp/>}/>
                <Route path="/booking" element={<Booking />} />
                <Route path="/doctor/" element={<DoctorDashboard />} />
                <Route path="/doctor/schedule" element={<DoctorSchedule />} />
                <Route path="/doctor/chat" element={<DoctorChatPage />} />
                <Route path="/patient/chat" element={<PatientChatPage />} />
                <Route path="*" element={<MainApp />} />
            </Routes>
        </Router>
    );
}

export default App;