import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Rpf() {
  const location = useLocation();
  const { rental } = location.state || {};
  const [companies, setCompanies] = useState(() => JSON.parse(localStorage.getItem("companies")) || [
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
  ]);
  const [selectedCompany, setSelectedCompany] = useState(companies.find((company) => company.id === rental?.id) || companies[0]);

  useEffect(() => {
    if (rental) {
      const company = companies.find((company) => company.id === rental.id);
      if (company) setSelectedCompany(company);
    }
  }, [rental]);

  return (
    <div className="h-fit w-full relative pb-10">
      <div className="flex py-6 items-center max-sm:flex-col max-sm:text-center">
        <img className="h-16 max-sm:h-12 ml-5 rounded-full max-sm:mx-auto" src={selectedCompany.imageUrl} alt={selectedCompany.name} />
        <h1 className="text-3xl ml-10 max-sm:text-2xl max-sm:ml-0 max-sm:mt-2">{selectedCompany.name}</h1>
        <div className="flex items-center ml-auto max-sm:mx-auto max-sm:mt-4">
          
        <Link to="/contact" state={{ imageUrl: selectedCompany.imageUrl, title: selectedCompany.name, address: selectedCompany.address, email: selectedCompany.email, phone: selectedCompany.phone, operatingHours: selectedCompany.operatingHours }}>
          <div className="p-3 text-white text-center mr-5 bg-black w-[150px] rounded-xl">
              <h1 className="font-medium text-lg m-0">Contact Info</h1>
          </div> </Link>
          <Link to="/requirements" state={{ imageUrl: selectedCompany.imageUrl, title: selectedCompany.name }}>
          <div className="p-3 text-white text-center bg-black w-[150px] rounded-xl">
              <h1 className="cursor-pointer font-medium text-lg m-0">Requirements</h1>   
          </div></Link>
        </div>
        <Link className="text-4xl max-sm:text-3xl ml-20 mr-10 cursor-pointer max-sm:ml-0 max-sm:mt-4" to="/inbox" state={{ name: selectedCompany.name, image: selectedCompany.imageUrl }}>
          <i className="fa fa-commenting"></i>
        </Link>
      </div>

      <div className="flex gap-4 my-6 px-4 max-sm:flex-col max-sm:items-center">
        {companies.map((company) => (
          <button key={company.id} onClick={() => setSelectedCompany(company)} className={`p-2 rounded-lg ${selectedCompany.id === company.id ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>
            {company.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-10 px-4">
        {selectedCompany.vehicles.map((vehicle) => (
          <div key={vehicle.id} className="flex border text-wrap rounded-lg p-4 shadow-md max-sm:flex-col">
            <img className="w-60 h-40 object-cover rounded-lg max-sm:w-full" src={vehicle.image} alt={vehicle.model} />
            <div className="mt-4 ml-4 max-sm:ml-0">
              <h2 className="font-bold text-xl">{vehicle.model}</h2>
              <p className="text-sm text-gray-600">
                Capacity: {vehicle.capacity} <br />
                Color: {vehicle.color} <br />
                Mileage: {vehicle.mileage} <br />
                Class: {vehicle.class}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rpf;