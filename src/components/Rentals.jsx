import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import StarRating from "./star.js";

const Rentals = () => {
  const [activeTab, setActiveTab] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeTab with current URL path
  useEffect(() => {
    if (location.pathname.includes("taxis")) {
      setActiveTab("taxis");
    } else if (location.pathname.includes("rentals")) {
      setActiveTab("rentals");
    }
  }, [location.pathname]);

  const handleClick = (tab, path) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      navigate(path);
    }
  };

  return (
    <div>
      <div className="h-fit w-full pt-10 relative">
        {/* Tab Buttons */}
        <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto">
          <div className="flex h-full">
            {/* Taxis Button */}
            <div
              onClick={() => handleClick("taxis", "/")}
              className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                activeTab === "taxis"
                  ? "bg-black text-white rounded-3xl"
                  : "bg-white hover:bg-gray-200 rounded-3xl"
              } transition-all`}
            >
              Taxis
            </div>

            {/* Rentals Button */}
            <div
              onClick={() => handleClick("rentals", "/rentals")}
              className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                activeTab === "rentals"
                  ? "bg-black text-white rounded-3xl"
                  : "bg-white hover:bg-gray-200 rounded-3xl"
              } transition-all`}
            >
              Rentals
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#D9D9D9] w-28 h-7 rounded-2xl text-center m-auto mt-8">
          Filters <i className="fa fa-search pl-4"></i>
        </div>

        {/* Rental Listings Grid */}
       {/* Rental Listings Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 px-4">
 
<div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/Drive.png"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Drive Grenada</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">Rent A Vehicle Book A Tour Call A Taxi</p>
              <StarRating rating={5} /> 
            </div>
          </div>
        </div>
 
<div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/onpoint.jpg"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">On point Rentals</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">Renting a vehicle with Onpoint gives you the opportunity to explore the Isle of Spice for a day of adventure. Our main goal is to provide a phenomenal rental experience to our customers. Hence the reason why, we offer a 24/7 road side assistance, free pick-up & drop-off anywhere</p>
              <StarRating rating={5} /> 
            </div>
          </div>
        </div>
</div>
      </div>
    </div>
  );
};

export default Rentals;