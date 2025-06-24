import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "./config/firebase";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../AuthProvider";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { sendEmail, testServerConnection, sendBookingConfirmation, sendTourReservationConfirmation } from '../utils/emailService';
import ProfileImage from './ProfileImage';

// Add these function definitions before the Profile component
const processPayment = async (booking) => {
  try {
    // Here you would integrate with your actual payment processing logic
    // For now, we'll simulate a successful payment
    return { success: true, message: 'Payment processed successfully' };
  } catch (error) {
    console.error('Payment processing error:', error);
    return { success: false, message: error.message || 'Payment processing failed' };
  }
};

const generateEmailTemplate = (booking) => {
  // Add data validation and default values
  const bookingData = {
    id: booking.id || 'N/A',
    date: booking.startDate || booking.date || new Date(),
    time: booking.time || 'N/A',
    guests: booking.guests || booking.persons || 1,
    totalAmount: booking.totalPrice || booking.totalAmount || 0,
    name: booking.customerName || booking.name || 'Valued Customer',
    vehicleDetails: booking.vehicleDetails || {
      model: 'N/A',
      class: 'N/A',
      color: 'N/A',
      capacity: 'N/A'
    }
  };

  console.log('Generating booking email template with data:', bookingData);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Booking Confirmation</h2>
      <p>Dear ${bookingData.name},</p>
      <p>Your booking has been confirmed. Here are your booking details:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Booking ID:</strong> ${bookingData.id}</p>
        <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${bookingData.time}</p>
        <p><strong>Total Amount:</strong> $${bookingData.totalAmount.toFixed(2)}</p>
        <p><strong>Vehicle Details:</strong></p>
        <ul>
          <li>Model: ${bookingData.vehicleDetails.model}</li>
          <li>Class: ${bookingData.vehicleDetails.brand}</li>
          <li>Color: ${bookingData.vehicleDetails.color}</li>
          <li>Capacity: ${bookingData.vehicleDetails.transmission}</li>
        </ul>
      </div>
      <p>Thank you for choosing IslandGo!</p>
      <p>Best regards,<br>The IslandGo Team</p>
    </div>
  `;
};

const generateTourReservationEmailTemplate = (reservation) => {
  // Add data validation and default values
  const reservationData = {
    id: reservation.id || 'N/A',
    date: reservation.reservationDate || reservation.date || new Date(),
    participants: reservation.persons || reservation.participants || 1,
    totalAmount: reservation.totalPrice || reservation.totalAmount || 0,
    name: reservation.customerName || reservation.name || 'Valued Customer',
    tourName: reservation.tourName || 'Tour',
    businessName: reservation.businessName || 'IslandGo'
  };

  console.log('Generating email template with data:', reservationData);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Tour Reservation Confirmation</h2>
      <p>Dear ${reservationData.name},</p>
      <p>Your tour reservation has been confirmed. Here are your reservation details:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Reservation ID:</strong> ${reservationData.id}</p>
        <p><strong>Tour Name:</strong> ${reservationData.tourName}</p>
        <p><strong>Tour Date:</strong> ${new Date(reservationData.date).toLocaleDateString()}</p>
        <p><strong>Number of Participants:</strong> ${reservationData.participants}</p>
        <p><strong>Total Amount:</strong> $${reservationData.totalAmount.toFixed(2)}</p>
        <p><strong>Business:</strong> ${reservationData.businessName}</p>
      </div>
      <p>Thank you for choosing IslandGo for your tour!</p>
      <p>Best regards,<br>The IslandGo Team</p>
    </div>
  `;
};

const updateBookingStatus = async (bookingId, status) => {
  try {
    console.log('Attempting to update booking status:', { bookingId, status });

    const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    console.log('Status update response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update booking status');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating booking status:', {
      error: error.message,
      bookingId,
      status
    });
    throw new Error(`Failed to update booking status: ${error.message}`);
  }
};

