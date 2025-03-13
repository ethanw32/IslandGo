import React from 'react';
import './index.css';
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import Header from './components/header';
import Taxis from './components/Taxis';
import Rentals from './components/Rentals';
import Bpf from './components/bpf';
import Inbox from './components/inbox';
import Rpf from './components/rpf';
import Requirements from './components/requirements';
import Contact from './components/contact';
import Footer from './components/footer';
import Login from './components/logIn';
import SignUp from './components/signUp';
import Bpfp from './components/bpfp';
import Addtour from './components/addtour';
import BsignUP from './components/bsignUp';
import Bfront from './components/bfront';
import Myprofile from './components/myprofile';




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<><Header/><Taxis/><Footer/></>} />
        <Route path="/rentals" element={<><Header/><Rentals/><Footer/></>} />
        <Route path="/bpf" element={<><Header/><Bpf/><Footer/></>} />
        <Route path="/inbox" element={<><Header/><Inbox/><Footer/></>} />
        <Route path="/rpf" element={<><Header/><Rpf/><Footer/></>} />
        <Route path="/bpfp" element={<><Header/><Bpfp/><Footer/></>} />
        <Route path="/addtour" element={<><Header/><Addtour/><Footer/></>} />
        <Route path="/requirements" element={<><Header/><Requirements/><Footer/></>} />
        <Route path="/contact" element={<><Header/><Contact/><Footer/></>} />
        <Route path="/signup" element={<><Header/><SignUp/><Footer/></>} />
        <Route path="/login" element={<><Header/><Login/><Footer/></>} />
        <Route path="/bsignUP" element={<><Header/><BsignUP/><Footer/></>} />
        <Route path="/bfront" element={<><Header/><Bfront/><Footer/></>} />
        <Route path="/myprofile" element={<><Header/><Myprofile/><Footer/></>} />
      </Routes>
    </Router>
  );
  
}

export default App;
