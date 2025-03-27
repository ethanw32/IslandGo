import React, { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";

const BPF = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Extract business data from location state
  const {
    image: businessImage,
    name: businessName,
    ownerId: OwnerId,
    businessId,
  } = location.state || {};

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!businessId || !OwnerId) {
      console.error("Missing businessId or ownerId in location.state");
      navigate("/"); 
      return;
    }
    fetchTours();
  }, [businessId, OwnerId]);

  const fetchTours = async () => {
    try {
      const toursCollection = collection(db, "tours");
      const q = query(toursCollection, where("businessId", "==", businessId));
      const toursSnapshot = await getDocs(q);
      const toursList = toursSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTours(toursList);
    } catch (error) {
      console.error("Error fetching tours: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && OwnerId) {
      setIsOwner(currentUser.uid === OwnerId);
    }
  }, [currentUser, OwnerId]);

  const handleDeleteTour = async () => {
    if (!tourToDelete) return;

    try {
      await deleteDoc(doc(db, "tours", tourToDelete));
      setTours(tours.filter((tour) => tour.id !== tourToDelete));
    } catch (error) {
      console.error("Error deleting tour: ", error);
    } finally {
      setShowDeleteConfirmation(false);
      setTourToDelete(null);
    }
  };

  const handleEditTour = (tour) => {
    navigate("/addtour", { state: { businessId, ownerId: OwnerId,  image: businessImage,
      name: businessName, tourToEdit: tour } });
  };

  const handleAddTour = () => {
    navigate("/addtour", { state: { businessId, ownerId: OwnerId, image: businessImage,
      name: businessName, } });
  };

  return (
    <div className="h-fit pb-10  w-full relative">
      <div className="flex py-6 mx-5 items-center max-sm:flex-col max-sm:text-center">
        <img
          className="h-16 w-16 ml-2.5 rounded-full max-sm:mx-auto max-sm:h-12"
          src={businessImage}
          alt="Business"
        />
        <h1 className="text-3xl ml-5 max-sm:text-xl max-sm:ml-0 max-sm:mt-2">
          {businessName}
        </h1>

        <div className="flex items-center ml-auto">
          {isOwner && (
            <button
              onClick={handleAddTour}
              className="bg-blue-500 text-white text-2xl px-4 py-2 rounded-full hover:bg-blue-600 transition-colors mr-4"
            >
              +
            </button>
          )}
          <div className="mb-2.5">
            <Link className="text-4xl cursor-pointer" to="/inbox">
              <i className="fa fa-commenting"></i>
            </Link>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Tours</h1>

      <div className="flex-1">
        {tours && tours.length > 0 ? (
          tours.map((tour) => (
            <div
              key={tour.id}
              className="flex bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow h-[350px] m-10 my-5 max-sm:flex-col p-7"
            >
              <img
                src={tour.image}
                alt={tour.name}
                className="w-[300px] h-[250px] rounded-md object-cover"
              />

              <div className="flex-1 mx-5 mb-3 max-sm:text-center">
                <h2 className="text-3xl capitalize font-bold text-gray-800 mb-2">
                  {tour.name}
                </h2>
                <p className="text-gray-600 mb-4">{tour.description}</p>

                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Spots:</h3>
                  <ul className="list-disc list-inside space-y-1">

                    {tour.spots &&
                      tour.spots.map((spot, index) => (
                        <li key={index} className="text-gray-600">
                          <strong className="text-gray-800">{spot.name}</strong>:{" "}
                          {spot.description}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <div className="ml-auto mr-5">
                <h3 className="text-2xl text-center font-bold text-gray-700 mb-2">
                  Route:
                </h3>
                <iframe
                  src={tour.routeEmbedLink}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title={`Route for ${tour.name}`}
                  className="rounded-lg"
                ></iframe>
              </div>

              {isOwner && (
                <div className="flex flex-col justify-center space-y-2">
                  <button
                    onClick={() => handleEditTour(tour)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setTourToDelete(tour.id);
                      setShowDeleteConfirmation(true);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">No tours available.</p>
        )}
      </div>

      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
            <p className="mb-4">Do you really want to delete this tour? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTour}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BPF;
