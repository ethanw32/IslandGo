import React, { useEffect, useState } from "react";
import { db } from "./config/firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth, } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { CardBody, CardContainer, CardItem } from "../components/ui/3d-card-hover";

function Rpf() {
  const location = useLocation();
  const [isOwner, setIsOwner] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const navigate = useNavigate();

  const {
    businessImage,
    businessName,
    ownerId,
    businessId,
  } = location.state || {};

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    console.log("RPF location state:", location.state);
    console.log("Business ID in RPF:", businessId);
    console.log("Full location state object:", JSON.stringify(location.state, null, 2));
  }, [location.state, businessId]);

  useEffect(() => {
    if (currentUser && ownerId) {
      setIsOwner(currentUser.uid === ownerId);
    }
  }, [currentUser, ownerId]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (ownerId) {
        try {
          const rentalsRef = collection(db, "rentals");
          const q = query(rentalsRef, where("ownerId", "==", ownerId));
          const querySnapshot = await getDocs(q);
          const vehicleList = [];
          querySnapshot.forEach((doc) => {
            vehicleList.push({ id: doc.id, ...doc.data() });
          });
          setVehicles(vehicleList);
        } catch (error) {
          console.error("Error fetching vehicles:", error);
        }
      }
    };

    fetchVehicles();
  }, [ownerId]);

  const handleOpenModal = (vehicleId) => {
    setVehicleToDelete(vehicleId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVehicleToDelete(null);
  };

  const handleDelete = async () => {
    if (vehicleToDelete) {
      try {
        await deleteDoc(doc(db, "rentals", vehicleToDelete));
        handleCloseModal();
      } catch (error) {
        console.error("Error deleting vehicle: ", error);
      }
    }
  };

  const handleEditVehicle = (e, vehicle) => {
    e.stopPropagation();
    navigate("/addv", { state: { businessId, ownerId, businessImage, businessName, vehicleToEdit: vehicle } });
  };

  const handleBookVehicle = (e, vehicle) => {
    e.stopPropagation();
    navigate('/vdetails', {
      state: {
        vehicle: vehicle,
        businessId: businessId,
        businessName: businessName,
        businessImage: businessImage,
        ownerId: ownerId
      }
    });
  };

  const handleChatClick = () => {
    navigate('/chat', {
      state: {
        businessId,
        businessName,
        businessImage,
        ownerId
      }
    });
  };

  const handleBusinessImageClick = () => {
    console.log("Clicking business image with ID:", businessId);
    console.log("Owner ID:", ownerId);
    console.log("Full location state when clicking:", JSON.stringify(location.state, null, 2));

    const targetBusinessId = ownerId || businessId;

    if (targetBusinessId) {
      navigate('/profile', {
        state: {
          businessId: targetBusinessId,
          businessName: businessName,
          businessImage: businessImage,
          ownerId: ownerId
        }
      });
    } else {
      console.error("No business ID or owner ID available");
      console.error("Location state:", location.state);
    }
  };

  return (
    <div className="min-h-screen w-full relative pb-10">
      <div className="flex flex-row py-4 sm:py-8 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="flex flex-row items-center flex-1">
          {businessImage && (
            <button
              onClick={handleBusinessImageClick}
              className="transition-transform hover:scale-105 shrink-0 cursor-pointer bg-transparent border-none p-0"
            >
              <img
                className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                src={businessImage}
                alt={businessName}
              />
            </button>
          )}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold ml-3 sm:ml-4 lg:ml-6 text-gray-800 truncate">{businessName}</h1>
        </div>

        <div className="flex items-center justify-end gap-3 ml-4">
          {!isOwner && (
            <button
              onClick={handleChatClick}
              className="bg-green-500 text-white p-2 sm:p-3 rounded-full hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              title="Chat with business"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => navigate("/addv", { state: { businessId, ownerId, businessImage, businessName } })}
              className="bg-blue-500 text-white text-xl sm:text-2xl px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              +
            </button>
          )}
        </div>
      </div>

      <div className="sm:mt-6 w-full px-1 sm:px-6 lg:px-8">
        {vehicles.length > 0 ? (
          <>
            {/* Mobile View */}
            <div className="sm:hidden grid grid-cols-2 gap-2 mt-4">
              {vehicles.map((vehicle) => (
                <div key={`mobile-${vehicle.id}`} className="bg-black rounded-lg p-2 flex flex-col">
                  <div className="text-xs font-bold text-white capitalize truncate">
                    {vehicle.vehicle.brand} {vehicle.vehicle.model}
                  </div>
                  <div className="mt-1">
                    <img
                      src={vehicle.vehicle.images?.[0] || vehicle.vehicle.image || "/default-image.jpg"}
                      className="h-20 w-full object-cover rounded-lg"
                      alt={vehicle.vehicle.model}
                    />
                  </div>

                  <div className="mt-1 space-y-0.5">
                    <div className="flex text-white justify-between text-[10px]">
                      <span className="text-gray-400">Transmission:</span>
                      <span className="truncate">{vehicle.vehicle.transmission}</span>
                    </div>
                    <div className="flex text-white justify-between text-[10px]">
                      <span className="text-gray-400">Fuel:</span>
                      <span className="truncate">{vehicle.vehicle.fuel}</span>
                    </div>
                    <div className="flex text-white justify-between text-[10px]">
                      <span className="text-gray-400">Price per day:</span>
                      <span>${vehicle.vehicle.price}</span>
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold mt-1 text-right ${vehicle.vehicle.availability === "Available"
                      ? "text-green-500"
                      : vehicle.vehicle.availability === "Booked"
                        ? "text-orange-500"
                        : "text-red-500"
                      }`}
                  >
                    {vehicle.vehicle.availability}
                  </div>

                  <div className="mt-2">
                    {isOwner ? (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditVehicle(e, vehicle);
                          }}
                          className="flex-1 px-1.5 py-0.5 rounded-lg text-[10px] font-normal bg-blue-500 text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(vehicle.id);
                          }}
                          className="flex-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-500 text-white"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleBookVehicle(e, vehicle)}
                        disabled={vehicle.vehicle.availability !== "Available"}
                        className={`w-full px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${vehicle.vehicle.availability === "Available"
                          ? "bg-green-500"
                          : vehicle.vehicle.availability === "Booked"
                            ? "bg-orange-500"
                            : "bg-gray-400"
                          } text-white`}
                      >
                        {vehicle.vehicle.availability === "Available"
                          ? "Book Now"
                          : vehicle.vehicle.availability === "Booked"
                            ? "Booked"
                            : "Unavailable"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {vehicles.map((vehicle) => (
                <CardContainer key={`desktop-${vehicle.id}`} className="inter-var w-full h-full">
                  <CardBody className="bg-black relative group/card w-full h-auto rounded-xl p-6 border border-black/[0.1] dark:border-white/[0.2] flex flex-col transition-transform duration-300 hover:scale-[1.02] active:scale-95 overflow-hidden">
                    <span className="absolute inset-0 bg-white opacity-0 active:opacity-10 transition duration-200 rounded-xl pointer-events-none"></span>

                    <div>
                      <CardItem translateZ="50" className="text-xl font-bold text-white capitalize">
                        {vehicle.vehicle.brand} {vehicle.vehicle.model}
                      </CardItem>
                      <CardItem translateZ="100" rotateX={5} rotateZ={-1} className="w-full mt-4 relative group">
                        <img
                          src={vehicle.vehicle.images?.[0] || vehicle.vehicle.image || "/default-image.jpg"}
                          height="1000"
                          width="1000"
                          className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                          alt={vehicle.vehicle.model}
                        />
                        {(vehicle.vehicle.images?.length > 1 || (vehicle.vehicle.images?.length === 1 && vehicle.vehicle.image)) && (
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {vehicle.vehicle.images?.length || 1} photos
                          </div>
                        )}
                      </CardItem>

                      <div className="mt-4 space-y-1">
                        <CardItem className="flex text-white justify-between text-sm">
                          <span className="text-gray-400 mr-1.5">Seats:</span>
                          <span>{vehicle.vehicle.seats}</span>
                        </CardItem>
                        <CardItem className="flex text-white justify-between text-sm">
                          <span className="text-gray-400 mr-1.5">Color:</span>
                          <span>{vehicle.vehicle.color}</span>
                        </CardItem>
                        <CardItem className="flex text-white justify-between text-sm">
                          <span className="text-gray-400 mr-1.5">Transmission:</span>
                          <span>{vehicle.vehicle.transmission}</span>
                        </CardItem>
                        <CardItem className="flex text-white justify-between text-sm">
                          <span className="text-gray-400 mr-1.5">Fuel:</span>
                          <span>{vehicle.vehicle.fuel}</span>
                        </CardItem>
                        <CardItem className="flex text-white justify-between text-sm">
                          <span className="text-gray-400 mr-1.5">Price per day:</span>
                          <span>${vehicle.vehicle.price}</span>
                        </CardItem>
                      </div>

                      <CardItem
                        className={`text-lg font-bold mt-3 w-full ml-auto text-right ${vehicle.vehicle.availability === "Available"
                          ? "text-green-500"
                          : vehicle.vehicle.availability === "Booked"
                            ? "text-orange-500"
                            : "text-red-500"
                          }`}
                      >
                        {vehicle.vehicle.availability}
                      </CardItem>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      {isOwner ? (
                        <>
                          <CardItem
                            translateZ={20}
                            as="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditVehicle(e, vehicle);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-normal bg-blue-500 text-white hover:bg-blue-600 transition-all"
                          >
                            Edit
                          </CardItem>
                          <CardItem
                            translateZ={20}
                            as="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(vehicle.id);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                          >
                            Delete
                          </CardItem>
                        </>
                      ) : (
                        <CardItem
                          translateZ={20}
                          as="button"
                          onClick={(e) => handleBookVehicle(e, vehicle)}
                          disabled={vehicle.vehicle.availability !== "Available"}
                          className={`px-4 py-2 rounded-xl w-full text-xs font-bold relative overflow-hidden group transition-all duration-300 ${vehicle.vehicle.availability === "Available"
                            ? "bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg"
                            : vehicle.vehicle.availability === "Booked"
                              ? "bg-orange-500 cursor-not-allowed"
                              : "bg-gray-400 cursor-not-allowed"
                            } text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
                        >
                          <span className="inline-block group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300">
                            {vehicle.vehicle.availability === "Available"
                              ? "Book Now"
                              : vehicle.vehicle.availability === "Booked"
                                ? "Booked"
                                : "Unavailable"}
                          </span>
                          <span className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <img src="/images/car.png" alt="Car" className="w-4 h-4 object-contain invert" />
                          </span>
                        </CardItem>
                      )}
                    </div>
                  </CardBody>
                </CardContainer>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 sm:py-12 lg:py-20">
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600">No vehicles added yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm transition-opacity z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl w-full max-w-xs sm:max-w-md transform transition-all shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Are you sure you want to delete this vehicle?</h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Delete
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-200 text-gray-800 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rpf;