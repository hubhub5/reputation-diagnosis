import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Top, Foot } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Test from './pages/Test.jsx';
import Result from './pages/Result.jsx';
import Report from './pages/Report.jsx';
import { PeerHub, PeerInvite, PeerRespond } from './pages/Peer.jsx';
import Sentence from './pages/Sentence.jsx';
import Roadmap from './pages/Roadmap.jsx';
import Services from './pages/Services.jsx';
import Consult from './pages/Consult.jsx';
import Me from './pages/Me.jsx';
import Admin from './pages/Admin.jsx';
import Mail from './pages/Mail.jsx';
import Privacy from './pages/Privacy.jsx';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const bare = pathname.startsWith('/p/');
  return (
    <>
      <Top />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/test" element={<Test />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="/peer" element={<PeerHub />} />
        <Route path="/peer/new/:id" element={<PeerInvite />} />
        <Route path="/p/:token" element={<PeerRespond />} />
        <Route path="/sentence" element={<Sentence />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/services" element={<Services />} />
        <Route path="/consult" element={<Consult />} />
        <Route path="/me" element={<Me />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/mail/:id" element={<Mail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {!bare && <Foot />}
    </>
  );
}
