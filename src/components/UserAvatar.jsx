import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * UserAvatar component for displaying user profile images
 * Handles different image sources and fallback to default
 */
const UserAvatar = ({ user, size = "md", className = "" }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [imgError, setImgError] = useState(false);
  
  // Size classes for different avatar sizes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };
  
  // Set the image source based on user type and available image URLs
  useEffect(() => {
    if (!user) {
      setImgSrc("/images/defaultpfp.jpg");
      return;
    }
    
    // Reset error state when user changes
    setImgError(false);
    
    if (user.type === "business") {
      setImgSrc(user.businessImage || "/images/defaultpfp.jpg");
    } else {
      // For regular users, try Google photo first, then fallback to others
      if (user.photoURL) {
        setImgSrc(user.photoURL);
      } else if (user.photo) {
        setImgSrc(user.photo);
      } else {
        setImgSrc("/images/defaultpfp.jpg");
      }
    }
  }, [user]);
  
  // Handle image load error
  const handleImageError = () => {
    console.log("Avatar image failed to load:", imgSrc);
    setImgError(true);
    setImgSrc("/images/defaultpfp.jpg");
  };
  
  return (
    <img
      src={imgError ? "/images/defaultpfp.jpg" : imgSrc}
      alt={user?.name || "User"}
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border-2 border-white ${className}`}
      onError={!imgError ? handleImageError : undefined}
    />
  );
};

UserAvatar.propTypes = {
  user: PropTypes.object,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  className: PropTypes.string
};

export default UserAvatar;
