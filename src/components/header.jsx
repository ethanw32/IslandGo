import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "./useAuth";
import { auth } from "./config/firebase";
import { motion } from "framer-motion";
import { FloatingDock } from "./ui/floating-dock";
import { MobileNavBar } from "./MobileNavBar";
import Weather from "./Weather";
import {
  Building2,
  MapPin,
  Route,
  Car,
  Gauge,
  Mail,
  User,
  Sun,
  Moon
} from "lucide-react";
import { useHasUnreadMessages } from './hooks/unreadmessages';
import ProfileImage from "./ProfileImage";

const Header = () => {
  const { userDetails, logout } = useAuth();
  const hasUnread = useHasUnreadMessages();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname === '/chat';
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : document.documentElement.classList.contains('dark');
  });

  // Add state to track if floating dock should be hidden
  const [hideFloatingDock, setHideFloatingDock] = useState(false);

  // Add effect to listen for custom event
  useEffect(() => {
    const handleInputFocus = (e) => {
      setHideFloatingDock(e.detail.focused);
    };

    window.addEventListener('chatInputFocus', handleInputFocus);
    return () => window.removeEventListener('chatInputFocus', handleInputFocus);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const desktopNavigationItems = [
    {
      title: "Businesses",
      icon: <Building2 className="h-full w-full" />,
      href: "/"
    },
    {
      title: "Tours",
      icon: <Route className="h-full w-full" />,
      href: "/tours"
    },
    {
      title: "Attractions",
      icon: <MapPin className="h-full w-full" />,
      href: "/map"
    },
    {
      title: "Vehicles",
      icon: <Car className="h-full w-full" />,
      href: "/vehicles"
    }
  ];

  const mobileNavigationItems = [
    ...desktopNavigationItems,
    {
      title: "Profile",
      icon: <User className="h-full w-full" />,
      href: "/profile"
    }
  ];

  // Add dashboard link for taxi/rental users
  if (userDetails?.businessType === "Taxi" || userDetails?.businessType === "Rental") {
    desktopNavigationItems.push({
      title: "Dashboard",
      icon: <Gauge className="h-full w-full" />,
      href: "/dashboard"
    });
    mobileNavigationItems.push({
      title: "Dashboard",
      icon: <Gauge className="h-full w-full" />,
      href: "/dashboard"
    });
  }

  return (
    <>
      <header className="flex bg-[#212121] items-center justify-between text-white h-20 px-6 md:px-10 sticky top-0 z-10">
        {/* Logo */}
        <Link to="/" className="text-3xl font-bold">
          IslandGo
        </Link>

        {/* User controls - flex-1 with justify-end pushes to right */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Weather Component */}
          <div className="hidden md:block">
            <Weather />
          </div>

          {userDetails ? (
            <>
              <Link to="/chat" className="relative p-2">
                <Mail className="h-6 w-6 text-white" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </Link>

              {/* Profile dropdown - hidden on mobile */}
              <div className="relative group hidden md:block">
                <button className="flex items-center focus:outline-none">
                  <ProfileImage user={userDetails} size="md" />
                </button>
                <div className="absolute -right-10 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 font-semibold hidden group-hover:block">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </Link>
                  {(userDetails.businessType === 'Taxi' || userDetails.businessType === 'Rental') && (
                    <button
                      onClick={() => {
                        navigate(userDetails.businessType === 'Taxi' ? '/bpf' : '/rpf', {
                          state: {
                            businessId: auth.currentUser.uid,
                            businessName: userDetails.businessName,
                            businessImage: userDetails.businessImage || userDetails.photoURL,
                            ownerId: auth.currentUser.uid
                          }
                        });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {userDetails.businessType === 'Taxi' ? 'My Tours' : 'My Rentals'}
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* Desktop Navigation Dock */}
      {!hideFloatingDock && (
        <FloatingDock
          items={desktopNavigationItems}
          desktopClassName="translate-y-0"
          mobileClassName="hidden"
        />
      )}

      {/* Mobile Navigation Bar */}
      <MobileNavBar items={mobileNavigationItems} />
    </>
  );
};

export default Header;