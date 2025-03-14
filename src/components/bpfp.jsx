import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Bpf() {
  const location = useLocation();
  const { image, name } = location.state || {};
  const [tours, setTours] = useState([]);

  // Fetch tours from localStorage on component mount
  useEffect(() => {
    const storedTours = JSON.parse(localStorage.getItem('tours')) || [];
    setTours(storedTours);
  }, []);

  return (
    <div className="h-fit w-full relative pb-10">
      {/* Header Section */}
      <div className="flex py-6 items-center">
        <img className="h-16 ml-5 rounded-full" src={image} alt="" />
        <h1 className="text-3xl ml-10 max-sm:text-xl">{name}</h1>

        <div className="flex ml-auto">
          <Link
            className="text-4xl ml-auto mr-5 cursor-pointer"
            to="/inbox"
            state={{
              name: 'Spice Taxi Tours',
              imageUrl: 'images/bpfp.jpg',
              description:
                'We are a professional Taxi service. Our services range from airport transfers to island tours.',
            }}
          >

      <div className="flex ml-auto">
          <Link
            to="/addtour"
            className="mr-10 right-10 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-4xl shadow-lg hover:bg-blue-600 transition-colors"
          >
            +
          </Link>
          <Link
            className="text-4xl ml-auto mr-5 cursor-pointer"
            to="/inbox"
            state={{
              name: 'Spice Taxi Tours',
              imageUrl: 'images/bpfp.jpg',
              description:
                'We are a professional Taxi service. Our services range from airport transfers to island tours.',
            }}
          ><i className="fa fa-commenting"></i></Link>
        </div>
        </Link>
        </div>
      </div>

      {/* Display Saved Tours */}
      {tours.map((tour, index) => (
        <div key={index} className="flex my-5">
          <img
            className="my-10 mx-5 max-sm:h-[100px] w-[300px] h-[250px] max-sm:mt-16 rounded-md"
            src={tour.image}
            alt={tour.name}
          />
          <div className="float-right my-5">
            <h1 className="font-bold text-2xl mb-2.5">{tour.name}</h1>
            <p className="max-sm:text-sm w-[600px]">{tour.description}</p>
            <h2 className="my-2.5 font-bold text-xl">Spots</h2>
            <ul>
              {tour.spots.map((spot, spotIndex) => (
                <li key={spotIndex}>
                  {spot.name} - {spot.description}
                </li>
              ))}
            </ul>
          </div>
          <div className="ml-auto mr-10 justify-center w-[400px]">
            <h1 className="text-center text-2xl font-bold mb-5">Route</h1>
            {tour.routeEmbedLink ? (
              <iframe
                src={tour.routeEmbedLink}
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            ) : (
              <p className="text-center text-gray-500">No route available for this tour.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}