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

  const handleBusinessImageClick = () => {
    if (!businessData) return;
    navigate('/profile', {
      state: {
        businessId: businessData.businessId,
        businessName: businessData.businessName,
        businessImage: businessData.businessImage,
        ownerId: businessData.ownerId
      }
    });
  };

  const handleReserve = (tour) => {
    navigate('/details', { state: { tourId: tour.id } });
  };

  const handleTourClick = (tour) => {
    navigate(`/details?tourId=${tour.id}`, { state: { tourId: tour.id } });
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
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-white bg-dark shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-8"></div>

            {/* Tour Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Image Skeleton */}
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>

                  {/* Content Skeleton */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>

                    <div className="space-y-2">
                      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
        className="hidden sm:block w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
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
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
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
      onClick={() => !isOwner && handleReserve(tour)}
      className="bg-[var(--color-background)] rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer"
    >
      <div className="relative h-24 sm:h-32 md:h-40 overflow-hidden">
        <ImageSlider tour={tour} />

        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleFavoriteToggle(tour.id);
          }}
          className="absolute top-1.5 right-1.5 p-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart className={`h-3 w-3 ${favorites.has(tour.id) ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="p-2 sm:p-3 md:p-4">
        <div className="flex items-center gap-1 mb-1">
          <Star className="h-3 w-3 fill-green-500 text-green-500" />
          <span className="font-semibold text-xs text-[var(--color-text)]">
            {tour.averageRating || 0}
          </span>
          <span className="text-[var(--color-text-secondary)] text-xs">
            ({tour.reviewCount || 0})
          </span>
        </div>

        <h3 className="font-semibold text-[var(--color-text)] mb-1 line-clamp-1 text-xs sm:text-sm leading-tight">{tour.name}</h3>

        <p className="hidden sm:block text-xs text-wrap text-[var(--color-text-secondary)] mb-2 line-clamp-1 md:line-clamp-2 break-words whitespace-normal">{tour.description}</p>

        <div className="hidden sm:block space-y-1 mb-3 text-xs text-[var(--color-text-secondary)]">
          {tour.spots && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{tour.spots.length} spots included</span>
            </div>
          )}
          {tour.duration && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-[var(--color-text-secondary)] rounded-full"></span>
              <span>{tour.duration} hours</span>
            </div>
          )}
          {tour.maxPeople && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-[var(--color-text-secondary)] rounded-full"></span>
              <span>Max {tour.maxPeople} people</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-bold text-base sm:text-lg text-[var(--color-text)]">${tour.price || '99'}</span>
          </div>
        </div>
        <ActionButtons tour={tour} isOwner={isOwner} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[var(--color-background)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {businessData.businessImage && (
                <button
                  onClick={handleBusinessImageClick}
                  className="transition-transform hover:scale-105"
                >
                  <img
                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                    src={businessData.businessImage}
                    alt={businessData.businessName}
                  />
                </button>
              )}
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{businessData.businessName}</h1>
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
                  className="inline-flex items-center justify-center w-12 h-12 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-green-500 hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <i className="fa fa-commenting"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">Tours</h2>

        {tours.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tours available</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[var(--color-background)] rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">Confirm Deletion</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">Are you sure you want to delete this tour? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 font-medium text-[var(--color-text)] bg-[var(--color-background-secondary)] rounded-md hover:bg-[var(--color-border)] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
    </div>
  );
};

export default BPF;