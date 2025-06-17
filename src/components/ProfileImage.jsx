import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import { getAuth } from "firebase/auth";

const ProfileImage = ({ user, size = "md", className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const auth = getAuth();

  // Size classes for different image sizes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  useEffect(() => {
    const processImageUrl = () => {
      if (!user) return null;

      // For business users or business-related images
      if (user.type === "business" || user.isBusiness || user.businessImage) {
        // Prioritize business-specific images
        return user.businessImage || user.photoURL || null;
      }

      // For regular users
      const currentUser = auth.currentUser;

      // If this is a chat participant's image, use it directly
      if (user.photoURL) {
        return user.photoURL;
      }

      // Fallback to current user's photo only if we're displaying the current user
      if (currentUser && currentUser.uid === user.uid) {
        return currentUser?.providerData?.[0]?.photoURL || // Provider photo
          currentUser?.photoURL;                      // Auth user photo
      }

      return null;
    };

    setImageUrl(processImageUrl());
    setImageError(false);
  }, [user, auth.currentUser]);

  const handleImageError = (e) => {
    console.error("ProfileImage - Image failed to load:", {
      url: imageUrl,
      user: user,
      currentAuthUser: auth.currentUser
    });
    setImageError(true);
    e.target.onerror = null;
    e.target.src = "";
  };

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-2 border-white ${className} flex items-center justify-center bg-gray-100`}>
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={user?.name || user?.displayName || "User"}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={handleImageError}
          onLoad={() => {
            console.log("ProfileImage - Image loaded successfully:", imageUrl);
          }}
        />
      ) : (
        <User className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : size === "lg" ? "w-6 h-6" : "w-8 h-8"} text-gray-500`} />
      )}
    </div>
  );
};

export default ProfileImage; 