import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "./config/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { useLoadScript } from '@react-google-maps/api';
import LocationInput from './LocationInput';
import TourMap from './TourMap';

// Define libraries array outside component to prevent recreation on each render
const libraries = ["places"];

const AddTour = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourToEdit, businessId, ownerId } = location.state || {};

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State for form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [tourImageFile, setTourImageFile] = useState(null);
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [spots, setSpots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the form if tourToEdit exists
  useEffect(() => {
    if (tourToEdit) {
      setName(tourToEdit.name);
      setDescription(tourToEdit.description);
      setImage(tourToEdit.image);
      setStartLocation(tourToEdit.startLocation || "");
      setEndLocation(tourToEdit.endLocation || "");
      setWaypoints(tourToEdit.waypoints || []);
      setSpots(tourToEdit.spots || []);
    }
  }, [tourToEdit]);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setTourImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid image file.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image && !tourToEdit) {
      alert("Please upload an image for the tour.");
      return;
    }

    if (!businessId) {
      alert("Error: No business ID found.");
      return;
    }

    if (!startLocation || !endLocation) {
      alert("Please provide both start and end locations.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        image: businessImage,
        name: businessName,
      } = location.state || {};

      // Clean up waypoints to only include necessary data
      const cleanWaypoints = waypoints.map(wp => {
        if (typeof wp === 'object') {
          return {
            formatted_address: wp.formatted_address,
            lat: wp.lat,
            lng: wp.lng
          };
        }
        return wp;
      }).filter(wp => wp);

      // Create spots array with locations and clean data
      const spotsWithLocations = spots.map((spot, index) => ({
        name: spot.name,
        description: spot.description,
        location: cleanWaypoints[index] || null
      }));

      // Clean up start and end locations
      const cleanStartLocation = typeof startLocation === 'object' ? {
        formatted_address: startLocation.formatted_address,
        lat: startLocation.lat,
        lng: startLocation.lng
      } : startLocation;

      const cleanEndLocation = typeof endLocation === 'object' ? {
        formatted_address: endLocation.formatted_address,
        lat: endLocation.lat,
        lng: endLocation.lng
      } : endLocation;

      const tourData = {
        name,
        description,
        image,
        startLocation: cleanStartLocation,
        endLocation: cleanEndLocation,
        waypoints: cleanWaypoints,
        spots: spotsWithLocations,
        businessId,
        ownerId,
      };

      if (tourToEdit) {
        const tourRef = doc(db, "tours", tourToEdit.id);
        await updateDoc(tourRef, tourData);
        console.log("Tour updated successfully!");
      } else {
        const newTourRef = doc(collection(db, "tours"));
        await setDoc(newTourRef, tourData);
        console.log("Tour added successfully!");
      }

      navigate("/bpf", { state: { businessId, ownerId, image: businessImage, name: businessName } });
    } catch (error) {
      console.error("Error saving tour: ", error);
      alert("Error saving tour. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSpot = (index) => {
    const newSpots = [...spots];
    newSpots.splice(index, 1);
    setSpots(newSpots);
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">Failed to load Google Maps. Please check your internet connection and try again.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        {tourToEdit ? "Edit Tour" : "Add New Tour"}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tour Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Image Upload Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tour Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={!tourToEdit}
          />
          {(image || (tourToEdit && tourToEdit.image)) && (
            <div className="mt-2">
              <img src={image || tourToEdit.image} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
            </div>
          )}
        </div>

        {/* Route Location Fields */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Route Details</h3>

          {/* Start Location */}
          <LocationInput
            label="Start Location"
            value={startLocation}
            onChange={setStartLocation}
            placeholder="Enter start location"
            required
          />

          {/* End Location */}
          <LocationInput
            label="End Location"
            value={endLocation}
            onChange={setEndLocation}
            placeholder="Enter end location"
            required
          />

          {/* Preview Map */}
          {startLocation && endLocation && (
            <div className="mt-4 mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-2">Route Preview</h4>
              <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300">
                <TourMap
                  startLocation={startLocation}
                  endLocation={endLocation}
                  waypoints={waypoints.filter(wp => wp)}
                />
              </div>
            </div>
          )}

          {/* Waypoints */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">Waypoints</label>
              <button
                type="button"
                onClick={() => {
                  setWaypoints([...waypoints, ""]);
                  setSpots([...spots, { name: "", description: "" }]);
                }}
                className="text-blue-500 text-sm hover:underline"
              >
                Add Waypoint
              </button>
            </div>
            {waypoints.map((waypoint, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <LocationInput
                  value={waypoint}
                  onChange={(value) => {
                    const newWaypoints = [...waypoints];
                    newWaypoints[index] = value;
                    setWaypoints(newWaypoints);

                    // Update the corresponding spot's name with the location name
                    const newSpots = [...spots];
                    if (newSpots[index]) {
                      if (typeof value === 'object') {
                        newSpots[index].name = value.locationName;
                      } else {
                        newSpots[index].name = value;
                      }
                      setSpots(newSpots);
                    }
                  }}
                  placeholder={`Waypoint ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newWaypoints = [...waypoints];
                    newWaypoints.splice(index, 1);
                    setWaypoints(newWaypoints);

                    // Remove the corresponding spot
                    const newSpots = [...spots];
                    newSpots.splice(index, 1);
                    setSpots(newSpots);
                  }}
                  className="px-3 py-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Spots Field */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 text-sm font-bold">Spots</label>
          </div>
          {spots.map((spot, index) => (
            <div key={index} className="mb-4 p-3 border rounded-lg relative">
              <div className="text-gray-700 font-medium mb-2">
                {spot.name || `Waypoint ${index + 1}`}
              </div>
              <input
                type="text"
                value={spot.description}
                onChange={(e) => {
                  const newSpots = [...spots];
                  newSpots[index].description = e.target.value;
                  setSpots(newSpots);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                placeholder="Spot Description"
                required
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            tourToEdit ? "Update Tour" : "Add Tour"
          )}
        </button>
      </form>
    </div>
  );
};

export default AddTour;