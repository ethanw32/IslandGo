import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import StarRating from "./star.js";

const Taxis = () => {
  const [activeTab, setActiveTab] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeTab with current URL path
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("taxis"); // Set activeTab to "taxis" if the path is "/"
    } else if (location.pathname === "/rentals") {
      setActiveTab("rentals"); // Set activeTab to "rentals" if the path is "/rentals"
    }
  }, [location.pathname]);

  const handleClick = (tab, path) => {
    setActiveTab(tab); // Update the activeTab state immediately
    navigate(path); // Navigate to the specified path
  };

  return (
    <div className="h-fit w-full pt-10 relative">
      {/* Taxis and Rentals Tabs */}
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

      {/* Taxi Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
        {/* Tour by Vie */}
        <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/tourbyvie.png"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Tour by Vie</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">
                Premier Taxi & Tour Provider In Grenada. Island Tours, Hiking, Private
                Chauffeuring, Airport Transfers & Many More.
              </p>
              <StarRating rating={5} /> 
            </div>
          </div>
        </div>

        {/* Tour De Spice */}
        <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/Tour de spice.png"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Tour De Spice</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">
                We provide a range of transport services which include V.I.P Taxi
                services, Island Tours, V.I.P Bar hopping and information that will
                ensure that you get the best out of your visit to Grenada.
              </p>
              <StarRating rating={4} />
            </div>
          </div>
        </div>

        {/* Pete's Mystique Tours */}
        <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/pete.png"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Pete's Mystique Tours</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">
                Explore the island of Grenada with tours designed for those seeking a
                truly unique Caribbean adventure.
              </p>
              <StarRating rating={4.5} />
            </div>
          </div>
        </div>

        {/* Prestige Taxi Tours */}
        <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/prestige.jpg"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Prestige Taxi Tours</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">
                Our service range from airport pick-up and drop off, Day tours, fish
                Friday trips and much more. Come enjoy a safe, comfortable and reliable
                service that's different from the rest. Lots of complimentary amenities
                for all our guest.
              </p>
              <StarRating rating={5} /> {/* Static rating */}
            </div>
          </div>
        </div>

        {/* Amazing Grenada Taxi & Tours */}
        <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/amazing taxi tours.jpg"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Amazing Grenada Taxi & Tours</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">
                Amazing Grenada offers a safe reliable and dependable service. Dedicated
                to an Amazing experience in the most pure Isle of spice, with an
                unforgettable stay. Always available to assist and serve in anyway
                possible.
              </p>
              <StarRating rating={4} /> 
            </div>
          </div>
        </div>

        {/* Burris Taxi & Tours */}
        <div className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md">
          <div className="flex">
            <Link to="" className="flex-shrink-0">
              <img
                className="w-24 h-24 rounded-lg object-cover"
                src="images/burris.png"
                alt="Taxi"
              />
            </Link>
            <div className="ml-4 flex flex-col justify-between flex-grow">
              <Link to="">
                <h1 className="font-bold text-xl">Burris Taxi & Tours</h1>
              </Link>
              <p className="text-sm text-gray-600 w-[400px]">
                Burris Taxi & Tours have taxi services, airport transfers and jet
                service, day tours, and customized excursions. Our prestige taxi and
                tour services include inclusive packages – free WiFi, spare cell phones
                for guests’ use, complimentary beverages, towel service.
              </p>
              <StarRating rating={4.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Taxis;