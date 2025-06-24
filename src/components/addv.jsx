import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config/firebase"; // Firestore instance
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

// Add image compression function
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with reduced quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
    };
  });
};

const AddEditListing = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    ownerId: "",
    vehicle: {
      model: "",
      seats: "",
      transmission: "",
      fuel: "",
      color: "",
      mileage: "",
      brand: "",
      price: "",
      images: [],
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
            seats: location.state.vehicleToEdit.vehicle.seats || "",
            transmission: location.state.vehicleToEdit.vehicle.transmission || "",
            fuel: location.state.vehicleToEdit.vehicle.fuel || "",
            color: location.state.vehicleToEdit.vehicle.color || "",
            mileage: location.state.vehicleToEdit.vehicle.mileage || "",
            brand: location.state.vehicleToEdit.vehicle.brand || "",
            price: location.state.vehicleToEdit.vehicle.price || "",
            images: location.state.vehicleToEdit.vehicle.images || [],
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

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        const compressedImages = await Promise.all(
          files.map(file => compressImage(file))
        );

        setFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            images: [...prev.vehicle.images, ...compressedImages]
          }
        }));
      } catch (error) {
        console.error('Error compressing images:', error);
        toast.error('Error processing images. Please try again.');
      }
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        images: prev.vehicle.images.filter((_, index) => index !== indexToRemove)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ownerId) {
      toast.error("Owner ID is missing");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Saving vehicle data...");

    try {
      if (location.state?.vehicleToEdit) {
        // Update existing vehicle
        const vehicleRef = doc(db, "rentals", location.state.vehicleToEdit.id);
        await updateDoc(vehicleRef, {
          ownerId: formData.ownerId,
          vehicle: formData.vehicle,
        });
        toast.dismiss(loadingToast);
        toast.success("Vehicle updated successfully!");
      } else {
        // Add new vehicle
        const rentalsRef = collection(db, "rentals");
        await addDoc(rentalsRef, {
          ownerId: formData.ownerId,
          vehicle: formData.vehicle,
        });
        toast.dismiss(loadingToast);
        toast.success("Vehicle added successfully!");
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
      console.error("Error saving vehicle: ", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to save vehicle. Please try again.");
    }
  };

  const handleReservation = () => {
    if (!currentUser) {
      toast.error("Please login to reserve a tour");
      navigate("/login");
      return;
    }
    // ...
  };

  const confirmReservation = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to reserve a tour");
      navigate("/login");
      return;
    }
    // ...
  };

  return (
    <div className="h-fit w-full pt-10 relative">
      <div className="max-w-4xl mx-auto p-5 m-5 bg-dark text-dark rounded-lg shadow-lg mt-6">
        <h1 className="text-3xl font-bold mb-5">{vehicleToEdit ? "Edit Vehicle" : "Add New Vehicle"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="font-medium mb-2">Model:</label>
            <input
              type="text"
              name="model"
              value={formData.vehicle.model}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Seats:</label>
            <input
              type="text"
              name="seats"
              value={formData.vehicle.seats}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Transmission:</label>
            <select
              name="transmission"
              value={formData.vehicle.transmission}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Fuel:</label>
            <select
              name="fuel"
              value={formData.vehicle.fuel}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Diesel">Diesel</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Electric">Electric</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Color:</label>
            <input
              type="text"
              name="color"
              value={formData.vehicle.color}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-darkfont-medium mb-2">Mileage:</label>
            <input
              type="text"
              name="mileage"
              value={formData.vehicle.mileage}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Brand:</label>
            <input
              type="text"
              name="brand"
              value={formData.vehicle.brand}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Price per day:</label>
            <input
              type="number"
              name="price"
              value={formData.vehicle.price}
              onChange={handleInputChange}
              required
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Availability:</label>
            <select
              name="availability"
              value={formData.vehicle.availability}
              onChange={handleInputChange}
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-dark font-medium mb-2">Vehicle Images:</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="p-3 border border-black bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.vehicle.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.vehicle.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Vehicle Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
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