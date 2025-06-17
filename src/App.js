import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/layout';
import Taxis from './components/Taxis';
import Rentals from './components/Rentals';
import Bpf from './components/bpf';
import Chat from './components/chat';
import Rpf from './components/rpf';
import Book from './components/book';
import Addtour from './components/addtour';
import Requirements from './components/requirements';
import Profile from './components/myprofile';
import Contact from './components/contact';
import SignUp from './components/signUp';
import Login from './components/logIn';
import BsignUP from './components/bsignUp';
import Addv from './components/addv';
import Bsetup from './components/bsetup';
import Map from './components/Map';
import Tours from './components/tours';
import Vehicles from './components/Vehicles';
import Details from './components/Details';
import VehiclesDetails from './components/vehiclesdetails';
import Dashboard from './components/Dashboard';
import PickupSpots from './components/PickupSpots';
import AuthProvider from './AuthProvider';
import useAuth from './components/useAuth';
import Weather from './components/Weather';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Taxis />} />
          <Route path="/weather" element={<Weather />} />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pickup-spots" element={<PickupSpots />} />
        </Route>
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
