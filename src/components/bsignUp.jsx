import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export default function SignUp() {
  const navigate = useNavigate(); // Hook for navigation
  const [formData, setFormData] = useState({
    fname: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.fname || !formData.email || !formData.password) {
      setError("All fields are required.");
      return;
    }

    setError(""); // Clear error if all fields are filled

    console.log("Form submitted:", formData);

    // Redirect to the front page after successful submission
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900">Sign Up</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="Bussiness name"
              name="Bussiness name"
              value={formData.Bname}
              onChange={handleChange}
              className="w-full p-3 mt-1 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your Bussiness name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First name
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
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
