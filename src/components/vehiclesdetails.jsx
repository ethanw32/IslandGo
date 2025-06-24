import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import useAuth from './useAuth';
import ProfileImage from './ProfileImage';
import {
  Star,
  MapPin,
  Car,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Check,
  X,
  User,
  Clock,
  Fuel,
  Gauge,
  Settings as Gear,
  Snowflake,
  Wifi,
  Music,
  Phone,
  Luggage,
  Shield,
  CarFront,
  CarTaxiFront
} from 'lucide-react';

// Add required CSS animations
const styles = `
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-350px * 5));
    }
  }

  @keyframes scroll-reverse {
    0% {
      transform: translateX(calc(-350px * 5));
    }
    100% {
      transform: translateX(0);
    }
  }

  .animate-scroll {
    animation: scroll 20s linear infinite;
  }

  .animate-scroll-reverse {
    animation: scroll-reverse 20s linear infinite;
  }

  .animate-duration-20s {
    animation-duration: 20s;
  }

  .animate-duration-40s {
    animation-duration: 40s;
  }

  .hover\\:pause:hover {
    animation-play-state: paused;
  }

  /* Add styles for Google profile images */
  .google-profile-image img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -webkit-transform: translateZ(0) scale(1.0, 1.0);
    transform: translateZ(0);
    referrer-policy: no-referrer;
  }
`;

