import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export default function SignUp() {
  const navigate = useNavigate(); // Hook for navigation
  const [formData, setFormData] = useState({
    fname: "",
    Bname: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("client");

  useEffect(() => {
    if (window.location.pathname === "/signUp") {
      setActiveTab("client");
    } else if (window.location.pathname === "/bsignUp") {
      setActiveTab("business");
    }
  }, [window.location.pathname]);

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

        {/* Client and Business Tabs */}
        <div className="h-fit w-full pt-10 relative">
          <div className="rounded-3xl font-medium bg-white text-lg h-10 w-40 m-auto">
            <div className="flex h-full">
              {/* Client Button */}
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

              {/* Business Button */}
              <div
                onClick={() => handleClick("business", "/bsignUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "business"
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

          {activeTab === "business" && (
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
          )}

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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full block text-center p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Sign up
          </button>
        </form>

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
