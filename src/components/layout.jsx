import React from "react";
import Header from './header';
import Footer from "./footer";
import { Outlet } from "react-router-dom";

// In your Layout component
const Layout = () => {
  return (
    <div>
      <Header />
      <main className="container mx-auto py-6 px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;