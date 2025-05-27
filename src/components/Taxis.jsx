import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./config/firebase";
import StarRating from "./star.js";

const Taxis = () => {
  const [activeTab, setActiveTab] = useState("");
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [taxis, setTaxis] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown') && !event.target.closest('.sort-dropdown')) {
        setIsFilterOpen(false);
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTaxis = async () => {
      console.log("Starting to fetch taxis...");
      try {
        const querySnapshot = await getDocs(collection(db, "businesses"));
        console.log("Firestore query completed, got", querySnapshot.size, "documents");
        
        const taxiData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Document data:", data);
          if (data.businessType === "Taxi") {
            taxiData.push({ id: doc.id, ...data });
          }
        });
        
        console.log("Found", taxiData.length, "taxis");
        setTaxis(taxiData);
      } catch (error) {
        console.error("Error fetching taxi businesses:", error);
      }
    };
    
    fetchTaxis();
  }, []);

  useEffect(() => {
    setActiveTab(location.pathname === "/" ? "taxis" : location.pathname === "/rentals" ? "rentals" : "");
  }, [location.pathname]);

  const handleClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleFilterChange = (rating) => {
    setFilterRating(rating === filterRating ? null : rating);
    setIsFilterOpen(false);
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    setIsSortOpen(false);
  };

  const filteredTaxis = filterRating ? taxis.filter(taxi => taxi.rating === filterRating) : taxis;
  const sortedTaxis = [...filteredTaxis].sort((a, b) =>
    sortOrder === "a-z" ? a.businessName.localeCompare(b.businessName) : sortOrder === "z-a" ? b.businessName.localeCompare(a.businessName) : 0
  );

  return (
    <div className="h-fit w-full pt-10 p-5 relative">
      <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto">
        <div className="flex h-full">
          <div onClick={() => handleClick("taxis", "/")} className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${activeTab === "taxis" ? "bg-black text-white rounded-3xl" : "bg-white hover:bg-gray-200 rounded-3xl"} transition-all`}>Taxis</div>
          <div onClick={() => handleClick("rentals", "/rentals")} className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${activeTab === "rentals" ? "bg-black text-white rounded-3xl" : "bg-white hover:bg-gray-200 rounded-3xl"} transition-all`}>Rentals</div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <div className="relative filter-dropdown">
          <button
            className={`px-6 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 ${isFilterOpen
              ? "bg-black text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
              } shadow-md`}
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
          >
            <span className="font-medium">Filters</span>
            <i className="fa fa-filter text-sm"></i>
          </button>
          {isFilterOpen && (
            <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl w-36 z-10 overflow-hidden">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div
                  key={rating}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${filterRating === rating ? "bg-gray-100" : ""
                    }`}
                  onClick={() => handleFilterChange(rating)}
                >
                  <div className="flex items-center gap-2">
                    <span>{rating} Star{rating > 1 ? "s" : ""}</span>
                    {filterRating === rating && (
                      <i className="fas fa-check text-green-500 ml-auto"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative sort-dropdown">
          <button
            className={`px-6 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 ${isSortOpen
              ? "bg-black text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
              } shadow-md`}
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              setIsFilterOpen(false);
            }}
          >
            <span className="font-medium">Sort</span>
            <i className="fa fa-sort text-sm"></i>
          </button>
          {isSortOpen && (
            <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl w-36 z-10 overflow-hidden">
              <div
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${sortOrder === "a-z" ? "bg-gray-100" : ""
                  }`}
                onClick={() => handleSortChange("a-z")}
              >
                <div className="flex items-center gap-2">
                  <span>A-Z</span>
                  {sortOrder === "a-z" && (
                    <i className="fas fa-check text-green-500 ml-auto"></i>
                  )}
                </div>
              </div>
              <div
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${sortOrder === "z-a" ? "bg-gray-100" : ""
                  }`}
                onClick={() => handleSortChange("z-a")}
              >
                <div className="flex items-center gap-2">
                  <span>Z-A</span>
                  {sortOrder === "z-a" && (
                    <i className="fas fa-check text-green-500 ml-auto"></i>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-6 sm:my-10 max-w-7xl mx-auto">
        {sortedTaxis.map((taxi) => (
          <div
            key={taxi.id}
            className="bg-white dark rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() =>
              navigate("/bpf", {
                state: {
                  businessId: taxi.id,
                  ownerId: taxi.ownerId,
                  image: taxi.businessImage,
                  name: taxi.businessName,
                },
              })
            }
          >
            <div className="flex gap-3 sm:gap-6">
              <div className="relative w-20 sm:w-32 flex-shrink-0">
                <img
                  className="aspect-square w-full rounded-full shadow-md object-cover"
                  src={taxi.businessImage || "/default-image.jpg"}
                  alt={taxi.businessName}
                />
              </div>
              <div className="ml-2 sm:ml-4 flex flex-col justify-between flex-grow">
                <div>
                  <h1 className="font-bold text-xl sm:text-2xl text-gray-800 mb-1 sm:mb-2">{taxi.businessName}</h1>
                  <p className="text-gray-600 line-clamp-2 text-xs sm:text-sm">{taxi.businessDescription}</p>
                </div>
                <div className="mt-1 sm:mt-2">
                  <StarRating rating={taxi.rating || 0} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Taxis;
