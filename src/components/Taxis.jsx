import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import StarRating from "./star.js";

const Taxis = () => {
  const [activeTab, setActiveTab] = useState("");
  const [filterRating, setFilterRating] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [isHoveredFilter, setIsHoveredFilter] = useState(false);
  const [isHoveredSort, setIsHoveredSort] = useState(false);
  const [taxis, setTaxis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchTaxis = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "businesses"));
        const taxiData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.businessType === "Taxi") {
            taxiData.push({ id: doc.id, ...data });
          }
        });
        setTaxis(taxiData);
      } catch (error) {
        console.error("Error fetching taxi businesses:", error);
      } finally {
        setIsLoading(false);
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

  const handleFilterChange = (rating) => setFilterRating(rating === filterRating ? null : rating);
  const handleSortChange = (order) => setSortOrder(order);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
        {sortedTaxis.map(taxi => (
          <div key={taxi.id} className="flex flex-col border rounded-lg p-4 h-[180px] shadow-md cursor-pointer" onClick={() => navigate("/bpf", { state: { businessId: taxi.id, ownerId: taxi.ownerId, image: taxi.businessImage, name: taxi.businessName } })}>
            <div className="flex">
              <img className="w-24 h-24 rounded-full object-cover" src={taxi.businessImage || "/default-image.jpg"} alt="Taxi" />
              <div className="ml-4 flex flex-col justify-between flex-grow">
                <h1 className="font-bold text-2xl">{taxi.businessName}</h1>
                <p className="text-sm text-gray-600 w-full md:w-[400px]">{taxi.businessDescription}</p>
                <StarRating rating={taxi.rating || 0} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Taxis;
