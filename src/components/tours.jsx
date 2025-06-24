import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom'
import { db } from "./config/firebase";
import { Heart, Star, MapPin, ChevronLeft, ChevronRight, Filter, ChevronDown, X } from "lucide-react";

const ToursPage = () => {
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    rating: '',
    spots: '',
    duration: '',
    priceRange: '',
    maxPeople: ''
  });
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToursWithRatings = async () => {
      try {
        // Fetch all tours
        const toursCollection = collection(db, 'tours');
        const toursSnapshot = await getDocs(toursCollection);
        const toursList = toursSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch reviews for all tours and calculate ratings
        const toursWithRatings = await Promise.all(
          toursList.map(async (tour) => {
            try {
              // Query reviews for this specific tour
              const reviewsQuery = query(
                collection(db, 'reviews'),
                where('tourId', '==', tour.id)
              );
              const reviewsSnapshot = await getDocs(reviewsQuery);
              const reviews = reviewsSnapshot.docs.map(doc => doc.data());

              // Calculate average rating and review count
              const reviewCount = reviews.length;
              let averageRating = 0;

              if (reviewCount > 0) {
                const totalRating = reviews.reduce((sum, review) => {
                  return sum + (parseFloat(review.rating) || 0);
                }, 0);
                averageRating = (totalRating / reviewCount).toFixed(1);
              }

              return {
                ...tour,
                averageRating: reviewCount > 0 ? averageRating : null,
                reviewCount: reviewCount
              };
            } catch (reviewError) {
              console.error(`Error fetching reviews for tour ${tour.id}:`, reviewError);
              return {
                ...tour,
                averageRating: null,
                reviewCount: 0
              };
            }
          })
        );

        // Initialize image indexes
        const initialIndexes = {};
        toursWithRatings.forEach(tour => {
          initialIndexes[tour.id] = 0;
        });

        setTours(toursWithRatings);
        setFilteredTours(toursWithRatings);
        setCurrentImageIndexes(initialIndexes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchToursWithRatings();
  }, []);

  // Apply filters whenever filters or tours change
  useEffect(() => {
    let filtered = [...tours];

    // Filter by rating
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(tour => {
        const rating = parseFloat(tour.averageRating) || 0;
        return rating >= minRating;
      });
    }

    // Filter by spots
    if (filters.spots) {
      filtered = filtered.filter(tour => {
        if (!tour.spots || !Array.isArray(tour.spots)) return false;
        return tour.spots.some(spot =>
          spot.name.toLowerCase().includes(filters.spots.toLowerCase())
        );
      });
    }

    // Filter by duration
    if (filters.duration) {
      filtered = filtered.filter(tour => {
        const duration = parseFloat(tour.duration) || 0;
        switch (filters.duration) {
          case 'short': return duration <= 2;
          case 'medium': return duration > 2 && duration <= 6;
          case 'long': return duration > 6;
          default: return true;
        }
      });
    }

    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(tour => {
        const price = parseFloat(tour.price) || 0;
        switch (filters.priceRange) {
          case 'budget': return price <= 50;
          case 'mid': return price > 50 && price <= 150;
          case 'premium': return price > 150;
          default: return true;
        }
      });
    }

    // Filter by max people
    if (filters.maxPeople) {
      const maxPeople = parseInt(filters.maxPeople);
      filtered = filtered.filter(tour => {
        const tourMaxPeople = parseInt(tour.maxPeople) || 0;
        return tourMaxPeople >= maxPeople;
      });
    }

    setFilteredTours(filtered);
  }, [filters, tours]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      rating: '',
      spots: '',
      duration: '',
      priceRange: '',
      maxPeople: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  const handleFavoriteToggle = (tourId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tourId)) {
      newFavorites.delete(tourId);
    } else {
      newFavorites.add(tourId);
    }
    setFavorites(newFavorites);
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    setIsSortOpen(false);

    // Sort the filtered tours based on the selected order
    const sortedTours = [...filteredTours].sort((a, b) => {
      if (order === "a-z") return a.name.localeCompare(b.name);
      if (order === "z-a") return b.name.localeCompare(a.name);
      return 0; // default order - no sorting
    });

    setFilteredTours(sortedTours);
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

  // Update the getUniqueValues function to handle spot objects
  const getUniqueValues = (key) => {
    const values = tours.map(tour => {
      if (key === 'spots') {
        // Handle spots which are objects with name and description
        return tour.spots ? tour.spots.map(spot => spot.name) : [];
      }
      if (key === 'duration') return tour.duration || '';
      if (key === 'maxPeople') return tour.maxPeople || '';
      return '';
    }).flat().filter(value => value);
    return [...new Set(values)].sort();
  };

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-8"></div>

            {/* Filter Section Skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>

            {/* Tour Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

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
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handlePrevImage(tour.id, images.length);
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleNextImage(tour.id, images.length);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
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

            <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
              {currentIndex + 1}/{images.length}
            </div>
          </>
        )}
      </div>
    );
  };

  const FilterDropdown = () => (
    <div className="relative inline-block bg-dark text-dark">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors border-custom text-dark bg-dark"
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {Object.values(filters).filter(v => v !== '').length}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {showFilters && (
        <div className="absolute top-12 left-0 right-0 bg-dark border border-custom rounded-lg shadow-lg p-6 z-[5]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
              >
                <option className="bg-dark text-dark" value="">All Ratings</option>
                <option className="bg-dark text-dark" value="4.5">4.5+ Stars</option>
                <option className="bg-dark text-dark" value="4.0">4+ Stars</option>
                <option className="bg-dark text-dark" value="3.5">3.5+ Stars</option>
                <option className="bg-dark text-dark" value="3.0">3+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Spots</label>
              <select
                value={filters.spots}
                onChange={(e) => handleFilterChange('spots', e.target.value)}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
              >
                <option className="bg-dark text-dark" value="">All Spots</option>
                {getUniqueValues('spots').map(spotName => (
                  <option className="bg-dark text-dark" key={spotName} value={spotName}>{spotName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Duration</label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
              >
                <option className="bg-dark text-dark" value="">All Durations</option>
                <option className="bg-dark text-dark" value="short">Short (&lt;= 2 hours)</option>
                <option className="bg-dark text-dark" value="medium">Medium (2-6 hours)</option>
                <option className="bg-dark text-dark" value="long">Long (&gt; 6 hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
              >
                <option className="bg-dark text-dark" value="">All Prices</option>
                <option className="bg-dark text-dark" value="budget">Budget ($0 - $50)</option>
                <option className="bg-dark text-dark" value="mid">Mid Range ($50 - $150)</option>
                <option className="bg-dark text-dark" value="premium">Premium ($150+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Group Size</label>
              <select
                value={filters.maxPeople}
                onChange={(e) => handleFilterChange('maxPeople', e.target.value)}
                className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
              >
                <option className="bg-dark text-dark" value="">Any Size</option>
                <option className="bg-dark text-dark" value="2">2+ People</option>
                <option className="bg-dark text-dark" value="4">4+ People</option>
                <option className="bg-dark text-dark" value="6">6+ People</option>
                <option className="bg-dark text-dark" value="10">10+ People</option>
                <option className="bg-dark text-dark" value="20">20+ People</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-dark hover:text-secondary underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const TourCard = ({ tour }) => (
    <div
      key={tour.id}
      onClick={(e) => {
        // Only navigate on mobile
        if (window.innerWidth < 640) { // sm breakpoint
          navigate(`/details?tourId=${tour.id}`, { state: { tourId: tour.id } });
        }
      }}
      className="bg-dark rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer"
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
          <span className="font-semibold text-xs text-dark">
            {tour.averageRating || '0'}
          </span>
          <span className="text-secondary text-xs">
            ({tour.reviewCount || '0'})
          </span>
        </div>

        <h3 className="font-semibold text-dark mb-1 line-clamp-1 text-xs sm:text-sm leading-tight">{tour.name}</h3>

        {/* Hide description on mobile, show fewer lines on larger screens */}
        <p className="hidden sm:block text-xs text-wrap text-secondary mb-2 line-clamp-1 md:line-clamp-2 break-words whitespace-normal">{tour.description}</p>

        {/* Hide additional info on mobile */}
        <div className="hidden sm:block space-y-1 mb-3 text-xs text-secondary">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-secondary rounded-full"></span>
            <span>Free Cancellation</span>
          </div>
          {tour.spots && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{tour.spots.length} spots included</span>
            </div>
          )}
          {tour.duration && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-secondary rounded-full"></span>
              <span>{tour.duration} hours</span>
            </div>
          )}
          {tour.maxPeople && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-secondary rounded-full"></span>
              <span>Max {tour.maxpeople} people</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <div>

            <span className="font-bold text-base sm:text-lg text-dark">${tour.price || '99'}</span>
          </div>
        </div>

        {/* Show button only on sm and above */}
        <button
          onClick={() => navigate(`/details?tourId=${tour.id}`, { state: { tourId: tour.id } })}
          className="hidden sm:block w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-dark">Available Tours</h2>

        {/* Filter Section */}
        <div className="mx-auto px-2 sm:px-6 lg:px-8 mt-4 mb-8">
          <div className="relative flex items-center gap-4 pl-0" ref={filterRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors border-custom text-dark bg-dark"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="text-sm text-gray-600">
              Showing {filteredTours.length} of {tours.length} tours
            </div>

            {showFilters && (
              <div className="absolute top-12 left-0 right-0 bg-dark border border-custom rounded-lg shadow-lg p-6 z-[5]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Rating</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => handleFilterChange('rating', e.target.value)}
                      className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                    >
                      <option className="bg-dark text-dark" value="">All Ratings</option>
                      <option className="bg-dark text-dark" value="4.5">4.5+ Stars</option>
                      <option className="bg-dark text-dark" value="4.0">4+ Stars</option>
                      <option className="bg-dark text-dark" value="3.5">3.5+ Stars</option>
                      <option className="bg-dark text-dark" value="3.0">3+ Stars</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Spots</label>
                    <select
                      value={filters.spots}
                      onChange={(e) => handleFilterChange('spots', e.target.value)}
                      className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                    >
                      <option className="bg-dark text-dark" value="">All Spots</option>
                      {getUniqueValues('spots').map(spotName => (
                        <option className="bg-dark text-dark" key={spotName} value={spotName}>{spotName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Duration</label>
                    <select
                      value={filters.duration}
                      onChange={(e) => handleFilterChange('duration', e.target.value)}
                      className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                    >
                      <option className="bg-dark text-dark" value="">All Durations</option>
                      <option className="bg-dark text-dark" value="short">Short (&lt;= 2 hours)</option>
                      <option className="bg-dark text-dark" value="medium">Medium (2-6 hours)</option>
                      <option className="bg-dark text-dark" value="long">Long (&gt; 6 hours)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Price Range</label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                    >
                      <option className="bg-dark text-dark" value="">All Prices</option>
                      <option className="bg-dark text-dark" value="budget">Budget ($0 - $50)</option>
                      <option className="bg-dark text-dark" value="mid">Mid Range ($50 - $150)</option>
                      <option className="bg-dark text-dark" value="premium">Premium ($150+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Group Size</label>
                    <select
                      value={filters.maxPeople}
                      onChange={(e) => handleFilterChange('maxPeople', e.target.value)}
                      className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                    >
                      <option className="bg-dark text-dark" value="">Any Size</option>
                      <option className="bg-dark text-dark" value="2">2+ People</option>
                      <option className="bg-dark text-dark" value="4">4+ People</option>
                      <option className="bg-dark text-dark" value="6">6+ People</option>
                      <option className="bg-dark text-dark" value="10">10+ People</option>
                      <option className="bg-dark text-dark" value="20">20+ People</option>
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-dark hover:text-secondary underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {filteredTours.length === 0 ? (
          <div className="text-center py-12 bg-dark rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM12 7v10m5-5H7" />
            </svg>
            <h3 className="mt-2 text-base font-medium text-dark">
              {tours.length === 0 ? 'No tours available' : 'No tours match your filters'}
            </h3>
            <p className="mt-1 text-sm text-secondary">
              {tours.length === 0
                ? 'Check back later for new tour offerings'
                : 'Try adjusting your filter criteria'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {filteredTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursPage;