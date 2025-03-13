import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddEditListing = ({ listingId, onSave }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    availability: "",
    image: null,
  });

  useEffect(() => {
    if (window.location.pathname === "/addtour") {
      setActiveTab("tours");
    } else if (window.location.pathname === "/bfront") {
      setActiveTab("rentals");
    }
  }, []);

  const handleClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      image: file,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave(formData);
    setFormData({
      name: "",
      description: "",
      price: "",
      availability: "",
      image: null,
    });

    navigate("/");
  };

  return (
    <div className="h-fit w-full pt-10 relative">
      {/* Tabs Section */}
      <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto">
        <div className="flex h-full">
          {/* Tours Tab */}
          <div
            onClick={() => handleClick("tours", "/addtour")}
            className={`w-1/2 h-full flex items-center justify-center cursor-pointer transition-all ${
              activeTab === "tours"
                ? "bg-black text-white rounded-3xl"
                : "bg-white hover:bg-gray-200 rounded-3xl"
            }`}
          >
            Tours
          </div>

          {/* Rentals Tab */}
          <div
            onClick={() => handleClick("rentals", "/bfront")}
            className={`w-1/2 h-full flex items-center justify-center cursor-pointer transition-all ${
              activeTab === "rentals"
                ? "bg-black text-white rounded-3xl"
                : "bg-white hover:bg-gray-200 rounded-3xl"
            }`}
          >
            Rentals
          </div>
        </div>
      </div>

      {/* Add/Edit Listing Form */}
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          {listingId ? "Edit Listing" : "Add New Rental"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Car Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            ></textarea>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Price (per day):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Availability:</label>
            <input
              type="text"
              name="availability"
              value={formData.availability}
              onChange={handleInputChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Upload Image:</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditListing;
