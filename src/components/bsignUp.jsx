import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation for path detection

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current path
  const [activeTab, setActiveTab] = useState("taxis");

  const [formData, setFormData] = useState({
    fname: "",
    Bname: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (location.pathname === "/bsignUp") {
      setActiveTab("bsignUp");
    } else if (location.pathname === "/signUp") {
      setActiveTab("clientt");
    }
  }, [location.pathname]);

  const handleClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fname || !formData.Bname || !formData.email || !formData.password) {
      setError("All fields are required.");
      return;
    }

    setError(""); // Clear error if valid

    console.log("Form submitted:", formData);

    // Redirect to the front page after successful submission
    navigate("/bfront");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900">Sign Up</h2>

        {/* Taxis and Rentals Tabs */}
        <div className="h-fit w-full pt-10 relative">
          <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto">
            <div className="flex h-full">

              {/* Taxis Button */}
              <div
                onClick={() => handleClick("client", "/signUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "client"
                    ? "bg-black text-white rounded-3xl"
                    : "bg-white hover:bg-gray-200 rounded-3xl"
                } transition-all`}
              >
                Client
              </div>

              {/* Rentals Button */}
              <div
                onClick={() => handleClick("rentals", "/bsignUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "bsignUp"
                    ? "bg-black text-white rounded-3xl"
                    : "bg-white hover:bg-gray-200 rounded-3xl"
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
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              className="w-full p-3 mt-1 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your first name"
              required
            />
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              name="Bname"
              value={formData.Bname}
              onChange={handleChange}
              className="w-full p-3 mt-1 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your business name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 mt-1 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 mt-1 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              required
            />
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
        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}
