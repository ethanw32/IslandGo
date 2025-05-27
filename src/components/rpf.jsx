import React, { useEffect, useState } from "react";
import { db } from "./config/firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
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
    id: businessId,
  } = location.state || {};

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser && ownerId) {
      setIsOwner(currentUser.uid === ownerId);
    }
  }, [currentUser, ownerId]);

  useEffect(() => {
    if (ownerId) {
      const rentalsRef = collection(db, "rentals");
      const q = query(rentalsRef, where("ownerId", "==", ownerId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const vehicleList = [];
        querySnapshot.forEach((doc) => {
          vehicleList.push({ id: doc.id, ...doc.data() });
        });
        setVehicles(vehicleList);
      });

      return () => unsubscribe();
    }
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

  const handleEditVehicle = (vehicle) => {
    navigate("/bfront", { state: { businessId, ownerId, businessImage, businessName, vehicleToEdit: vehicle } });
  };

  const handleBookVehicle = (vehicle) => {
    navigate('/book', {
      state: {
        vehicle,
        businessId,
        businessName,
        businessImage,
        ownerId
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full relative pb-10">
      <div className="flex flex-row py-4 sm:py-8 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="flex flex-row items-center flex-1">
          {businessImage && (
            <Link to={`/profile?businessId=${businessId}`} className="transition-transform hover:scale-105 shrink-0">
              <img
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                src={businessImage}
                alt={businessName}
              />
            </Link>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold ml-4 sm:ml-6 lg:ml-10 text-gray-800 truncate">{businessName}</h1>
        </div>

        <div className="flex items-center justify-end ml-4">
          {isOwner && (
            <button
              onClick={() => navigate("/bfront", { state: { businessId, ownerId, businessImage, businessName } })}
              className="bg-blue-500 text-white text-xl sm:text-2xl px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              +
            </button>
          )}
        </div>
      </div>

    <div className="sm:mt-6 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-12 lg:gap-y-0">
            {vehicles.map((vehicle) => (
              <CardContainer className="inter-var w-full h-full" key={vehicle.id}>
                <CardBody className="bg-black relative group/card w-full min-w-[300px] max-w-[400px] h-auto rounded-xl p-6 border border-black/[0.1] dark:border-white/[0.2] flex flex-col">
                  <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-white"
                  >
                    {vehicle.vehicle.model}
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-white text-sm max-w-sm mt-1"
                  >
                    {vehicle.vehicle.class}
                  </CardItem>
                  <CardItem
                    translateZ="100"
                    rotateX={5}
                    rotateZ={-1}
                    className="w-full mt-4"
                  >
                    <img
                      src={vehicle.vehicle.image || "/default-image.jpg"}
                      height="1000"
                      width="1000"
                      className="h-40 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                      alt={vehicle.vehicle.model}
                    />
                  </CardItem>
                  
                  <div className="mt-4 space-y-1">
                    <CardItem className="flex text-white justify-between text-sm">
                      <span className="">Capacity:</span>
                      <span>{vehicle.vehicle.capacity}</span>
                    </CardItem>
                    <CardItem className="flex text-white justify-between text-sm">
                      <span className="">Color:</span>
                      <span>{vehicle.vehicle.color}</span>
                    </CardItem>
                    <CardItem className="flex text-white justify-between text-sm">
                      <span className="">Mileage:</span>
                      <span>{vehicle.vehicle.mileage}</span>
                    </CardItem>
                  </div>

                  <CardItem
                    className={`text-lg font-bold mt-3 ml-auto text-right ${
                      vehicle.vehicle.availability === "Available"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {vehicle.vehicle.availability}
                  </CardItem>

                  <div className="flex justify-between items-center mt-6">
                    {isOwner ? (
                      <>
                        <CardItem
                          translateZ={20}
                          as="button"
                          onClick={() => handleEditVehicle(vehicle)}
                          className="px-4 py-2 rounded-xl text-xs font-normal bg-blue-500 text-white hover:bg-blue-600 transition-all"
                        >
                          Edit
                        </CardItem>
                        <CardItem
                          translateZ={20}
                          as="button"
                          onClick={() => handleOpenModal(vehicle.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                        >
                          Delete
                        </CardItem>
                      </>
                    ) : (
<button
  onClick={() => handleBookVehicle(vehicle)}
  disabled={vehicle.vehicle.availability !== "Available"}
  className={`w-full px-4 py-2 rounded-xl text-xs font-bold relative overflow-hidden ${
    vehicle.vehicle.availability === "Available"
      ? "bg-green-500 hover:bg-green-600 text-white group"
      : "bg-gray-400 text-white cursor-not-allowed"
  } transition-all duration-300`}
>
  {/* Text label */}
  <span className={`inline-block ${
    vehicle.vehicle.availability === "Available" 
      ? "group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300"
      : ""
  }`}>
    {vehicle.vehicle.availability === "Available" ? "Book Now" : "Not Available"}
  </span>

  {/* PNG icon - only for available vehicles */}
  {vehicle.vehicle.availability === "Available" && (
    <span className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">

      <img 
        src="/images/car.png"  // Update this path to your PNG file
        alt="Car" 
        className="w-5 h-5 object-contain invert" // invert makes white icon
      />
    </span>
  )}
</button>
                    )}
                  </div>
                </CardBody>
              </CardContainer>
            ))}
          </div>
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