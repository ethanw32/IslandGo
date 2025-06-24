import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "./config/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday' },
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' }
];

const AddTour = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tourToEdit, businessId, ownerId } = location.state || {};

  // State for form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [maxpeople, setMaxpeople] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const [tourImageFiles, setTourImageFiles] = useState([]);
  const [spots, setSpots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [scheduleStartDate, setScheduleStartDate] = useState(null);
  const [scheduleEndDate, setScheduleEndDate] = useState(null);

  // Pre-fill the form if tourToEdit exists
  useEffect(() => {
    if (tourToEdit) {
      setName(tourToEdit.name);
      setDescription(tourToEdit.description);
      setDuration(tourToEdit.duration);
      setMaxpeople(tourToEdit.maxpeople);
      setPrice(tourToEdit.price);
      setImages(tourToEdit.images || [tourToEdit.image].filter(Boolean));
      setSpots(tourToEdit.spots || []);

      // Convert dates to proper Date objects
      if (tourToEdit.availableDates) {
        const dates = tourToEdit.availableDates.map(date => {
          if (date instanceof Date) return date;
          if (date.toDate) return date.toDate();
          return new Date(date);
        }).filter(date => !isNaN(date.getTime())); // Filter out invalid dates
        setAvailableDates(dates);
      }

      setWeeklySchedule(tourToEdit.weeklySchedule || []);

      // Convert schedule dates to proper Date objects
      if (tourToEdit.scheduleStartDate) {
        const startDate = tourToEdit.scheduleStartDate instanceof Date
          ? tourToEdit.scheduleStartDate
          : new Date(tourToEdit.scheduleStartDate);
        setScheduleStartDate(!isNaN(startDate.getTime()) ? startDate : null);
      }

      if (tourToEdit.scheduleEndDate) {
        const endDate = tourToEdit.scheduleEndDate instanceof Date
          ? tourToEdit.scheduleEndDate
          : new Date(tourToEdit.scheduleEndDate);
        setScheduleEndDate(!isNaN(endDate.getTime()) ? endDate : null);
      }
    }
  }, [tourToEdit]);

  // Handle date selection
  const handleDateSelect = (date) => {
    if (!date || isNaN(date.getTime())) return;

    if (!availableDates.some(d => d.getTime() === date.getTime())) {
      setAvailableDates([...availableDates, date]);
    }
  };

  // Remove date from available dates
  const removeDate = (dateToRemove) => {
    if (!dateToRemove || isNaN(dateToRemove.getTime())) return;

    setAvailableDates(availableDates.filter(date => {
      const date1 = date instanceof Date ? date : new Date(date);
      const date2 = dateToRemove instanceof Date ? dateToRemove : new Date(dateToRemove);
      return date1.getTime() !== date2.getTime();
    }));
  };

  // Toggle day in weekly schedule
  const toggleDayInSchedule = (dayId) => {
    setWeeklySchedule(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId].sort()
    );
  };

  // Generate dates from weekly schedule
  const generateDatesFromSchedule = () => {
    if (!scheduleStartDate || !scheduleEndDate || weeklySchedule.length === 0) return;

    const dates = [];
    const currentDate = new Date(scheduleStartDate);
    const endDate = new Date(scheduleEndDate);

    while (currentDate <= endDate) {
      if (weeklySchedule.includes(currentDate.getDay())) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setAvailableDates(prev => {
      const newDates = [...prev];
      dates.forEach(date => {
        if (!newDates.some(d => {
          const date1 = d instanceof Date ? d : new Date(d);
          const date2 = date instanceof Date ? date : new Date(date);
          return date1.getTime() === date2.getTime();
        })) {
          newDates.push(date);
        }
      });
      return newDates;
    });
  };

  // Handle file input change for multiple images
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      alert("Please upload only valid image files.");
      return;
    }

    setTourImageFiles(prevFiles => [...prevFiles, ...validFiles]);

    // Convert files to base64 for preview
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prevImages => [...prevImages, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image by index
  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setTourImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0 && !tourToEdit) {
      alert("Please upload at least one image for the tour.");
      return;
    }

    if (!businessId) {
      alert("Error: No business ID found.");
      return;
    }

    if (spots.length === 0) {
      alert("Please add at least one spot to the tour.");
      return;
    }

    if (availableDates.length === 0) {
      alert("Please select at least one available date for the tour.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        image: businessImage,
        name: businessName,
      } = location.state || {};

      // Ensure all dates are proper Date objects
      const processedDates = availableDates.map(date => {
        if (date instanceof Date) return date;
        if (date.toDate) return date.toDate();
        return new Date(date);
      }).filter(date => !isNaN(date.getTime()));

      const tourData = {
        name,
        description,
        duration,
        maxpeople,
        price,
        images,
        spots,
        businessId,
        ownerId,
        availableDates: processedDates,
        weeklySchedule,
        scheduleStartDate: scheduleStartDate ? new Date(scheduleStartDate) : null,
        scheduleEndDate: scheduleEndDate ? new Date(scheduleEndDate) : null,
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

  // Add new spot
  const addSpot = () => {
    setSpots([...spots, { name: "", description: "" }]);
  };

  // Remove spot by index
  const removeSpot = (index) => {
    const newSpots = [...spots];
    newSpots.splice(index, 1);
    setSpots(newSpots);
  };

  // Update spot
  const updateSpot = (index, field, value) => {
    const newSpots = [...spots];
    newSpots[index][field] = value;
    setSpots(newSpots);
  };

  return (
    <div className="min-h-screen bg-dark text-dark p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-dark">
        {tourToEdit ? "Edit Tour" : "Add New Tour"}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-dark text-dark p-6 rounded-lg shadow-lg">
        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Tour Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 border-black py-2 border bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Weekly Schedule Field */}
        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Weekly Schedule</label>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDayInSchedule(day.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${weeklySchedule.includes(day.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-dark text-dark border  border-black'
                    }`}
                >
                  {day.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Start Date</label>
                <DatePicker
                  selected={scheduleStartDate}
                  onChange={date => setScheduleStartDate(date)}
                  minDate={new Date()}
                  className="w-full px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select start date"
                  dateFormat="MMMM d, yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">End Date</label>
                <DatePicker
                  selected={scheduleEndDate}
                  onChange={date => setScheduleEndDate(date)}
                  minDate={scheduleStartDate || new Date()}
                  className="w-full px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select end date"
                  dateFormat="MMMM d, yyyy"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={generateDatesFromSchedule}
              disabled={!scheduleStartDate || !scheduleEndDate || weeklySchedule.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Generate Dates from Schedule
            </button>
          </div>
        </div>

        {/* Specific Dates Field */}
        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Additional Specific Dates</label>
          <div className="flex flex-col space-y-4">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateSelect}
              minDate={new Date()}
              className="w-full px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select specific dates"
              dateFormat="MMMM d, yyyy"
            />

            {/* Selected Dates List */}
            {availableDates.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold text-dark mb-2">Selected Dates:</h4>
                <div className="flex flex-wrap gap-2">
                  {availableDates.map((date, index) => {
                    // Ensure we have a valid Date object
                    const dateObj = date instanceof Date ? date : new Date(date);
                    return (
                      <div
                        key={index}
                        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{dateObj.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                        <button
                          type="button"
                          onClick={() => removeDate(date)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Tour duration/hours</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-56 px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Description</label>
          <textarea
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Max number of people</label>
          <input
            type="number"
            value={maxpeople}
            onChange={(e) => setMaxpeople(e.target.value)}
            className="w-56 px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-56 px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
            required
          />
        </div>

        {/* Multiple Image Upload Field */}
        <div className="mb-4">
          <label className="block text-dark text-sm font-bold mb-2">Tour Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full px-3 py-2 bg-dark text-dark border-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-dark mb-2">Image Previews:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spots Field */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4 ">
            <label className="block text-dark text-sm font-bold">Tour Spots</label>
            <button
              type="button"
              onClick={addSpot}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Add Spot
            </button>
          </div>

          {spots.length === 0 ? (
            <div className="text-center py-8 text-dark">
              <p>No spots added yet. Click "Add Spot" to get started.</p>
            </div>
          ) : (
            spots.map((spot, index) => (
              <div key={index} className="mb-4 p-4 border rounded-lg bg-dark text-dark ">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium">Spot {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeSpot(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Spot Name</label>
                  <input
                    type="text"
                    value={spot.name}
                    onChange={(e) => updateSpot(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border-black border bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter spot name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={spot.description}
                    onChange={(e) => updateSpot(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border-black border bg-dark text-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                    placeholder="Describe this spot"
                    required
                  />
                </div>
              </div>
            ))
          )}
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