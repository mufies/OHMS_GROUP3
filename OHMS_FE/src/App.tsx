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
import Booking from "./page/Booking.tsx";

function App() {
    return (
        <Router>
            {/*<AuthProvider>*/}
            <Routes>
                {/*<Route index element={<MainPage/>}/>*/}
                {/*<Route path="/deck" element={<ProtectRoute><ProfilePage/></ProtectRoute>}/>*/}
                {/*<Route path="unpack" element={<UnPackPage/>}/>*/}
                {/*<Route path="trade" element={<SearchUser/>}/>*/}
                {/*<Route path="/login" element={<LoginPage />} />*/}
                <Route path="/booking" element={<Booking />} />
                {/*<Route path="/music" element={<DashboardPage />} />*/}
                {/*<Route path="/register" element={<RegisterPage />} />*/}
                {/*<Route path="/playlist/:id" element={<PlaylistPage />} />*/}

            </Routes>
            {/*</AuthProvider>*/}
        </Router>
    );
}

export default App;