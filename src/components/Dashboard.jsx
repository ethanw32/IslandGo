import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { getAuth } from 'firebase/auth';
import { Calendar, Clock, DollarSign, Filter, Search, ChevronDown, Users, Car, MapPin, Phone, Mail, Map, ExternalLink, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from './useAuth';

const LoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [tourReservations, setTourReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('date');
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedBookings: 0
  });
  const [pickupSpots, setPickupSpots] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [relatedTourBookings, setRelatedTourBookings] = useState([]);
  const [showRelatedBookings, setShowRelatedBookings] = useState(false);
  const [expandedTours, setExpandedTours] = useState({});

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const { userDetails, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userDetails) {
      navigate('/login');
      return;
    }

    if (userDetails.type !== 'business' || !['Taxi', 'Rental'].includes(userDetails.businessType)) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        if (!userDetails?.uid) {
          setError('No user ID found. Please make sure you are logged in.');
          setLoading(false);
          return;
        }

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('hostId', '==', userDetails.uid),
          orderBy('createdAt', 'desc')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          status: doc.data().status || 'pending',
          isPaid: doc.data().isPaid || false,
          totalPrice: doc.data().totalPrice || 0,
          vehicleDetails: doc.data().vehicleDetails || {
            brand: 'Unknown',
            model: 'Unknown',
            images: []
          },
          customerName: doc.data().customerName || 'Unknown Customer',
          customerEmail: doc.data().customerEmail || 'No email provided',
          customerPhone: doc.data().customerPhone || 'No phone provided',
          pickupLocation: doc.data().pickupLocation || 'Not specified',
          dropoffLocation: doc.data().dropoffLocation || 'Not specified'
        }));
        setBookings(bookingsData);

        // Fetch pickup spots
        const spotsQuery = query(
          collection(db, 'pickupSpots'),
          where('businessId', '==', userDetails.uid)
        );
        const spotsSnapshot = await getDocs(spotsQuery);
        const spotsMap = {};
        spotsSnapshot.docs.forEach(doc => {
          const spotData = doc.data();
          spotsMap[spotData.bookingId] = {
            id: doc.id,
            ...spotData
          };
        });
        setPickupSpots(spotsMap);

        // Fetch tour reservations
        const toursQuery = query(
          collection(db, 'tourReservations'),
          where('businessId', '==', userDetails.uid),
          orderBy('createdAt', 'desc')
        );
        const toursSnapshot = await getDocs(toursQuery);
        const toursData = toursSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          reservationDate: doc.data().reservationDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          status: doc.data().status || 'pending',
          isPaid: doc.data().isPaid || false,
          totalPrice: doc.data().totalPrice || 0,
          tourImage: doc.data().tourImage || '/images/default-tour.jpg',
          tourName: doc.data().tourName || 'Unnamed Tour',
          persons: doc.data().persons || 1,
          customerName: doc.data().customerName || 'Unknown Customer',
          customerEmail: doc.data().customerEmail || 'No email provided',
          customerPhone: doc.data().customerPhone || 'No phone provided',
          pricePerPerson: doc.data().pricePerPerson || 0,
          specialRequests: doc.data().specialRequests || '',
          isPrivate: doc.data().isPrivate || false,
          tourLocation: doc.data().tourLocation || 'Location TBD',
          hostId: doc.data().hostId
        }));
        setTourReservations(toursData);

        // Calculate statistics
        const allData = [...bookingsData, ...toursData];
        const totalRevenue = allData.reduce((sum, item) => sum + (item.isPaid ? item.totalPrice : 0), 0);
        const pendingPayments = allData.reduce((sum, item) => sum + (!item.isPaid ? item.totalPrice : 0), 0);
        const completedBookings = allData.filter(item => item.status === 'completed').length;

        setStats({
          totalBookings: allData.length,
          totalRevenue,
          pendingPayments,
          completedBookings
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userDetails, authLoading, navigate]);

  // Update activeTab when userDetails becomes available
  useEffect(() => {
    if (userDetails?.businessType) {
      setActiveTab(userDetails.businessType === 'Taxi' ? 'tours' : 'bookings');
    }
  }, [userDetails]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleTourExpansion = (tourKey) => {
    setExpandedTours(prev => ({
      ...prev,
      [tourKey]: !prev[tourKey]
    }));
  };

  const getFilteredData = () => {
    const data = activeTab === 'bookings' ? bookings : tourReservations;

    let filtered = data.filter(item => {
      // Filter by status
      if (filters.status && item.status !== filters.status) return false;

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          item.customerEmail,
          item.customerName,
          item.customerPhone,
          activeTab === 'bookings' ? item.vehicleDetails?.brand : item.tourName,
          activeTab === 'bookings' ? item.vehicleDetails?.model : item.tourLocation,
          activeTab === 'bookings' ? item.pickupLocation : '',
          activeTab === 'bookings' ? item.dropoffLocation : ''
        ].filter(Boolean);

        if (!searchableFields.some(field =>
          field.toLowerCase().includes(searchTerm)
        )) return false;
      }

      return true;
    });

    if (activeTab === 'tours') {
      // Group tours by name and date
      const groupedTours = filtered.reduce((acc, tour) => {
        const key = `${tour.tourName}-${tour.reservationDate?.toDateString()}`;
        if (!acc[key]) {
          acc[key] = {
            ...tour,
            totalPeople: tour.persons,
            totalPrice: tour.totalPrice,
            bookings: [tour]
          };
        } else {
          acc[key].totalPeople += tour.persons;
          acc[key].totalPrice += tour.totalPrice;
          acc[key].bookings.push(tour);
        }
        return acc;
      }, {});
      filtered = Object.values(groupedTours);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'price') {
        return b.totalPrice - a.totalPrice;
      }
      return 0;
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const sendPickupSpotMessage = async (bookingId, customerName, locationName, coordinates) => {
    try {
      const messageData = {
        bookingId,
        senderId: userDetails.uid,
        senderName: userDetails.businessName || 'Business Owner',
        message: `Pickup location has been set for your booking. Location: ${locationName}`,
        type: 'pickup_location',
        location: {
          name: locationName,
          coordinates: coordinates
        },
        timestamp: serverTimestamp(),
        read: false,
        customerName: customerName
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);
    } catch (err) {
      console.error('Error sending pickup spot message:', err);
    }
  };

  const handleItemClick = async (item) => {
    if (item.status === 'completed') {
      setSelectedItem(item);

      // If it's a tour reservation, fetch related bookings
      if (activeTab === 'tours') {
        try {
          const relatedBookings = tourReservations.filter(
            tour => tour.tourName === item.tourName &&
              tour.reservationDate?.toDateString() === item.reservationDate?.toDateString()
          );
          setRelatedTourBookings(relatedBookings);
        } catch (err) {
          console.error('Error fetching related tour bookings:', err);
        }
      }
    }
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setShowRelatedBookings(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mt-2"></div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userDetails?.businessName ? `${userDetails.businessName} Dashboard` : 'Business Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">Manage your vehicle bookings and tour reservations</p>
          </div>
          <button
            onClick={async () => {
              const tourData = await Promise.all(getFilteredData()
                .filter(item => activeTab === 'tours')
                .map(async tour => {
                  // Fetch customer images for all bookings in the tour
                  const bookingsWithImages = await Promise.all(tour.bookings.map(async booking => {
                    try {
                      // Get customer's user ID from the booking
                      const tourRef = doc(db, 'tourReservations', booking.id);
                      const tourSnap = await getDoc(tourRef);
                      const tourData = tourSnap.data();
                      const customerId = tourData.userId || tourData.customerId || tourData.customer_id;

                      if (customerId) {
                        // Fetch customer's image from users collection
                        const customerRef = doc(db, 'users', customerId);
                        const customerSnap = await getDoc(customerRef);
                        const customerData = customerSnap.exists() ? customerSnap.data() : {};
                        return {
                          ...booking,
                          customerImage: customerData.photoURL || ''
                        };
                      }
                      return booking;
                    } catch (err) {
                      console.error('Error fetching customer image:', err);
                      return booking;
                    }
                  }));

                  const customerName = bookingsWithImages.length > 0
                    ? bookingsWithImages[0].customerName || 'Group Tour'
                    : 'Unknown Customer';

                  return {
                    bookingId: tour.id,
                    vehicleDetails: tour.tourName,
                    startDate: formatDate(tour.reservationDate),
                    endDate: formatDate(tour.reservationDate),
                    pickupLocation: tour.tourLocation,
                    dropoffLocation: tour.tourLocation,
                    isTour: true,
                    totalCustomers: tour.bookings.length,
                    groupBookings: bookingsWithImages
                  };
                }));

              navigate('/pickup-spots', {
                state: {
                  allBookings: bookings.map(booking => ({
                    bookingId: booking.id,
                    customerName: booking.customerName,
                    vehicleDetails: `${booking.vehicleDetails?.brand} ${booking.vehicleDetails?.model}`,
                    startDate: formatDate(booking.startDate),
                    endDate: formatDate(booking.endDate),
                    pickupLocation: booking.pickupLocation,
                    dropoffLocation: booking.dropoffLocation,
                    isTour: false
                  })),
                  allTours: tourData
                }
              });
            }}
            className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <Map className="w-4 h-4 mr-1.5" />
            Manage Spots
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{formatPrice(stats.pendingPayments)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
        {userDetails?.businessType === 'Rental' && (
          <button
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'bookings'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('bookings')}
          >
            <Car className="inline-block w-4 h-4 mr-2" />
            Vehicle Bookings ({bookings.length})
          </button>
        )}
        {userDetails?.businessType === 'Taxi' && (
          <button
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'tours'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('tours')}
          >
            <MapPin className="inline-block w-4 h-4 mr-2" />
            Tour Reservations ({tourReservations.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by customer, vehicle, or location..."
              className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>

          <div className="relative">
            <select
              className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm md:text-base"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <Filter className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <ChevronDown className="absolute right-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>

          <div className="relative">
            <select
              className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm md:text-base"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
            </select>
            <Clock className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <ChevronDown className="absolute right-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm md:text-base text-gray-600">
          Showing {filteredData.length} {activeTab === 'bookings' ? 'vehicle bookings' : 'tour reservations'}
        </p>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'bookings' ? <Car className="h-8 w-8 md:h-12 md:w-12 mx-auto" /> : <MapPin className="h-8 w-8 md:h-12 md:w-12 mx-auto" />}
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'bookings' ? 'vehicle bookings' : 'tour reservations'} found
            </h3>
            <p className="text-sm md:text-base text-gray-500">
              {filters.search || filters.status
                ? 'Try adjusting your search or filters'
                : `You don't have any ${activeTab === 'bookings' ? 'vehicle bookings' : 'tour reservations'} yet`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'bookings' ? 'Vehicle Details' : 'Tour Details'}
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Information
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'bookings' ? 'Booking Period' : 'Reservation Date'}
                  </th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location Details
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price & Payment
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <React.Fragment key={activeTab === 'bookings' ? item.id : `${item.tourName}-${item.reservationDate?.toDateString()}`}>
                    <tr
                      className={`hover:bg-gray-50 transition-colors ${item.status === 'completed' ? 'cursor-pointer' : ''}`}
                      onClick={() => activeTab === 'bookings' ? handleItemClick(item) : toggleTourExpansion(`${item.tourName}-${item.reservationDate?.toDateString()}`)}
                    >
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {activeTab === 'bookings'
                                ? `${item.vehicleDetails?.brand || 'Unknown'} ${item.vehicleDetails?.model || 'Model'}`
                                : item.tourName}
                            </div>
                            {activeTab === 'tours' && (
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="text-xs md:text-sm text-gray-500">
                                  <Users className="inline-block w-3 h-3 mr-1" />
                                  {item.totalPeople} {item.totalPeople === 1 ? 'person' : 'people'} total
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const customerIds = item.bookings.map(booking => booking.userId || booking.customerId || booking.customer_id).filter(Boolean);
                                    navigate('/pickup-spots', {
                                      state: {
                                        allBookings: bookings.map(booking => ({
                                          bookingId: booking.id,
                                          customerName: booking.customerName,
                                          vehicleDetails: `${booking.vehicleDetails?.brand} ${booking.vehicleDetails?.model}`,
                                          startDate: formatDate(booking.startDate),
                                          endDate: formatDate(booking.endDate),
                                          pickupLocation: booking.pickupLocation,
                                          dropoffLocation: booking.dropoffLocation,
                                          isTour: false
                                        })),
                                        allTours: [{
                                          bookingId: item.id,
                                          customerName: item.bookings[0]?.customerName || 'Group Tour',
                                          vehicleDetails: item.tourName,
                                          startDate: formatDate(item.reservationDate),
                                          endDate: formatDate(item.reservationDate),
                                          pickupLocation: item.tourLocation,
                                          dropoffLocation: item.tourLocation,
                                          isTour: true,
                                          totalCustomers: item.bookings.length,
                                          groupBookings: item.bookings.map(booking => ({
                                            ...booking,
                                            customerName: booking.customerName || 'Unknown Customer',
                                            customerEmail: booking.customerEmail || 'No email provided',
                                            customerPhone: booking.customerPhone || 'No phone provided'
                                          })),
                                          customerIds: customerIds
                                        }]
                                      }
                                    });
                                  }}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                                  title="Manage Pickup Spots"
                                >
                                  <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              ID: {item.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 md:px-6 py-3 md:py-4">
                        {activeTab === 'bookings' ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                            <div className="text-xs md:text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {item.customerEmail}
                            </div>
                            {item.customerPhone && item.customerPhone !== 'No phone provided' && (
                              <div className="text-xs md:text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {item.customerPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs md:text-sm text-gray-500">
                            {item.bookings.length} {item.bookings.length === 1 ? 'booking' : 'bookings'}
                          </div>
                        )}
                      </td>

                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm text-gray-900">
                          {activeTab === 'bookings' ? (
                            <div className="space-y-1">
                              <div><strong>Start:</strong> {formatDate(item.startDate)}</div>
                              <div><strong>End:</strong> {formatDate(item.endDate)}</div>
                            </div>
                          ) : (
                            <div>
                              <div><strong>Date:</strong> {formatDate(item.reservationDate)}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Booked: {formatDate(item.createdAt)}
                        </div>
                      </td>

                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {activeTab === 'bookings' ? (
                            <div className="space-y-2">
                              {pickupSpots[item.id] ? (
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                                  <div>
                                    <span className="text-xs font-medium text-gray-700">Pickup Spot:</span>
                                    <div className="text-sm text-gray-900 mt-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(`https://www.google.com/maps?q=${pickupSpots[item.id].coordinates.lat},${pickupSpots[item.id].coordinates.lng}`, '_blank');
                                        }}
                                        className="text-blue-500 hover:text-blue-700 flex items-center"
                                      >
                                        {pickupSpots[item.id].name}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs font-medium text-gray-700">Pickup Location:</span>
                                    <div className="text-sm text-gray-900 mt-1">{item.pickupLocation}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {pickupSpots[item.id] ? (
                                <div className="flex justify-center">
                                  <MapPin className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-center font-medium text-gray-700">Meetup Spot:</span>
                                    <div className="text-sm text-gray-900 mt-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(`https://www.google.com/maps?q=${pickupSpots[item.id].coordinates.lat},${pickupSpots[item.id].coordinates.lng}`, '_blank');
                                        }}
                                        className="text-blue-500 hover:text-blue-700 flex items-center"
                                      >
                                        {pickupSpots[item.id].name}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                  <div>
                                    <span className="text-xs font-medium text-gray-700">Tour Location:</span>
                                    <div className="text-sm text-gray-900 mt-1">{item.tourLocation}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.totalPrice)}
                          </div>
                          {activeTab === 'tours' && (
                            <div className="text-xs text-gray-500">
                              {formatPrice(item.pricePerPerson)} per person
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className={`px-2 md:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                    </tr>

                    {activeTab === 'tours' && expandedTours[`${item.tourName}-${item.reservationDate?.toDateString()}`] && (
                      <tr>
                        <td colSpan="6" className="px-3 md:px-6 py-3 md:py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 mb-3">All Bookings for {item.tourName}</h4>
                            {item.bookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                              >
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{booking.customerName}</p>
                                    <p className="text-xs md:text-sm text-gray-600">{booking.customerEmail}</p>
                                    {booking.customerPhone && (
                                      <p className="text-xs md:text-sm text-gray-600">{booking.customerPhone}</p>
                                    )}
                                  </div>
                                  <div className="text-left md:text-right">
                                    <p className="text-xs md:text-sm font-medium text-gray-900">
                                      {booking.persons} {booking.persons === 1 ? 'person' : 'people'}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-600">
                                      {formatPrice(booking.totalPrice)}
                                    </p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {booking.isPaid ? 'Paid' : 'Pending'}
                                    </span>
                                  </div>
                                </div>
                                {booking.specialRequests && (
                                  <div className="mt-2 text-xs md:text-sm text-gray-600">
                                    <span className="font-medium">Special Requests:</span> {booking.specialRequests}
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs md:text-sm text-gray-600">
                                Total Bookings: {item.bookings.length}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600">
                                Total People: {item.totalPeople}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600">
                                Total Revenue: {formatPrice(item.totalPrice)}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {activeTab === 'bookings' ? 'Booking Details' : 'Tour Reservation Details'}
              </h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'bookings'
                    ? `${selectedItem.vehicleDetails?.brand} ${selectedItem.vehicleDetails?.model}`
                    : selectedItem.tourName}
                </h3>
                <p className="text-sm text-gray-600">ID: {selectedItem.id}</p>
              </div>

              {activeTab === 'tours' && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowRelatedBookings(!showRelatedBookings)}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm md:text-base"
                  >
                    <Users className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    {showRelatedBookings ? 'Hide' : 'Show'} All Bookings for This Tour
                    <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 ml-2 transform transition-transform ${showRelatedBookings ? 'rotate-180' : ''}`} />
                  </button>

                  {showRelatedBookings && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3 md:p-4">
                      <h4 className="font-medium text-gray-900 mb-3">All Bookings for {selectedItem.tourName}</h4>
                      <div className="space-y-3">
                        {relatedTourBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                          >
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                              <div>
                                <p className="font-medium text-gray-900">{booking.customerName}</p>
                                <p className="text-xs md:text-sm text-gray-600">{booking.customerEmail}</p>
                                {booking.customerPhone && (
                                  <p className="text-xs md:text-sm text-gray-600">{booking.customerPhone}</p>
                                )}
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-xs md:text-sm font-medium text-gray-900">
                                  {booking.persons} {booking.persons === 1 ? 'person' : 'people'}
                                </p>
                                <p className="text-xs md:text-sm text-gray-600">
                                  {formatPrice(booking.totalPrice)}
                                </p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {booking.isPaid ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                            </div>
                            {booking.specialRequests && (
                              <div className="mt-2 text-xs md:text-sm text-gray-600">
                                <span className="font-medium">Special Requests:</span> {booking.specialRequests}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs md:text-sm text-gray-600">
                          Total Bookings: {relatedTourBookings.length}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          Total People: {relatedTourBookings.reduce((sum, booking) => sum + booking.persons, 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-600">{selectedItem.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedItem.customerEmail}</p>
                  {selectedItem.customerPhone && (
                    <p className="text-sm text-gray-600">{selectedItem.customerPhone}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {activeTab === 'bookings' ? 'Booking Period' : 'Reservation Date'}
                  </h4>
                  {activeTab === 'bookings' ? (
                    <>
                      <p className="text-sm text-gray-600">Start: {formatDate(selectedItem.startDate)}</p>
                      <p className="text-sm text-gray-600">End: {formatDate(selectedItem.endDate)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Date: {formatDate(selectedItem.reservationDate)}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location Details</h4>
                  {activeTab === 'bookings' ? (
                    <>
                      <p className="text-sm text-gray-600">Pickup: {selectedItem.pickupLocation}</p>
                      <p className="text-sm text-gray-600">Dropoff: {selectedItem.dropoffLocation}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Location: {selectedItem.tourLocation}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                  <p className="text-sm text-gray-600">Total: {formatPrice(selectedItem.totalPrice)}</p>
                  <p className="text-sm text-gray-600">
                    Status: {selectedItem.isPaid ? 'Paid' : 'Payment Pending'}
                  </p>
                </div>
              </div>

              {activeTab === 'tours' && selectedItem.specialRequests && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                  <p className="text-sm text-gray-600">{selectedItem.specialRequests}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseDetails}
                  className="px-3 md:px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;