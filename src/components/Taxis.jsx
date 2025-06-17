import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./config/firebase";
import StarRating from "./star.js";

const Taxis = () => {
  const [activeTab, setActiveTab] = useState("");
  const [taxis, setTaxis] = useState([]);
  const [taxiRatings, setTaxiRatings] = useState({});
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch taxi businesses
        const querySnapshot = await getDocs(collection(db, "businesses"));
        const taxiData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.businessType === "Taxi") {
            taxiData.push({ id: doc.id, ...data });
          }
        });
        setTaxis(taxiData);

        // Set up real-time listener for reviews
        const reviewsRef = collection(db, "reviews");
        const unsubscribe = onSnapshot(reviewsRef, (querySnapshotRatings) => {
          console.log("Reviews snapshot received, total reviews:", querySnapshotRatings.size);

          const reviewsByBusiness = {};
          querySnapshotRatings.forEach((doc) => {
            const review = doc.data();
            if (review.businessId) {
              if (!reviewsByBusiness[review.businessId]) {
                reviewsByBusiness[review.businessId] = [];
              }
              reviewsByBusiness[review.businessId].push(review.rating);
            }
          });

          const ratingsData = {};
          for (const businessId in reviewsByBusiness) {
            const ratings = reviewsByBusiness[businessId];
            const sum = ratings.reduce((a, b) => a + b, 0);
            const avg = sum / ratings.length;
            ratingsData[businessId] = Math.round(avg * 10) / 10;
          }

          setTaxiRatings(ratingsData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const filteredTaxis = filterRating
    ? taxis.filter(taxi => Math.round(taxiRatings[taxi.id] || 0) === filterRating)
    : taxis;

  const sortedTaxis = [...filteredTaxis].sort((a, b) => {
    if (sortOrder === "a-z") return a.businessName.localeCompare(b.businessName);
    if (sortOrder === "z-a") return b.businessName.localeCompare(a.businessName);
    return 0;
  });

  return (
    <div className="h-screen w-full pt-10 p-5 relative">
      <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto">
        <div className="flex h-full">
          <div onClick={() => handleClick("taxis", "/")} className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${activeTab === "taxis" ? "bg-black text-white rounded-3xl" : "bg-white hover:bg-gray-200 rounded-3xl"} transition-all`}>
            Taxis
          </div>
          <div onClick={() => handleClick("rentals", "/rentals")} className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${activeTab === "rentals" ? "bg-black text-white rounded-3xl" : "bg-white hover:bg-gray-200 rounded-3xl"} transition-all`}>
            Rentals
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <div className="relative filter-dropdown">
          <button
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 ${isFilterOpen ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"} shadow-md`}
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
            disabled={loading}
          >
            <span className="font-medium">Filters</span>
            <i className="fa fa-filter text-sm"></i>
          </button>
          {isFilterOpen && (
            <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl w-36 z-10 overflow-hidden">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div
                  key={rating}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${filterRating === rating ? "bg-gray-100" : ""}`}
                  onClick={() => handleFilterChange(rating)}
                >
                  <div className="flex items-center gap-2">
                    <span>{rating} {rating === 1 ? "★" : "★"}</span>
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
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 ${isSortOpen ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"} shadow-md`}
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              setIsFilterOpen(false);
            }}
            disabled={loading}
          >
            <span className="font-medium">Sort</span>
            <i className="fa fa-sort text-sm"></i>
          </button>
          {isSortOpen && (
            <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl w-36 z-10 overflow-hidden">
              <div
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${sortOrder === "default" ? "bg-gray-100" : ""}`}
                onClick={() => handleSortChange("default")}
              >
                <div className="flex items-center gap-2">
                  <span>Default</span>
                  {sortOrder === "default" && (
                    <i className="fas fa-check text-green-500 ml-auto"></i>
                  )}
                </div>
              </div>
              <div
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${sortOrder === "a-z" ? "bg-gray-100" : ""}`}
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
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${sortOrder === "z-a" ? "bg-gray-100" : ""}`}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {loading ? (
          // Loading skeleton
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-4 sm:p-6 shadow-md animate-pulse">
              <div className="flex gap-3 sm:gap-6">
                <div className="w-20 sm:w-32 h-20 sm:h-32 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))
        ) : sortedTaxis.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">
            No results found
          </div>
        ) : (
          sortedTaxis.map((taxi) => {
            const avgRating = taxiRatings[taxi.id] || 0;
            return (
              <div
                key={taxi.id}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer"
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
                      <div className="flex items-center">
                        <StarRating rating={Math.round(avgRating)} />
                        {avgRating > 0 && (
                          <span className="ml-2 text-sm text-gray-600">
                            ({avgRating} ★)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Taxis;