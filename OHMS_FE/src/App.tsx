import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from "./page/patient/Home.tsx";
import Booking from "./page/Booking.tsx";
import DoctorDashboard from "./page/doctor/DoctorDashboard.tsx";
import DoctorSchedule from "./page/doctor/DoctorSchedule.tsx";
import DoctorChat from "./page/doctor/DoctorChat.tsx";
import DoctorProfilePage from "./page/doctor/DoctorProfilePage.tsx";
import PendingSchedulePage from "./page/doctor/PendingSchedulePage.tsx";
import WebRTCApp from './page/WebRTCApp.tsx';
import OnlineConsultSpecialty from "./page/patient/OnlineConsultSpecialty";
import OnlineConsultTime from "./page/patient/OnlineConsultTime";
import BookingSchedule from "./page/patient/BookingSchedule";
import BookingScheduleNew from "./page/patient/BookingSchedule_New_BACKUP.tsx";
import BookingPreventive from "./page/patient/BookingPreventive";
import PaymentCallback from "./page/patient/PaymentCallback";
import Doctor from "./page/patient/Doctor";
import Guide from "./page/patient/Guide.tsx";
import Policy from "./page/patient/Policy.tsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PatientChatPage from './page/patient/PatientChatPage.tsx';
import AppWithChat from './provider/AppWithChat.tsx';
import PatientProfile from "./components/patient/PatientProfile.tsx";
import PatientAppointments from "./components/patient/PatientAppointments.tsx";
import PatientAccount from "./components/patient/PatientAccount.tsx";
import PatientDashboard from "./page/patient/PatientDashboard.tsx";
import PatientMedicalRecords from './components/patient/PatientMedicalRecords.tsx';
import ReceptionAppointmentPage from './components/reception/AppointmentControll.tsx';
import StaffDashboard from "./page/staff/StaffDashboard.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import AdminRouter from "./components/admin/AdminRouter.tsx";

function App() {
    return (
        <Router>
            {/*<AuthProvider>*/}
            <AppWithChat>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/online-consult" element={<OnlineConsultSpecialty />} />
                <Route path="/online-consult-time" element={<OnlineConsultTime />} />
                <Route path="/online-doctor" element={<Doctor/>}/>
                <Route path="/booking-schedule" element={<BookingSchedule/>}/>
                <Route path="/booking-schedule-new" element={<BookingScheduleNew/>}/>
                <Route path="/booking-preventive" element={<BookingPreventive/>}/>
                <Route path="/payment-callback" element={<PaymentCallback/>}/>
                <Route path="/guide" element={<Guide />} />
                <Route path="/policy" element={<Policy />} />
                
                {/* Doctor Routes - Protected */}
                <Route path="/doctor/" element={
                    <ProtectedRoute allowedRoles={['ROLE_DOCTOR']}>
                        <DoctorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/schedule" element={
                    <ProtectedRoute allowedRoles={['ROLE_DOCTOR']}>
                        <DoctorSchedule />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/pending-requests" element={
                    <ProtectedRoute allowedRoles={['ROLE_DOCTOR']}>
                        <PendingSchedulePage />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/chat" element={
                    <ProtectedRoute allowedRoles={['ROLE_DOCTOR']}>
                        <DoctorChat />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/profile" element={
                    <ProtectedRoute allowedRoles={['ROLE_DOCTOR']}>
                        <DoctorProfilePage />
                    </ProtectedRoute>
                } />
                
                {/* Patient Routes - Protected */}
                <Route path="/chat" element={
                    <ProtectedRoute allowedRoles={['ROLE_PATIENT']}>
                        <PatientChatPage />
                    </ProtectedRoute>
                } />
                <Route path="/patient" element={
                    <ProtectedRoute allowedRoles={['ROLE_PATIENT']}>
                        <PatientDashboard />
                    </ProtectedRoute>
                }>
                    <Route path="appointments" element={<PatientAppointments />} />
                    <Route path="medical-record" element={<PatientMedicalRecords />} />
                    <Route path="profile" element={<PatientProfile />} />
                    <Route path="account" element={<PatientAccount />} />
                </Route>
                
                {/* Staff/Reception Routes - Protected */}
                <Route path='/receptionPage' element={
                    <ProtectedRoute allowedRoles={['ROLE_STAFF', 'ROLE_RECEPTION']}>
                        <ReceptionAppointmentPage/>
                    </ProtectedRoute>
                }/>
                <Route path='/staff' element={
                    <ProtectedRoute allowedRoles={['ROLE_STAFF', 'ROLE_ADMIN']}>
                        <StaffDashboard/>
                    </ProtectedRoute>
                }/>
                
                {/* Admin Routes - Protected */}
                <Route path='/admin/*' element={<AdminRouter />} />
                
                {/* Video Call - Protected (Doctor or Patient) */}
                <Route path='/video' element={
                    <ProtectedRoute allowedRoles={['ROLE_DOCTOR', 'ROLE_PATIENT']}>
                        <WebRTCApp/>
                    </ProtectedRoute>
                } />
                
                {/* Fallback */}
                <Route path="*" element={<Home />} />
            </Routes>
            </AppWithChat>
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