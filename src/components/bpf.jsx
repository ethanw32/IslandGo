import React, { useEffect, useState } from "react";
import { db } from "./config/firebase";
import { collection, getDocs, doc, deleteDoc, query, where, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { Heart, Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "./useAuth";
import Review from "./Review";

const BPF = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tours, setTours] = useState([]);
  const [error, setError] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [reservationDate, setReservationDate] = useState("");
  const [numPersons, setNumPersons] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [showTourReview, setShowTourReview] = useState(false);
  const [selectedTourForReview, setSelectedTourForReview] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const { userDetails } = useAuth();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const calculateAverageRating = async (tourId) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("tourId", "==", tourId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return 0;
      let totalRating = 0;
      querySnapshot.forEach((doc) => { totalRating += doc.data().rating; });
      return Math.round((totalRating / querySnapshot.size) * 10) / 10;
    } catch (error) {
      console.error("Error calculating rating:", error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const businessId = location.state?.businessId;
        if (!businessId) throw new Error("Missing business ID");
        
        const businessDoc = await getDoc(doc(db, "businesses", businessId));
        if (!businessDoc.exists()) throw new Error("Business not found");
        
        const data = businessDoc.data();
        setBusinessData({
          businessId,
          businessImage: data.businessImage,
          businessName: data.businessName,
          ownerId: data.ownerId
        });
        
        if (currentUser) setIsOwner(currentUser.uid === data.ownerId);
        
        const toursCollection = collection(db, "tours");
        const q = query(toursCollection, where("businessId", "==", businessId));
        const toursSnapshot = await getDocs(q);
        
        const toursList = [];
        const initialIndexes = {};
        for (const doc of toursSnapshot.docs) {
          const tourData = doc.data();
          const averageRating = await calculateAverageRating(doc.id);
          
          // Ensure images is always an array
          let images = [];
          if (tourData.images && Array.isArray(tourData.images)) {
            images = tourData.images;
          } else if (tourData.image) {
            images = [tourData.image];
          }
          
          toursList.push({ 
            id: doc.id, 
            ...tourData, 
            images,
            averageRating 
          });
          initialIndexes[doc.id] = 0;
        }
        setTours(toursList);
        setCurrentImageIndexes(initialIndexes);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load business information");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location.state?.businessId, currentUser, navigate]);

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
        name: businessData.businessName
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

  const handleReserve = (tour) => {
    if (!userDetails) {
      toast.error("Please login to reserve a tour");
      navigate("/login");
      return;
    }
    setSelectedTour(tour);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReservationDate(tomorrow.toISOString().split('T')[0]);
    setNumPersons(1);
    setSpecialRequests("");
    setIsPrivate(false);
    setShowReserveModal(true);
  };

  const handleTourClick = (tour) => {
    if (isOwner) return;
    setSelectedTourForReview({
      id: tour.id,
      businessId: tour.businessId,
      title: tour.name,
      name: tour.name,
      description: tour.description || "",
      src: tour.images?.[0] || tour.image,
      image: tour.images?.[0] || tour.image,
      imageUrl: tour.images?.[0] || tour.image,
      ctaText: "Reserve Now",
      ctaLink: "#",
      content: () => (
        <>
          <h3 className="font-semibold mb-2">Tour Spots:</h3>
          <ul className="space-y-3">
            {tour.spots?.map((spot, index) => (
              <li key={index}>
                <span className="font-medium">{spot.name}</span> - {spot.description}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button
              onClick={() => {
                setShowTourReview(false);
                handleReserve(tour);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all"
            >
              Reserve This Tour
            </button>
          </div>
        </>
      )
    });
    setShowTourReview(true);
  };

  const handleReservationSubmit = async () => {
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
      const reservationData = {
        tourId: selectedTour.id,
        tourName: selectedTour.name,
        tourImage: selectedTour.images?.[0] || selectedTour.image,
        businessId: selectedTour.businessId,
        businessName: selectedTour.businessName || businessData?.businessName,
        customerId: currentUser.uid,
        customerName: userDetails?.name || currentUser.email,
        customerEmail: currentUser.email,
        reservationDate: new Date(reservationDate),
        persons: parseInt(numPersons) || 1,
        specialRequests: specialRequests || "",
        isPrivate: isPrivate,
        status: "confirmed",
        createdAt: serverTimestamp(),
        type: "tour"
      };
      await addDoc(collection(db, "tourReservations"), reservationData);
      toast.success(`${isPrivate ? 'Private' : 'Public'} tour reserved successfully!`);
      setShowReserveModal(false);
    } catch (error) {
      console.error("Error reserving tour:", error);
      toast.error(`Failed to reserve tour: ${error.message}`);
    } finally {
      setIsReserving(false);
    }
  };

  const handleFavoriteToggle = (tourId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tourId)) {
      newFavorites.delete(tourId);
    } else {
      newFavorites.add(tourId);
    }
    setFavorites(newFavorites);
  };

  const handleNextImage = (tourId, totalImages) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [tourId]: (prev[tourId] + 1) % totalImages
    }));
  };

  const handlePrevImage = (tourId, totalImages) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [tourId]: prev[tourId] === 0 ? totalImages - 1 : prev[tourId] - 1
    }));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const ActionButtons = ({ tour, isOwner }) => {
    if (isOwner) {
      return (
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEditTour(tour); }}
            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setTourToDelete(tour.id); setShowDeleteConfirmation(true); }}
            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      );
    }
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); handleReserve(tour); }}
        className="w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
      >
        Reserve Now
      </button>
    );
  };

  const ImageSlider = ({ tour }) => {
    const images = tour.images || [];
    const currentIndex = currentImageIndexes[tour.id] || 0;
    const hasMultipleImages = images.length > 1;

    if (images.length === 0) {
      return (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <MapPin className="h-12 w-12 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full group">
        <img 
          src={images[currentIndex]} 
          alt={`${tour.name} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {hasMultipleImages && (
          <>
            {/* Navigation Arrows */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handlePrevImage(tour.id, images.length); 
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleNextImage(tour.id, images.length); 
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndexes(prev => ({
                      ...prev,
                      [tour.id]: index
                    }));
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white scale-110' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
              {currentIndex + 1}/{images.length}
            </div>
          </>
        )}
      </div>
    );
  };

  const TourCard = ({ tour }) => (
    <div 
      key={tour.id} 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer"
      onClick={() => !isOwner && handleTourClick(tour)}
    >
      <div className="relative h-48 overflow-hidden">
        <ImageSlider tour={tour} />
        
        <button 
          onClick={(e) => { e.stopPropagation(); handleFavoriteToggle(tour.id); }}
          className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full transition-colors z-10"
        >
          <Heart 
            className={`h-4 w-4 ${favorites.has(tour.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
          />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-4 w-4 fill-green-500 text-green-500" />
          <span className="font-semibold text-sm">{tour.averageRating || "No ratings"}</span>
          <span className="text-gray-500 text-sm">({tour.reviewCount || 0} {tour.reviewCount === 1 ? "review" : "reviews"})</span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">{tour.name}</h3>
        <p className="text-xs text-wrap text-gray-600 mb-2 line-clamp-2">{tour.description}</p>

        <div className="space-y-1 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>Free Cancellation</span>
          </div>
          {tour.spots && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{tour.spots.length} spots included</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-gray-500">from </span>
            <span className="font-bold text-lg">$99</span>
          </div>
        </div>

        <ActionButtons tour={tour} isOwner={isOwner} />
      </div>
    </div>
  );

  const ToggleSwitch = ({ isOn, onToggle, label }) => (
    <div className="flex items-center justify-between mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isOn ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {businessData.businessImage && (
                <Link 
                  to={`/profile?businessId=${businessData.businessId}`}
                  className="transition-transform hover:scale-105"
                >
                  <img 
                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-500 shadow-lg" 
                    src={businessData.businessImage} 
                    alt={businessData.businessName} 
                  />
                </Link>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{businessData.businessName}</h1>
            </div>
            <div className="flex items-center gap-3">
              {isOwner ? (
                <button 
                  onClick={handleAddTour}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="mr-2">Add Tour</span>
                  <span className="text-xl">+</span>
                </button>
              ) : (
                <button 
                  onClick={handleNavigateToChat}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-green-500 hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <i className="fa fa-commenting mr-2"></i>Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Tours</h2>
        
        {tours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM12 7v10m5-5H7" />
            </svg>
            <h3 className="mt-2 text-base font-medium text-gray-900">No tours</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isOwner ? "Get started by creating a new tour" : "No tours are available for this business yet"}
            </p>
            {isOwner && (
              <div className="mt-6">
                <button 
                  onClick={handleAddTour}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="mr-2">Create new tour</span>
                  <span>+</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this tour? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteTour}
                className="px-4 py-2 font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Review 
        isOpen={showTourReview} 
        onClose={() => setShowTourReview(false)} 
        product={selectedTourForReview} 
        productType="tour" 
      />

      {/* Reservation Modal */}
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
              <p className="text-gray-600 text-sm  break-words whitespace-normal">{selectedTour.description}</p>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Date</label>
                <input 
                  type="date" 
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Persons</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={numPersons}
                  onChange={(e) => setNumPersons(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <ToggleSwitch 
                isOn={isPrivate}
                onToggle={() => setIsPrivate(!isPrivate)}
                label={`Tour Type: ${isPrivate ? 'Private' : 'Public'}`}
              />

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                <textarea 
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReservationSubmit}
                  disabled={isReserving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isReserving ? "Reserving..." : `Confirm ${isPrivate ? 'Private' : 'Public'} Tour`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BPF;