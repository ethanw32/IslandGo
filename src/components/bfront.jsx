import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddEditListing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");

  // Default companies (you can fetch this from localStorage or a backend)
  const defaultCompanies = [
    {
      id: 1,
      name: "Drive Grenada",
      imageUrl: "images/Drive.png",
      address: "Grand Anse, St. George's",
      phone: "+1 (473) 421-3333",
      email: "contact@drivegrenada.com",
      operatingHours: "Open 24 hours",
      vehicles: [
        {
          id: 1,
          image: "images/rental car.png",
          model: "Toyota Camry",
          capacity: "28 Miles per gallon",
          color: "Silver",
          mileage: "50000m",
          class: "Sedan",
        },
        {
          id: 2,
          image: "images/jeep.jpg",
          model: "Jeep Wrangler",
          capacity: "20 Miles per gallon",
          color: "Red",
          mileage: "15000m",
          class: "SUV",
        },
      ],
    },
    {
      id: 2,
      name: "On point Rental",
      imageUrl: "images/onpoint.jpg",
      address: "Lance Aux Epines, St George's, Grenada",
      phone: "+1 (473) 534-3900",
      email: "onpointautorentals.com",
      operatingHours: "Open 24 hours",
      vehicles: [
        {
          id: 3,
          image: "images/toyota.png",
          model: "Toyota Sienna",
          capacity: "36 Miles per gallon",
          color: "Silver",
          mileage: "100000m",
          class: "Van",
        },
      ],
    },
  ];

  // State for form data
  const [formData, setFormData] = useState({
    companyId: "", // Selected company ID
    vehicle: {
      model: "",
      capacity: "",
      color: "",
      mileage: "",
      class: "",
      image: "",
    },
  });

  // Fetch companies from localStorage or use default
  const [companies, setCompanies] = useState(() => {
    const storedCompanies = JSON.parse(localStorage.getItem("companies")) || defaultCompanies;
    return storedCompanies;
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

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      vehicle: {
        ...formData.vehicle,
        [name]: value,
      },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      vehicle: {
        ...formData.vehicle,
        image: URL.createObjectURL(file), // Store the image URL
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Find the selected company
    const selectedCompany = companies.find(
      (company) => company.id === parseInt(formData.companyId)
    );

    if (selectedCompany) {
      // Create a new vehicle object
      const newVehicle = {
        id: Date.now(), // Generate a unique ID
        ...formData.vehicle,
      };

      // Add the new vehicle to the selected company
      selectedCompany.vehicles.push(newVehicle);

      // Update the companies list
      const updatedCompanies = companies.map((company) =>
        company.id === selectedCompany.id ? selectedCompany : company
      );

      // Save the updated companies to localStorage
      localStorage.setItem("companies", JSON.stringify(updatedCompanies));

      // Reset the form
      setFormData({
        companyId: "",
        vehicle: {
          model: "",
          capacity: "",
          color: "",
          mileage: "",
          class: "",
          image: "",
        },
      });

      // Navigate back to the RPF page
      navigate("/rpf");
    }
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

      {/* Add Vehicle Form */}
      <div className="max-w-4xl mx-auto p-5 m-5 bg-white rounded-lg shadow-lg mt-6">
        <h1 className="text-3xl font-bold mb-5">Add New Vehicle</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Selection */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Select Company:</label>
            <select
              name="companyId"
              value={formData.companyId}
              onChange={handleInputChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Details */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Model:</label>
            <input
              type="text"
              name="model"
              value={formData.vehicle.model}
              onChange={handleVehicleChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Capacity:</label>
            <input
              type="text"
              name="capacity"
              value={formData.vehicle.capacity}
              onChange={handleVehicleChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Color:</label>
            <input
              type="text"
              name="color"
              value={formData.vehicle.color}
              onChange={handleVehicleChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Mileage:</label>
            <input
              type="text"
              name="mileage"
              value={formData.vehicle.mileage}
              onChange={handleVehicleChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Class:</label>
            <input
              type="text"
              name="class"
              value={formData.vehicle.class}
              onChange={handleVehicleChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Vehicle Image:</label>
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
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditListing;