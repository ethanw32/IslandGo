import React, { useEffect, useState } from "react";
import { useNavigate, useLocation} from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./config/firebase"; // Firestore instance
import StarRating from "./star.js";

const Rentals = () => {
  const [activeTab, setActiveTab] = useState("rentals");
  const [rentals, setRentals] = useState([]);
  const navigate = useNavigate();
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isHoveredFilter, setIsHoveredFilter] = useState(false);
  const [isHoveredSort, setIsHoveredSort] = useState(false);
  const location = useLocation();

  // Fetch rental businesses from Firestore
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "businesses"));
        const rentalData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.businessType === "Rental") {
            rentalData.push({ id: doc.id, ...data });
          }
        });
        setRentals(rentalData);
      } catch (error) {
        console.error("Error fetching rental businesses:", error);
      }
    };

    fetchRentals();
  }, []);

    useEffect(() => {
      setActiveTab(location.pathname === "/" ? "taxis" : location.pathname === "/rentals" ? "rentals" : "");
    }, [location.pathname]);
  
    const handleClick = (tab, path) => {
      setActiveTab(tab);
      navigate(path);
    };

  const handleFilterChange = (rating) => setFilterRating(rating === filterRating ? null : rating);
  const handleSortChange = (order) => setSortOrder(order);

  const filteredRentals = filterRating ? rentals.filter(rental => rental.rating === filterRating) : rentals;
  const sortedRentals = [...filteredRentals].sort((a, b) =>
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
        <div className="bg-[#D9D9D9] w-28 h-7 rounded-2xl text-center relative cursor-pointer" onMouseEnter={() => setIsHoveredFilter(true)} onMouseLeave={() => setIsHoveredFilter(false)}>
          <span>Filters</span><i className="fa fa-search pl-4"></i>
          {isHoveredFilter && (
            <div className="absolute top-7 left-0 bg-white rounded-lg shadow-lg w-28 z-10">
              {[1, 2, 3, 4, 5].map(rating => (
                <div key={rating} className="p-2 hover:bg-gray-200 cursor-pointer" onClick={() => handleFilterChange(rating)}>{rating} Star{rating > 1 ? "s" : ""}</div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#D9D9D9] w-28 h-7 rounded-2xl text-center relative cursor-pointer" onMouseEnter={() => setIsHoveredSort(true)} onMouseLeave={() => setIsHoveredSort(false)}>
          <span>Sort</span><i className="fa fa-sort pl-4"></i>
          {isHoveredSort && (
            <div className="absolute top-7 left-0 bg-white rounded-lg shadow-lg w-28 z-10">
              <div className="p-2 hover:bg-gray-200 cursor-pointer" onClick={() => handleSortChange("a-z")}>A-Z</div>
              <div className="p-2 hover:bg-gray-200 cursor-pointer" onClick={() => handleSortChange("z-a")}>Z-A</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 px-4">
        {sortedRentals.map((rental) => {
          console.log(rental); // Log the rental data to check the fields
          return (
            <div 
              key={rental.id} 
              className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md cursor-pointer"
              onClick={() =>
                navigate("/rpf", {
                  state: {
                    businessImage: rental.businessImage,
                    businessName: rental.businessName,
                    id: rental.id,
                    ownerId: rental.ownerId,
                  },
                })
              }
            >
              <div className="flex">
                <img className="w-24 h-24 rounded-full object-cover" src={rental.businessImage} alt={rental.businessName} />
                <div className="ml-4 flex flex-col justify-between flex-grow">
                  <h1 className="font-bold text-2xl">{rental.businessName}</h1>
                  <p className="text-sm text-gray-600 w-full lg:w-[400px]">{rental.businessDescription}</p>
                  <StarRating rating={rental.rating || 0} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rentals;
