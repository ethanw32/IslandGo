import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "./config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("taxis");

  const [formData, setFormData] = useState({
    fname: "",
    Bname: "",
    email: "",
    password: "",
    confirmPassword: "", // Add confirm password field
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle confirm password visibility

  useEffect(() => {
    if (location.pathname === "/bsignUp") {
      setActiveTab("bsignUp");
    } else if (location.pathname === "/signUp") {
      setActiveTab("client");
    }
  }, [location.pathname]);

  const handleClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!formData.fname || !formData.Bname || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Save business data to Firestore
      await setDoc(doc(db, "businesses", user.uid), {
        name: formData.fname,
        businessName: formData.Bname,
        email: formData.email,
        role: "business", // Add role for business
        createdAt: new Date().toISOString(),
      });

      // Show success message
      toast.success("Business account created successfully!", { position: "top-center" });

      // Redirect to the business front page
      navigate("/bsetup");
    } catch (error) {
      // Handle Firebase errors
      let errorMessage = "An error occurred during registration.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak.";
      }
      setError(errorMessage);
      toast.error(errorMessage, { position: "bottom-center" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-dark text-dark rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-dark">Sign Up</h2>

        {/* Taxis and Rentals Tabs */}
        <div className="h-fit w-full pt-10 relative">
          <div className="rounded-3xl font-medium bg-dark text-lg h-10 w-40 m-auto">
            <div className="flex h-full">
              {/* Taxis Button */}
              <div
                onClick={() => handleClick("client", "/signUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "client"
                    ? "bg-black text-white dark:text-dark dark:bg-white rounded-3xl"
                    : "bg-dark hover:bg-gray-200 hover:text-black rounded-3xl"
                } transition-all`}
              >
                Client
              </div>

              {/* Rentals Button */}
              <div
                onClick={() => handleClick("rentals", "/bsignUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "bsignUp"
                    ? "bg-black text-white dark:text-black dark:bg-white rounded-3xl"
                    : "bg-dark dark:bg-white dark:text-black hover:bg-gray-200 dark:hover:text-black rounded-3xl"
                } transition-all`}
              >
                Business
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-dark">Name</label>
            <input
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your first name"
              required
            />
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-dark">Business Name</label>
            <input
              type="text"
              name="Bname"
              value={formData.Bname}
              onChange={handleChange}
              className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your business name"
              required
            />
          </div>

          {/* Email */}
          <div>
          <label className="block text-sm font-medium text-dark">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // Toggle input type
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)} // Toggle visibility
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Toggle eye icon */}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} // Toggle input type
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle visibility
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />} {/* Toggle eye icon */}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full block text-center p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Sign up
          </button>
        </form>

        {/* Login Link */}
        <p className="text-sm text-center text-dark">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log In
          </a>
        </p>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}