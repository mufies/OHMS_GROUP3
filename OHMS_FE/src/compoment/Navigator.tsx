import "./Navigator.css"
import { useState, useEffect} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser} from "@fortawesome/free-solid-svg-icons";
import { validateJwt } from "../hook/useAuth.tsx";
import Login from "./Login";
function Navigator() {
    const links = [
        { href: "/booking", label: "Đặt khám" },
        { href: "/", label: "" },
        // { href: "/donate", label: "Donate" },
        // { href: "/shop", label: "Shop" },
        // { href: "/partners", label: "Partners" },
    ];
    const [showLogin, setShowLogin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(token ? validateJwt(token) : false);
    }, [showLogin]);

    const toggleLogin = () => setShowLogin(prev => !prev);
    /* ---------- logout ---------- */
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };
    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50 bg-black-800/95 bg-white">
                <nav className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
                    {/* Logo */}
                    <a href="/" className="text-2xl font-bold text-black flex items-center">
                        ┏┛
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
                                    onClick={toggleLogin}
                                    className="flex items-center justify-center text-black
                             hover:text-pink-500 focus:text-pink-500 login-button cursor-pointer"
                                    title="User"
                                    style={{ fontSize: '1.25rem' }}
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                </button>

                                <div className="absolute right-0 hidden pt-2 group-hover:block login-button">
                                    <div className="w-48 rounded-md bg-white shadow-lg ring-1
                                  ring-opacity-5 focus:outline-none text-gray-100 left-0">
                                        <a
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                        >
                                            Profile
                                        </a>
                                        <a
                                            href="/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block-text"
                                        >
                                            Settings
                                        </a>
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
                            <button
                                onClick={toggleLogin}
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
      "
                            >
                                Login
                            </button>
                        )}
                    </div>
                </nav>
            </header>
            {showLogin && <Login onClose={toggleLogin} isProfileMode={isAuthenticated} />}
        </>
    );
}

export default Navigator;
