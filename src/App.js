import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import './index.css';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import Taxis from './components/Taxis';
import Rentals from './components/Rentals';
import Bpf from './components/bpf';
import Chat from './components/chat';
import Rpf from './components/rpf';
import Requirements from './components/requirements';
import Contact from './components/contact';
import Login from './components/logIn';
import SignUp from './components/signUp';
import Addtour from './components/addtour';
import BsignUP from './components/bsignUp';
import Bfront from './components/bfront';
import Profile from './components/myprofile';
import Layout from './components/layout';
import Bsetup from "./components/bsetup"; 
import Book from "./components/book"



function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Taxis /></Layout>} />
        <Route path="/rentals" element={<Layout><Rentals /></Layout>} />
        <Route path="/bpf" element={<Layout><Bpf /></Layout>} />
        <Route path="/chat" element={<Layout><Chat /></Layout>} />
        <Route path="/rpf" element={<Layout><Rpf /></Layout>} />
        <Route path="/book" element={<Layout><Book /></Layout>} />
        <Route path="/addtour" element={<Layout><Addtour /></Layout>} />
        <Route path="/requirements" element={<Layout><Requirements /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/signup" element={<Layout><SignUp /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/bsignUP" element={<Layout><BsignUP /></Layout>} />
        <Route path="/bfront" element={<Layout><Bfront /></Layout>} />
        <Route path="/bsetup" element={<Layout><Bsetup /></Layout>} />
      </Routes>
      <ToastContainer  />
    </Router>
    
  );
}

export default App;
