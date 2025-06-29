import React, { useState } from "react";
import useAuth from "./useAuth";
import Signinwithgoogle from "./signinwithgoogle";
import { FaEye, FaEyeSlash } from "react-icons/fa";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, resetPassword } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-dark text-dark rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center text-dark">Login</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-dark">
              Email
            </label>
            <input type="email" name="email" placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark cursor-pointer"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" onClick={handleSubmit}
            className="w-full block text-center p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700" >
            Login
          </button>

          <Signinwithgoogle />

        </form>

        <div className="text-center space-y-2">
          <button
            onClick={() => resetPassword(email)}
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            Forgot Password
          </button>
            <p className="text-sm text-dark mt-4">
            Don't have an account?
            <a href="/signup" className="text-blue-600 hover:underline ml-1">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
