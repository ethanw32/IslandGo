import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import StarRating from "./star.js";

const Rentals = () => {
  const [activeTab, setActiveTab] = useState("");
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isHoveredFilter, setIsHoveredFilter] = useState(false);
  const [isHoveredSort, setIsHoveredSort] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const rentalData = [
    { id: 1, name: "Drive Grenada", image: "images/Drive.png", description: "Rent A Vehicle Book A Tour Call A Taxi", rating: 5 },
    { id: 2, name: "On point Rentals", image: "images/onpoint.jpg", description: "Renting a vehicle with Onpoint gives you the opportunity to explore the Isle of Spice for a day of adventure.", rating: 5 },
  ];

  useEffect(() => {
    setActiveTab(location.pathname.includes("taxis") ? "taxis" : location.pathname.includes("rentals") ? "rentals" : "");
  }, [location.pathname]);

  const handleClick = (tab, path) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      navigate(path);
    }
  };

  const handleFilterChange = (rating) => setFilterRating(rating === filterRating ? null : rating);
  const handleSortChange = (order) => setSortOrder(order);

  const filteredRentals = filterRating ? rentalData.filter(rental => rental.rating === filterRating) : rentalData;
  const sortedRentals = [...filteredRentals].sort((a, b) => sortOrder === "a-z" ? a.name.localeCompare(b.name) : sortOrder === "z-a" ? b.name.localeCompare(a.name) : 0);

  return (
    <div className="h-screen w-full pt-10 relative">
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
        {sortedRentals.map(rental => (
          <Link to="/rpf" key={rental.id} state={{ rental }}>
            <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
              <div className="flex">
                <img className="w-24 h-24 rounded-full object-cover" src={rental.image} alt={rental.name} />
                <div className="ml-4 flex flex-col justify-between flex-grow">
                  <h1 className="font-bold text-xl max-sm:text-lg">{rental.name}</h1>
                  <p className="text-sm text-gray-600 w-full lg:w-[400px] max-sm:text-xs">{rental.description}</p>
                  <StarRating rating={rental.rating} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Rentals;