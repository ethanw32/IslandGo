import React, { useState,useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Signinwithgoogle from "./signinwithgoogle";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function SignUp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long", { position: "bottom-center" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", { position: "bottom-center" });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        type: activeTab, 
        createdAt: new Date().toISOString(),
      });

      toast.success("User Registered Successfully", { position: "top-center" });
      navigate("/");
    } catch (error) {
      let errorMessage = "An error occurred during registration.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak.";
      }
      toast.error(errorMessage, { position: "bottom-center" });
    }
  };

  useEffect(() => {
    if (window.location.pathname === "/signUp") {
      setActiveTab("client");
    } else if (window.location.pathname === "/bsignUp") {
      setActiveTab("business");
    }
  }, [window.location.pathname]);

  const handleTabClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };


  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-dark text-dark rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-dark">Sign Up</h2>

        {/* Client and Business Tabs */}
        <div className="h-fit w-full pt-10 relative">
          <div className="rounded-3xl font-medium bg-dark text-lg h-10 w-40 m-auto">
            <div className="flex h-full">
              <div
                onClick={() => handleTabClick("client", "/signUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "client"
                    ? "bg-black text-white dark:text-black dark:bg-white rounded-3xl"
                    : "bg-dark dark:text-black hover:bg-gray-200 hover:text-black rounded-3xl"
                } transition-all`}
              >
                Client
              </div>
              <div
                onClick={() => handleTabClick("business", "/bsignUp")}
                className={`w-1/2 h-full flex items-center justify-center cursor-pointer ${
                  activeTab === "business"
                    ? "bg-black text-white dark:text-dark dark:bg-white rounded-3xl"
                    : "bg-dark hover:bg-gray-200 hover:text-black rounded-3xl"
                } transition-all`}
              >
                Business
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-dark">Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full p-3 mt-1 border bg-dark text-dark rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark cursor-pointer"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full block text-center p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Sign up
      </button>

      <Signinwithgoogle />
    </form>

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

export default SignUp;