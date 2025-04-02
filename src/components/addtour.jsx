import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "./config/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";

const AddTour = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourToEdit, businessId, ownerId } = location.state || {};

  // State for form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(""); 
  const [tourImageFile, setTourImageFile] = useState(null);
  const [routeEmbedLink, setRouteEmbedLink] = useState("");
  const [spots, setSpots] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMapInstructions, setShowMapInstructions] = useState(false);

  // Pre-fill the form if tourToEdit exists
  useEffect(() => {
    if (tourToEdit) {
      setName(tourToEdit.name);
      setDescription(tourToEdit.description);
      setImage(tourToEdit.image);
      setRouteEmbedLink(tourToEdit.routeEmbedLink);
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

  // Extract `src` from an iframe string
  const extractSrcFromIframe = (iframeString) => {
    const srcRegex = /src="([^"]+)"/;
    const match = iframeString.match(srcRegex);
    return match ? match[1] : "";
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

    setIsUploading(true);

    try {
      const src = extractSrcFromIframe(routeEmbedLink);
      const decodedRouteEmbedLink = decodeURIComponent(src || routeEmbedLink);

      const {
        image: businessImage,
        name: businessName,
      } = location.state || {};

      const tourData = {
        name,
        description,
        image,
        routeEmbedLink: decodedRouteEmbedLink,
        spots,
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
    } finally {
      setIsUploading(false);
    }
  };

  const removeSpot = (index) => {
    const newSpots = [...spots];
    newSpots.splice(index, 1);
    setSpots(newSpots);
  };

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

        {/* Route Embed Link Field */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label className="block text-gray-700 text-sm font-bold mb-2">Route Embed Link</label>
            <button 
              type="button" 
              onClick={() => setShowMapInstructions(!showMapInstructions)}
              className="text-blue-500 text-sm hover:underline"
            >
              {showMapInstructions ? "Hide Instructions" : "How to get this?"}
            </button>
          </div>
          
          {showMapInstructions && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
              <p className="font-bold mb-2">How to get the embed link from Google Maps:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to Google Maps and create your route</li>
                <li>Click the three-dot menu next to the route name</li>
                <li>Select "Share or embed map"</li>
                <li>Choose the "Embed map" tab</li>
                <li>Copy the entire iframe code (starts with &lt;iframe)</li>
                <li>Paste it in the field below</li>
              </ol>
            </div>
          )}
          
          <input
            type="text"
            value={routeEmbedLink}
            onChange={(e) => setRouteEmbedLink(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste iframe or direct URL"
            required
          />
        </div>

        {/* Spots Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Spots</label>
          {spots.map((spot, index) => (
            <div key={index} className="mb-4 p-3 border rounded-lg relative">
              <button
                type="button"
                onClick={() => removeSpot(index)}
                className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                title="Remove spot"
              >
                ×
              </button>
              <input
                type="text"
                value={spot.name}
                onChange={(e) => {
                  const newSpots = [...spots];
                  newSpots[index].name = e.target.value;
                  setSpots(newSpots);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Spot Name"
                required
              />
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
          <button
            type="button"
            onClick={() => setSpots([...spots, { name: "", description: "" }])}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Spot
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : tourToEdit ? "Update Tour" : "Add Tour"}
        </button>
      </form>
    </div>
  );
};

export default AddTour;