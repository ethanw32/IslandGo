import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "./useAuth";
import {
  FaBars,
  FaTimes,
  FaEnvelope,
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt
} from "react-icons/fa";
import { useHasUnreadMessages } from './hooks/unreadmessages';
import UserAvatar from "./UserAvatar";

function Header() {
  const { userDetails, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasUnread = useHasUnreadMessages();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="flex items-center justify-between bg-black text-white h-24 px-6 md:px-10 sticky top-0 z-50">
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="md:hidden text-white focus:outline-none relative"
        aria-label="Toggle menu"
      >
        <FaBars className="h-6 w-6" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Logo */}
      <Link to="/" className="text-3xl font-bold">
        IslandGo
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        {userDetails ? (
          <>
            <Link to="/chat" className="relative p-2">
              <FaEnvelope className="h-6 w-6 text-white" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative group">
              <button className="flex items-center focus:outline-none">
                <UserAvatar user={userDetails} size="md" />
              </button>
              <div className="absolute -right-10 w-28 bg-white rounded-lg shadow-lg py-1 z-50 font-semibold hidden group-hover:block">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-75 z-40 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out md:hidden`}
        onClick={toggleMenu}
      >
        <div className="w-64 h-full bg-black text-white p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <span className="text-xl font-bold">IslandGo</span>
            <div className="flex items-center">
              <button onClick={toggleMenu} className="text-white">
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
          </div>
          <nav className="mt-3">
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  onClick={toggleMenu}
                  className="flex items-center py-2 hover:text-gray-300"
                >
                  <FaHome className="h-5 w-5 mr-2" />
                  Home
                </Link>
              </li>
              {userDetails && (
                <>
                  <li>
                    <Link
                      to="/profile"
                      onClick={toggleMenu}
                      className="flex items-center py-2 hover:text-gray-300"
                    >
                      <FaUser className="h-5 w-5 mr-2" />
                      Profile
                    </Link>
                  </li>
                  <li className="relative">
                    <Link
                      to="/chat"
                      onClick={toggleMenu}
                      className="flex items-center py-2 hover:text-gray-300"
                    >
                      <div className="flex items-center">
                        <FaEnvelope className="h-5 w-5 mr-2" />
                        Messages
                        {hasUnread && (
                          <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        logout();
                        toggleMenu();
                      }}
                      className="flex items-center py-2 hover:text-gray-300 w-full text-left"
                    >
                      <FaSignOutAlt className="h-5 w-5 mr-2" />
                      Sign Out
                    </button>
                  </li>
                </>
              )}
              {!userDetails && (
                <li>
                  <Link
                    to="/login"
                    onClick={toggleMenu}
                    className="flex items-center py-2 hover:text-gray-300"
                  >
                    <FaSignInAlt className="h-5 w-5 mr-2" />
                    Log In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;