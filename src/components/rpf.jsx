import React, { useEffect, useState } from "react";
import { db } from "./config/firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";

function Rpf() {
  const location = useLocation();
  const [isOwner, setIsOwner] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const navigate = useNavigate();

  const {
    businessImage: businessImage,
    businessName: businessName,
    ownerId: ownerId,
    id: businessId,
  } = location.state || {};

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser && ownerId) {
      setIsOwner(currentUser.uid === ownerId);
    }
  }, [currentUser, ownerId]);

  // Fetch vehicles by OwnerId
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
    navigate("/bfront", { state: { businessId, ownerId: ownerId, businessImage, businessName, vehicleToEdit: vehicle } });
  };

  const handleNavigateToChat = () => {
    navigate('/chat', { 
      state: {businessId, businessName, businessImage}
    });
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
    <div className="h-fit w-full relative pb-10">
      <div className="flex py-6 items-center max-sm:flex-col max-sm:text-center mx-5">
          {businessImage && (
            <Link to={`/profile?businessId=${businessId}`}>
              <img 
                className="h-16 w-16 ml-5 rounded-full max-sm:mx-auto" 
                src={businessImage} 
                alt={businessName} 
              />
            </Link>
          )}
        <h1 className="text-3xl ml-10 max-sm:text-2xl max-sm:ml-0 max-sm:mt-2">{businessName}</h1>

        <div className="flex items-center ml-auto">
          {isOwner && (
            <button
              onClick={() => navigate("/bfront", { state: { businessId, ownerId: ownerId, businessImage, businessName } })}
              className="bg-blue-500 text-white text-2xl px-4 py-2 rounded-full hover:bg-blue-600 transition-colors ml-auto mr-4"
            >
              +
            </button>
          )}
          {!isOwner && (
            <div className="mb-2.5">
              <button 
                className="text-4xl cursor-pointer" 
                onClick={handleNavigateToChat}
              >
                <i className="fa fa-commenting"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        {vehicles.length > 0 ? (
          <div className="flex flex-wrap ml-5">
            {vehicles.map((vehicle) => {
              return (
                <div key={vehicle.id} className="w-[300px] ml-10 mb-10 rounded-lg p-5 shadow-md">
                  <img 
                    src={vehicle.vehicle.image || "/default-image.jpg"} 
                    alt="" 
                    className="w-[250px] h-[150px] object-cover rounded-md mb-4" 
                  />
                  <h2 className="text-xl font-semibold">{vehicle.vehicle.model}</h2>
                  <p className="text-sm text-gray-600">Capacity: {vehicle.vehicle.capacity}</p>
                  <p className="text-sm text-gray-600">Color: {vehicle.vehicle.color}</p>
                  <p className="text-sm text-gray-600">Mileage: {vehicle.vehicle.mileage}</p>
                  <p className="text-sm text-gray-600">Class: {vehicle.vehicle.class}</p>
                  <p className={`text-lg font-bold text-right ${vehicle.vehicle.availability === "Available" ? "text-blue-600" : "text-red-600"}`}>
                    {vehicle.vehicle.availability}</p>

                  <div className="mt-4 flex justify-between">
                    {isOwner ? (
                      <>
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleOpenModal(vehicle.id)} 
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleBookVehicle(vehicle)}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 w-full"
                        disabled={vehicle.vehicle.availability !== "Available"}
                      >
                        {vehicle.vehicle.availability === "Available" ? "Book Now" : "Not Available"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-lg text-gray-600 mt-10">No vehicles added yet.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h2 className="text-xl font-semibold mb-4">Are you sure you want to delete this vehicle?</h2>
            <div className="flex justify-between">
              <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Delete</button>
              <button onClick={handleCloseModal} className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rpf;