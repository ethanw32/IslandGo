import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config/firebase"; // Firestore instance
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

const AddEditListing = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    ownerId: "",
    vehicle: {
      model: "",
      capacity: "",
      color: "",
      mileage: "",
      class: "",
      image: "",
      availability: "",
    },
  });

  const [businessData, setBusinessData] = useState(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const { businessImage, ownerId, businessName, businessId, vehicleToEdit } = location.state || {};

  useEffect(() => {
    if (currentUser) {
      // Always set the ownerId
      setFormData(prevState => ({
        ...prevState,
        ownerId: currentUser.uid,
      }));
  
      // If we have a vehicle to edit, populate the form
      if (location.state?.vehicleToEdit) {
        setFormData(prevState => ({
          ...prevState,
          vehicle: {
            model: location.state.vehicleToEdit.vehicle.model || "",
            capacity: location.state.vehicleToEdit.vehicle.capacity || "",
            color: location.state.vehicleToEdit.vehicle.color || "",
            mileage: location.state.vehicleToEdit.vehicle.mileage || "",
            class: location.state.vehicleToEdit.vehicle.class || "",
            image: location.state.vehicleToEdit.vehicle.image || "",
            availability: location.state.vehicleToEdit.vehicle.availability || "",
          }
        }));
      } else {
        // Otherwise, fetch business data for new vehicle
        const fetchBusinessData = async () => {
          try {
            const businessRef = doc(db, "businesses", currentUser.uid);
            const businessDoc = await getDoc(businessRef);
            if (businessDoc.exists()) {
              setBusinessData(businessDoc.data());
            }
          } catch (error) {
            console.error("Error fetching business data: ", error);
          }
        };
        fetchBusinessData();
      }
    }
  }, [currentUser, location.state?.vehicleToEdit]);

  const handleInputChange = (e) => {
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
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Convert to base64
      reader.onloadend = () => {
        setFormData({
          ...formData,
          vehicle: {
            ...formData.vehicle,
            image: reader.result, // Store base64 string
          },
        });
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.ownerId) {
      return;
    }
  
    try {
      if (location.state?.vehicleToEdit) {
        // Update existing vehicle
        const vehicleRef = doc(db, "rentals", location.state.vehicleToEdit.id);
        await updateDoc(vehicleRef, {
          ownerId: formData.ownerId,
          vehicle: formData.vehicle,
        });
      } else {
        // Add new vehicle
        const rentalsRef = collection(db, "rentals");
        await addDoc(rentalsRef, {
          ownerId: formData.ownerId,
          vehicle: formData.vehicle,
        });
      }
  
      navigate("/rpf", {
        state: {
          businessId,
          businessImage,
          businessName,
          ownerId
        },
      });
    } catch (error) {
      
    }
  };
  return (
    <div className="h-fit w-full pt-10 relative">
      <div className="max-w-4xl mx-auto p-5 m-5 bg-white rounded-lg shadow-lg mt-6">
        <h1 className="text-3xl font-bold mb-5">{vehicleToEdit ? "Edit Vehicle" : "Add New Vehicle"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Model:</label>
            <input
              type="text"
              name="model"
              value={formData.vehicle.model}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Availability:</label>
            <select
              name="availability"
              value={formData.vehicle.availability}
              onChange={handleInputChange}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-2">Vehicle Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.vehicle.image && (
              <div className="mt-4">
                <img
                  src={formData.vehicle.image}
                  alt="Vehicle Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vehicleToEdit ? "Update Vehicle" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditListing;
