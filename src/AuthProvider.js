import React, { createContext } from "react";
import useAuth from "./useAuth";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const { userDetails, login, googleLogin } = useAuth();
  
  return (
    <AuthContext.Provider value={{ userDetails, login, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;