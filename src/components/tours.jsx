import { useEffect, useState } from "react";
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
          spot.toLowerCase().includes(filters.spots.toLowerCase())
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
    <div className="relative inline-block">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${hasActiveFilters
          ? 'bg-blue-50 border-blue-300 text-blue-700'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
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
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+</option>
                <option value="4.0">4+</option>
                <option value="3.5">3.5+</option>
                <option value="3.0">3+</option>
              </select>
            </div>

            {/* Spots Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Spots
              </label>
              <input
                type="text"
                placeholder="Enter spot name"
                value={filters.spots}
                onChange={(e) => handleFilterChange('spots', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Duration</option>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Price</option>
                <option value="budget">Budget</option>
                <option value="mid">Mid Range</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Max People Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Group Size
              </label>
              <select
                value={filters.maxPeople}
                onChange={(e) => handleFilterChange('maxPeople', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Size</option>
                <option value="2">2+ People</option>
                <option value="4">4+ People</option>
                <option value="6">6+ People</option>
                <option value="10">10+ People</option>
                <option value="20">20+ People</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const TourCard = ({ tour }) => (
    <div
      key={tour.id}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <ImageSlider tour={tour} />

        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleFavoriteToggle(tour.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart className={`h-4 w-4 ${favorites.has(tour.id) ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-4 w-4 fill-green-500 text-green-500" />
          <span className="font-semibold text-sm">
            {tour.averageRating ? tour.averageRating : "No ratings"}
          </span>
          <span className="text-gray-500 text-sm">
            ({tour.reviewCount || 0} {tour.reviewCount === 1 ? "review" : "reviews"})
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">{tour.name}</h3>
        <p className="text-xs text-wrap text-gray-600 mb-2 line-clamp-2 break-words whitespace-normal">{tour.description}</p>

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
          {tour.duration && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>{tour.duration} hours</span>
            </div>
          )}
          {tour.maxPeople && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Max {tour.maxpeople} people</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-gray-500">from </span>
            <span className="font-bold text-lg">${tour.price || '99'}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/details', { state: { tourId: tour.id } })}
          className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Available Tours</h2>

        {/* Filter Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <FilterDropdown />
            <span className="text-sm text-gray-600">
              {filteredTours.length} of {tours.length} tours
            </span>
          </div>
        </div>

        {filteredTours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM12 7v10m5-5H7" />
            </svg>
            <h3 className="mt-2 text-base font-medium text-gray-900">
              {tours.length === 0 ? 'No tours available' : 'No tours match your filters'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursPage;