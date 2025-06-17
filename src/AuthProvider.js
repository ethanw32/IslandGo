import React, { createContext, useEffect, useState } from "react";
import useAuth from "./components/useAuth";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{
      ...auth,
      userDetails: auth.userDetails,
      setUserDetails: auth.setUserDetails,
      login: auth.login,
      googleLogin: auth.googleLogin,
      logout: auth.logout,
      resetPassword: auth.resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;