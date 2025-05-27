import { useState, useEffect } from "react";
import { auth, db } from "./config/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const [userDetails, setUserDetails] = useState(null);
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
      // Query users
      const usersQuery = query(collection(db, "users"), where("email", "==", email));
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        const userId = usersSnapshot.docs[0].id;
        
        console.log("Raw user data from Firestore:", {
          id: userId,
          email: userData.email,
          name: userData.name,
          photo: userData.photo ? "[exists]" : "[missing]",
          photoURL: userData.photoURL ? "[exists]" : "[missing]",
        });
        
        // If user logged in with Google but we don't have their photo/photoURL
        // Get it directly from auth.currentUser
        if (auth.currentUser && auth.currentUser.photoURL && (!userData.photo && !userData.photoURL)) {
          console.log("Updating missing photo from auth.currentUser");
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            photo: auth.currentUser.photoURL,
            photoURL: auth.currentUser.photoURL
          });
          
          // Update local userData
          userData.photo = auth.currentUser.photoURL;
          userData.photoURL = auth.currentUser.photoURL;
        }
        
        // Explicitly set both photo and photoURL in userDetails
        setUserDetails({
          ...userData,
          type: "user",
          // Ensure both photo fields are set
          photo: userData.photo || userData.photoURL || "",
          photoURL: userData.photoURL || userData.photo || ""
        });
        
        return true;
      }

      // Query businesses
      const businessesQuery = query(collection(db, "businesses"), where("email", "==", email));
      const businessesSnapshot = await getDocs(businessesQuery);

      if (!businessesSnapshot.empty) {
        const businessData = businessesSnapshot.docs[0].data();
        setUserDetails({ ...businessData, type: "business" });
        return true;
      }

      toast.error("No account found with this email");
      return false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error fetching user data");
      return false;
    }
  };

  const saveUserData = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Store both original URL and in the photo field for compatibility
      const userData = {
        email: user.email,
        name: user.displayName || "",
        photo: user.photoURL || "", // Store in photo field for compatibility with existing code
        photoURL: user.photoURL || "",
        type: "user",
        createdAt: new Date().toISOString(),
      };
      
      console.log("Saving Google user data:", {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL ? "[photo URL exists]" : "[no photo URL]"
      });
      
      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error("Error saving user data:", error);
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
    // Request additional scopes to ensure we get the profile image
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log("Google user data:", user); // Debug log

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Always save/update user data to ensure we have the latest photo
      await saveUserData(user);
      
      // Force refresh the user data to ensure we have the latest information
      await fetchUserOrBusinessData(user.email);
      
      toast.success("Google login successful!", { position: "top-center" });
      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message, { position: "bottom-center" });
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserOrBusinessData(user.email);
      } else {
        setUserDetails(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    userDetails,
    login,
    googleLogin,
    logout,
    resetPassword,
  };
};

export default useAuth;