import React from "react";

const StarRating = ({ rating }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <i
          key={index}
          className={`fa fa-star ${
            index < rating ? "text-yellow-500" : "text-gray-300"
          }`}
        ></i>
      ))}
    </div>
  );
};

export default StarRating;