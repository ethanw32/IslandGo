import React from 'react';
import './index.css';
import './App.css';
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

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Taxis /></Layout>} />
        <Route path="/rentals" element={<Layout><Rentals /></Layout>} />
        <Route path="/bpf" element={<Layout><Bpf /></Layout>} />
        <Route path="/inbox" element={<Layout><Inbox /></Layout>} />
        <Route path="/rpf" element={<Layout><Rpf /></Layout>} />
        <Route path="/bpfp" element={<Layout><Bpfp /></Layout>} />
        <Route path="/addtour" element={<Layout><Addtour /></Layout>} />
        <Route path="/requirements" element={<Layout><Requirements /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/signup" element={<Layout><SignUp /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/bsignUP" element={<Layout><BsignUP /></Layout>} />
        <Route path="/bfront" element={<Layout><Bfront /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
