import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./config/firebase";
import StarRating from "./star.js";

const Rentals = () => {
  const [activeTab, setActiveTab] = useState("rentals");
  const [rentals, setRentals] = useState([]);
  const [rentalRatings, setRentalRatings] = useState({});
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      try {
        // Fetch rentals (this remains the same)
        const querySnapshot = await getDocs(collection(db, "businesses"));
        const rentalData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.businessType === "Rental") {
            rentalData.push({ businessId: doc.id, ...data });
          }
        });
        setRentals(rentalData);

        // Set up real-time listener for reviews
        const reviewsRef = collection(db, "reviews");
        const unsubscribe = onSnapshot(reviewsRef, (querySnapshotRatings) => {
          console.log("Reviews snapshot received, total reviews:", querySnapshotRatings.size);

          const reviewsByProduct = {};
          querySnapshotRatings.forEach((doc) => {
            const review = doc.data();
            console.log("Review data:", review);

            if (review.businessId) {
              if (!reviewsByProduct[review.businessId]) {
                reviewsByProduct[review.businessId] = [];
              }
              reviewsByProduct[review.businessId].push(review.rating);
            }
          });

          console.log("Reviews by business:", reviewsByProduct);

          const ratingsData = {};
          for (const businessId in reviewsByProduct) {
            const ratings = reviewsByProduct[businessId];
            const sum = ratings.reduce((a, b) => a + b, 0);
            const avg = sum / ratings.length;
            ratingsData[businessId] = Math.round(avg * 10) / 10;
          }

          console.log("Final ratings data:", ratingsData);
          setRentalRatings(ratingsData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
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

  const filteredRentals = filterRating
    ? rentals.filter(rental => Math.round(rentalRatings[rental.businessId] || 0) === filterRating)
    : rentals;

  const sortedRentals = [...filteredRentals].sort((a, b) => {
    if (sortOrder === "a-z") return a.businessName.localeCompare(b.businessName);
    if (sortOrder === "z-a") return b.businessName.localeCompare(a.businessName);
    return 0;
  });

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="bg-dark rounded-xl p-6 shadow-md animate-pulse">
      <div className="flex gap-6">
        <div className="relative w-32 flex-shrink-0">
          <div className="aspect-square w-full rounded-full bg-secondary"></div>
        </div>
        <div className="ml-4 flex flex-col justify-between flex-grow">
          <div>
            <div className="h-6 bg-secondary rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-secondary rounded w-full mb-2"></div>
            <div className="h-4 bg-secondary rounded w-5/6"></div>
          </div>
          <div className="mt-4">
            <div className="h-5 bg-secondary rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-fit w-full pt-10 p-5 relative bg-dark">
      <div className="rounded-3xl font-medium bg-dark text-lg h-10 w-40 m-auto">
        <div className="flex h-full">
          <div onClick={() => handleClick("taxis", "/")} className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${activeTab === "taxis" ? "bg-black text-white rounded-3xl dark:bg-white dark:text-black" : "bg-dark bg-hover rounded-3xl"} transition-all`}>
            Taxis
          </div>
          <div onClick={() => handleClick("rentals", "/rentals")} className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${activeTab === "rentals" ? "bg-black text-white rounded-3xl dark:bg-white dark:text-black" : "bg-dark bg-hover rounded-3xl"} transition-all`}>
            Rentals
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <div className="relative filter-dropdown">
          <button
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 ${isFilterOpen ? "bg-black text-white dark:bg-white dark:text-black" : "bg-dark text-dark bg-hover"} shadow-md`}
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
            disabled={isLoading}
          >
            <span className="font-medium">Filters</span>
            <i className="fa fa-filter text-sm"></i>
          </button>
          {isFilterOpen && (
            <div className="absolute top-12 left-0 bg-dark rounded-xl shadow-xl w-36 z-10 overflow-hidden">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div
                  key={rating}
                  className={`p-3 bg-hover cursor-pointer transition-colors ${filterRating === rating ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
                  onClick={() => handleFilterChange(rating)}
                >
                  <div className="flex items-center gap-2">
                    <span className={filterRating === rating ? "text-white dark:text-black" : "text-dark"}>{rating} {rating === 1 ? "★" : "★"}</span>
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
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 ${isSortOpen ? "bg-black text-white dark:bg-white dark:text-black" : "bg-dark text-dark bg-hover"} shadow-md`}
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              setIsFilterOpen(false);
            }}
            disabled={isLoading}
          >
            <span className="font-medium">Sort</span>
            <i className="fa fa-sort text-sm"></i>
          </button>
          {isSortOpen && (
            <div className="absolute top-12 left-0 bg-dark rounded-xl shadow-xl w-36 z-10 overflow-hidden">
              <div
                className={`p-3 bg-hover cursor-pointer transition-colors ${sortOrder === "default" ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
                onClick={() => handleSortChange("default")}
              >
                <div className="flex items-center gap-2">
                  <span className={sortOrder === "default" ? "text-white dark:text-black" : "text-dark"}>Default</span>
                  {sortOrder === "default" && (
                    <i className="fas fa-check text-green-500 ml-auto"></i>
                  )}
                </div>
              </div>
              <div
                className={`p-3 bg-hover cursor-pointer transition-colors ${sortOrder === "a-z" ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
                onClick={() => handleSortChange("a-z")}
              >
                <div className="flex items-center gap-2">
                  <span className={sortOrder === "a-z" ? "text-white dark:text-black" : "text-dark"}>A-Z</span>
                  {sortOrder === "a-z" && (
                    <i className="fas fa-check text-green-500 ml-auto"></i>
                  )}
                </div>
              </div>
              <div
                className={`p-3 bg-hover cursor-pointer transition-colors ${sortOrder === "z-a" ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
                onClick={() => handleSortChange("z-a")}
              >
                <div className="flex items-center gap-2">
                  <span className={sortOrder === "z-a" ? "text-white dark:text-black" : "text-dark"}>Z-A</span>
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
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : sortedRentals.length === 0 ? (
          <div className="col-span-full text-center text-secondary py-10">
            No results found
          </div>
        ) : (
          sortedRentals.map((rental) => {
            const avgRating = rentalRatings[rental.businessId] || 0;
            return (
              <div
                key={rental.businessId}
                className="bg-dark rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  console.log("Navigating to RPF with rental data:", {
                    businessImage: rental.businessImage,
                    businessName: rental.businessName,
                    businessId: rental.businessId,
                    ownerId: rental.ownerId,
                  });
                  navigate("/rpf", {
                    state: {
                      businessImage: rental.businessImage,
                      businessName: rental.businessName,
                      businessId: rental.businessId,
                      ownerId: rental.ownerId,
                    },
                  });
                }}
              >
                <div className="flex gap-3 sm:gap-6">
                  <div className="relative w-20 sm:w-32 flex-shrink-0">
                    <img
                      className="aspect-square w-full rounded-full shadow-md object-cover"
                      src={rental.businessImage || "/default-image.jpg"}
                      alt={rental.businessName}
                    />
                  </div>
                  <div className="ml-2 sm:ml-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h1 className="font-bold text-xl sm:text-2xl text-dark mb-1 sm:mb-2">
                        {rental.businessName}
                      </h1>
                      <p className="text-secondary line-clamp-2 text-xs sm:text-sm">
                        {rental.businessDescription}
                      </p>
                    </div>
                    <div className="mt-1 sm:mt-2">
                      <div className="flex items-center">
                        <StarRating rating={Math.round(avgRating)} />
                        {avgRating > 0 && (
                          <span className="ml-2 text-sm text-secondary">
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

export default Rentals;