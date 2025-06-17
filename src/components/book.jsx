import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './config/firebase';
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function BookVehicle() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const { vehicle, businessId, businessName, businessImage, ownerId } = location.state || {};

  // Use ownerId as businessId if businessId is not available
  const hostId = businessId || ownerId;

  // Initialize dates with correct time handling
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Set initial dates with local time (no timezone conversion)
  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(tomorrow);
  const [totalPrice, setTotalPrice] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper function to format date for datetime-local input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to parse datetime-local input
  const parseInputDate = (inputValue) => {
    const [datePart, timePart] = inputValue.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  useEffect(() => {
    if (vehicle?.vehicle?.price && startDate && endDate) {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const calculatedPrice = days * vehicle.vehicle.price;
      setTotalPrice(calculatedPrice);
    }
  }, [startDate, endDate, vehicle]);

  const handleStartDateChange = (e) => {
    const newDate = parseInputDate(e.target.value);
    setStartDate(newDate);
    // If new start date is after end date, adjust end date
    if (newDate > endDate) {
      const newEndDate = new Date(newDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newDate = parseInputDate(e.target.value);
    if (newDate >= startDate) {
      setEndDate(newDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!currentUser) {
      setBookingError('Please sign in to book a vehicle');
      return;
    }

    if (!vehicle || !vehicle.id) {
      setBookingError('Invalid vehicle information');
      return;
    }

    // Enhanced business data validation
    if (!hostId) {
      console.error('Missing hostId:', {
        hostId,
        businessId,
        ownerId,
        locationState: location.state
      });
      setBookingError('Missing business ID. Please try again or contact support.');
      return;
    }

    if (!businessName) {
      console.error('Missing businessName:', {
        businessName,
        locationState: location.state
      });
      setBookingError('Missing business name. Please try again or contact support.');
      return;
    }

    try {
      // Validate dates
      if (startDate >= endDate) {
        setBookingError('Return date must be after pickup date');
        return;
      }

      // Create booking document
      const bookingRef = doc(collection(db, 'bookings'));
      const bookingData = {
        vehicleId: vehicle.id,
        vehicleDetails: {
          brand: vehicle.vehicle.brand,
          model: vehicle.vehicle.model,
          transmission: vehicle.vehicle.transmission,
          price: vehicle.vehicle.price,
          images: vehicle.vehicle.images || [vehicle.vehicle.image],
          color: vehicle.vehicle.color || 'Not specified',
          capacity: vehicle.vehicle.capacity || 'Not specified'
        },
        hostId: hostId,
        businessId: hostId,
        businessName: businessName || 'Unknown Business',
        businessImage: businessImage || '',
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        customerName: currentUser.displayName || currentUser.email.split('@')[0],
        startDate: serverTimestamp(),
        endDate: serverTimestamp(),
        totalPrice,
        pricePerDay: vehicle.vehicle.price,
        specialRequests: specialRequests || '',
        status: 'pending',
        isPaid: false,
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        refundRequested: false
      };

      // Validate all required fields
      const requiredFields = [
        'vehicleId',
        'vehicleDetails',
        'hostId',
        'businessId',
        'businessName',
        'customerId',
        'startDate',
        'endDate',
        'totalPrice',
        'pricePerDay'
      ];

      const missingFields = requiredFields.filter(field => !bookingData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      await setDoc(bookingRef, bookingData);

      // Update vehicle availability
      const vehicleRef = doc(db, 'rentals', vehicle.id);
      await updateDoc(vehicleRef, {
        'vehicle.availability': 'Booked',
      });

      setBookingSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error('Detailed booking error:', error);
      setBookingError(`Failed to create booking: ${error.message}`);
    }
  };

  const nextImage = () => {
    if (vehicle?.vehicle?.images) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === vehicle.vehicle.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (vehicle?.vehicle?.images) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? vehicle.vehicle.images.length - 1 : prevIndex - 1
      );
    }
  };

  if (!vehicle) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vehicle Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Booking Confirmed!</h2>
          <p>Your booking for {vehicle.vehicle.model} has been confirmed.</p>
          <p>Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Book {vehicle.vehicle.model}</h1>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="relative">
                <img
                  src={vehicle.vehicle.images?.[currentImageIndex] || vehicle.vehicle.image || '/default-car.jpg'}
                  alt={vehicle.vehicle.model}
                  className="w-full h-48 sm:h-64 object-cover rounded-md mb-4"
                />
                {vehicle.vehicle.images && vehicle.vehicle.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                    >
                      →
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                      {currentImageIndex + 1} / {vehicle.vehicle.images.length}
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600">Brand:</p>
                  <p className="font-medium">{vehicle.vehicle.brand}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transmission:</p>
                  <p className="font-medium">{vehicle.vehicle.transmission}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xl font-bold text-blue-600">
                  ${vehicle.vehicle.price} <span className="text-sm font-normal text-gray-600">per day</span>
                </p>
              </div>
            </div>
          </div>

          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Pickup Date</label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(startDate)}
                    onChange={handleStartDateChange}
                    min={formatDateForInput(new Date())}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Return Date</label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(endDate)}
                    onChange={handleEndDateChange}
                    min={formatDateForInput(startDate)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Special Requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  />
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Price:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {bookingError && <div className="mb-4 text-red-500">{bookingError}</div>}

                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-md text-white font-semibold ${'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                  Confirm Booking
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookVehicle;