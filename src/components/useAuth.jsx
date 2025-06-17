import { useState, useEffect } from "react";
import { auth, db } from "./config/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, sendPasswordResetEmail, signInWithRedirect } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const setAuthPersistence = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (error) {
      toast.error("Error setting authentication persistence");
    }
  };

  const fetchUserOrBusinessData = async (email) => {
    try {
      // Query businesses first since we're primarily dealing with business users
      const businessesQuery = query(collection(db, "businesses"), where("email", "==", email));
      const businessesSnapshot = await getDocs(businessesQuery);

      if (!businessesSnapshot.empty) {
        const businessData = businessesSnapshot.docs[0].data();
        const userData = {
          ...businessData,
          type: "business",
          businessType: businessData.businessType || "Unknown",
          uid: businessesSnapshot.docs[0].id,
          businessId: businessesSnapshot.docs[0].id,
          email: businessData.email,
          name: businessData.businessName,
          photoURL: businessData.photoURL || businessData.photo || "",
          photo: businessData.photoURL || businessData.photo || ""
        };
        setUserDetails(userData);
        return true;
      }

      // If not a business, check regular users
      const usersQuery = query(collection(db, "users"), where("email", "==", email));
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        const userDetails = {
          ...userData,
          type: "user",
          uid: usersSnapshot.docs[0].id,
          photoURL: userData.photoURL || userData.photo || "",
          photo: userData.photoURL || userData.photo || ""
        };
        setUserDetails(userDetails);
        return true;
      }

      return false;
    } catch (error) {
      toast.error("Error fetching user data");
      return false;
    }
  };

  const convertImageToBase64 = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  };

  const saveUserData = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);

      // Format Google photo URL if present
      let photoURL = user.photoURL;
      if (photoURL && photoURL.includes('googleusercontent.com')) {
        // Ensure HTTPS
        photoURL = photoURL.replace('http://', 'https://');
        // Remove any existing size parameters
        photoURL = photoURL.replace(/=s\d+(-c)?/, '');
        // Add appropriate size parameter
        photoURL = `${photoURL}=s96-c`;
      }

      const userData = {
        email: user.email,
        name: user.displayName || "",
        displayName: user.displayName || "",
        photoURL: photoURL || "",
        photo: photoURL || "",
        type: "user",
        createdAt: new Date().toISOString(),
        emailVerified: user.emailVerified || false,
        lastLoginAt: new Date().toISOString()
      };

      await setDoc(userRef, userData, { merge: true });
      await fetchUserOrBusinessData(user.email);
    } catch (error) {
      toast.error("Error saving user data");
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const foundData = await fetchUserOrBusinessData(user.email);

      if (foundData) {
        toast.success("Login successful!", { position: "top-center" });
        navigate("/");
      } else {
        await signOut(auth);
      }
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure we have a valid photo URL
      let photoURL = user.photoURL;
      if (photoURL && photoURL.includes('googleusercontent.com')) {
        // Ensure HTTPS
        photoURL = photoURL.replace('http://', 'https://');
        // Remove any existing size parameters
        photoURL = photoURL.replace(/=s\d+(-c)?/, '');
        // Add appropriate size parameter
        photoURL = `${photoURL}=s96-c`;
      }

      const userRef = doc(db, "users", user.uid);
      const userData = {
        email: user.email,
        name: user.displayName || "",
        displayName: user.displayName || "",
        photoURL: photoURL || "",
        photo: photoURL || "",
        type: "user",
        createdAt: new Date().toISOString(),
        emailVerified: user.emailVerified || false,
        lastLoginAt: new Date().toISOString()
      };

      await setDoc(userRef, userData, { merge: true });

      const foundData = await fetchUserOrBusinessData(user.email);
      if (foundData) {
        toast.success("Google login successful!", { position: "top-center" });
        navigate("/");
      } else {
        await signOut(auth);
        toast.error("Error fetching user data");
      }
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        toast.error("Please allow popups for this website to use Google login", { position: "bottom-center" });
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Login cancelled", { position: "bottom-center" });
      } else {
        toast.error(error.message, { position: "bottom-center" });
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      setUserDetails(null);
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const resetPassword = async (email) => {
    if (!email) {
      toast.error("Please enter your email address to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      toast.error(error.message || "Failed to send password reset email.");
    }
  };

  useEffect(() => {
    setAuthPersistence();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Handle Google sign-in redirect
        if (user.providerData[0]?.providerId === 'google.com') {
          try {
            // Ensure we have a valid photo URL
            let photoURL = user.photoURL;
            if (photoURL && photoURL.includes('googleusercontent.com')) {
              // Ensure HTTPS
              photoURL = photoURL.replace('http://', 'https://');

              // Remove any existing size parameters
              photoURL = photoURL.replace(/=s\d+(-c)?/, '');

              // Add appropriate size parameter
              photoURL = `${photoURL}=s96-c`;
            }

            const userRef = doc(db, "users", user.uid);
            const userData = {
              email: user.email,
              name: user.displayName || "",
              displayName: user.displayName || "",
              photoURL: photoURL || "",
              photo: photoURL || "",
              type: "user",
              createdAt: new Date().toISOString(),
              emailVerified: user.emailVerified || false,
              lastLoginAt: new Date().toISOString()
            };

            await setDoc(userRef, userData, { merge: true });
            navigate("/");
          } catch (error) {
            toast.error("Error saving user data");
          }
        }

        await fetchUserOrBusinessData(user.email);
      } else {
        setUserDetails(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    userDetails,
    setUserDetails,
    loading,
    login,
    googleLogin,
    logout,
    resetPassword
  };
};

export default useAuth;