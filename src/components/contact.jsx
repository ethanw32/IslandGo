import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Contact() {
  // Retrieve the state passed from the Link
  const location = useLocation();
  const {
    imageUrl,
    title,
    address,
    phone,
    email,
    operatingHours,
  } = location.state || {};

  // Map URLs for each company
  const mapUrls = {
    'Drive Grenada':
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2205.1785559973005!2d-61.748089714225216!3d12.026202146609764!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c3821239df9479d%3A0x6879646fe9d31511!2sDrive%20Grenada!5e1!3m2!1sen!2s!4v1741650000219!5m2!1sen!2s',
    'On point Rental':
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4410.705402910596!2d-61.7599665!3d12.004944300000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c3821eb7e039287%3A0xb7668ff7f392bb12!2sOn%20Point%20Auto%20Rentals%20%7C%20Car%20Rental%20in%20Grenada!5e1!3m2!1sen!2s!4v1741652891266!5m2!1sen!2s',
  };

  // Get the correct map URL based on the company title
  const mapUrl = mapUrls[title] || '';

  return (
    <div className="min-h-screen pb-10">
      {/* Header Section */}
      <div className="flex py-6 items-center">
        <Link to="/rpf" state={{ imageUrl, title }}>
          <img
            className="h-16 max-sm:h-12 ml-5 rounded-full"
            src={imageUrl}
            alt={title}
          />
        </Link>
        <h1 className="text-3xl max-sm:text-2xl ml-10">{title}</h1>
        <Link
          className="text-4xl max-sm:text-3xl ml-auto mr-5 cursor-pointer"
          to="/inbox"
          state={{
            name: title,
            imageUrl: imageUrl,
            description: 'We are a professional auto rental business. We also offer a variety of vehicles.',
          }}
        >
          <i className="fa fa-commenting"></i>
        </Link>
      </div>

      {/* Contact and Map Section */}
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Contact Information */}
        <div className="flex-1 p-6">
          <div className="space-y-4 ml-40">
            <div className="mb-10">
              <p className="font-medium text-2xl ml-10">{title}</p>
            </div>
            <div>
              <p className="font-medium text-lg">
                <i className="fa fa-map-marker mr-3"></i>
                {address}
              </p>
              <p>Address</p>
            </div>
            <div>
              <p className="font-medium text-lg">
                <i className="fa fa-phone mr-3"></i>
                {phone}
              </p>
              <p>Phone Number</p>
            </div>
            <div>
              <p className="font-medium text-lg">
                <i className="fa fa-envelope mr-3"></i>
                {email}
              </p>
              <p>Appointment</p>
            </div>
            <div>
              <p className="font-medium text-lg">
                <i className="fa fa-calendar mr-3"></i>
                {operatingHours}
              </p>
              <p>Operating Hours</p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <iframe
            width="90%"
            height="400"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={mapUrl} // Use the dynamically determined map URL
            title={`${title} Location`}
          >
            <a href="https://www.gps.ie/collections/drones/">best drones</a>
          </iframe>
        </div>
      </div>
    </div>
  );
}

export default Contact;
