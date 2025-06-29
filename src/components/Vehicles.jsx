import React, { useEffect, useState, useRef } from "react";
import { db } from "./config/firebase";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CardBody, CardContainer, CardItem } from "../components/ui/3d-card-hover";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [vehicleRatings, setVehicleRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    color: '',
    priceRange: '',
    transmission: '',
    fuel: '',
    seats: '',
    mileageRange: '',
    starRating: '',
    availability: ''
  });
  const navigate = useNavigate();
  const filterRef = useRef(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "rentals"));
        const vehiclesData = [];
        querySnapshot.forEach((doc) => {
          vehiclesData.push({ id: doc.id, ...doc.data() });
        });
        setVehicles(vehiclesData);
        setFilteredVehicles(vehiclesData);

        // Fetch ratings for all vehicles
        await fetchVehicleRatings(vehiclesData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching vehicles: ", error);
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Fetch ratings from reviews collection
  const fetchVehicleRatings = async (vehiclesData) => {
    try {
      const ratingsMap = {};

      for (const vehicle of vehiclesData) {
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("vehicleId", "==", vehicle.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);

        if (!reviewsSnapshot.empty) {
          let totalRating = 0;
          let reviewCount = 0;

          reviewsSnapshot.forEach((doc) => {
            const reviewData = doc.data();
            if (reviewData.rating) {
              totalRating += reviewData.rating;
              reviewCount++;
            }
          });

          if (reviewCount > 0) {
            ratingsMap[vehicle.id] = {
              averageRating: (totalRating / reviewCount).toFixed(1),
              reviewCount: reviewCount
            };
          } else {
            ratingsMap[vehicle.id] = {
              averageRating: 0,
              reviewCount: 0
            };
          }
        } else {
          ratingsMap[vehicle.id] = {
            averageRating: 0,
            reviewCount: 0
          };
        }
      }

      setVehicleRatings(ratingsMap);
    } catch (error) {
      console.error("Error fetching vehicle ratings: ", error);
    }
  };

  // Extract unique values for filter options
  const getUniqueValues = (key) => {
    const values = vehicles.map(vehicle => {
      if (key === 'brand') return vehicle.vehicle.brand?.split(' ')[0] || '';
      if (key === 'color') return vehicle.vehicle.color || '';
      if (key === 'transmission') return vehicle.vehicle.transmission || '';
      if (key === 'seats') return vehicle.vehicle.seats || '';
      if (key === 'fuel') return vehicle.vehicle.fuel || '';
      if (key === 'availability') return vehicle.vehicle.availability || '';
      return '';
    }).filter(value => value);
    return [...new Set(values)].sort();
  };

  // Apply filters
  useEffect(() => {
    let filtered = vehicles;

    // Filter by brand
    if (filters.brand) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle.brand?.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    // Filter by color
    if (filters.color) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle.color?.toLowerCase() === filters.color.toLowerCase()
      );
    }

    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(vehicle => {
        const price = parseFloat(vehicle.vehicle.price) || 0;
        switch (filters.priceRange) {
          case 'under50': return price < 50;
          case '50-100': return price >= 50 && price <= 100;
          case '100-200': return price > 100 && price <= 200;
          case 'over200': return price > 200;
          default: return true;
        }
      });
    }

    // Filter by transmission
    if (filters.transmission) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle.transmission?.toLowerCase() === filters.transmission.toLowerCase()
      );
    }

    // Filter by fuel
    if (filters.fuel) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle.fuel?.toLowerCase() === filters.fuel.toLowerCase()
      );
    }

    if (filters.seats) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle.seats?.toLowerCase() === filters.seats.toLowerCase()
      );
    }

    // Filter by mileage range
    if (filters.mileageRange) {
      filtered = filtered.filter(vehicle => {
        const mileage = parseFloat(vehicle.vehicle.mileage) || 0;
        switch (filters.mileageRange) {
          case 'under20': return mileage < 20;
          case '20-30': return mileage >= 20 && mileage <= 30;
          case '30-40': return mileage > 30 && mileage <= 40;
          case 'over40': return mileage > 40;
          default: return true;
        }
      });
    }

    // Filter by star rating
    if (filters.starRating) {
      filtered = filtered.filter(vehicle => {
        const rating = parseFloat(vehicleRatings[vehicle.id]?.averageRating) || 0;
        const minRating = parseFloat(filters.starRating);
        return rating >= minRating;
      });
    }

    // Filter by availability
    if (filters.availability) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle.availability?.toLowerCase() === filters.availability.toLowerCase()
      );
    }

    setFilteredVehicles(filtered);
  }, [filters, vehicles, vehicleRatings]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      color: '',
      priceRange: '',
      transmission: '',
      fuel: '',
      seats: '',
      mileageRange: '',
      starRating: '',
      availability: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  // Star Rating Component
  const StarRating = ({ rating, reviewCount, size = 'sm' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className={`${starSize} text-yellow-400 fill-current`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className={`${starSize} relative`}>
            <svg className={`${starSize} text-gray-300 fill-current absolute`} viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg className={`${starSize} text-yellow-400 fill-current absolute overflow-hidden`} viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      } else {
        stars.push(
          <svg key={i} className={`${starSize} text-gray-300 fill-current`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-white ml-1">
          {rating || 0} ({reviewCount || 0})
        </span>
      </div>
    );
  };

  const handleViewDetails = (e, vehicle) => {
    e.stopPropagation();
    navigate('/vdetails', {
      state: {
        vehicle,
        businessId: vehicle.ownerId,
        businessName: vehicle.businessName,
        businessImage: vehicle.businessImage,
        ownerId: vehicle.ownerId
      }
    });
  };

  const SkeletonLoader = () => {
    return (
      <div className="sm:mt-6 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-12 lg:gap-y-0">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200/50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700 animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>

              <div className="h-40 w-full bg-gray-300 dark:bg-gray-700 rounded-xl mb-4"></div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>

              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-4 ml-auto"></div>

              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl mt-6"></div>
            </div>
          ))}
        </div>
      </div>
    );
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
      <div className="min-h-screen w-full relative pb-10">
        <div className="flex flex-row py-4 sm:py-8 items-center justify-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-gray-200">
          <div className="flex flex-row items-center">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800">Available Vehicles</h1>
          </div>
        </div>

        {/* Filter Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-32 animate-pulse"></div>
        </div>

        <SkeletonLoader />
      </div>
    );
  }
  return (
    <div className="min-h-screen 0 w-full relative pb-10">
      <div className="flex flex-row py-4 sm:py-8 items-center justify-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="flex flex-row items-center">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-dark text-gray-800">Available Vehicles</h1>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative flex items-center gap-4" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors border-custom text-dark bg-dark"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <span className="text-dark">Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-dark text-xs px-2 py-1 rounded-full">
                {Object.values(filters).filter(f => f !== '').length}
              </span>
            )}
            <svg className={`w-4 h-4 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="text-sm text-dark text-gray-600">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </div>

          {showFilters && (
            <div className="absolute top-12 left-0 right-0 border border-custom rounded-lg shadow-lg p-6 z-[5] bg-dark">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Brand</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Brands</option>
                    {getUniqueValues('brand').map(brand => (
                      <option className="bg-dark text-dark" key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Color Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Color</label>
                  <select
                    value={filters.color}
                    onChange={(e) => handleFilterChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Colors</option>
                    {getUniqueValues('color').map(color => (
                      <option className="bg-dark text-dark" key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Price per Day</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Prices</option>
                    <option className="bg-dark text-dark" value="under50">Under $50</option>
                    <option className="bg-dark text-dark" value="50-100">$50 - $100</option>
                    <option className="bg-dark text-dark" value="100-200">$100 - $200</option>
                    <option className="bg-dark text-dark" value="over200">Over $200</option>
                  </select>
                </div>

                {/* Transmission Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Transmission</label>
                  <select
                    value={filters.transmission}
                    onChange={(e) => handleFilterChange('transmission', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Types</option>
                    {getUniqueValues('transmission').map(transmission => (
                      <option className="bg-dark text-dark" key={transmission} value={transmission}>{transmission}</option>
                    ))}
                  </select>
                </div>

                {/* Fuel Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Fuel Type</label>
                  <select
                    value={filters.fuel}
                    onChange={(e) => handleFilterChange('fuel', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Fuel Types</option>
                    {getUniqueValues('fuel').map(fuel => (
                      <option className="bg-dark text-dark" key={fuel} value={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Seats</label>
                  <select
                    value={filters.seats}
                    onChange={(e) => handleFilterChange('fuel', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All seat types</option>
                    {getUniqueValues('seats').map(seats => (
                      <option className="bg-dark text-dark" key={seats} value={seats}>{seats}</option>
                    ))}
                  </select>
                </div>

                {/* Mileage Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Mileage (MPG)</label>
                  <select
                    value={filters.mileageRange}
                    onChange={(e) => handleFilterChange('mileageRange', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Mileage</option>
                    <option className="bg-dark text-dark" value="under20">Under 20 MPG</option>
                    <option className="bg-dark text-dark" value="20-30">20 - 30 MPG</option>
                    <option className="bg-dark text-dark" value="30-40">30 - 40 MPG</option>
                    <option className="bg-dark text-dark" value="over40">Over 40 MPG</option>
                  </select>
                </div>

                {/* Star Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Minimum Rating</label>
                  <select
                    value={filters.starRating}
                    onChange={(e) => handleFilterChange('starRating', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Ratings</option>
                    <option className="bg-dark text-dark" value="4">4+ Stars</option>
                    <option className="bg-dark text-dark" value="3">3+ Stars</option>
                    <option className="bg-dark text-dark" value="2">2+ Stars</option>
                    <option className="bg-dark text-dark" value="1">1+ Stars</option>
                  </select>
                </div>
              </div>

              {/* Second row for additional filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mt-4">
                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Availability</label>
                  <select
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-dark text-dark"
                  >
                    <option className="bg-dark text-dark" value="">All Status</option>
                    {getUniqueValues('availability').map(availability => (
                      <option className="bg-dark text-dark" key={availability} value={availability}>{availability}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full px-1 sm:px-2 lg:px-3">
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 relative z-[1]">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="w-full">
                {/* Desktop version with 3D effects */}
                <div className="hidden sm:block">
                  <CardContainer className="inter-var w-full h-full">
                    <CardBody className="bg-black relative group/card w-full min-w-[280px] max-w-[350px] h-auto rounded-xl p-2 sm:p-3 border border-black/[0.1] dark:border-white/[0.2] flex flex-col transition-transform duration-300 hover:scale-[1.02] active:scale-95 overflow-hidden">
                      <span className="absolute inset-0 bg-white opacity-0 active:opacity-10 transition duration-200 rounded-lg pointer-events-none"></span>

                      <div className="flex flex-col gap-1">
                        <CardItem translateZ="50" className="text-xl font-bold text-white capitalize">
                          {vehicle.vehicle.brand} {vehicle.vehicle.model}
                        </CardItem>
                        <CardItem translateZ="100" rotateX={5} rotateZ={-1} className="w-full relative group mt-2">
                          <img
                            src={vehicle.vehicle.images?.[0] || vehicle.vehicle.image || "/default-image.jpg"}
                            height="40 sm:h-44 w-full object-cover rounded-lg group-hover/card:shadow-xl"
                            className="h-40 sm:h-44 w-full object-cover rounded-lg group-hover/card:shadow-xl"
                            alt={vehicle.vehicle.model}
                          />
                          {(vehicle.vehicle.images?.length > 1 || (vehicle.vehicle.images?.length === 1 && vehicle.vehicle.image)) && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                              {vehicle.vehicle.images?.length || 1} photos
                            </div>
                          )}
                        </CardItem>

                        <div className="flex flex-col gap-1 mt-1">
                          <CardItem>
                            <StarRating
                              rating={parseFloat(vehicleRatings[vehicle.id]?.averageRating) || 0}
                              reviewCount={vehicleRatings[vehicle.id]?.reviewCount || 0}
                            />
                          </CardItem>

                          <div className="grid grid-cols-1 gap-2 mt-1">
                            <CardItem className="flex text-white justify-between text-sm">
                              <span className="text-gray-400">Seats:</span>
                              <span>{vehicle.vehicle.seats}</span>
                            </CardItem>
                            <CardItem className="flex text-white justify-between text-sm">
                              <span className="text-gray-400">Transmission:</span>
                              <span>{vehicle.vehicle.transmission}</span>
                            </CardItem>
                            <CardItem className="flex text-white justify-between text-sm">
                              <span className="text-gray-400">Fuel:</span>
                              <span>{vehicle.vehicle.fuel}</span>
                            </CardItem>
                          </div>

                          <CardItem className="flex text-white justify-between text-base font-semibold mt-2">
                            <span>Price:</span>
                            <span>${vehicle.vehicle.price || "0"}/day</span>
                          </CardItem>
                        </div>

                        <CardItem
                          className={`text-xl font-bold mt-1 ml-auto text-right ${vehicle.vehicle.availability === "Available" ? "text-green-500" :
                            vehicle.vehicle.availability === "Booked" ? "text-orange-500" :
                              "text-red-500"
                            }`}
                        >
                          {vehicle.vehicle.availability}
                        </CardItem>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={(e) => handleViewDetails(e, vehicle)}
                          className="w-full px-4 py-2 rounded-lg text-sm font-bold relative overflow-hidden bg-blue-500 hover:bg-blue-600 text-white group transition-all duration-300"
                        >
                          <span className="inline-block group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300">
                            View Details
                          </span>
                          <span className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <img src="/images/car.png" alt="Car" className="w-4 h-4 object-contain invert" />
                          </span>
                        </button>
                      </div>
                    </CardBody>
                  </CardContainer>
                </div>

                {/* Mobile version without 3D effects */}
                <div
                  className="sm:hidden bg-black mt-2 rounded-lg p-1.5 border border-black/[0.1] dark:border-white/[0.2] cursor-pointer active:scale-95 transition-transform"
                  onClick={(e) => handleViewDetails(e, vehicle)}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-bold text-white capitalize truncate">
                      {vehicle.vehicle.brand} {vehicle.vehicle.model}
                    </div>
                    <div className="w-full relative mt-1">
                      <img
                        src={vehicle.vehicle.images?.[0] || vehicle.vehicle.image || "/default-image.jpg"}
                        height="32"
                        className="h-32 w-full object-cover rounded-lg"
                        alt={vehicle.vehicle.model}
                      />
                      {(vehicle.vehicle.images?.length > 1 || (vehicle.vehicle.images?.length === 1 && vehicle.vehicle.image)) && (
                        <div className="absolute top-0.5 right-0.5 bg-black/50 text-white text-[8px] px-1 py-0.5 rounded-full">
                          {vehicle.vehicle.images?.length || 1}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div>
                        <StarRating
                          rating={parseFloat(vehicleRatings[vehicle.id]?.averageRating) || 0}
                          reviewCount={vehicleRatings[vehicle.id]?.reviewCount || 0}
                          size="sm"
                        />
                      </div>
                      <div className="flex text-white text-[10px]">
                        <span className="text-gray-400 mr-1.5">Transmission:</span>
                        <span>{vehicle.vehicle.transmission}</span>
                      </div>
                      <div className="flex text-white text-[10px]">
                        <span className="text-gray-400 mr-1.5">Fuel:</span>
                        <span>{vehicle.vehicle.fuel}</span>
                      </div>
                      <div className="flex text-white text-[10px]">
                        <span className="text-gray-400 mr-1.5">Price:</span>
                        <span>${vehicle.vehicle.price || "0"}/d</span>
                      </div>
                    </div>

                    <div className={`text-[14px] font-bold ml-auto text-right ${vehicle.vehicle.availability === "Available" ? "text-green-500" :
                      vehicle.vehicle.availability === "Booked" ? "text-orange-500" :
                        "text-red-500"
                      }`}>
                      {vehicle.vehicle.availability}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 lg:py-20">
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600">
              {hasActiveFilters ? "No vehicles match your filters." : "No vehicles available for rent."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Vehicles;