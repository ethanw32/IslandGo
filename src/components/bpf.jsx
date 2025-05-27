import React, { useEffect, useState } from "react";
import { db } from "./config/firebase";
import { collection, getDocs, doc, deleteDoc, query, where, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useLoadScript } from '@react-google-maps/api';
import TourMap from "./TourMap";
import { DirectionAwareHover } from "../components/ui/direction-aware-hover";
import { div } from "motion/react-client";
import { toast } from "react-toastify";
import useAuth from "./useAuth";

// Define libraries array outside component to prevent recreation on each render
const libraries = ["places"];

const BPF = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tours, setTours] = useState([]);
  const [error, setError] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [reservationDate, setReservationDate] = useState("");
  const [numPersons, setNumPersons] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const { userDetails } = useAuth();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get business ID either from location state or URL params
        const businessId = location.state?.businessId;

        if (!businessId) {
          throw new Error("Missing business ID");
        }

        // Fetch business data
        const businessDoc = await getDoc(doc(db, "businesses", businessId));

        if (!businessDoc.exists()) {
          throw new Error("Business not found");
        }

        const data = businessDoc.data();

        setBusinessData({
          businessId: businessId,
          businessImage: data.businessImage,
          businessName: data.businessName,
          ownerId: data.ownerId
        });

        // Set owner status
        if (currentUser) {
          setIsOwner(currentUser.uid === data.ownerId);
        }

        // Fetch tours
        const toursCollection = collection(db, "tours");
        const q = query(toursCollection, where("businessId", "==", businessId));
        const toursSnapshot = await getDocs(q);
        const toursList = toursSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTours(toursList);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load business information");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [location.state?.businessId, currentUser]); // Only depend on businessId instead of entire location.state

  const handleDeleteTour = async () => {
    if (!tourToDelete) return;

    try {
      setError(null);
      await deleteDoc(doc(db, "tours", tourToDelete));
      setTours(tours.filter((tour) => tour.id !== tourToDelete));
    } catch (error) {
      console.error("Error deleting tour: ", error);
      setError("Failed to delete tour. Please try again later.");
    } finally {
      setShowDeleteConfirmation(false);
      setTourToDelete(null);
    }
  };

  const handleEditTour = (tour) => {
    if (!businessData) return;

    navigate("/addtour", {
      state: {
        businessId: businessData.businessId,
        ownerId: businessData.ownerId,
        image: businessData.businessImage,
        name: businessData.businessName,
        tourToEdit: tour
      }
    });
  };

  const handleAddTour = () => {
    if (!businessData) return;

    navigate("/addtour", {
      state: {
        businessId: businessData.businessId,
        ownerId: businessData.ownerId,
        image: businessData.businessImage,
        name: businessData.businessName,
      }
    });
  };

  const handleNavigateToChat = () => {
    if (!businessData) return;

    navigate('/chat', {
      state: {
        businessId: businessData.businessId,
        businessName: businessData.businessName,
        businessImage: businessData.businessImage
      }
    });
  };

  const handleLoadError = (error) => {
    console.error("Error loading Google Maps:", error);
    setMapsError(`Error loading map: ${error.message}`);
  };

  const handleReserve = (tour) => {
    if (!userDetails) {
      toast.error("Please login to reserve a tour");
      navigate("/login");
      return;
    }
    
    setSelectedTour(tour);
    // Set default reservation date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setReservationDate(tomorrowStr);
    setNumPersons(1);
    setSpecialRequests("");
    setShowReserveModal(true);
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTour || !reservationDate) {
      toast.error("Missing reservation information");
      return;
    }
    
    if (!currentUser) {
      toast.error("You must be logged in to reserve a tour");
      navigate("/login");
      return;
    }
    
    try {
      setIsReserving(true);
      console.log("Submitting reservation with data:", { 
        selectedTour, 
        reservationDate, 
        userDetails, 
        currentUser 
      });
      
      const reservationData = {
        tourId: selectedTour.id,
        tourName: selectedTour.name,
        tourImage: selectedTour.image,
        businessId: selectedTour.businessId,
        businessName: selectedTour.businessName || businessData?.businessName,
        customerId: currentUser.uid,
        customerName: userDetails?.name || currentUser.email,
        customerEmail: currentUser.email,
        reservationDate: new Date(reservationDate),
        persons: parseInt(numPersons) || 1,
        specialRequests: specialRequests || "",
        status: "confirmed",
        createdAt: serverTimestamp(),
        type: "tour"
      };
      
      // Add the reservation to Firestore
      const docRef = await addDoc(collection(db, "tourReservations"), reservationData);
      console.log("Reservation created with ID:", docRef.id);
      
      toast.success("Tour reserved successfully!");
      setShowReserveModal(false);
    } catch (error) {
      console.error("Error reserving tour:", error);
      toast.error(`Failed to reserve tour: ${error.message}`);
    } finally {
      setIsReserving(false);
    }
  };

  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Configuration Error</h2>
          <p className="text-red-600">Google Maps API key is not configured. Please check your environment variables.</p>
        </div>
      </div>
    );
  }

  if (error || loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || "Failed to load Google Maps"}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !isLoaded || !businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-2 sm:py-8">
        <div className=" rounded-lg shadow-sm p-1 sm:p-6 mb-2 sm:mb-8">
          <div className="flex flex-row items-center justify-between w-full">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              {businessData.businessImage && (
                <Link to={`/profile?businessId=${businessData.businessId}`} className="transition-transform hover:scale-105 shrink-0">
                  <img
                    className="h-10 w-10 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                    src={businessData.businessImage}
                    alt={businessData.businessName}
                  />
                </Link>
              )}
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {businessData.businessName}
              </h1>
            </div>

            <div className="flex items-center ml-4">
              {isOwner && (
                <button
                  onClick={handleAddTour}
                  className="inline-flex items-center px-2.5 sm:px-4 py-1 sm:py-2 border border-transparent rounded-full shadow-sm text-xs sm:text-base font-medium text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="mr-1 sm:mr-2">Add Tour</span>
                  <span className="text-base sm:text-xl">+</span>
                </button>
              )}
              {!isOwner && (
                <button
                  onClick={handleNavigateToChat}
                  className="inline-flex items-center px-2.5 sm:px-4 py-1 sm:py-2 border border-transparent rounded-full shadow-sm text-xs sm:text-base font-medium text-white bg-green-500 hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <i className="fa fa-commenting mr-1 sm:mr-2"></i>
                  Chat
                </button>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 sm:mb-8 text-gray-800">Tours</h1>

        {mapsError && (
          <div className="bg-red-50 p-2 sm:p-4 rounded-lg shadow-sm mb-3 sm:mb-6">
            <p className="text-red-600 text-xs sm:text-base">{mapsError}</p>
          </div>
        )}

        {tours.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-2 lg:p-6 flex flex-col lg:flex-row gap-2 lg:gap-12">
                  <h2 className="text-base lg:text-2xl font-bold text-gray-800 mb-4 text-center lg:hidden">
                    {tour.name}
                  </h2>
                  <div className="flex flex-col lg:flex-row gap-2 lg:gap-12 w-full">
                      <div className="group relative w-full h-[300px] lg:w-[450px] rounded-lg overflow-hidden">
                        {tour.image ? (
                          <>
                            <img 
                              src={tour.image} 
                              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" 
                              alt={tour.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-white font-bold text-xl">{tour.name}</p>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No tour image</span>
                          </div>
                        )}
                      </div>             
                    <div className="w-full lg:w-2/5">
                      <p className="text-xs lg:text-base text-gray-600 mb-2 lg:mb-4 break-words">{tour.description}</p>

                      <div>
                        <h3 className="text-xs lg:text-xl font-semibold text-gray-700 mb-1 lg:mb-2">Spots:</h3>
                        <ul className="space-y-1 lg:space-y-2">
                          {tour.spots?.map((spot, index) => (
                            <li key={index} className="flex items-start">
                              <span className="h-1 w-1 lg:h-2 lg:w-2 rounded-full bg-blue-500 mt-1 lg:mt-2 mr-1 lg:mr-2 flex-shrink-0"></span>
                              <div className="flex-1">
                                <div className="flex gap-1 lg:gap-2 items-start">
                                  <span className="text-xs lg:text-base font-medium text-gray-800 whitespace-nowrap">{spot.name}:</span>
                                  <p className="text-xs lg:text-base text-gray-600 break-words">{spot.description}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="w-full lg:w-[35%]">

                      <div className={`h-[120px] lg:h-[250px] w-full relative ${isOwner ? 'pb-10 lg:pb-0 lg:pr-24' : ''}`}>
                        <TourMap
                          startLocation={tour.startLocation}
                          endLocation={tour.endLocation}
                          waypoints={tour.spots?.map(spot => spot.location) || []}
                        />
                        {isOwner && (
                          <div className="flex lg:flex-col gap-2 absolute bottom-0 left-0 right-0 lg:bottom-auto lg:right-0 lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:pl-4">
                            <button
                              onClick={() => handleEditTour(tour)}
                              className="flex-1 lg:flex-none bg-blue-500 text-white px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-base rounded hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setTourToDelete(tour.id);
                                setShowDeleteConfirmation(true);
                              }}
                              className="flex-1 lg:flex-none bg-red-500 text-white px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-base rounded hover:bg-red-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-sm"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {!isOwner && (
                          <button
                            onClick={() => handleReserve(tour)}
                            className="mt-3 w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 shadow-sm"
                          >
                            Reserve a Spot
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM12 7v10m5-5H7"
              />
            </svg>
            <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No tours</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {isOwner
                ? "Get started by creating a new tour"
                : "No tours are available for this business yet"}
            </p>
            {isOwner && (
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={handleAddTour}
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent shadow-sm text-sm sm:text-base font-medium rounded-full text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="mr-1 sm:mr-2">Create new tour</span>
                  <span>+</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-xs sm:max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Confirm Deletion</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to delete this tour? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTour}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tour Reservation Modal */}
      {showReserveModal && selectedTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Reserve Tour</h2>
              <button 
                onClick={() => setShowReserveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-lg">{selectedTour.name}</h3>
              <p className="text-gray-600 text-sm">{selectedTour.description}</p>
            </div>
            
            <form onSubmit={handleReservationSubmit}>
              <div className="mb-4">
                <label htmlFor="reservationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Reservation Date
                </label>
                <input
                  type="date"
                  id="reservationDate"
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="numPersons" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Persons
                </label>
                <input
                  type="number"
                  id="numPersons"
                  min="1"
                  max="20"
                  value={numPersons}
                  onChange={(e) => setNumPersons(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReserving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isReserving ? "Reserving..." : "Confirm Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BPF;

