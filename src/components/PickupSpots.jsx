import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './config/firebase';
import { MapPin, Plus, Trash2, User, Car, Calendar, ExternalLink, Map, Phone, Mail, Clock, Star } from 'lucide-react';
import useAuth from './useAuth';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useLocation, Route } from 'react-router-dom';
import ProfileImage from './ProfileImage';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Simple marker component
function LocationMarker({ position, setPosition, onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPosition = e.target.getLatLng();
          setPosition(newPosition);
          onLocationSelect(newPosition.lat, newPosition.lng);
        },
      }}
    />
  );
}

const PickupSpots = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetails, loading: authLoading } = useAuth();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingSpot, setBookingSpot] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.1165, -61.6790]);
  const [mapZoom, setMapZoom] = useState(11);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [bookingSpots, setBookingSpots] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'tours'

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userDetails) {
      navigate('/login');
      return;
    }

    if (userDetails.type !== 'business') {
      navigate('/');
      return;
    }

    // Get booking details from location state
    if (location.state) {
      if (userDetails.businessType === 'Taxi') {
        // For taxi businesses, only show tours
        if (location.state.allTours) {
          setAllBookings(location.state.allTours);
          fetchAllBookingSpots();
        }
      } else if (userDetails.businessType === 'Rental') {
        // For rental businesses, only show regular bookings
        if (location.state.allBookings) {
          setAllBookings(location.state.allBookings);
          fetchAllBookingSpots();
        }
      } else {
        // For other business types, show both if available
        if (location.state.allBookings) {
          setAllBookings(location.state.allBookings);
          fetchAllBookingSpots();
        }
      }
    }
  }, [userDetails, authLoading, location.state, navigate]);

  const fetchAllBookingSpots = async () => {
    try {
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
      setBookingSpots(spotsMap);
    } catch (err) {
      console.error('Error fetching booking spots:', err);
      setError('Error fetching booking spots');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingSpot = async () => {
    try {
      if (!selectedBooking?.bookingId) return;

      const spotsQuery = query(
        collection(db, 'pickupSpots'),
        where('bookingId', '==', selectedBooking.bookingId)
      );
      const spotsSnapshot = await getDocs(spotsQuery);
      if (!spotsSnapshot.empty) {
        const spotData = spotsSnapshot.docs[0].data();
        setBookingSpot({
          id: spotsSnapshot.docs[0].id,
          ...spotData
        });
      } else {
        setBookingSpot(null);
      }
    } catch (err) {
      console.error('Error fetching booking spot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!locationName) {
      setError('Please enter a location name');
      return;
    }

    try {
      console.log('Searching for location:', locationName);
      const response = await fetch(
        `http://localhost:3001/api/geocode?q=${encodeURIComponent(locationName + ', Grenada')}&type=search`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search response:', data);

      if (data && data.length > 0) {
        const location = data[0];
        console.log('Found location:', location);

        const latlng = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon)
        };
        console.log('Setting location to:', latlng);

        setSelectedLocation(latlng);
        setMapCenter([latlng.lat, latlng.lng]);
        setMapZoom(15);
        setError(null);
      } else {
        console.log('No locations found');
        setError('Location not found in Grenada. Please try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Error searching for location: ${err.message}`);
    }
  };

  const getLocationName = async (lat, lng) => {
    try {
      setIsLoadingLocation(true);
      const response = await fetch(
        `http://localhost:3001/api/geocode?lat=${lat}&lng=${lng}&type=reverse`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.display_name) {
        setLocationName(data.display_name);
      }
    } catch (err) {
      console.error('Error getting location name:', err);
      setError('Error getting location name. Please enter it manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const sendPickupSpotMessage = async (bookingId, customerName, locationName, coordinates, groupBookings = []) => {
    try {
      if (!userDetails?.uid) {
        throw new Error('User details not available');
      }

      if (!bookingId || !locationName || !coordinates) {
        throw new Error('Missing required data for message');
      }

      console.log('Sending location message with data:', {
        bookingId,
        customerName,
        locationName,
        coordinates,
        businessId: userDetails.uid,
        businessName: userDetails.businessName,
        groupBookings
      });

      // Use business image from userDetails
      const businessImage = userDetails.businessImage || userDetails.photoURL || '';
      console.log('Business Image:', businessImage);

      const batch = writeBatch(db);
      const mapUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      const locationType = userDetails.businessType === 'Taxi' ? 'meetup' : 'pickup';

      // Helper function to fetch customer data
      const fetchCustomerData = async (customerId) => {
        try {
          if (!customerId) return { name: 'Unknown Customer', image: '' };
          const customerRef = doc(db, 'users', customerId);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            const customerData = customerSnap.data();
            return {
              name: customerData.name || customerData.displayName || 'Unknown Customer',
              image: customerData.photoURL || customerData.photo
            };
          }
          return { name: 'Unknown Customer', image: '' };
        } catch (error) {
          return { name: 'Unknown Customer', image: '' };
        }
      };

      // If this is a group tour, send messages to all customers
      if (groupBookings && groupBookings.length > 0) {
        for (const booking of groupBookings) {
          try {
            // Get customer ID for each booking
            const tourRef = doc(db, 'tourReservations', booking.id);
            const tourSnap = await getDoc(tourRef);

            if (!tourSnap.exists()) {
              continue;
            }

            const tourData = tourSnap.data();
            const groupCustomerId = tourData.userId || tourData.customerId || tourData.customer_id;

            if (!groupCustomerId) {
              continue;
            }

            // Fetch this specific customer's data
            const customerData = await fetchCustomerData(groupCustomerId);
            console.log(`Customer data for ${groupCustomerId}:`, customerData);

            // Create conversation ID for this customer
            const participants = [userDetails.uid, groupCustomerId].sort();
            const conversationId = `conversation_${participants[0]}_${participants[1]}`;

            // Update or create conversation with this customer's specific data
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationSnap = await getDoc(conversationRef);

            const conversationData = {
              participant1: userDetails.uid,
              participant2: groupCustomerId,
              participant1Name: userDetails.businessName || userDetails.name,
              participant2Name: customerData.name,
              participant1Image: businessImage,
              participant2Image: customerData.image,
              isBusiness: true,
              lastMessage: '',
              lastMessageTime: new Date(),
              updatedAt: new Date()
            };

            if (!conversationSnap.exists()) {
              conversationData.createdAt = serverTimestamp();
            }

            batch.set(conversationRef, conversationData, { merge: true });

            // Add message to conversation with this customer's specific data
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const newMessageRef = doc(messagesRef);
            batch.set(newMessageRef, {
              text: `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} location has been set for your tour. Location: ${locationName}`,
              createdAt: serverTimestamp(),
              uid: userDetails.uid,
              photoURL: businessImage,
              displayName: userDetails.businessName || 'Business Owner',
              recipientId: groupCustomerId,
              recipientName: customerData.name,
              recipientImage: customerData.image,
              isBusiness: true,
              type: `${locationType}_location`,
              location: {
                name: locationName,
                coordinates: coordinates
              },
              links: [{
                text: locationName,
                url: mapUrl,
                type: 'location'
              }]
            });

            console.log(`Message prepared for customer: ${customerData.name} (${groupCustomerId})`);
          } catch (err) {
            throw new Error(`Failed to send notification: ${err.message}`);
          }
        }
      } else {
        // Handle single booking as before
        let customerId;
        let dataForError;

        if (userDetails.businessType === 'Taxi') {
          const tourRef = doc(db, 'tourReservations', bookingId);
          const tourSnap = await getDoc(tourRef);
          if (!tourSnap.exists()) {
            throw new Error('Tour reservation not found');
          }
          const tourData = tourSnap.data();
          customerId = tourData.userId || tourData.customerId || tourData.customer_id;
          dataForError = tourData;
        } else {
          const bookingRef = doc(db, 'bookings', bookingId);
          const bookingSnap = await getDoc(bookingRef);
          if (!bookingSnap.exists()) {
            throw new Error('Booking not found');
          }
          const bookingData = bookingSnap.data();
          customerId = bookingData.userId || bookingData.customerId;
          dataForError = bookingData;
        }

        if (!customerId) {
          console.error('Data:', dataForError);
          throw new Error('Customer ID not found. Available fields: ' + Object.keys(dataForError).join(', '));
        }

        // Fetch this customer's specific data
        const customerData = await fetchCustomerData(customerId);
        console.log(`Single booking customer data for ${customerId}:`, customerData);

        const participants = [userDetails.uid, customerId].sort();
        const conversationId = `conversation_${participants[0]}_${participants[1]}`;

        // Update or create conversation
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);

        const conversationData = {
          participant1: userDetails.uid,
          participant2: customerId,
          participant1Name: userDetails.businessName || userDetails.name,
          participant2Name: customerData.name,
          participant1Image: businessImage,
          participant2Image: customerData.image,
          isBusiness: true,
          lastMessage: '',
          lastMessageTime: new Date(),
          updatedAt: new Date()
        };

        if (!conversationSnap.exists()) {
          conversationData.createdAt = serverTimestamp();
        }

        batch.set(conversationRef, conversationData, { merge: true });

        // Add message to conversation
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const newMessageRef = doc(messagesRef);
        batch.set(newMessageRef, {
          text: `${locationType.charAt(0).toUpperCase() + locationType.slice(1)} location has been set for your ${userDetails.businessType === 'Taxi' ? 'tour' : 'booking'}. Location: ${locationName}`,
          createdAt: serverTimestamp(),
          uid: userDetails.uid,
          photoURL: businessImage,
          displayName: userDetails.businessName || 'Business Owner',
          recipientId: customerId,
          recipientName: customerData.name,
          recipientImage: customerData.image,
          isBusiness: true,
          type: `${locationType}_location`,
          location: {
            name: locationName,
            coordinates: coordinates
          },
          links: [{
            text: locationName,
            url: mapUrl,
            type: 'location'
          }]
        });
      }

      await batch.commit();
      console.log('Messages sent successfully to all customers with their individual images');

      return true;
    } catch (err) {
      console.error('Error sending location message:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      throw new Error(`Failed to send notification: ${err.message}`);
    }
  };

  const handleSaveSpot = async () => {
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }

    if (!locationName?.trim()) {
      setError('Please enter a location name');
      return;
    }

    try {
      // Debug logging
      console.log('Selected Booking:', selectedBooking);
      console.log('Location Name:', locationName);
      console.log('Selected Location:', selectedLocation);

      // Helper function to safely get a value or provide a default
      const safeValue = (value, defaultValue = null) => {
        return value !== undefined && value !== null && value !== '' ? value : defaultValue;
      };

      // Helper function to clean an object of undefined values
      const cleanObject = (obj) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
              const cleanedValue = cleanObject(value);
              if (Object.keys(cleanedValue).length > 0) {
                cleaned[key] = cleanedValue;
              }
            } else {
              cleaned[key] = value;
            }
          }
        }
        return cleaned;
      };

      // Ensure we have all required fields with proper validation
      const baseSpotData = {
        name: locationName.trim(),
        address: locationName.trim(),
        coordinates: {
          lat: Number(selectedLocation.lat),
          lng: Number(selectedLocation.lng)
        },
        businessId: userDetails.uid,
        createdAt: new Date(),
        businessType: safeValue(userDetails.businessType, 'Unknown'),
        bookingId: safeValue(selectedBooking?.bookingId, ''),
        vehicleDetails: safeValue(selectedBooking?.vehicleDetails, 'No Details'),
        startDate: safeValue(selectedBooking?.startDate, 'No Date'),
        endDate: safeValue(selectedBooking?.endDate, 'No Date'),
        isTour: Boolean(selectedBooking?.isTour)
      };

      // Handle group bookings safely
      if (selectedBooking?.groupBookings && Array.isArray(selectedBooking.groupBookings)) {
        baseSpotData.groupBookings = selectedBooking.groupBookings.map(booking => {
          const cleanedBooking = {
            id: safeValue(booking.id, ''),
            customerName: safeValue(booking.customerName, 'Unknown Customer'),
            customerEmail: safeValue(booking.customerEmail, 'No email provided'),
            customerPhone: safeValue(booking.customerPhone, 'No phone provided')
          };

          // Add other booking fields if they exist and are not undefined
          if (booking.persons !== undefined) cleanedBooking.persons = booking.persons;
          if (booking.totalPrice !== undefined) cleanedBooking.totalPrice = booking.totalPrice;
          if (booking.businessId !== undefined) cleanedBooking.businessId = booking.businessId;
          if (booking.isPaid !== undefined) cleanedBooking.isPaid = booking.isPaid;
          if (booking.isPrivate !== undefined) cleanedBooking.isPrivate = booking.isPrivate;
          if (booking.reservationDate !== undefined) cleanedBooking.reservationDate = booking.reservationDate;

          return cleanedBooking;
        });
      } else {
        baseSpotData.groupBookings = [];
      }

      // Clean the entire object to remove any undefined values
      const spotData = cleanObject(baseSpotData);

      // Additional validation
      if (!spotData.bookingId) {
        throw new Error('Booking ID is required but not found');
      }

      if (!spotData.businessId) {
        throw new Error('Business ID is required but not found');
      }

      // Debug logging
      console.log('Cleaned Spot Data to be saved:', spotData);

      let spotRef;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // If there's an existing spot, delete it first
          if (bookingSpot?.id) {
            await deleteDoc(doc(db, 'pickupSpots', bookingSpot.id));
            console.log('Deleted existing spot:', bookingSpot.id);
          }

          spotRef = await addDoc(collection(db, 'pickupSpots'), spotData);
          console.log('Location spot saved successfully with ID:', spotRef.id);
          break; // If successful, break the retry loop
        } catch (writeError) {
          retryCount++;
          console.error(`Attempt ${retryCount} failed:`, writeError);

          if (retryCount === maxRetries) {
            throw new Error(`Failed to save after ${maxRetries} attempts: ${writeError.message}`);
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      try {
        // Send notification using the same function for both types
        await sendPickupSpotMessage(
          spotData.bookingId,
          spotData.isTour ? null : (selectedBooking?.customerName || 'Unknown Customer'),
          spotData.name,
          spotData.coordinates,
          spotData.groupBookings || []
        );
        console.log('Notification sent successfully');
      } catch (messageError) {
        console.error('Failed to send notification:', messageError);
        console.error('Booking/Tour ID:', spotData.bookingId);
        // Don't throw here, as the spot was saved successfully
        setError('Location saved successfully, but failed to send notification to customer.');
      }

      // Update local state with the new spot
      const newSpot = {
        id: spotRef.id,
        ...spotData
      };

      setBookingSpots(prev => ({
        ...prev,
        [spotData.bookingId]: newSpot
      }));

      // Reset form state
      setLocationName('');
      setSelectedLocation(null);
      setIsAdding(false);
      setIsEditing(false);
      setSelectedBooking(null);
      setBookingSpot(null);
      setMapCenter([12.1165, -61.6790]);
      setMapZoom(11);
      setError(null); // Clear any previous errors

      // Show success message
      console.log('Location spot saved and form reset successfully');

    } catch (err) {
      console.error('Error saving location spot:', err);
      console.error('Error details:', {
        selectedBooking,
        locationName,
        selectedLocation,
        userDetails: userDetails ? { uid: userDetails.uid, businessType: userDetails.businessType } : 'undefined'
      });
      setError(`Error saving location spot: ${err.message}. Please check that all required information is available and try again.`);
    }
  };
  const handleDeleteSpot = async (spotId) => {
    try {
      await deleteDoc(doc(db, 'pickupSpots', spotId));
      fetchBookingSpot();
    } catch (err) {
      setError(err.message);
    }
  };

  const openLocationInMap = (coordinates) => {
    const { lat, lng } = coordinates;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleEditSpot = (booking, spot) => {
    console.log('Editing spot for booking:', booking);
    console.log('Current spot:', spot);

    setSelectedBooking({
      bookingId: booking.bookingId,
      customerName: booking.customerName || 'Unknown Customer',
      vehicleDetails: booking.vehicleDetails || 'No Details',
      startDate: booking.startDate || 'No Date',
      endDate: booking.endDate || 'No Date',
      isTour: booking.isTour || false,
      groupBookings: Array.isArray(booking.groupBookings)
        ? booking.groupBookings.map(b => ({
          ...b,
          customerName: b.customerName || 'Unknown Customer',
          customerEmail: b.customerEmail || 'No email provided',
          customerPhone: b.customerPhone || 'No phone provided'
        }))
        : []
    });
    setLocationName(spot.name || '');
    setSelectedLocation(spot.coordinates);
    setMapCenter([spot.coordinates.lat, spot.coordinates.lng]);
    setMapZoom(15);
    setIsEditing(true);
    setIsAdding(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {userDetails?.businessType === 'Taxi' ? 'Meetup Spots' : 'Pickup Spots'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          {userDetails?.businessType === 'Taxi'
            ? 'Manage your tour meetup locations in Grenada'
            : 'Manage your vehicle pickup locations in Grenada'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {isAdding ? (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            {isEditing ? 'Edit Meetup Spot' : 'Add Meetup Spot'}
          </h2>

          {selectedBooking && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Customer</p>
                  <p className="text-sm sm:text-base font-medium">{selectedBooking.customerName}</p>
                  {selectedBooking.groupBookings && selectedBooking.groupBookings.length > 1 && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      +{selectedBooking.groupBookings.length - 1} more customers
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Map className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Tour Details</p>
                  <p className="text-sm sm:text-base font-medium">{selectedBooking.vehicleDetails}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Tour Date</p>
                  <p className="text-sm sm:text-base font-medium">{selectedBooking.startDate}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location Name</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter location name (e.g., Maurice Bishop International Airport, Grenada)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                Please enter a clear, recognizable location name in Grenada. This will help customers find the meetup spot easily.
              </p>
            </div>

            <div style={{ height: '300px', width: '100%', position: 'relative' }} className="sm:h-[400px]">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker
                  position={selectedLocation}
                  setPosition={setSelectedLocation}
                  onLocationSelect={(lat, lng) => {
                    setSelectedLocation({ lat, lng });
                  }}
                />
              </MapContainer>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleSaveSpot}
                disabled={!selectedLocation || !locationName.trim()}
                className={`px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${selectedLocation && locationName.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isEditing ? 'Update Spot' : 'Save Spot'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                  setLocationName('');
                  setSelectedLocation(null);
                  setMapCenter([12.1165, -61.6790]);
                  setMapZoom(11);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {allBookings.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {allBookings.map((booking) => (
                <div key={booking.bookingId} className="bg-white rounded-lg shadow-md p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{booking.customerName}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{booking.vehicleDetails}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {userDetails?.businessType === 'Taxi' ? booking.startDate : `${booking.startDate} - ${booking.endDate}`}
                      </p>
                      {booking.groupBookings && booking.groupBookings.length > 1 && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Group Tour: {booking.groupBookings.length} customers
                        </p>
                      )}
                    </div>
                    {bookingSpots[booking.bookingId] ? (
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <button
                          onClick={() => openLocationInMap(bookingSpots[booking.bookingId].coordinates)}
                          className="flex items-center text-blue-500 hover:text-blue-700 text-sm sm:text-base"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm sm:text-base">{bookingSpots[booking.bookingId].name}</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
                        <button
                          onClick={() => handleEditSpot(booking, bookingSpots[booking.bookingId])}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSpot(bookingSpots[booking.bookingId].id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsAdding(true);
                          setIsEditing(false);
                        }}
                        className="flex items-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        {userDetails?.businessType === 'Taxi' ? 'Add Meetup Spot' : 'Add Pickup Spot'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600">
                {userDetails?.businessType === 'Taxi'
                  ? 'No tour reservations found.'
                  : 'No vehicle bookings found.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PickupSpots; 