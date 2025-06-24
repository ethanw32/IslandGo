import React from "react";
import Header from './header';
import Footer from "./footer";
import { Outlet, useLocation } from "react-router-dom";

// In your Layout component
const Layout = () => {
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  return (
    <div>
      <Header />
      <main className="container mx-auto py-6 px-4">
        <Outlet />
      </main>
      {!isChat && <Footer />}
    </div>
  );
};

export default Layout;