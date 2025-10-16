import "./Navigator.css"
import { useState, useEffect, useRef} from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faCalendarAlt, faCreditCard, faSignOutAlt} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../hook/useAuth.tsx";
import Login from "./Login";
function Navigator() {
    const navigate = useNavigate();
    const location = useLocation();
	const [hoveredMenu, setHoveredMenu] = useState<null | 'services' | 'profile'>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const servicesItems = [ 
        { label: "Đặt khám bác sĩ",  href:"/booking" },
        
        {label: "Gói khám sức khỏe"} ,
         {lable:  "Tư vấn Online"}];
	const profileItems = [
		{ label: "Lịch khám", href: "/appointments", icon: faCalendarAlt },
		{ label: "Lịch sử giao dịch", href: "/payments", icon: faCreditCard },
		{ label: "Hồ sơ", href: "/profile", icon: faUserCircle },
		{ label: "Đăng xuất", href: "#", icon: faSignOutAlt, action: "logout" }
	];
    const links = [
        { href: "/", label: "Đặt khám" },
        { href: "/", label: "" },
        // { href: "/donate", label: "Donate" },
        // { href: "/shop", label: "Shop" },
        // { href: "/partners", label: "Partners" },
    ];
    const [showLogin, setShowLogin] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();

    // Debug logging
    console.log('Navigator render - isAuthenticated:', isAuthenticated, 'user:', user);

    const toggleLogin = () => setShowLogin(prev => !prev);
    
    /* ---------- logout ---------- */
    const handleLogout = () => {
        logout();
        setShowProfile(false);
        // If user is on one of the personal pages, redirect to home
        const personalPaths = ['/profile', '/appointments', '/payments', '/account'];
        if (personalPaths.some(p => location.pathname.startsWith(p))) {
            navigate('/');
        }
    };

    // Close login modal when user successfully logs in
    useEffect(() => {
        if (isAuthenticated && showLogin) {
            setShowLogin(false);
        }
    }, [isAuthenticated, showLogin]);

    // Hover delay functions
	const handleMouseEnter = (menu: 'services' | 'profile') => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setHoveredMenu(menu);
    };

    const handleMouseLeave = () => {
        // Set a delay before hiding the menu
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredMenu(null);
        }, 300); // 300ms delay
    };

    const handleDropdownMouseEnter = () => {
        // Cancel the timeout when mouse enters dropdown
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleDropdownMouseLeave = () => {
        // Hide menu immediately when leaving dropdown
        setHoveredMenu(null);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    // No need for click outside handler since we're using hover
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
                            <div 
                                className="relative group login-button"
                                onMouseEnter={() => setShowProfile(true)}
                                onMouseLeave={() => setShowProfile(false)}
                            >
                                <button
                                    className="inline-flex items-center justify-center
                                    rounded-md border border-sky-500 bg-white px-4 py-2
                                    text-sm font-medium text-sky-600 transition-colors
                                    hover:bg-sky-50 hover:text-sky-700 cursor-pointer"
                                >
                                    {user?.name || 'User'}
                                </button>

                                {showProfile && (
                                    <div className="absolute right-0 pt-2 login-button">
                                        <div className="w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                                <p className="text-sm text-gray-500">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                {/* <button
                                                    onClick={() => {
                                                        setShowProfile(false);
                                                        setShowLogin(true);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <FontAwesomeIcon icon={faUserCircle} className="mr-3" />
                                                    Hồ sơ
                                                </button> */}
                                                <a
                                                    href="/profile"
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <FontAwesomeIcon icon={faUserCircle} className="mr-3" />
                                                    Hồ sơ
                                                </a>
                                                <a
                                                    href="/appointments"
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
                                                    Lịch khám
                                                </a>
                                                <a
                                                    href="/payments"
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <FontAwesomeIcon icon={faCreditCard} className="mr-3" />
                                                    Lịch sử giao dịch
                                                </a>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </nav>
            </header>
            <div style={{
                position: 'sticky',
                top: 56,
                zIndex: 40,
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 24,
                    padding: '10px 16px'
                }}>
                    <div
                        onMouseEnter={() => handleMouseEnter('services')}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative' }}
                    >
                        <a href="/services" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>Dịch vụ y tế</a>
                        {hoveredMenu === 'services' && (
                            <div 
                                onMouseEnter={handleDropdownMouseEnter}
                                onMouseLeave={handleDropdownMouseLeave}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '100%',
                                    marginTop: 8,
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                    padding: 8,
                                    minWidth: 260
                                }}>
                                {servicesItems.map((i) => (
    <a
        key={i.label || i.lable}
        href={i.href || (i.lable ? "/online-consult" : "#")}
        style={{
            display: 'block',
            padding: '10px 12px',
            borderRadius: 6,
            color: '#0f172a',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        {i.label || i.lable}
    </a>
))}
                            </div>
                        )}
                    </div>

                    <div
                        onMouseEnter={() => handleMouseEnter('profile')}
                        onMouseLeave={handleMouseLeave}
                        style={{ position: 'relative' }}
                    >
                        <a href="#" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>Thông tin cá nhân</a>
                        {hoveredMenu === 'profile' && (
                            <div 
                                onMouseEnter={handleDropdownMouseEnter}
                                onMouseLeave={handleDropdownMouseLeave}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '100%',
                                    marginTop: 8,
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                    padding: 8,
                                    minWidth: 200
                                }}>
                                {isAuthenticated ? (
                                    // Show profile menu items when logged in
                                    profileItems.map((item) => (
                                        <div key={item.label}>
                                            {item.action === 'logout' ? (
                                                <button
                                                    onClick={handleLogout}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        borderRadius: 6,
                                                        color: '#0f172a',
                                                        textDecoration: 'none',
                                                        fontWeight: 500,
                                                        transition: 'all 0.2s ease-in-out',
                                                        cursor: 'pointer',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={item.icon} style={{ marginRight: 8, width: 16 }} />
                                                    {item.label}
                                                </button>
                                            ) : (
                                                <a href={item.href} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '10px 12px',
                                                    borderRadius: 6,
                                                    color: '#0f172a',
                                                    textDecoration: 'none',
                                                    fontWeight: 500,
                                                    transition: 'all 0.2s ease-in-out',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                >
                                                    <FontAwesomeIcon icon={item.icon} style={{ marginRight: 8, width: 16 }} />
                                                    {item.label}
                                                </a>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Show login prompt when not logged in
                                    <div style={{ padding: '16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px 0' }}>
                                            Vui lòng đăng nhập để sử dụng tính năng này
                                        </p>
                                        <button
                                            onClick={toggleLogin}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#0ea5e9',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Đăng nhập
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showLogin && <Login onClose={toggleLogin} isProfileMode={isAuthenticated} />}
        </>
    );
}

export default Navigator;