const Profile = () => {
  const { userDetails, logout, setUserDetails } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewedBusiness, setViewedBusiness] = useState(null);
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    phoneNumber: "",
    address: "",
  });
  const [bookings, setBookings] = useState([]);
  const [tourReservations, setTourReservations] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const fileInputRef = useRef(null);
  const businessId = location.state?.businessId;
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add debugging logs
  useEffect(() => {
    console.log("Profile page location state:", location.state);
    console.log("Business ID from location:", businessId);
  }, [location.state, businessId]);

  // Debug userDetails
  useEffect(() => {
    console.log("Current userDetails:", userDetails);
    console.log("Current auth user:", auth.currentUser);
  }, [userDetails]);

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

  // Add useEffect to fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (businessId) {
        setIsLoading(true);
        try {
          const businessDoc = await getDoc(doc(db, "businesses", businessId));
          if (businessDoc.exists()) {
            setViewedBusiness({
              ...businessDoc.data(),
              businessId: businessDoc.id
            });
          }
        } catch (error) {
          console.error("Error fetching business data:", error);
          toast.error("Failed to load business information");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchBusinessData();
  }, [businessId]);

  const fetchBookings = useCallback(async () => {
    if (!userDetails) return;

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
          startDate: data.startDate ? new Date(data.startDate.seconds * 1000) : new Date(),
          endDate: data.endDate ? new Date(data.endDate.seconds * 1000) : new Date(),
          status: data.status || 'pending',
          vehicleDetails: data.vehicleDetails || {
            model: 'Unknown model',
            class: 'Unknown class',
            color: 'Unknown color',
            capacity: 'Unknown capacity'
          }
        });
      });

      setBookings(userBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error(`Failed to load bookings: ${error.message}`);
    }
  }, [userDetails]);

  const fetchTourReservations = useCallback(async () => {
    if (!userDetails || userDetails.type !== "user") return;

    try {
      const q = query(
        collection(db, "tourReservations"),
        where("customerId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const reservations = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reservations.push({
          id: doc.id,
          ...data,
          reservationDate: data.reservationDate?.toDate(),
          tourImage: data.tourImage || "/images/default-tour.jpg",
          tourName: data.tourName || "Unnamed Tour",
          businessName: data.businessName || "Unknown Business",
          persons: data.persons || 1,
          totalPrice: data.totalPrice || 0,
          isPrivate: data.isPrivate || false,
          status: data.status || "pending"
        });
      });

      setTourReservations(reservations);
    } catch (error) {
      console.error("Error fetching tour reservations:", error);
      toast.error(`Failed to load tour reservations: ${error.message}`);
    }
  }, [userDetails]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchTourReservations();
  }, [fetchTourReservations]);

  // Calculate total amount whenever bookings or tourReservations change
  useEffect(() => {
    let total = 0;

    // Add up unpaid bookings
    bookings.forEach(booking => {
      if (!booking.isPaid && booking.status !== 'cancelled') {
        total += parseFloat(booking.totalPrice) || 0;
      }
    });

    // Add up unpaid tour reservations
    tourReservations.forEach(reservation => {
      if (!reservation.isPaid && reservation.status !== 'cancelled') {
        total += parseFloat(reservation.totalPrice) || 0;
      }
    });

    setTotalAmount(total);
  }, [bookings, tourReservations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (userDetails.type === "business") {
        const businessRef = doc(db, "businesses", auth.currentUser.uid);
        await updateDoc(businessRef, formData);
      } else {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, formData);
      }
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 1MB for base64)
    if (file.size > 1 * 1024 * 1024) {
      toast.error("File size should be less than 1MB");
      return;
    }

    try {
      console.log("Converting image to base64...");

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64String = reader.result;
          console.log("Image converted to base64");

          // Determine which collection to update based on user type
          const collectionName = userDetails.type === "business" ? "businesses" : "users";
          const docRef = doc(db, collectionName, auth.currentUser.uid);

          // Update the profile with the base64 image
          await updateDoc(docRef, {
            photoURL: base64String,
            // For businesses, also update businessImage field
            ...(userDetails.type === "business" && { businessImage: base64String })
          });
          console.log(`Profile updated with base64 image in ${collectionName} collection`);

          // Update local user details
          setUserDetails(prev => ({
            ...prev,
            photoURL: base64String,
            // For businesses, also update businessImage
            ...(userDetails.type === "business" && { businessImage: base64String })
          }));

          toast.success("Profile picture updated successfully");
        } catch (error) {
          console.error("Error updating profile with base64 image:", error);
          toast.error("Failed to update profile picture: " + error.message);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast.error("Failed to read image file");
      };

    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image: " + error.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      // Get the booking details first
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();

      // Set the vehicle back to available if we have vehicle info
      if (bookingData.vehicleId) {
        const vehicleRef = doc(db, "rentals", bookingData.vehicleId);
        await updateDoc(vehicleRef, {
          'vehicle.availability': 'Available',
          'vehicle.isAvailable': true
        });
      }

      // Update the booking status to cancelled first
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      // Then delete the booking
      await deleteDoc(bookingRef);

      // Remove the cancelled booking from the local state
      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));

      setSuccessMessage(`Booking for ${bookingData.vehicleDetails?.model || 'vehicle'} has been cancelled successfully. The vehicle is now available for other bookings.`);
      setShowSuccessModal(true);
      setShowCancelModal(false);
      setBookingToCancel(null);

    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking: " + error.message);
    }
  };

  const handleCancelTourReservation = async (reservationId) => {
    try {
      // Get the reservation details first
      const reservationRef = doc(db, "tourReservations", reservationId);
      const reservationDoc = await getDoc(reservationRef);

      if (!reservationDoc.exists()) {
        throw new Error("Reservation not found");
      }

      const reservationData = reservationDoc.data();

      // Get the tour document to update spots
      const tourRef = doc(db, "tours", reservationData.tourId);
      const tourDoc = await getDoc(tourRef);

      if (tourDoc.exists()) {
        const tourData = tourDoc.data();

        // Convert the reservation date to a proper Date object
        let reservationDate;
        try {
          if (reservationData.reservationDate?.toDate) {
            reservationDate = reservationData.reservationDate.toDate();
          } else if (reservationData.reservationDate instanceof Date) {
            reservationDate = reservationData.reservationDate;
          } else {
            reservationDate = new Date(reservationData.reservationDate);
          }
        } catch (error) {
          console.error("Error converting date:", error);
          throw new Error("Invalid reservation date format");
        }

        // If it's a private tour, add the date back to available dates
        if (reservationData.isPrivate) {
          const updatedDates = [...(tourData.availableDates || [])];
          updatedDates.push(reservationDate);

          await updateDoc(tourRef, {
            availableDates: updatedDates
          });
        }

        // Update the tour's bookings count
        const dateKey = reservationDate.toISOString().split('T')[0];
        const currentBookings = tourData.dateBookings || {};
        const updatedBookings = {
          ...currentBookings,
          [dateKey]: Math.max(0, (currentBookings[dateKey] || 0) - reservationData.persons)
        };

        await updateDoc(tourRef, {
          dateBookings: updatedBookings
        });
      }

      // Delete the tour reservation document from the database
      await deleteDoc(reservationRef);

      // Remove the cancelled reservation from the local state
      setTourReservations(prevReservations =>
        prevReservations.filter(reservation => reservation.id !== reservationId)
      );

      setSuccessMessage(`Tour reservation for ${reservationData.tourName || 'tour'} has been cancelled successfully.`);
      setShowSuccessModal(true);
      setShowCancelModal(false);
      setBookingToCancel(null);

    } catch (error) {
      console.error("Error cancelling tour reservation:", error);
      toast.error("Failed to cancel tour reservation: " + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      // Handle regular Date object
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handlePayment = async (booking) => {
    let statusUpdateError = null;

    try {
      // First test server connection
      const isServerConnected = await testServerConnection();
      if (!isServerConnected) {
        throw new Error('Cannot connect to email server. Please try again later.');
      }

      // Process payment
      const paymentResult = await processPayment(booking);
      if (!paymentResult.success) {
        throw new Error(paymentResult.message);
      }

      // Update booking status first
      try {
        console.log('Updating booking status for:', booking);
        const statusResult = await updateBookingStatus(booking.id, 'confirmed');
        console.log('Status update result:', statusResult);
      } catch (error) {
        console.error('Failed to update booking status:', error);
        statusUpdateError = error;
        // Continue with email sending even if status update fails
      }

      // Send confirmation email using the email service
      const bookingEmailResult = await sendBookingConfirmation(booking);

      // Show appropriate message based on what succeeded/failed
      if (statusUpdateError) {
        setMessage({
          type: 'warning',
          text: `Payment successful and email sent, but failed to update status: ${statusUpdateError.message}. Please contact support.`
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Payment successful and confirmation email sent!'
        });
      }
    } catch (error) {
      console.error('Payment/Email error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred during payment processing'
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  // Show business profile if we're viewing another business
  if (businessId && viewedBusiness) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
        <div>
          <div className="flex items-center mb-6">
            <ProfileImage
              user={{
                type: "business",
                businessImage: viewedBusiness.businessImage
              }}
              size="lg"
              className="mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">{viewedBusiness.businessName}</h1>
              <p className="text-gray-400">{viewedBusiness.businessType || "Business"}</p>
            </div>
          </div>
          <div className="space-y-4">
            <p><strong>Description:</strong> {viewedBusiness.businessDescription || "No description provided"}</p>
            <p><strong>Phone:</strong> {viewedBusiness.phoneNumber || "Not provided"}</p>
            <p><strong>Address:</strong> {viewedBusiness.address || "Not provided"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
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

  // Show user's own profile
  return (
    <div className="min-h-screen 0 w-full relative pb-10">
      <div className="max-w-4xl mx-auto p-6 bg-black text-white shadow-lg m-10 rounded-lg">
        {businessId ? (
          viewedBusiness ? (
            <div>
              <div className="flex items-center mb-6">
                <ProfileImage
                  user={{
                    type: "business",
                    businessImage: viewedBusiness.businessImage
                  }}
                  size="lg"
                  className="mr-4"
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
                  <ProfileImage
                    user={userDetails}
                    size="xl"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                    aria-label="Upload profile picture"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
              <div className="flex items-center gap-4">
                {userDetails?.type === "business" && (
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Menu"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit Profile
                        </button>
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
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {userDetails.businessType === 'Taxi' ? 'View Tours' : 'View Rentals'}
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {userDetails?.type !== "business" && (
                  <button
                    onClick={logout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm sm:text-base"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>

            {/* PayPal Checkout Button */}
            {(bookings.length > 0 || tourReservations.length > 0) && (
              <div className="flex justify-end mb-6 relative z-0">
                <div className="text-right">
                  <h3 className="text-xl font-semibold mb-4">
                    {isPaid ? `Balance: $${balance.toFixed(2)}` : `Total Amount: $${totalAmount.toFixed(2)}`}
                  </h3>
                  {!isPaid && totalAmount > 0 && (
                    <PayPalScriptProvider options={{ "client-id": "AWD8LCSPAdc52fO1971Y41NDCxe3_L-8jEJeDQOc_C3oXAHUTXIiKOLmXruhM1Sa6Vo5Si6L3ExFaD66", currency: "USD" }}>
                      <PayPalButtons
                        style={{
                          layout: "horizontal",
                          color: "blue",
                          shape: "rect",
                          label: "pay"
                        }}
                        fundingSource="paypal"
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: totalAmount.toFixed(2),
                                },
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          await actions.order.capture();

                          try {
                            // Update bookings in database
                            const bookingPromises = bookings.map(async (booking) => {
                              if (!booking.isPaid && booking.status === 'pending') {
                                try {
                                  const bookingRef = doc(db, "bookings", booking.id);
                                  await updateDoc(bookingRef, {
                                    status: 'confirmed',
                                    isPaid: true
                                  });

                                  // Only send email if we have a valid email address
                                  if (booking.email || booking.customerEmail) {
                                    const emailToUse = booking.email || booking.customerEmail;
                                    console.log('Sending confirmation email to:', emailToUse);

                                    const bookingEmailResult = await sendBookingConfirmation({
                                      ...booking,
                                      customerEmail: emailToUse
                                    });

                                    if (bookingEmailResult.success) {
                                      toast.success(`Confirmation email sent to ${emailToUse}`);
                                    } else {
                                      toast.warning(`Booking confirmed but email could not be sent: ${bookingEmailResult.message}`);
                                    }
                                  } else {
                                    console.warn('No email address available for booking:', booking.id);
                                    toast.warning('Booking confirmed but no email address available for confirmation');
                                  }
                                } catch (error) {
                                  console.error('Error processing booking:', error);
                                  toast.error(`Error processing booking: ${error.message}`);
                                }
                              }
                            });

                            // Update tour reservations in database
                            const reservationPromises = tourReservations.map(async (reservation) => {
                              if (!reservation.isPaid && reservation.status === 'pending') {
                                try {
                                  const reservationRef = doc(db, "tourReservations", reservation.id);
                                  await updateDoc(reservationRef, {
                                    status: 'confirmed',
                                    isPaid: true
                                  });

                                  // Only send email if we have a valid email address
                                  if (reservation.email || reservation.customerEmail) {
                                    const emailToUse = reservation.email || reservation.customerEmail;
                                    console.log('Sending confirmation email to:', emailToUse);

                                    const reservationEmailResult = await sendTourReservationConfirmation({
                                      ...reservation,
                                      customerEmail: emailToUse
                                    });

                                    if (reservationEmailResult.success) {
                                      toast.success(`Confirmation email sent to ${emailToUse}`);
                                    } else {
                                      toast.warning(`Reservation confirmed but email could not be sent: ${reservationEmailResult.message}`);
                                    }
                                  } else {
                                    console.warn('No email address available for reservation:', reservation.id);
                                    toast.warning('Reservation confirmed but no email address available for confirmation');
                                  }
                                } catch (error) {
                                  console.error('Error processing reservation:', error);
                                  toast.error(`Error processing reservation: ${error.message}`);
                                }
                              }
                            });

                            // Wait for all updates to complete
                            await Promise.all([...bookingPromises, ...reservationPromises]);

                            // Update local state
                            const updatedBookings = bookings.map(booking => ({
                              ...booking,
                              status: (!booking.isPaid && booking.status === 'pending') ? 'confirmed' : booking.status,
                              isPaid: true
                            }));
                            setBookings(updatedBookings);

                            const updatedTourReservations = tourReservations.map(reservation => ({
                              ...reservation,
                              status: (!reservation.isPaid && reservation.status === 'pending') ? 'confirmed' : reservation.status,
                              isPaid: true
                            }));
                            setTourReservations(updatedTourReservations);

                            setIsPaid(true);
                            setBalance(0);
                            toast.success("Payment successful! Your bookings and reservations are now confirmed.");
                          } catch (error) {
                            console.error("Error updating status:", error);
                            toast.error("Payment successful but failed to update status. Please contact support.");
                          }
                        }}
                        onError={(err) => {
                          toast.error("Payment failed: " + err);
                        }}
                      />
                    </PayPalScriptProvider>
                  )}
                </div>
              </div>
            )}

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
                      >
                        Save Changes
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

            {(userDetails?.type === "user" || (userDetails?.type === "business" && userDetails?.businessType === "Rental")) && bookings.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">
                  {userDetails?.type === "business" ? "Your Rentals" : "Your Bookings"}
                </h2>
                {console.log("Rendering bookings section. Bookings:", bookings)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:border-gray-600 transition-all">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{booking.vehicleDetails.model}</h3>
                            <p className="text-sm text-gray-300 mb-2">Business: {booking.businessName}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-400">Brand: {booking.vehicleDetails.brand}</p>
                              <p className="text-sm text-gray-400">Color: {booking.vehicleDetails.color}</p>
                              <p className="text-sm text-gray-400">Transmission: {booking.vehicleDetails.transmission}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-3 py-1 text-sm rounded-full ${booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                              booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              } font-medium`}>
                              {booking.status === 'cancelled' ? 'Cancelled' :
                                booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </span>
                            {booking.status === 'cancelled' && booking.refundRequested && (
                              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                Refund in process
                              </span>
                            )}
                          </div>
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

                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setBookingToCancel(booking.id);
                              setShowCancelModal(true);
                            }}
                            className="w-full mt-4 bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors flex items-center justify-center space-x-2"
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
              </div>
            )}

            {/* Tour Reservations Section */}
            {userDetails?.type === "user" && tourReservations.length > 0 && (
              <div className="bg-black/90 rounded-xl p-4 sm:p-6 shadow-lg mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Your Tour Reservations</h2>
                {console.log("Rendering tour reservations section. Reservations:", tourReservations)}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {tourReservations.map((reservation) => (
                    <div key={reservation.id} className="bg-white/10 rounded-lg overflow-hidden">
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
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${reservation.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                  reservation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                    'bg-yellow-500/20 text-yellow-400'}`}>
                                  {reservation.status === 'cancelled' ? 'Cancelled' :
                                    reservation.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </span>
                                {reservation.status === 'cancelled' && reservation.refundRequested && (
                                  <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                    Refund in process
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-300 mt-1">Business: {reservation.businessName}</p>

                            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-gray-300">
                              <div>
                                <span className="text-gray-400">Date: </span>
                                {reservation.reservationDate ? formatDate(reservation.reservationDate) : 'N/A'}
                              </div>
                              <div>
                                <span className="text-gray-400">Persons: </span>
                                {reservation.persons}
                              </div>
                              <div>
                                <span className="text-gray-400">Price: </span>
                                ${reservation.totalPrice || '0.00'}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${reservation.isPrivate ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                {reservation.isPrivate ? 'Private Tour' : 'Public Tour'}
                              </span>
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
              </div>
            )}
          </div>
        )}

        {showSuccessModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm transition-opacity z-50 p-4"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.target === e.currentTarget && setShowSuccessModal(false)}
          >
            <div className="bg-white p-6 sm:p-8 rounded-xl w-full max-w-xs sm:max-w-md transform transition-all shadow-2xl text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                Cancellation Successful
              </h2>

              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {successMessage}
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all duration-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showCancelModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm transition-opacity z-50 p-4"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}
          >
            <div className="bg-white p-6 sm:p-8 rounded-xl w-full max-w-xs sm:max-w-md transform transition-all shadow-2xl text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                Confirm Cancellation
              </h2>

              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Are you sure you want to cancel this {bookingToCancel?.startsWith('tour-') ? 'tour reservation' : 'booking'}?
                A refund will be processed within 3-5 business days.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (bookingToCancel?.startsWith('tour-')) {
                      handleCancelTourReservation(bookingToCancel.replace('tour-', ''));
                    } else {
                      handleCancelBooking(bookingToCancel);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-300 font-medium"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
                >
                  No, Keep It
                </button>
              </div>
            </div>
          </div>
        )}
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </div>
  );
};

export default Profile;