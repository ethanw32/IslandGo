import { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch user or business data from Firestore by email
  const fetchUserOrBusinessData = async (email) => {
    try {
      console.log("Fetching data for email:", email); // Debugging

      // Query the "users" collection for the email
      const usersQuery = query(collection(db, "users"), where("email", "==", email));
      const usersSnapshot = await getDocs(usersQuery);

      console.log("Users query results:", usersSnapshot.docs); // Debugging

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        console.log("User data fetched:", userData); // Debugging
        setUserDetails({ ...userData, type: "user" }); // Set user details
        return;
      }

      // Query the "businesses" collection for the email
      const businessesQuery = query(collection(db, "businesses"), where("email", "==", email));
      const businessesSnapshot = await getDocs(businessesQuery);

      console.log("Businesses query results:", businessesSnapshot.docs); // Debugging

      if (!businessesSnapshot.empty) {
        const businessData = businessesSnapshot.docs[0].data();
        console.log("Business data fetched:", businessData); // Debugging
        setUserDetails({ ...businessData, type: "business" }); // Set business details
        return;
      }

      // If no data is found
      console.log("No user or business data found for this email");
      toast.error("No account found with this email");
    } catch (error) {
      console.error("Error in fetchUserOrBusinessData:", error); // Debugging
      toast.error("Error fetching user or business data");
    }
  };

  // Save user data to Firestore
  const saveUserData = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid); // Use UID as document ID
      const userData = {
        email: user.email,
        name: user.displayName || "",
        photoURL: user.photoURL || "",
        type: "user",
        createdAt: new Date().toISOString(),
      };
      console.log("Saving user data:", userData); // Debugging
      await setDoc(userRef, userData, { merge: true }); // Merge to avoid overwriting other fields
    } catch (error) {
      toast.error("Error saving user data");
      console.error(error); // Debugging
    }
  };

  // Email/password login
  const login = async (email, password) => {
    try {
      setIsLoading(true); // Start loading
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User logged in:", user); // Debugging

      // Check if the email belongs to a user or business
      await fetchUserOrBusinessData(user.email);

      toast.success("Login successful!", { position: "top-center" });
      navigate("/"); // Redirect to home page
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
      console.error(error); // Debugging
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Google login
  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true); // Start loading
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google user logged in:", user); // Debugging

      // Check if user data exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Save user data if it doesn't exist
        console.log("Saving new user data for Google login"); // Debugging
        await saveUserData(user);
      }

      // Fetch user data after Google login
      await fetchUserOrBusinessData(user.email);
      toast.success("Google login successful!", { position: "top-center" });
      navigate("/"); // Redirect to home page
    } catch (error) {
      console.error("Error in googleLogin:", error); // Debugging
      toast.error(error.message, { position: "bottom-center" });
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      setUserDetails(null); // Clear user details
      navigate("/login"); // Redirect to login page
    } catch (error) {
      toast.error("Error logging out");
      console.error(error); // Debugging
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed - user logged in:", user); // Debugging
        fetchUserOrBusinessData(user.email); // Fetch user or business data
      } else {
        console.log("Auth state changed - no user"); // Debugging
        setUserDetails(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { userDetails, isLoading, login, googleLogin, logout };
};

export default useAuth;