// Add InfiniteMovingCards component
const InfiniteMovingCards = ({ items, direction = "left", speed = "fast", pauseOnHover = true, className }) => {
  const containerRef = React.useRef(null);
  const scrollerRef = React.useRef(null);

  useEffect(() => {
    // Inject styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        scrollerRef.current.appendChild(duplicatedItem);
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        ref={scrollerRef}
        className={`flex gap-4 py-4 w-max ${direction === "left" ? "animate-scroll" : "animate-scroll-reverse"
          } ${pauseOnHover ? "hover:pause" : ""} ${speed === "fast" ? "animate-duration-20s" : "animate-duration-40s"
          }`}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="w-[350px] max-w-full relative rounded-2xl border border-neutral-200/10 bg-black p-5 shadow-md"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ProfileImage
                  user={{
                    uid: item.userId,
                    photoURL: item.userPhotoURL,
                    name: item.userName,
                    displayName: item.userName,
                    provider: item.provider,
                    referrerPolicy: item.provider === 'google.com' ? 'no-referrer' : undefined
                  }}
                  size="md"
                  className={item.provider === 'google.com' ? 'google-profile-image' : ''}
                />
                <div>
                  <div className="font-medium text-white">{item.userName || 'Anonymous User'}</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (item.rating || 5)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white line-clamp-3">{item.comment || item.review || 'Great experience!'}</p>
              <p className="text-sm text-gray-300">
                {item.createdAt instanceof Date
                  ? item.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                  : item.createdAt?.seconds
                    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : 'Recent'
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VehicleDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { state } = location;

  // State declarations
  const [vehicle, setVehicle] = useState(state?.vehicle || null);
  const [vehicleId, setVehicleId] = useState(state?.vehicle?.id || params.id || null); // Use params.id as fallback
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!state?.vehicle);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [businessData, setBusinessData] = useState(null);

  const { userDetails } = useAuth();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!vehicle?.ownerId) return;

      try {
        const businessDoc = await getDoc(doc(db, "businesses", vehicle.ownerId));
        if (businessDoc.exists()) {
          setBusinessData(businessDoc.data());
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
      }
    };

    fetchBusinessData();
  }, [vehicle?.ownerId]);

  // Improved image URL handling
  const getHighQualityImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    try {
      const url = new URL(imageUrl);
      if (url.hostname.includes('firebasestorage')) {
        url.searchParams.set('quality', '95');
        url.searchParams.set('w', '1200');
        return url.toString();
      }
      return imageUrl;
    } catch {
      return imageUrl;
    }
  };

  // Get images array with fallback for single image
  const images = React.useMemo(() => {
    if (vehicle.vehicle?.images?.length > 0) {
      return vehicle.vehicle.images;
    }
    if (vehicle.vehicle?.image) {
      return [vehicle.vehicle.image];
    }
    return [];
  }, [vehicle.vehicle?.images, vehicle.vehicle?.image]);

  // Separate function to fetch reviews
  const fetchReviews = async (vId) => {
    try {
      setReviewsLoading(true);

      const reviewsQuery = query(
        collection(db, "reviews"),
        where("vehicleId", "==", vId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);

      const reviewsData = reviewsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to JS Date
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      // Sort reviews by date (newest first)
      reviewsData.sort((a, b) => b.createdAt - a.createdAt);

      setReviews(reviewsData);

      // Calculate average rating and update vehicle state
      if (reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setVehicle(prev => prev ? {
          ...prev,
          averageRating: avgRating.toFixed(1),
          reviewCount: reviewsData.length
        } : null);
      } else {
        setVehicle(prev => prev ? {
          ...prev,
          averageRating: 0,
          reviewCount: 0
        } : null);
      }

    } catch (err) {
      console.error("Error fetching reviews:", err);
      // Don't set main error state for review fetching issues
    } finally {
      setReviewsLoading(false);
    }
  };

  // Main useEffect for fetching vehicle data
  useEffect(() => {
    // If we have vehicle data from state, use it but still fetch reviews
    if (state?.vehicle && vehicleId) {
      setVehicle(state.vehicle);
      setVehicleId(state.vehicle.id);
      setLoading(false);
      fetchReviews(state.vehicle.id);
      return;
    }

    // If no vehicleId, show error
    if (!vehicleId) {
      setError("Vehicle information not provided");
      setLoading(false);
      return;
    }

    // Fetch vehicle data from Firestore
    const fetchVehicleData = async () => {
      try {
        setLoading(true);

        const vehicleDoc = await getDoc(doc(db, "rentals", vehicleId));
        if (!vehicleDoc.exists()) {
          throw new Error("Vehicle not found");
        }

        const vehicleData = {
          id: vehicleDoc.id,
          ...vehicleDoc.data(),
          // Ensure vehicle data is properly structured
          vehicle: vehicleDoc.data().vehicle || vehicleDoc.data()
        };

        setVehicle(vehicleData);

        // Fetch reviews after vehicle data is loaded
        await fetchReviews(vehicleId);

      } catch (err) {
        console.error("Error fetching vehicle data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [vehicleId]); // Remove state?.vehicle from dependencies

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write your review");
      return;
    }

    try {
      setIsSubmittingReview(true);

      // Get Google provider data if available
      const googleProvider = currentUser.providerData?.find(
        provider => provider.providerId === 'google.com'
      );

      // Get user photo URL with priority for Google photo
      const userPhotoURL =
        googleProvider?.photoURL || // Google photo (highest priority)
        currentUser?.photoURL || // Direct auth photo
        userDetails?.photoURL || // User details photo
        null;

      // Get user display name with priority for Google display name
      const userName =
        googleProvider?.displayName || // Google display name
        userDetails?.name ||
        currentUser.displayName ||
        currentUser.email;

      const reviewData = {
        vehicleId: vehicle.id,
        userId: currentUser.uid,
        userName: userName,
        userPhotoURL: userPhotoURL,
        rating: reviewRating,
        comment: reviewComment,
        createdAt: serverTimestamp(),
        businessId: vehicle.ownerId,
        type: "vehicle",
        // Store provider information to help with photo display
        provider: googleProvider ? 'google.com' : currentUser.providerId || 'unknown'
      };

      // Add the review to Firestore
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);

      // Get the newly created review with its proper ID
      const newReviewDoc = await getDoc(docRef);
      const newReview = {
        id: newReviewDoc.id,
        ...newReviewDoc.data(),
        createdAt: newReviewDoc.data().createdAt?.toDate() || new Date()
      };

      // Update the reviews state
      setReviews(prev => [newReview, ...prev]);

      // Update the average rating
      const newAvgRating = [...reviews, newReview].reduce(
        (sum, review) => sum + review.rating, 0
      ) / (reviews.length + 1);

      setVehicle(prev => ({
        ...prev,
        averageRating: newAvgRating.toFixed(1),
        reviewCount: reviews.length + 1
      }));

      toast.success('Review submitted successfully!');
      setReviewComment('');
      setReviewRating(5);
      setIsReviewOpen(false);

    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(`Failed to submit review: ${error.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleNextImage = () => {
    if (vehicle?.vehicle?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.vehicle.images.length);
    }
  };

  const handlePrevImage = () => {
    if (vehicle?.vehicle?.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? vehicle.vehicle.images.length - 1 : prev - 1
      );
    }
  };

  const handleReservation = () => {
    if (!userDetails || !currentUser) {
      toast.error("Please login to book a vehicle");
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select rental period');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('Return date must be after pickup date');
      return;
    }

    setShowReservationModal(true);
  };

  const calculateRentalDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculateTotalPrice = () => {
    const days = calculateRentalDays();
    const price = parseFloat(vehicle?.vehicle?.price) || 99;
    return (price * days) + 15; // Including service fee
  };

  const confirmReservation = async () => {
    if (isSubmittingReservation) return;

    if (!currentUser) {
      toast.error("You must be logged in to book a vehicle");
      return;
    }

    try {
      setIsSubmittingReservation(true);

      const reservationData = {
        vehicleDetails: vehicle.vehicle,
        vehicleId: vehicle.id,
        hostId: vehicle.ownerId,
        businessName: businessData?.businessName || 'Unknown Business',
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        customerName: currentUser.displayName || currentUser.email.split('@')[0],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "pending",
        isPaid: false,
        createdAt: serverTimestamp(),
        totalPrice: calculateTotalPrice(),
        paymentStatus: "pending"
      };

      // Create the reservation
      const docRef = await addDoc(collection(db, 'bookings'), reservationData);

      // Update the vehicle's availability status
      const vehicleRef = doc(db, 'rentals', vehicle.id);
      await updateDoc(vehicleRef, {
        'vehicle.availability': 'Booked'
      });

      // Update local state to reflect the change
      setVehicle(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          availability: 'Booked'
        }
      }));

      toast.success('Vehicle reserved successfully!');
      setShowReservationModal(false);
      setStartDate('');
      setEndDate('');
      setGuestCount(1);

      // Navigate to profile page after successful reservation
      navigate('/profile');

    } catch (error) {
      console.error('Error saving reservation:', error);
      toast.error(`Failed to reserve vehicle: ${error.message}`);
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'Vehicle not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Image Gallery Section */}
      <div className="relative h-48 sm:h-80 md:h-[500px] overflow-hidden bg-black">
        {images.length > 0 ? (
          <>
            <img
              src={getHighQualityImageUrl(images[currentImageIndex])}
              alt={`${vehicle.vehicle.brand} ${vehicle.vehicle.model} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain cursor-pointer"
              loading="eager"
              onClick={() => setShowFullGallery(true)}
              style={{
                imageRendering: 'high-quality',
                objectFit: 'contain',
                objectPosition: 'center'
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Go to image ${index + 1}`}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentImageIndex
                        ? 'bg-white scale-110'
                        : 'bg-white/60 hover:bg-white/80'
                        }`}
                    />
                  ))}
                </div>

                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            )}

            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-colors"
                aria-label="Share this vehicle"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Car className="h-24 w-24 text-gray-400" />
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
      {showFullGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-7xl h-full flex flex-col">
            <button
              onClick={() => setShowFullGallery(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center justify-center">
              <img
                src={getHighQualityImageUrl(images[currentImageIndex])}
                alt={`${vehicle.vehicle.brand} ${vehicle.vehicle.model} - Image ${currentImageIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentImageIndex
                        ? 'bg-white scale-110'
                        : 'bg-white/60 hover:bg-white/80'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute bottom-4 left-4 text-white text-sm">
              {currentImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Vehicle Header */}
            <div className="bg-dark rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-dark">{vehicle.averageRating || "New"}</span>
                <span className="text-secondary">({vehicle.reviewCount || 0} Reviews)</span>

              </div>

              <h1 className="text-3xl font-bold text-dark mb-2">{vehicle.vehicle.brand} {vehicle.vehicle.model}</h1>
              <h2 className="text-xl text-secondary mb-4">{vehicle.vehicle.year}</h2>

              <div className="flex flex-wrap items-center gap-4 text-secondary mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <button
                    onClick={() => navigate("/rpf", {
                      state: {
                        businessId: vehicle.ownerId,
                        businessName: businessData?.businessName,
                        businessImage: businessData?.businessImage,
                        ownerId: vehicle.ownerId
                      }
                    })}
                    className="text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    {businessData?.businessName || 'Business Name'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{businessData?.address || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  <span>{vehicle.vehicle.brand || 'Brand not specified'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Seats: {vehicle.vehicle.seats || 4}</span>
                </div>

              </div>

              <p className="text-secondary leading-relaxed mb-4">
                {vehicle.vehicle.description || 'No description available'}
              </p>

              {/* Key Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm text-secondary">Fuel Type</div>
                    <div className="font-medium text-dark">{vehicle.vehicle.fuel || 'Gasoline'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm text-secondary">Mileage</div>
                    <div className="font-medium text-dark">
                      {vehicle.vehicle.mileage ? `${vehicle.vehicle.mileage.toLocaleString()} km` : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gear className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm text-secondary">Transmission</div>
                    <div className="font-medium text-dark">{vehicle.vehicle.transmission || 'Automatic'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm text-secondary">AC</div>
                    <div className="font-medium text-dark">{vehicle.vehicle.hasAC ? 'No' : 'Yes'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-dark rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-dark">Features & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicle.vehicle.features?.length > 0 ? (
                  vehicle.vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-secondary">{feature}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-secondary">Air Conditioning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-secondary">Bluetooth</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-secondary">Navigation System</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-secondary">USB Ports</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Rental Policies */}
            <div className="bg-dark rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-dark">Rental Policies</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-dark">Insurance</h3>
                    <p className="text-secondary text-sm">Comprehensive insurance included with every rental</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-dark">Cancellation</h3>
                    <p className="text-secondary text-sm">Free cancellation up to 24 hours before pickup</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CarFront className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-dark">Pickup & Return</h3>
                    <p className="text-secondary text-sm">Vehicle must be returned with the same fuel level</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-dark rounded-lg shadow-sm p-6 sticky top-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-dark">
                  ${vehicle.vehicle.price || 99}
                  <span className="text-lg font-normal text-secondary"> / day</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {vehicle.vehicle.availability === "Available" ? (
                    <span className="text-green-500">Available now</span>
                  ) : vehicle.vehicle.availability === "Booked" ? (
                    <span className="text-orange-500">Currently booked</span>
                  ) : (
                    <span className="text-red-500">Currently unavailable</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Passengers
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    {[...Array(vehicle.vehicle.capacity || 5)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mb-4 border-custom">
                <div className="flex justify-between items-center text-secondary mb-1">
                  <span>${vehicle.vehicle.price || 99} x {calculateRentalDays()} days</span>
                  <span>${(vehicle.vehicle.price || 99) * calculateRentalDays()}</span>
                </div>
                <div className="flex justify-between items-center text-secondary mb-1">
                  <span>Service fee</span>
                  <span>$15.00</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold mt-3 pt-3 border-t border-custom text-dark">
                  <span>Total:</span>
                  <span>${calculateTotalPrice()}</span>
                </div>
              </div>

              <button
                onClick={handleReservation}
                disabled={vehicle.vehicle.availability !== "Available" || !startDate || !endDate}
                className={`w-full ${vehicle.vehicle.availability === "Available"
                  ? 'bg-green-500 hover:bg-green-600'
                  : vehicle.vehicle.availability === "Booked"
                    ? 'bg-orange-500 cursor-not-allowed'
                    : 'bg-gray-400 cursor-not-allowed'
                  } text-white font-semibold py-3 px-4 rounded-lg transition-colors`}
              >
                {vehicle.vehicle.availability === "Available"
                  ? 'Reserve Now'
                  : vehicle.vehicle.availability === "Booked"
                    ? 'Booked'
                    : 'Unavailable'}
              </button>

              <p className="text-xs text-secondary text-center mt-3">
                Free cancellation up to 24 hours before pickup
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Review Section */}
        <div className="bg-dark rounded-lg shadow-sm p-6 mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-dark">Customer Reviews</h2>
              <div className="flex items-center mt-2">
                <div className="flex items-center mr-4">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold text-dark">{vehicle.averageRating || "0"}</span>
                  <span className="mx-1 text-secondary">·</span>
                  <span className="text-secondary">{reviews.length} reviews</span>
                </div>
              </div>
            </div>
            {currentUser && (
              <button
                onClick={() => setIsReviewOpen(true)}
                className="mt-4 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="mx-auto h-8 w-8 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-dark">No reviews yet</h3>
              <p className="mt-1 text-secondary">
                {currentUser ? "Be the first to review this vehicle" : "Sign in to leave a review"}
              </p>
              {!currentUser && (
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Sign In
                </button>
              )}
            </div>
          ) : (
            <div className="h-[400px] rounded-md flex flex-col antialiased bg-dark items-center justify-center relative overflow-hidden">
              <InfiniteMovingCards
                items={reviews}
                direction="right"
                speed="fast"
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Reservation Confirmation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">Confirm Reservation</h3>
              <button
                onClick={() => setShowReservationModal(false)}
                className="text-secondary hover:text-dark"
                disabled={isSubmittingReservation}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-secondary">Vehicle:</span>
                <span className="font-medium text-dark">{vehicle.vehicle.brand} {vehicle.vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Pickup:</span>
                <span className="font-medium text-dark">
                  {new Date(startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Return:</span>
                <span className="font-medium text-dark">
                  {new Date(endDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Passengers:</span>
                <span className="font-medium text-dark">{guestCount}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-3 border-custom">
                <span className="text-dark">Total:</span>
                <span className="text-dark">${calculateTotalPrice()}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReservationModal(false)}
                disabled={isSubmittingReservation}
                className="flex-1 px-4 py-2 border border-custom text-dark rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReservation}
                disabled={isSubmittingReservation}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReservation ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">Write a Review</h3>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-secondary hover:text-dark"
                disabled={isSubmittingReview}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center mb-4">
              <span className="mr-2 text-dark">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none"
                  disabled={isSubmittingReview}
                >
                  <Star
                    className={`h-6 w-6 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-secondary'}`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this vehicle..."
              className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] bg-dark text-dark"
              rows="4"
              disabled={isSubmittingReview}
            />

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setIsReviewOpen(false)}
                disabled={isSubmittingReview}
                className="flex-1 px-4 py-2 border border-custom text-dark rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails;