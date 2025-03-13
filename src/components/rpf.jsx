import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Rpf() {
  const companies = [
    {
      id: 1,
      name: 'Drive Grenada',
      imageUrl: 'images/Drive.png',
      address: "Grand Anse, St. George's", 
      phone: "+1 (473) 421-3333",
      email: "contact@drivegrenada.com",
      operatingHours: "Open 24 hours",

      vehicles: [
        {
          id: 1,
          image: 'images/rental car.png',
          model: 'Toyota Camry',
          capacity: '28 Miles per gallon',
          color: 'Silver',
          mileage: '50000m',
          class: 'Sedan',
        },
        {
          id: 2,
          image: 'images/jeep.jpg',
          model: 'Jeep Wrangler',
          capacity: '20 Miles per gallon',
          color: 'Red',
          mileage: '15000m',
          class: 'SUV',
        },
      ],
    },
    {
      id: 2,
      name: 'On point Rental',
      imageUrl: 'images/onpoint.jpg',
      address: "Lance Aux Epines, St George's, Grenada", 
      phone: "+1 (473) 534-3900",
      email: "onpointautorentals.com",
      operatingHours: "Open 24 hours",

      vehicles: [
        {
          id: 3,
          image: 'images/toyota.png',
          model: 'Toyota Sienna',
          capacity: '36 Miles per gallon',
          color: 'Silver',
          mileage: '100000m',
          class: 'Van',
        },
      ],
    },
  ];

  const location = useLocation();
  const { imageUrl, title } = location.state || {};

  const [selectedCompany, setSelectedCompany] = useState(
    companies.find((company) => company.name === title) || companies[0]
  );

  return (
    <div>
      <div className="h-fit w-full relative pb-10">
        {/* Business Info */}
        <div className="flex py-6 items-center">
          <img className="h-16 max-sm:h-12 ml-5 rounded-full" src={selectedCompany.imageUrl} alt={selectedCompany.name}/>
          <h1 className="text-3xl ml-10 max-sm:text-2xl">{selectedCompany.name}</h1>

          <div className="flex items-center ml-auto">
            <div className="p-3 text-white text-center mr-5 bg-black w-[150px] rounded-xl">
              <Link
                 to="/contact"
                 state={{imageUrl: selectedCompany.imageUrl, title: selectedCompany.name, address: selectedCompany.address, email: selectedCompany.email, phone: selectedCompany.phone, operatingHours: selectedCompany.operatingHours}}>
                <h1 className="font-medium text-lg m-0">Contact Info</h1>
              </Link>
            </div>
            <div className="p-3 text-white text-center bg-black w-[150px] rounded-xl">
              <Link to="/requirements" state={{imageUrl: selectedCompany.imageUrl, title: selectedCompany.name,}}>
                <h1 className="cursor-pointer font-medium text-lg m-0">Requirements</h1>
              </Link>
            </div>
          </div>

          <Link
            className="text-4xl max-sm:text-3xl ml-20 mr-10 cursor-pointer"
            to="/inbox"
            state={{name: selectedCompany.name,imageUrl: selectedCompany.imageUrl}}>
            <i className="fa fa-commenting"></i>
          </Link>
        </div>

        {/* Company Selection Buttons */}
        <div className="flex gap-4 my-6 px-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className={`p-2 rounded-lg ${
                selectedCompany.id === company.id
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              {company.name}
            </button>
          ))}
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-10 px-4">
          {selectedCompany.vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex border rounded-lg p-4 shadow-md"
            >
              {/* Vehicle Image */}
              <img className="w-60 h-40 object-cover rounded-lg"src={vehicle.image} alt={vehicle.model}/>

              {/* Vehicle Details */}
              <div className="mt-4 ml-4">
                <h2 className="font-bold text-xl">{vehicle.model}</h2>
                <p className="text-sm text-gray-600">
                  Capacity: {vehicle.capacity} <br />
                  Color: {vehicle.color} <br />
                  Mileage: {vehicle.mileage} <br />
                  Class: {vehicle.class}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Rpf;