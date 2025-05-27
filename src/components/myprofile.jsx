import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, db } from "./config/firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import useAuth from "./useAuth";
import PropTypes from "prop-types";

function Profile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userDetails, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewedBusiness, setViewedBusiness] = useState(null);
  const [formData, setFormData] = useState({ 
    businessName: "", 
    businessDescription: "", 
    phoneNumber: "", 
    address: "" 
  });
  const [bookings, setBookings] = useState([]);
  const [tourReservations, setTourReservations] = useState([]);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState({
    profile: false,
    bookings: false,
    cancelling: false,
    tourReservations: false
  });
  const businessId = searchParams.get("businessId");

  const fetchBusinessProfile = useCallback(async () => {
    if (!businessId) return;
    
    setIsLoading(prev => ({...prev, profile: true}));
    try {
      const docRef = doc(db, "businesses", businessId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setViewedBusiness(docSnap.data());
      } else {
        navigate("/myprofile");
        toast.error("Business profile not found");
      }
    } catch (error) {
      console.error("Error fetching business profile:", error);
      toast.error(`Failed to load business profile: ${error.message}`);
    } finally {
      setIsLoading(prev => ({...prev, profile: false}));
    }
  }, [businessId, navigate]);

  const fetchBookings = useCallback(async () => {
    if (!userDetails || businessId) return;

    setIsLoading(prev => ({...prev, bookings: true}));
    try {
      let q;
      if (userDetails.type === "business" && userDetails?.businessType === "Rental") {
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
      toast.error(`Failed to load bookings: ${error.message}`);
    } finally {
      setIsLoading(prev => ({...prev, bookings: false}));
    }
  }, [userDetails, businessId]);
  
  const fetchTourReservations = useCallback(async () => {
    if (!userDetails || businessId || userDetails?.type !== "user") return;
    
    setIsLoading(prev => ({...prev, tourReservations: true}));
    try {
      const q = query(
        collection(db, "tourReservations"),
        where("customerId", "==", auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const userTourReservations = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userTourReservations.push({
          id: doc.id,
          ...data,
          reservationDate: data.reservationDate?.toDate(),
          createdAt: data.createdAt?.toDate()
        });
      });
      
      setTourReservations(userTourReservations);
    } catch (error) {
      console.error("Error fetching tour reservations:", error);
      toast.error(`Failed to load tour reservations: ${error.message}`);
    } finally {
      setIsLoading(prev => ({...prev, tourReservations: false}));
    }
  }, [userDetails, businessId]);

  useEffect(() => {
    if (businessId) {
      fetchBusinessProfile();
    } else if (userDetails) {
      setFormData({
        businessName: userDetails?.businessName || "",
        businessDescription: userDetails?.businessDescription || "",
        phoneNumber: userDetails?.phoneNumber || "",
        address: userDetails?.address || "",
      });
    }
  }, [businessId, userDetails, fetchBusinessProfile]);

  useEffect(() => {
    fetchBookings();
    fetchTourReservations();
  }, [fetchBookings]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => toast.info("Uploading image...");
    reader.onloadend = async () => {
      try {
        await updateDoc(
          doc(db, userDetails.type === "business" ? "businesses" : "users", auth.currentUser.uid), 
          { [userDetails.type === "business" ? "businessImage" : "photo"]: reader.result }
        );
        toast.success("Profile picture updated successfully!");
      } catch (error) {
        console.error("Error updating profile picture:", error);
        toast.error(`Failed to update profile picture: ${error.message}`);
      }
    };
    reader.onerror = () => toast.error("Error reading image file");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    if (formData.phoneNumber && !/^[\d\s+-]+$/.test(formData.phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      await updateDoc(
        doc(db, userDetails.type === "business" ? "businesses" : "users", auth.currentUser.uid), 
        formData
      );
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    }
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

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;

    setIsLoading(prev => ({...prev, cancelling: true}));
    try {
      // Get the booking document
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (!bookingSnap.exists()) {
        throw new Error("Booking not found");
      }
      
      const bookingData = bookingSnap.data();
      
      // Update the booking status to cancelled
      await updateDoc(bookingRef, {
        status: 'cancelled'
      });

      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId ? {...booking, status: 'cancelled'} : booking
        )
      );

      toast.success("Booking cancelled successfully");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(`Failed to cancel booking: ${error.message}`);
    } finally {
      setIsLoading(prev => ({...prev, cancelling: false}));
      setShowCancelModal(false);
      setBookingToCancel(null);
    }
  };
  
  const handleCancelTourReservation = async (reservationId) => {
    if (!reservationId) return;

    setIsLoading(prev => ({...prev, cancelling: true}));
    try {
      // Get the reservation document
      const reservationRef = doc(db, "tourReservations", reservationId);
      const reservationSnap = await getDoc(reservationRef);
      
      if (!reservationSnap.exists()) {
        throw new Error("Tour reservation not found");
      }
      
      // Update the reservation status to cancelled
      await updateDoc(reservationRef, {
        status: 'cancelled'
      });

      // Update local state
      setTourReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === reservationId ? {...reservation, status: 'cancelled'} : reservation
        )
      );

      toast.success("Tour reservation cancelled successfully");
    } catch (error) {
      console.error("Error cancelling tour reservation:", error);
      toast.error(`Failed to cancel tour reservation: ${error.message}`);
    } finally {
      setIsLoading(prev => ({...prev, cancelling: false}));
      setShowCancelModal(false);
      setBookingToCancel(null);
    }
  };



  if (!userDetails) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-4">Please log in to view your profile</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading.profile) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
      {businessId ? (
        viewedBusiness ? (
          <div>
            <div className="flex items-center mb-6">
              <img
                src={viewedBusiness.businessImage || "/images/defaultpfp.jpg"}
                alt="Business"
                className="w-24 h-24 rounded-full object-cover mr-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/defaultpfp.jpg";
                }}
              />
              <div>
                <h1 className="text-2xl font-bold">{viewedBusiness.businessName}</h1>
                <p className="text-gray-400">{viewedBusiness.businessType}</p>
              </div>
            </div>
            <div className="space-y-4">
              <p><strong>Description:</strong> {viewedBusiness.businessDescription}</p>
              <p><strong>Phone:</strong> {viewedBusiness.phoneNumber || "Not provided"}</p>
              <p><strong>Address:</strong> {viewedBusiness.address || "Not provided"}</p>
            </div>
          </div>
        ) : null
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="relative">
                <img
                  src={userDetails?.photoURL || userDetails?.businessImage || "/images/defaultpfp.jpg"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/defaultpfp.jpg";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  aria-label="Upload profile picture"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold">
                  {userDetails?.type === "business" ? userDetails?.businessName : userDetails?.name}
                </h1>
                <p className="text-gray-400">
                  {userDetails?.type === "business" ? "Business Account" : "User Account"}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              {userDetails?.type === "business" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  disabled={isLoading.profile}
                >
                  {isLoading.profile ? "Loading..." : "Edit Profile"}
                </button>
              )}
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {userDetails.type === "business" && (
            <div className="mb-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Business Name*</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.businessDescription}
                      onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                      rows="3"
                      maxLength="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                      pattern="[\d\s+-]+"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      disabled={isLoading.profile}
                    >
                      {isLoading.profile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <strong className="block mb-1">Business Description</strong>
                    <p className="text-gray-300">{userDetails?.businessDescription || "No description provided"}</p>
                  </div>
                  <div>
                    <strong className="block mb-1">Phone Number</strong>
                    <p className="text-gray-300">{userDetails?.phoneNumber || "No phone number provided"}</p>
                  </div>
                  <div>
                    <strong className="block mb-1">Address</strong>
                    <p className="text-gray-300">{userDetails?.address || "No address provided"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {(userDetails?.type === "user" || (userDetails?.type === "business" && userDetails?.businessType === "Rental")) && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">
                {userDetails?.type === "business" ? "Your Rentals" : "Your Bookings"}
                {isLoading.bookings && (
                  <span className="ml-2 text-sm text-gray-400">Loading...</span>
                )}
              </h2>
              {isLoading.bookings ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-gray-400">No bookings found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 hover:border-gray-600 transition-all">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{booking.vehicleDetails.model}</h3>
                            <p className="text-sm text-blue-400 mb-2">{booking.businessName}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-400">Class: {booking.vehicleDetails.class}</p>
                              <p className="text-sm text-gray-400">Color: {booking.vehicleDetails.color}</p>
                              <p className="text-sm text-gray-400">Capacity: {booking.vehicleDetails.capacity}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 
                            booking.status === 'completed' ? 'bg-purple-500/20 text-purple-400' : 
                            'bg-green-500/20 text-green-400'
                          } font-medium`}>
                            {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Confirmed'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-gray-300">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm">Start: {formatDate(booking.startDate)}</p>
                              <p className="text-sm">End: {formatDate(booking.endDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-300">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-semibold">${booking.totalPrice}</p>
                          </div>
                        </div>

                        {booking.specialRequests && (
                          <div className="text-gray-300">
                            <p className="text-sm font-medium mb-1">Special Requests:</p>
                            <p className="text-sm bg-gray-700/50 p-2 rounded">{booking.specialRequests}</p>
                          </div>
                        )}

                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setBookingToCancel(booking.id);
                              setShowCancelModal(true);
                            }}
                            className="w-full mt-4 bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors flex items-center justify-center space-x-2"
                            disabled={isLoading.cancelling}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Cancel Booking</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Tour Reservations Section */}
          {userDetails?.type === "user" && (
            <div className="bg-black/90 rounded-xl p-4 sm:p-6 shadow-lg mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Your Tour Reservations</h2>
              
              {isLoading.tourReservations ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : tourReservations.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-lg">
                  <p className="text-gray-300">You have no tour reservations yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {tourReservations.map((reservation) => (
                    <div key={reservation.id} className="bg-white/10 rounded-lg overflow-hidden border border-gray-700/30">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Tour Image */}
                          <div className="sm:w-1/4 h-32 sm:h-auto">
                            {reservation.tourImage ? (
                              <img 
                                src={reservation.tourImage} 
                                alt={reservation.tourName} 
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 rounded-md flex items-center justify-center">
                                <span className="text-gray-400">No image</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Tour Details */}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="text-lg font-semibold text-white">{reservation.tourName}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${reservation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : reservation.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {reservation.status === 'cancelled' ? 'Cancelled' : reservation.status === 'confirmed' ? 'Confirmed' : reservation.status}
                              </span>
                            </div>
                            
                            <p className="text-gray-400 text-sm mt-1">by {reservation.businessName}</p>
                            
                            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-gray-300">
                              <div>
                                <span className="text-gray-400">Date: </span>
                                {reservation.reservationDate ? formatDate(reservation.reservationDate) : 'N/A'}
                              </div>
                              <div>
                                <span className="text-gray-400">Persons: </span>
                                {reservation.persons}
                              </div>
                            </div>
                            
                            {reservation.specialRequests && (
                              <div className="mt-3 text-gray-300">
                                <p className="text-sm font-medium mb-1">Special Requests:</p>
                                <p className="text-sm bg-gray-700/50 p-2 rounded">{reservation.specialRequests}</p>
                              </div>
                            )}
                            
                            {reservation.status !== 'cancelled' && (
                              <button
                                onClick={() => {
                                  setBookingToCancel('tour-' + reservation.id);
                                  setShowCancelModal(true);
                                }}
                                className="w-full mt-4 bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors flex items-center justify-center space-x-2"
                                disabled={isLoading.cancelling}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Cancel Reservation</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm transition-opacity z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}
        >
          <div className="bg-white p-6 sm:p-8 rounded-xl w-full max-w-xs sm:max-w-md transform transition-all shadow-2xl">
            <h2 id="cancel-modal-title" className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
              Are you sure you want to cancel this {bookingToCancel && bookingToCancel.includes('tour') ? 'tour reservation' : 'booking'}?
            </h2>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  if (bookingToCancel && typeof bookingToCancel === 'string') {
                    if (bookingToCancel.startsWith('tour')) {
                      handleCancelTourReservation(bookingToCancel.replace('tour-', ''));
                    } else {
                      handleCancelBooking(bookingToCancel);
                    }
                  }
                }}
                className="flex-1 bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                disabled={isLoading.cancelling}
              >
                {isLoading.cancelling ? "Cancelling..." : `Cancel ${bookingToCancel && bookingToCancel.includes('tour') ? 'Reservation' : 'Booking'}`}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Keep {bookingToCancel && bookingToCancel.includes('tour') ? 'Reservation' : 'Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}

Profile.propTypes = {
  userDetails: PropTypes.shape({
    type: PropTypes.string,
    businessName: PropTypes.string,
    businessDescription: PropTypes.string,
    phoneNumber: PropTypes.string,
    address: PropTypes.string,
    photoURL: PropTypes.string,
    businessImage: PropTypes.string,
    name: PropTypes.string,
    businessType: PropTypes.string,
  }),
  logout: PropTypes.func.isRequired,
};

export default Profile;