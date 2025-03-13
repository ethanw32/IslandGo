import React, { useState } from "react";
import { Link } from "react-router-dom";

function Header() {
  // Simulating authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="flex flex-row items-center bg-[#D9D9D9] text-3xl h-24 px-10">
      {/* Left Section */}
      <div className="font-bold text-black max-sm:text-2xl">
        <Link to="/">IslandGo</Link>
      </div>

      {/* Right Section */}
      <div className="ml-auto text-xl flex space-x-4">
        {isLoggedIn ? (
          // Show profile image when logged in
          <img 
            src="/profile.jpg" // Default profile image
            alt="Profile"
            className="w-10 h-10 rounded-full border border-gray-500"
          />
        ) : (
          // Show Log In/Sign Up when not logged in
          <Link to="/login">Log In/Sign Up</Link>
        )}
      </div>
    </div>
  );
}

export default Header;
