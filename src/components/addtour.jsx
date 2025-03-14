import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddTourForm = () => {
  const navigate = useNavigate();

  // State to manage form inputs
  const [tourName, setTourName] = useState('');
  const [tourDescription, setTourDescription] = useState('');
  const [tourImageFile, setTourImageFile] = useState(null); // Store the uploaded file
  const [spots, setSpots] = useState([{ name: '', description: '' }]);
  const [tourRouteEmbedLink, setTourRouteEmbedLink] = useState(''); // Store the Google Maps embed URL
  const [activeTab, setActiveTab] = useState("client");

  // Handle adding a new spot
  const handleAddSpot = () => {
    setSpots([...spots, { name: '', description: '' }]);
  };

  // Handle removing a spot
  const handleRemoveSpot = (index) => {
    const updatedSpots = spots.filter((_, i) => i !== index);
    setSpots(updatedSpots);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert the uploaded file to a base64 string for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const newTour = {
        name: tourName,
        description: tourDescription,
        image: reader.result, // Save the base64 string
        spots: spots.filter((spot) => spot.name && spot.description), // Filter out empty spots
        routeEmbedLink: tourRouteEmbedLink, // Save the embed URL
      };

      // Save the tour to localStorage
      const existingTours = JSON.parse(localStorage.getItem('tours')) || [];
      localStorage.setItem('tours', JSON.stringify([...existingTours, newTour]));

      // Navigate to the Bpfp or Bpf page
      navigate('/bpfp'); // or navigate('/bpf');
    };

    if (tourImageFile) {
      reader.readAsDataURL(tourImageFile); // Convert the file to a base64 string
    } else {
      alert('Please upload an image for the tour.');
    }
  };

  // Extract the src attribute from the iframe tag
  const extractSrcFromIframe = (iframeString) => {
    const srcRegex = /src="([^"]+)"/;
    const match = iframeString.match(srcRegex);
    return match ? match[1] : '';
  };

  // Handle changes to the embed link input
  const handleEmbedLinkChange = (e) => {
    const iframeString = e.target.value;
    const src = extractSrcFromIframe(iframeString);
    setTourRouteEmbedLink(src);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setTourImageFile(file);
    } else {
      alert('Please upload a valid image file.');
    }
  };

  const handleClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">

      <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto mb-5">
        <div className="flex h-full">
          {/* Tours Tab */}
          <div
            onClick={() => handleClick("client", "/addtour")}
            className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
              activeTab === "client"
                ? "bg-black text-white rounded-3xl"
                : "bg-white hover:bg-gray-200 rounded-3xl"
            } transition-all`}
          >
            Tours
          </div>

          {/* Rentals Tab */}
          <div
            onClick={() => handleClick("business", "/bfront")}
            className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
              activeTab === "business"
                ? "bg-black text-white rounded-3xl"
                : "bg-white hover:bg-gray-200 rounded-3xl"
            } transition-all`}
          >
            Rentals
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-5">Create a New Tour</h1>
      <form onSubmit={handleSubmit}>
        {/* Tour Name */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Tour Name</label>
          <input
            type="text"
            value={tourName}
            onChange={(e) => setTourName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Tour Description */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Tour Description</label>
          <textarea
            value={tourDescription}
            onChange={(e) => setTourDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="4"
            required
          />
        </div>

        {/* Tour Image Upload */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Tour Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          {tourImageFile && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(tourImageFile)}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Spots */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Spots</label>
          {spots.map((spot, index) => (
            <div key={index} className="mb-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Spot Name"
                  value={spot.name}
                  onChange={(e) => {
                    const updatedSpots = [...spots];
                    updatedSpots[index].name = e.target.value;
                    setSpots(updatedSpots);
                  }}
                  className="w-1/2 p-2 border border-gray-300 rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Spot Description"
                  value={spot.description}
                  onChange={(e) => {
                    const updatedSpots = [...spots];
                    updatedSpots[index].description = e.target.value;
                    setSpots(updatedSpots);
                  }}
                  className="w-1/2 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {spots.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSpot(index)}
                  className="mt-2 text-red-500 hover:text-red-700"
                >
                  Remove Spot
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddSpot}
            className="mt-2 text-blue-500 hover:text-blue-700"
          >
            + Add Another Spot
          </button>
        </div>

        {/* Tour Route Embed Link */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Tour Route Embed Link</label>
          <input
            type="text"
            value={tourRouteEmbedLink}
            onChange={handleEmbedLinkChange}
            placeholder="Paste Google Maps Embed Iframe Here"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            Go to{' '}
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google Maps
            </a>
            , create your route, click "Share" → "Embed a map" → Copy the iframe code, and paste it here.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Create Tour
        </button>
      </form>
    </div>
  );
};

export default AddTourForm;