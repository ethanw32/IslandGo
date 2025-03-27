import React from "react";
import { Link } from "react-router-dom";
import useAuth from "./useAuth";

function Header() {
  const { userDetails, logout } = useAuth();

  return (
    <div className="flex flex-row items-center bg-black text-white text-3xl h-24 px-10">
      <div className="font-bold max-sm:text-2xl">
        <Link to="/">IslandGo</Link>
      </div>

      {/* Right Section */}
      <div className="ml-auto text-xl relative group flex space-x-4 items-center">

        
        {userDetails ? ( // Check if userDetails exists (user is logged in)
          <>
            <div className="relative">
              {/* Display business photo if type is "business", otherwise display user photo */}
              <img
                src={
                  userDetails.type === "business"
                    ? userDetails.businessImage || "/images/defaultpfp.jpg" // Use businessImage for businesses
                    : userDetails.photo || userDetails.photoURL || "/images/defaultpfp.jpg" // Use photo or photoURL for users
                }
                alt="Profile"
                className="w-12 h-12 rounded-full cursor-pointer"
                onError={(e) => {
                  e.target.src = "/images/defaultpfp.jpg"; // Fallback to default image
                }}
              />

              {/* Dropdown Menu */}
              <div className="absolute -right-10 top-12 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10 focus:opacity-100 focus:visible">
                <ul className="py-2 text-left text-lg">
                  <Link to="/profile">
                    <li className="w-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100">
                      Profile
                      <i className="fa fa-user ml-2" aria-hidden="true"></i>
                    </li>
                  </Link>

                  <li
                    onClick={logout} // Use the logout function from useAuth
                    className="w-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
                  >
                    Log out
                    <i className="fa fa-sign-out ml-2" aria-hidden="true"></i>
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-400">
              Log In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Header;