import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import LoginPage from './Page/LoginPage/LoginPage';
// import RegisterPage from './Page/RegisterPage/RegisterPage';
// import HomePage from './Page/HomePage/HomePage';
// import ProfilePage from './Page/MyProfilePage/ProfilePage';
// import ProtectRoute from './components/Authen/ProtectRoute';
// import {AuthProvider} from "./components/Authen/AuthContext.tsx";
// import UnPackPage from "./Page/UnPackPage/UnPackPage.tsx";
// import TradePage from "./Page/TradePage/TradePage.tsx";
// import SearchUser from "./Page/TradePage/SearchUser.tsx";
// import MainPage from "./page/main.tsx";
// import LoginPage from "./compoment/Login.tsx";
// import RegisterPage from "./page/Register.tsx";
// import DashboardPage from "./page/Dashboard.tsx";
// import PlaylistPage from "./page/Playlist.tsx";
import Home from "./page/patient/Home.tsx";
import Booking from "./page/Booking.tsx";
import DoctorDashboard from "./page/doctor/DoctorDashboard.tsx";
import DoctorSchedule from "./page/doctor/DoctorSchedule.tsx";
import DoctorChat from "./page/doctor/DoctorChat.tsx";
import WebRTCApp from './page/WebRTCApp.tsx';
import OnlineConsultSpecialty from "./page/patient/OnlineConsultSpecialty";
import OnlineConsultTime from "./page/patient/OnlineConsultTime";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import DoctorCall from "./page/doctor/DoctorCall.tsx";
function App() {
    return (
        <Router>
            {/*<AuthProvider>*/}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/doctor/" element={<DoctorDashboard />} />
                <Route path="/doctor/schedule" element={<DoctorSchedule />} />
                <Route path="/doctor/chat" element={<DoctorChat />} />
                <Route path='/video' element={<WebRTCApp/>} />
                <Route path="/online-consult" element={<OnlineConsultSpecialty />} />
                <Route path="/online-consult-time" element={<OnlineConsultTime />} />

            </Routes>
            {/*</AuthProvider>*/}
           <ToastContainer
                position="bottom-left"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                style={{ zIndex: 1000 }}
            />
        </Router>
    );
}

export default App;