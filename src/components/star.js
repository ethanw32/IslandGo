import React, { useState } from "react";

const StarRating = ({ initialRating = 0, onSave }) => {
  const [rating, setRating] = useState(initialRating); // Save the rating in the state
  const [hovered, setHovered] = useState(null); // For hover effect

  const handleClick = (newRating) => {
    setRating(newRating); // Update the rating
    if (onSave) {
      onSave(newRating); // Optional: Save rating via callback
    }
  };

  const handleMouseEnter = (index) => setHovered(index); // Hover effect
  const handleMouseLeave = () => setHovered(null); // Reset hover effect

  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <i
          key={index}
          className={`fa fa-star ${
            index < (hovered ?? rating) // Use hovered or current rating
              ? "text-yellow-500"
              : "text-gray-300"
          } cursor-pointer`}
          onClick={() => handleClick(index + 1)} // 1-based rating
          onMouseEnter={() => handleMouseEnter(index + 1)}
          onMouseLeave={handleMouseLeave}
        ></i>
      ))}
    </div>
  );
};

export default StarRating;
