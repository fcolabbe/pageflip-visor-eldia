import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from './components/Library';
import ViewerPage from './components/ViewerPage';
import Login from './components/Login';
import Admin from './components/Admin';
import Navbar from './components/Navbar';
import './App.css';

// Layout wrapper for pages with Navbar
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout><Library /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
        {/* Viewer is now part of MainLayout to show Header */}
        <Route path="/visor/:id" element={<MainLayout><ViewerPage /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
