import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import useAuth from "./useAuth";

function Profile() {
  const { userDetails, isLoading, logout } = useAuth(); // Destructure values from useAuth
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    phoneNumber: "",
    address: "",
  });

  // Initialize form data when userDetails changes
  useEffect(() => {
    if (userDetails) {
      setFormData({
        businessName: userDetails.businessName || "",
        businessDescription: userDetails.businessDescription || "",
        phoneNumber: userDetails.phoneNumber || "",
        address: userDetails.address || "",
      });
    }
  }, [userDetails]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result; // Base64-encoded image

          // Update Firestore with the Base64 image
          const docRef = doc(db, userDetails.type === "business" ? "businesses" : "users", auth.currentUser.uid);
          await updateDoc(docRef, {
            [userDetails.type === "business" ? "businessImage" : "photo"]: base64String,
          });
          toast.success("Profile picture updated successfully!");
        };
        reader.readAsDataURL(file); // Read the file as a data URL
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Error updating profile picture");
      }
    }
  };

  // Trigger file input click
  const handlePencilClick = () => {
    fileInputRef.current.click();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, userDetails.type === "business" ? "businesses" : "users", auth.currentUser.uid);
      await updateDoc(docRef, formData);
      toast.success("Profile updated successfully!");
      setIsEditing(false); // Exit edit mode
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      businessName: userDetails.businessName || "",
      businessDescription: userDetails.businessDescription || "",
      phoneNumber: userDetails.phoneNumber || "",
      address: userDetails.address || "",
    });
    setIsEditing(false); // Exit edit mode
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
      {userDetails ? (
        <>
          <h2 className="text-2xl text-center font-bold mb-4">Account Profile</h2>
          <div className="my-2 flex items-center">
            <div className="relative">
              <img
                src={
                  userDetails.type === "business"
                    ? userDetails.businessImage || "/images/defaultpfp.jpg" // Use businessImage for businesses
                    : userDetails.photo || userDetails.photoURL || "/images/defaultpfp.jpg" // Use photo or photoURL for users
                }
                alt="Profile"
                className="w-24 h-24 rounded-full mr-4"
                onError={(e) => {
                  e.target.src = "/images/defaultpfp.jpg";
                }}
              />
              <div
                className="absolute bottom-2 right-3 bg-[#333] text-white shadow-lg rounded-[100%] px-1 cursor-pointer hover:bg-gray-200 hover:text-black transition-colors"
                onClick={handlePencilClick}
              >
                <i className="fa fa-pencil text-lg" aria-hidden="true"></i>
              </div>
            </div>
            <div className="text-sm">
              <strong className="text-xl">
                {userDetails.type === "business"
                  ? userDetails.businessName
                  : userDetails.name}
              </strong>
              <p className="text-gray-400">{userDetails?.email}</p>
              {userDetails.type === "business" && (
                <>
                  <p className="text-gray-400">Phone: {userDetails.phoneNumber}</p>
                  <p className="text-gray-400">Address: {userDetails.address}</p>
                </>
              )}
            </div>
          </div>

          {/* Display business-specific data */}
          {userDetails.type === "business" && (
            <div className="mt-4">
            
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Business Description</label>
                    <textarea
                      name="businessDescription"
                      value={formData.businessDescription}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      rows="4"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg flex-1 hover:bg-blue-600 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1 hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full mt-4 hover:bg-blue-600 transition-colors"
                  >
                    Update Business Info
                  </button>
                </>
              )}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 my-5 py-2 rounded-lg w-full hover:bg-red-600 transition-colors"
          >
            Log out
          </button>
        </>
      ) : (
        <p>No user data found. Please log in.</p>
      )}

      <ToastContainer />
    </div>
  );
}

export default Profile;