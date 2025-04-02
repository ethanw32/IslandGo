import { useState, useEffect } from "react";
import { auth, db } from "./config/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from "firebase/auth";
import { collection, query, where, getDocs, getDoc, doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
        setUserDetails({ ...userData, type: "user" });
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
      toast.error("Error fetching user data");
      return false;
    }
  };

  const saveUserData = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userData = {
        email: user.email,
        name: user.displayName || "",
        photoURL: user.photoURL || "",
        type: "user",
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      toast.error("Error saving user data");
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await saveUserData(user);
      }

      await fetchUserOrBusinessData(user.email);
      toast.success("Google login successful!", { position: "top-center" });
      navigate("/");
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    setAuthPersistence();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserOrBusinessData(user.email);
      } else {
        setUserDetails(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { userDetails, isLoading, login, googleLogin, logout };
};

export default useAuth;