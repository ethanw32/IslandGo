import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from "./config/firebase";
import { toast } from "react-toastify";

function Requirements() {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageUrl, title } = location.state || {};

  const handleMessageClick = (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.info("Please log in to send messages", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    navigate('/chat', { state: { businessName: title, businessImage: imageUrl } });
  };

  return (
    <div>
      <div className="h-fit w-full relative pb-10">
        <div className="flex py-6 items-center">
          <Link to="/rpf" state={{ imageUrl, title }}>
            <img className="h-16 ml-5 max-sm:h-12 rounded-full" src={imageUrl} alt="" />
          </Link>
          <h1 className="text-3xl ml-10 max-sm:text-2xl">{title}</h1>
          <button
            onClick={handleMessageClick}
            className="text-4xl max-sm:text-3xl ml-auto mr-5 cursor-pointer"
          >
            <i className="fa fa-commenting"></i>
          </button>
        </div>

        <div className="rounded-md w-[600px] m-auto p-5 space-y-4 max-sm:text-sm max-sm:w-[360px]">
          <ul className="list-disc list-inside">
            <li>
              <strong>Minimum Age Requirement:</strong>
              <ul className="list-disc list-inside ml-5">
                <li>Renters must be at least 21 years old to rent a vehicle.</li>
                <li>Renters under 25 may incur an additional "young driver" surcharge.</li>
              </ul>
            </li>
            <li>
              <strong>Valid Driver's License:</strong>
              <ul className="list-disc list-inside ml-5">
                <li>Renters must present a valid driver's license that has been held for at least one year.</li>
                <li>An international driver's permit (IDP) is required for non-local renters.</li>
              </ul>
            </li>
            <li>
              <strong>Proof of Identity:</strong>
              <ul className="list-disc list-inside ml-5">
                <li>A valid passport or national ID card must be provided at the time of rental.</li>
              </ul>
            </li>
            <li>
              <strong>Payment Method:</strong>
              <ul className="list-disc list-inside ml-5">
                <li>A valid credit card in the renter's name is required for the security deposit.</li>
                <li>Debit cards and cash payments may not be accepted for deposits but can be used for rental charges.</li>
              </ul>
            </li>
            <li>
              <strong>Insurance Requirements:</strong>
              <ul className="list-disc list-inside ml-5">
                <li>Basic insurance coverage is included in the rental price.</li>
                <li>Renters may opt for additional coverage for personal accident insurance or to lower the deductible on the basic coverage.</li>
              </ul>
            </li>
            <li>
              <strong>Rental Duration:</strong>
              <ul className="list-disc list-inside ml-5">
                <li>The minimum rental period is 24 hours.</li>
                <li>Late returns beyond the grace period of 1 hour may incur additional daily charges.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Requirements;
