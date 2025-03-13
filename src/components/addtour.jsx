import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddTourForm = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("client");

  // State to manage form inputs
  const [tourName, setTourName] = useState('');
  const [tourDescription, setTourDescription] = useState('');
  const [tourImage, setTourImage] = useState('');
  const [spots, setSpots] = useState([{ name: '', description: '' }]);

  // Handle tab click
  const handleClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  // Handle adding a new spot
  const handleAddSpot = () => {
    setSpots([...spots, { name: '', description: '' }]);
  };

  // Handle removing a spot
  const handleRemoveSpot = (index) => {
    setSpots(spots.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Create a new tour object
    const newTour = {
      name: tourName,
      description: tourDescription,
      image: tourImage,
      spots: spots.filter((spot) => spot.name && spot.description), // Remove empty spots
    };

    // Save the tour to local storage (or send it to an API)
    const existingTours = JSON.parse(localStorage.getItem('tours')) || [];
    localStorage.setItem('tours', JSON.stringify([...existingTours, newTour]));

    // Navigate back to the main page
    navigate('/');
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Client and Business Tabs */}
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

      {/* Form Section */}
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

        {/* Tour Image URL */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Tour Image URL</label>
          <input
            type="url"
            value={tourImage}
            onChange={(e) => setTourImage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Spots Section */}
        <div className="mb-5">
          <label className="block text-lg font-medium mb-2">Spots</label>
          {spots.map((spot, index) => (
            <div key={index} className="flex gap-4 mb-4 items-center">
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
              {spots.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSpot(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          {/* Add Another Spot Button */}
          <button
            type="button"
            onClick={handleAddSpot}
            className="mt-2 text-blue-500 hover:text-blue-700"
          >
            + Add Another Spot
          </button>
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
