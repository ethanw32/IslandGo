import React from 'react';
import { Autocomplete } from '@react-google-maps/api';

const LocationInput = ({ value, onChange, placeholder, label, required = false }) => {
  const [autocomplete, setAutocomplete] = React.useState(null);

  const onLoad = React.useCallback((autocomplete) => {
    setAutocomplete(autocomplete);
  }, []);

  const onPlaceChanged = React.useCallback(() => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.formatted_address) {
        // Extract the location name from place details
        let locationName = place.name;

        if (!locationName) {
          // Try to get name from address components if place.name is not available
          const addressComponents = place.address_components || [];
          for (const component of addressComponents) {
            if (component.types.includes('point_of_interest') ||
              component.types.includes('establishment') ||
              component.types.includes('premise')) {
              locationName = component.long_name;
              break;
            }
          }
          // If still no name, use the first part of formatted address
          if (!locationName) {
            locationName = place.formatted_address.split(',')[0];
          }
        }

        onChange({
          formatted_address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          locationName: locationName.trim() // Add the location name to the data
        });
      }
    }
  }, [autocomplete, onChange]);

  // Extract formatted_address from value object if it exists
  const displayValue = typeof value === 'object' ? value.formatted_address : value;

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
      </label>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        restrictions={{ country: "gd" }} // Restrict to Grenada
      >
        <input
          type="text"
          value={displayValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          required={required}
        />
      </Autocomplete>
    </div>
  );
};

export default LocationInput; 