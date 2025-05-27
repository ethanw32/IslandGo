import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

const getContainerStyle = (isPreview) => ({
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
  cursor: isPreview ? 'pointer' : 'default'
});

const defaultCenter = {
  lat: 12.1165, // Grenada's latitude
  lng: -61.6790 // Grenada's longitude
};

const defaultMapOptions = {
  gestureHandling: 'greedy', // Allows zoom without ctrl key
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: 2, // DROPDOWN_MENU
    position: 3, // TOP_RIGHT
    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
  },
  scaleControl: true,
  streetViewControl: true,
  rotateControl: true,
  fullscreenControl: true
};

const previewMapOptions = {
  ...defaultMapOptions,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  draggable: false
};

// Helper function to get location object for DirectionsService
const getLocationForDirections = (location) => {
  if (!location) return null;
  if (typeof location === 'string') {
    return location; // Google Maps API can handle address strings
  }
  if (location.lat && location.lng) {
    return { lat: parseFloat(location.lat), lng: parseFloat(location.lng) };
  }
  if (location.formatted_address) {
    return location.formatted_address;
  }
  return null;
};

const TourMap = ({ startLocation, endLocation, waypoints = [], isPreview = false }) => {
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [directionsRequested, setDirectionsRequested] = useState(false);

  useEffect(() => {
    // Reset directions when locations change
    setDirections(null);
    setDirectionsRequested(false);

    // Update center to start location if available
    const start = getLocationForDirections(startLocation);
    if (start && typeof start === 'object' && 'lat' in start && 'lng' in start) {
      setCenter(start);
    }
  }, [startLocation, endLocation]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const directionsCallback = useCallback((response) => {
    if (response !== null) {
      if (response.status === 'OK') {
        setDirections(response);
        setError(null);
      } else {
        console.error('Directions request failed:', response);
        setError('Error fetching directions');
      }
    }
    setDirectionsRequested(false);
  }, []);

  // Only request directions if we have both start and end locations
  const shouldRequestDirections = startLocation && endLocation && !directionsRequested;

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={getContainerStyle(isPreview)}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={isPreview ? previewMapOptions : defaultMapOptions}
      >
        {shouldRequestDirections && (
          <DirectionsService
            options={{
              destination: getLocationForDirections(endLocation),
              origin: getLocationForDirections(startLocation),
              waypoints: waypoints.map(location => ({
                location: getLocationForDirections(location),
                stopover: true
              })),
              travelMode: 'DRIVING'
            }}
            callback={(response) => {
              setDirectionsRequested(true);
              directionsCallback(response);
            }}
          />
        )}
        {directions && (
          <DirectionsRenderer
            options={{
              directions: directions,
              suppressMarkers: false,
              preserveViewport: false
            }}
          />
        )}
      </GoogleMap>
      {error && (
        <div className="absolute bottom-2 left-2 right-2 bg-red-50 p-2 rounded text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(TourMap); 