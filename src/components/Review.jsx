"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "./ui/useOutsideClick";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db, auth } from "./config/firebase";
import useAuth from "./useAuth";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const StarIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

export function Review({
  isOpen,
  onClose,
  product,
  productType = 'tour' // 'tour' or 'vehicle'
}) {
  const { userDetails, loading: authLoading } = useAuth();
  const [active, setActive] = useState(product);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const ref = useRef(null);
  const id = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const { businessId, ownerId, image, name } = location.state || {};

  // Determine collection names and fields based on product type
  const productCollection = productType === 'vehicle' ? 'rentals' : 'tours';
  const titleField = productType === 'vehicle' ? 'model' : 'title';
  const imageField = productType === 'vehicle' ? 'imageUrl' : 'image';

  useEffect(() => {
    console.log(`${productType} Review mounted with product:`, product);
    console.log("User details:", userDetails);
    console.log("Auth current user:", auth.currentUser);
  }, [product, userDetails, productType]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product?.id) return;

      setIsLoading(true);
      try {
        const productRef = doc(db, productCollection, product.id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProductDetails({ id: productSnap.id, ...productSnap.data() });
        } else {
          setError(`${productType} details not found`);
        }
      } catch (err) {
        setError(`Failed to load ${productType} details`);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchReviews = async () => {
      if (!product?.id) {
        setError(`No ${productType} ID provided`);
        return;
      }

      setIsLoadingReviews(true);
      try {
        console.log(`Fetching reviews for ${productType} ID:`, product.id);
        const reviewsRef = collection(db, "reviews");
        const q = query(
          reviewsRef,
          where("productId", "==", product.id),
          where("productType", "==", productType),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log(`No reviews found for this ${productType}`);
          setReviews([]);
        } else {
          console.log(`Found ${querySnapshot.size} reviews`);
          const reviewsData = [];
          querySnapshot.forEach((doc) => {
            if (doc.exists()) {
              reviewsData.push({ id: doc.id, ...doc.data() });
            }
          });
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(`Failed to load reviews: ${err.message}`);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if (isOpen && product?.id) {
      fetchProductDetails();
      fetchReviews();
    }
  }, [isOpen, product, productType, productCollection]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActive(product);
      setRating(0);
      setComment("");
      setError("");
    } else {
      document.body.style.overflow = "auto";
      setProductDetails(null);
      setReviews([]);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, product]);

  useOutsideClick(ref, onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!product?.id) {
      setError(`Invalid ${productType} data - missing ID`);
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (authLoading) {
      setError("Checking authentication status...");
      return;
    }

    if (!userDetails) {
      setError("You must be logged in to submit a review");
      return;
    }

    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      setError("User authentication not found. Please log in again.");
      return;
    }

    const userId = currentAuthUser.uid;
    if (!userId) {
      setError("User ID is missing. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare review data
      const reviewData = {
        productId: product.id,
        productType: productType,
        businessId: product.businessId || "",
        productTitle: product[titleField] || `Untitled ${productType}`,
        rating,
        comment: comment.trim() || "No comment provided",
        userName: userDetails.name || userDetails.email || "Guest",
        userId: userId,
        createdAt: serverTimestamp(),
        imageUrl: productDetails?.[imageField] || product.src || product.imageUrl || ""
      };

      console.log("Submitting review:", reviewData);

      // Add review to Firestore
      const docRef = await addDoc(collection(db, "reviews"), reviewData);
      console.log("Review submitted successfully with ID:", docRef.id);

      // Refresh reviews after submission
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("productId", "==", product.id),
        where("productType", "==", productType),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const reviewsData = [];
      querySnapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() });
      });
      setReviews(reviewsData);

      // Reset form
      setRating(0);
      setComment("");
      setError("");

      // Show success message
      toast.success("Review submitted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate(-1);
    } catch (error) {
      console.error("Error adding review: ", error);

      let errorMessage = "Failed to submit review. Please try again.";

      if (error.code) {
        switch (error.code) {
          case "permission-denied":
            errorMessage = "You don't have permission to submit reviews.";
            break;
          case "invalid-argument":
            errorMessage = "Invalid data submitted. Please check your input.";
            break;
          case "unavailable":
            errorMessage = "Network error. Please check your connection.";
            break;
          default:
            errorMessage = `Firebase error: ${error.code}`;
        }
      }

      setError(errorMessage);

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => {
      const images = productType === 'vehicle'
        ? (productDetails?.vehicle?.images || [productDetails?.vehicle?.image])
        : (productDetails?.images || [productDetails?.[imageField] || product.src || product.imageUrl]);
      return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
    });
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => {
      const images = productType === 'vehicle'
        ? (productDetails?.vehicle?.images || [productDetails?.vehicle?.image])
        : (productDetails?.images || [productDetails?.[imageField] || product.src || product.imageUrl]);
      return prevIndex === images.length - 1 ? 0 : prevIndex + 1;
    });
  };

  if (!isOpen || !product) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && active ? (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            <motion.div
              layoutId={`card-${active[titleField]}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-y-auto relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
              >
                <CloseIcon />
              </button>
              <motion.div layoutId={`image-${active[titleField]}-${id}`} className="relative">
                <img
                  width={200}
                  height={200}
                  src={productType === 'vehicle'
                    ? (productDetails?.vehicle?.images?.[currentImageIndex] || productDetails?.vehicle?.image)
                    : (productDetails?.images?.[currentImageIndex] || productDetails?.[imageField] || product.src || product.imageUrl)}
                  alt={productType === 'vehicle'
                    ? `${productDetails?.vehicle?.brand} ${productDetails?.vehicle?.model}`
                    : active[titleField]}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
                {(productType === 'vehicle'
                  ? (productDetails?.vehicle?.images?.length > 1)
                  : (productDetails?.images?.length > 1)) && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {(productType === 'vehicle'
                          ? (productDetails?.vehicle?.images || [])
                          : (productDetails?.images || [])).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                            />
                          ))}
                      </div>
                    </>
                  )}
              </motion.div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <motion.h3
                    layoutId={`title-${active[titleField]}-${id}`}
                    className="font-bold text-2xl text-neutral-700 dark:text-neutral-200"
                  >
                    {active[titleField]}
                  </motion.h3>

                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ) : null}

                  <div className="border-t pt-4 space-y-6">
                    {authLoading ? (
                      <p className="text-blue-500 dark:text-blue-400">
                        Checking authentication status...
                      </p>
                    ) : userDetails ? (
                      <>
                        <div className="flex flex-col gap-2">
                          <h4 className="font-medium text-neutral-600 dark:text-neutral-300">
                            Rate this {productType} as <span className="font-bold">{userDetails.name || userDetails.email}</span>
                          </h4>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                              >
                                <Star
                                  className={`h-8 w-8 ${(hover || rating) >= star
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="comment"
                            className="font-medium text-neutral-600 dark:text-neutral-300"
                          >
                            Your Review
                          </label>
                          <textarea
                            id="comment"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full text-white p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700"
                            placeholder="Share your experience..."
                          />
                        </div>

                        {error && (
                          <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting || rating === 0}
                          className={`w-full py-3 px-4 rounded-lg font-bold text-white ${isSubmitting || rating === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                            } transition-colors`}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                      </>
                    ) : (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        Please log in to leave a review
                      </p>
                    )}
                  </div>

                  {/* Reviews Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-bold text-neutral-700 dark:text-neutral-200 mb-4">
                      Reviews ({reviews.length})
                    </h3>

                    {isLoadingReviews ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : reviews.length === 0 ? (
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No reviews yet. Be the first to review!
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-neutral-700 dark:text-neutral-200">
                                  {review.userName || "Anonymous"}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${review.rating >= star
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300 fill-gray-300"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300 mt-2">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default Review;