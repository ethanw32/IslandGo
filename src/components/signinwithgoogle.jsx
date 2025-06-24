import React from "react";
import useAuth from "./useAuth";

function Signinwithgoogle() {
  const { googleLogin } = useAuth();

  return (
  <div className="text-center pt-3">

      <div className="flex items-center justify-center">
        <div className="w-20 h-px bg-gray-300"></div>
        <p className="mx-4 text-xs text-gray-500">Or</p>
        <div className="w-20 h-px bg-gray-300"></div>
      </div>

      <div
        className="border-black border-2 dark:border-white w-[60%] max-sm:w-[80%] p-2 rounded-full flex bg-dark text-dark text-center m-auto my-8 hover:border-red-500 dark:hover:border-red-500 cursor-pointer"
        onClick={googleLogin}
      >
        <img
          src="/images/Google__G__logo.svg"
          alt="Google Logo"
          className="rounded-[100%] w-10 pl-3 mr-3 px-0"
        />
        Sign in with Google
      </div>
  </div>
  );
}

export default Signinwithgoogle;