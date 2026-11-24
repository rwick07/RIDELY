import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from './router';
import Navbar from './components/common/Navbar';
import { AuthProvider, AuthContext } from './auth/AuthContext';
import Home from './pages/Home';
import BookRide from './pages/BookRide';
import Register from './pages/Register';
import Login from './pages/Login';
import RideHistory from './pages/RideHistory';
import Profile from './pages/Profile';
import { useContext } from 'react';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute><BookRide /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><RideHistory /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
