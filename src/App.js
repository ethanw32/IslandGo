import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import './index.css';
import './App.css';
import { Routes, Route } from 'react-router-dom';
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
import Addv from './components/addv';
import Profile from './components/myprofile';
import Layout from './components/layout';
import Bsetup from "./components/bsetup";
import Book from "./components/book"
import Map from "./components/Map"
import Tours from "./components/tours"
import Vehicles from "./components/Vehicles"
import Details from "./components/Details"
import VehiclesDetails from "./components/vehiclesdetails"



function App() {


  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Taxis />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/bpf" element={<Bpf />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/rpf" element={<Rpf />} />
          <Route path="/book" element={<Book />} />
          <Route path="/addtour" element={<Addtour />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/bsignUP" element={<BsignUP />} />
          <Route path="/addv" element={<Addv />} />
          <Route path="/bsetup" element={<Bsetup />} />
          <Route path="/map" element={<Map />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/details" element={<Details />} />
          <Route path="/vdetails" element={<VehiclesDetails />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>

  );
}

export default App;
