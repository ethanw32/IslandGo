import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, db } from "./config/firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import useAuth from "./useAuth";

function Profile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userDetails, isLoading, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewedBusiness, setViewedBusiness] = useState(null);
  const [formData, setFormData] = useState({ businessName: "", businessDescription: "", phoneNumber: "", address: "" });
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const businessId = searchParams.get("businessId");

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (businessId) {
        const docRef = doc(db, "businesses", businessId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setViewedBusiness(docSnap.data());
        else navigate("/myprofile");
      } else if (userDetails) {
        setFormData({
          businessName: userDetails.businessName || "",
          businessDescription: userDetails.businessDescription || "",
          phoneNumber: userDetails.phoneNumber || "",
          address: userDetails.address || "",
        });
      }
    };
    fetchBusinessProfile();
  }, [businessId, userDetails, navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userDetails || businessId) return;
      
      try {
        let q;
        if (userDetails.type === "business" && userDetails.businessType === "Rental") {
          q = query(
            collection(db, "bookings"),
            where("businessId", "==", auth.currentUser.uid)
          );
        } else if (userDetails.type === "user") {
          q = query(
            collection(db, "bookings"),
            where("customerId", "==", auth.currentUser.uid)
          );
        } else {
          setLoadingBookings(false);
          return;
        }
        
        const querySnapshot = await getDocs(q);
        const userBookings = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userBookings.push({
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate(),
          });
        });
        
        setBookings(userBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [userDetails, businessId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await updateDoc(doc(db, userDetails.type === "business" ? "businesses" : "users", auth.currentUser.uid), {
          [userDetails.type === "business" ? "businessImage" : "photo"]: reader.result,
        });
        toast.success("Profile picture updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, userDetails.type === "business" ? "businesses" : "users", auth.currentUser.uid), formData);
    toast.success("Profile updated!");
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) return <div className="max-w-md mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg"><p>Loading...</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
      {businessId ? (
        viewedBusiness ? (
          <>
            <h2 className="text-2xl text-center font-bold mb-4">Business Profile</h2>
            <div className="my-2 flex items-center">
              <div className="relative">
                <img src={viewedBusiness.businessImage || "/images/defaultpfp.jpg"} alt="Business Profile" className="w-24 h-24 rounded-full mr-4" onError={(e) => e.target.src = "/images/defaultpfp.jpg"} />
              </div>
              <div className="text-sm">
                <strong className="text-xl">{viewedBusiness.businessName}</strong>
                {viewedBusiness.email && <p className="text-gray-400">{viewedBusiness.email}</p>}
                <p className="text-gray-400">Phone: {viewedBusiness.phoneNumber}</p>
                <p className="text-gray-400">Address: {viewedBusiness.address}</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-gray-300">{viewedBusiness.businessDescription}</p>
            </div>
            <button onClick={() => navigate(-1)} className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full mt-6 hover:bg-blue-600 transition-colors">Go Back</button>
          </>
        ) : <p>Loading business profile...</p>
      ) : userDetails ? (
        <>
          <h2 className="text-2xl text-center font-bold mb-4">{userDetails.type === "business" ? "Business Profile" : "User Profile"}</h2>
          <div className="my-2 flex items-center">
            <div className="relative">
              <img src={userDetails.type === "business" ? userDetails.businessImage || "/images/defaultpfp.jpg" : userDetails.photo || userDetails.photoURL || "/images/defaultpfp.jpg"} alt="Profile" className="w-24 h-24 rounded-full mr-4" onError={(e) => e.target.src = "/images/defaultpfp.jpg"} />
              <div className="absolute bottom-2 right-3 bg-[#333] text-white shadow-lg rounded-[100%] px-1 cursor-pointer hover:bg-gray-200 hover:text-black transition-colors" onClick={() => fileInputRef.current.click()}>
                <i className="fa fa-pencil text-lg" aria-hidden="true"></i>
              </div>
            </div>
            <div className="text-sm">
              <strong className="text-xl">{userDetails.type === "business" ? userDetails.businessName : userDetails.name}</strong>
              <p className="text-gray-400">{userDetails?.email}</p>
              {userDetails.type === "business" && <>
                <p className="text-gray-400">Phone: {userDetails.phoneNumber}</p>
                <p className="text-gray-400">Address: {userDetails.address}</p>
              </>}
            </div>
          </div>

          {userDetails.type === "business" && (
            <div className="mt-4">
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Business Name</label>
                    <input type="text" name="businessName" value={formData.businessName} onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full p-2 rounded-lg bg-gray-700 text-white" required />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Business Description</label>
                    <textarea name="businessDescription" value={formData.businessDescription} onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full p-2 rounded-lg bg-gray-700 text-white" rows="4" required />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full p-2 rounded-lg bg-gray-700 text-white" required />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full p-2 rounded-lg bg-gray-700 text-white" required />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg flex-1 hover:bg-blue-600 transition-colors">Save</button>
                    <button type="button" onClick={() => {setFormData({businessName: userDetails.businessName || "", businessDescription: userDetails.businessDescription || "", phoneNumber: userDetails.phoneNumber || "", address: userDetails.address || ""}); setIsEditing(false);}} className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1 hover:bg-gray-600 transition-colors">Cancel</button>
                  </div>
                </form>
              ) : <>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-gray-300">{userDetails.businessDescription}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full mt-4 hover:bg-blue-600 transition-colors">Update Business Info</button>
              </>}
            </div>
          )}

          {/* Bookings Section - Only show for Rental businesses or regular users */}
          {(userDetails.type === "user" || (userDetails.type === "business" && userDetails.businessType === "Rental")) && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">{userDetails.type === "business" ? "Your Rentals" : "Your Bookings"}</h2>
              
              {loadingBookings ? (
                <p>Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="text-gray-400">No bookings found</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/4">
                          <img 
                            src={booking.vehicleDetails?.image || "/images/default-car.jpg"} 
                            alt={booking.vehicleDetails?.model} 
                            className="w-full h-32 object-cover rounded-md"
                            onError={(e) => e.target.src = "/images/default-car.jpg"}
                          />
                        </div>
                        <div className="md:w-3/4">
                          <h3 className="font-bold text-lg">{booking.vehicleDetails?.model || "Unknown Vehicle"}</h3>
                          {userDetails.type === "business" && (
                            <p className="text-gray-400">Booked by: {booking.customerEmail}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <div>
                              <p className="text-sm text-gray-400">Pickup:</p>
                              <p>{formatDate(booking.startDate)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Return:</p>
                              <p>{formatDate(booking.endDate)}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-400">Status:</p>
                            <p className={`font-medium ${
                              booking.status === "confirmed" ? "text-green-400" :
                              booking.status === "pending" ? "text-yellow-400" :
                              "text-red-400"
                            }`}>
                              {booking.status?.toUpperCase()}
                            </p>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-400">Total Price:</p>
                            <p className="font-bold">${booking.totalPrice?.toFixed(2) || "0.00"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
          <button onClick={logout} className="bg-red-500 text-white px-4 my-5 py-2 rounded-lg w-full hover:bg-red-600 transition-colors">Log out</button>
        </>
      ) : <p>No user data found. Please log in.</p>}
      <ToastContainer />
    </div>
  );
}

export default Profile;