import React, { useState } from "react";

const AddEditListing = ({ listingId, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    availability: "",
    image: null,
  });

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
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        {listingId ? "Edit Listing" : "Add New Listing"}
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
  );
};

export default AddEditListing;
