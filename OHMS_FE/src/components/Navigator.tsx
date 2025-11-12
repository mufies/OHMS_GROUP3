import "./Navigator.css"
import { useState, useEffect} from "react";

import { validateJwt } from "../hook/useAuth.tsx";
import Login from "./auth/Login.tsx";
import Register from "./auth/register.tsx";
import { LOGIN_USER } from "../constant/enum.ts";
import { fetchLogoutUser, fetchGetProfile, axiosInstance } from "../utils/fetchFromAPI.ts";

export interface ProfileData {
  id: string;
  username: string;
  imageUrl?: string;
  email: string;
  roles: Array<{
    name: string;
    description?: string;
    permissions: string[];
  }>;
  phone?: string | null;
  medicleSpecially?: string | null;
}

function Navigator() {
    const links = [
        { href: "/booking", label: "Đặt khám" },
        { href: "/chat", label: "Nhắn tin" },
        { href: "/", label: "" },
    ];

    const [showLogin, setShowLogin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const [showRegister, setShowRegister] = useState(false);
    const [user, setUser] = useState<ProfileData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem(LOGIN_USER);
        
        if (token && validateJwt(token)) {
            fetchGetProfile()
                .then((data: ProfileData) => {
                    setUser(data);
                    setIsAuthenticated(true);
                })
                .catch(() => {
                    setIsAuthenticated(false);
                    localStorage.removeItem(LOGIN_USER);
                });
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [showLogin]);

    const getHighestRole = (roles?: ProfileData['roles']) => {
        if (!roles || roles.length === 0) return 'N/A';
        const priority = { ADMIN: 0, STAFF: 1, DOCTOR: 2,RECEPTION:3, PATIENT: 4 } as const;
        type PriorityKey = keyof typeof priority;
        return roles.reduce((highest, role) => {
            const currentP = priority[role.name as PriorityKey] ?? 4;
            const highestP = priority[highest.name as PriorityKey] ?? 4;
            return currentP < highestP ? role : highest;
        }, roles[0]).name;
    };
    const receptionRole =getHighestRole(user?.roles) ; 
    
    const toggleLogin = () => setShowLogin(prev => !prev);
    /* ---------- logout ---------- */
    const handleLogout = () => {
        fetchLogoutUser();
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem(LOGIN_USER);
        
  // Xóa query param khỏi URL (nếu có)
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('accessToken');
  window.history.replaceState({}, document.title, currentUrl.toString());
  axiosInstance.post(`auth/logout`);
  // Redirect về home sạch
  window.location.href = '/';
    };
    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50 bg-black-800/95 bg-white">
                <nav className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
                    {/* Logo */}
                    <a 
                        href="/" 
                        className="
                            text-x
                            font-medium 
                            text-black/90 
                            flex 
                            items-center
                            relative
                            after:absolute
                            after:inset-x-0
                            after:-bottom-1
                            after:h-0.5
                            after:scale-x-0
                            after:bg-pink-500
                            after:transition-transform
                            after:duration-200
                            hover:after:scale-x-100
                        "
                    >
                        Home
                    </a>

                    {/* Navigation links */}
                    <ul className="flex gap-6 text-sm font-medium text-black/90">
                        {links.map(({ href, label }) => (
                            <li key={href}>
                                <a
                                    href={href}
                                    className="
                      relative
                      text-black
                      after:absolute
                      after:inset-x-0
                      after:-bottom-1
                      after:h-0.5
                      after:scale-x-0
                      after:bg-pink-500
                      after:transition-transform
                      after:duration-200
                      hover:after:scale-x-100
                    "
                                >
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="ml-auto flex items-center gap-6">
                        {isAuthenticated ? (
                            <div className="relative group login-button">
                                <button
                                    className="flex items-center justify-center text-black hover:text-pink-500 focus:text-pink-500 login-button cursor-pointer"
                                    title="User"
                                    style={{ fontSize: '1.25rem' }}
                                >
                                                    <img
                                src={user?.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full object-cover"
                                />

                                </button>

                                <div className="absolute right-0 hidden pt-2 group-hover:block login-button">
                                    <div className="w-48 rounded-md bg-white shadow-lg ring-1
                                  ring-opacity-5 focus:outline-none text-gray-100 left-0">
                                        <div className="px-4 py-2 text-sm text-gray-700 bg-gray-50 border-b">
                                            <p className="font-medium">{user?.username || user?.email}</p>
                                            <p className="text-xs opacity-75">{user?.email}</p>
                                            <p className="text-xs opacity-75">Role: {getHighestRole(user?.roles)}</p>
                                        </div>
                                        <a
                                            href="/patient/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                        >
                                            Profile
                                        </a>
                                        <a
                                            href="/chat"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                        >
                                            Chat
                                        </a>
                                        <a
                                            href="/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                        >
                                            Settings
                                        </a>
                                        {/* aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa */}
                                        {receptionRole && <a
                                            href="/receptionPage"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                        >
                                            Reception manager
                                        </a>}

                         
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div 
                                  className="
                                inline-flex items-center justify-center
                                rounded-md
                                border border-sky-500
                                bg-white
                                px-4 py-2
                                text-sm font-medium text-sky-600
                                transition-colors
                                hover:bg-sky-50 hover:text-sky-700
                                focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:ring-offset-1
                                cursor-pointer
      ">
                            <button
                                onClick={toggleLogin}
                            >
                                Login
                            </button>
                            |
                            <button
                                onClick={() => setShowRegister(true)}
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </header>
            {showLogin && <Login onClose={toggleLogin} />}
            {showRegister && <Register onClose={() => setShowRegister(false)} onSwitch={() => {
                setShowRegister(false);
                setShowLogin(true);
            }} />}
        </>
    );
}

export default Navigator;