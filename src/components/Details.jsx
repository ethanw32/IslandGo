import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import useAuth from './useAuth';
import {
  Star,
  MapPin,
  Clock,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Check,
  X,
  User
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
            className="w-[350px] max-w-full relative rounded-2xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-black p-5 shadow-md"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {item.userPhotoURL ? (
                    <img
                      src={item.userPhotoURL}
                      alt={item.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
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
                {item.createdAt?.seconds
                  ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                  : item.date?.seconds
                    ? new Date(item.date.seconds * 1000).toLocaleDateString('en-US', {
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

const TourDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourId } = location.state || {};
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isPrivateTour, setIsPrivateTour] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [dateBookings, setDateBookings] = useState({});

  const { userDetails } = useAuth();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    // If no tourId in state, try to get it from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tourIdFromUrl = urlParams.get('tourId');
    const finalTourId = tourId || tourIdFromUrl;

    if (!finalTourId) {
      setError("Tour ID not provided");
      setLoading(false);
      return;
    }

    const fetchTourAndReviews = async () => {
      try {
        // Fetch tour data
        const tourDoc = await getDoc(doc(db, "tours", finalTourId));
        if (!tourDoc.exists()) throw new Error("Tour not found");

        const tourData = { id: tourDoc.id, ...tourDoc.data() };
        setTour(tourData);

        // Set available dates
        if (tourData.availableDates) {
          const dates = tourData.availableDates.map(date => {
            try {
              if (date instanceof Date) return date;
              if (date.toDate) return date.toDate();
              const newDate = new Date(date);
              if (isNaN(newDate.getTime())) {
                console.warn('Invalid date found:', date);
                return null;
              }
              return newDate;
            } catch (error) {
              console.warn('Error converting date:', date, error);
              return null;
            }
          }).filter(date => date !== null); // Remove any invalid dates
          setAvailableDates(dates);
        }

        // Only fetch bookings if user is authenticated
        if (currentUser) {
          try {
            // Fetch existing bookings for this tour
            const bookingsQuery = query(
              collection(db, "tourReservations"),
              where("tourId", "==", finalTourId)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);

            // Calculate bookings per date
            const bookingsPerDate = {};
            bookingsSnapshot.docs.forEach(doc => {
              const booking = doc.data();
              try {
                const date = booking.reservationDate?.toDate?.() || new Date(booking.reservationDate);
                if (!isNaN(date.getTime())) {
                  const dateKey = date.toISOString().split('T')[0];
                  bookingsPerDate[dateKey] = (bookingsPerDate[dateKey] || 0) + (booking.persons || 1);
                }
              } catch (error) {
                console.warn('Error processing booking date:', booking.reservationDate, error);
              }
            });

            setDateBookings(bookingsPerDate);
          } catch (error) {
            console.warn('Error fetching bookings:', error);
            // Continue execution even if bookings fetch fails
          }
        }

        // Fetch reviews for this tour
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("tourId", "==", finalTourId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort reviews by date (newest first)
        reviewsData.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setReviews(reviewsData);

        // Calculate average rating from actual reviews
        if (reviewsData.length > 0) {
          const avgRating = reviewsData.reduce((sum, review) => sum + (review.rating || 5), 0) / reviewsData.length;
          setTour(prev => ({
            ...prev,
            averageRating: avgRating.toFixed(1),
            reviewCount: reviewsData.length
          }));
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTourAndReviews();
  }, [tourId]);

  // Fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!tour?.businessId) return;

      try {
        const businessDoc = await getDoc(doc(db, "businesses", tour.businessId));
        if (businessDoc.exists()) {
          setBusinessData(businessDoc.data());
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
      }
    };

    fetchBusinessData();
  }, [tour?.businessId]);

  const handleNextImage = () => {
    if (tour?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % tour.images.length);
    }
  };

  const handlePrevImage = () => {
    if (tour?.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? tour.images.length - 1 : prev - 1
      );
    }
  };

  const handleReservation = () => {
    if (!userDetails || !currentUser) {
      toast.error("Please login to reserve a tour");
      navigate("/login");
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    setShowReservationModal(true);
  };

  const getAvailableSpots = (date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date in getAvailableSpots:', date);
        return 0;
      }
      const dateKey = dateObj.toISOString().split('T')[0];
      const bookedSpots = dateBookings[dateKey] || 0;
      return Math.max(0, (tour.maxpeople || 10) - bookedSpots);
    } catch (error) {
      console.warn('Error in getAvailableSpots:', error);
      return 0;
    }
  };

  const isDateFullyBooked = (date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return true;
      }
      return getAvailableSpots(dateObj) <= 0;
    } catch (error) {
      return true;
    }
  };

  const confirmReservation = async () => {
    if (isSubmittingReservation) return;

    if (!currentUser) {
      toast.error("You must be logged in to reserve a tour");
      navigate("/login");
      return;
    }

    // Check if there are enough spots available
    const availableSpots = getAvailableSpots(selectedDate);
    if (guestCount > availableSpots) {
      toast.error(`Only ${availableSpots} spots available for this date`);
      return;
    }

    try {
      setIsSubmittingReservation(true);

      const reservationData = {
        tourId: tour.id,
        tourName: tour.name,
        tourImage: tour.images?.[0] || tour.image,
        businessId: tour.businessId,
        businessName: businessData?.businessName || tour.name,
        customerId: currentUser.uid,
        customerName: userDetails?.name || currentUser.email,
        customerEmail: currentUser.email,
        reservationDate: new Date(selectedDate),
        isPrivate: isPrivateTour,
        persons: parseInt(guestCount) || 1,
        specialRequests: "",
        status: "pending",
        totalPrice: totalPrice,
        pricePerPerson: tour.price || 99,
        createdAt: serverTimestamp(),
        type: "tour",
        isPaid: false
      };

      const docRef = await addDoc(collection(db, 'tourReservations'), reservationData);

      // Update local bookings count
      const dateKey = new Date(selectedDate).toISOString().split('T')[0];
      setDateBookings(prev => ({
        ...prev,
        [dateKey]: (prev[dateKey] || 0) + guestCount
      }));

      // If it's a private tour, remove the date from available dates
      if (isPrivateTour) {
        const tourRef = doc(db, "tours", tourId);
        const updatedDates = availableDates.filter(date =>
          new Date(date).toISOString() !== new Date(selectedDate).toISOString()
        );
        await updateDoc(tourRef, {
          availableDates: updatedDates
        });
        setAvailableDates(updatedDates);
      }

      console.log('Reservation saved with ID:', docRef.id);
      toast.success('Tour reserved successfully!');

      setShowReservationModal(false);
      setSelectedDate('');
      setGuestCount(1);
      setIsPrivateTour(false);

      // Navigate to profile page after successful reservation
      navigate('/profile');

    } catch (error) {
      toast.error("Failed to create reservation. Please try again.");
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast.error("Please login to leave a review");
      navigate("/login");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please enter your review comment");
      return;
    }

    try {
      setIsSubmittingReview(true);

      const reviewData = {
        businessId: tour.businessId,
        comment: reviewComment,
        tourId: tour.id,
        createdAt: serverTimestamp(),
        tourTitle: tour.name,
        rating: reviewRating,
        userId: currentUser.uid,
        userName: userDetails?.name || currentUser.email,
        userPhotoURL: currentUser.photoURL || null
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      toast.success('Review submitted successfully!');

      // Refresh reviews
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("tourId", "==", tourId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      reviewsData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setReviews(reviewsData);

      // Update average rating
      if (reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + (review.rating || 5), 0) / reviewsData.length;
        setTour(prev => ({
          ...prev,
          averageRating: avgRating.toFixed(1),
          reviewCount: reviewsData.length
        }));
      }

      // Reset form
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);

    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(`Failed to submit review: ${error.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getHighQualityImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;

    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      return `${imageUrl}&quality=95&w=1200&h=800&fit=crop`;
    }

    return imageUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'Tour not found'}</p>
        </div>
      </div>
    );
  }

  const totalPrice = (tour.price || 99) * guestCount;
  const images = tour.images || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={getHighQualityImageUrl(images[currentImageIndex])}
              alt={`${tour.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              loading="eager"
              style={{
                imageRendering: 'high-quality',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
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

                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            )}

            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <MapPin className="h-24 w-24 text-gray-400" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tour Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{tour.averageRating || "New"}</span>
                <span className="text-gray-500">({tour.reviewCount || 0} reviews)</span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{tour.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <button
                    onClick={() => navigate("/bpf", {
                      state: {
                        businessId: tour.businessId,
                        businessName: businessData?.businessName,
                        businessImage: businessData?.businessImage,
                        ownerId: tour.businessId
                      }
                    })}
                    className="text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    {businessData?.businessName || 'Business Name'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{tour.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{tour.duration || '3 hours'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Max {tour.maxpeople || 10} guests</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed break-words whitespace-normal">{tour.description}</p>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">What's Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tour.included?.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                )) || (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Professional guide</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Transportation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Entry fees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">Free cancellation</span>
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* Tour Spots */}
            {tour.spots && tour.spots.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Tour Highlights</h2>
                <div className="space-y-3">
                  {tour.spots.map((spot, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{spot.name}</h3>
                        {spot.description && (
                          <p className="text-gray-600 text-sm mt-1">{spot.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Reviews ({reviews.length})
                </h2>
                {currentUser && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${star <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Share your experience with this tour..."
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="h-[400px] rounded-md flex flex-col antialiased bg-white items-center justify-center relative overflow-hidden">
                  <InfiniteMovingCards
                    items={reviews}
                    direction="right"
                    speed="slow"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Star className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </div>

          {/* Reservation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  ${tour.price || 99}
                  <span className="text-lg font-normal text-gray-500"> / person</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Select Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a date</option>
                    {availableDates.map((date, index) => {
                      try {
                        const dateObj = date instanceof Date ? date : new Date(date);
                        if (isNaN(dateObj.getTime())) {
                          console.warn('Invalid date in select options:', date);
                          return null;
                        }
                        const dateStr = dateObj.toISOString();
                        const availableSpots = getAvailableSpots(dateObj);
                        const fullyBooked = isDateFullyBooked(dateObj);

                        return (
                          <option
                            key={index}
                            value={dateStr}
                            disabled={fullyBooked}
                          >
                            {dateObj.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} - {fullyBooked ? 'Fully Booked' : `${availableSpots} spots available`}
                          </option>
                        );
                      } catch (error) {
                        console.warn('Error processing date in select options:', error);
                        return null;
                      }
                    }).filter(Boolean)}
                  </select>
                </div>
                {selectedDate && !isDateFullyBooked(selectedDate) && (
                  <div className="mt-2 text-sm text-gray-600">
                    {getAvailableSpots(selectedDate)} spots available for this date
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Private Tour
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPrivateTour(!isPrivateTour)}
                    className={`${isPrivateTour ? 'bg-blue-500' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${isPrivateTour ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Guests
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[...Array(parseInt(tour.maxpeople) || 10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${totalPrice}</span>
                </div>
              </div>

              <button
                onClick={handleReservation}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Reserve Now
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Free cancellation up to 24 hours before the tour
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Confirmation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Reservation</h3>
              <button
                onClick={() => setShowReservationModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmittingReservation}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Tour:</span>
                <span className="font-medium">{tour.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">{guestCount}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-3">
                <span>Total:</span>
                <span>${totalPrice}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReservationModal(false)}
                disabled={isSubmittingReservation}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReservation}
                disabled={isSubmittingReservation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReservation ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetails;