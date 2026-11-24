// src/pages/Register.jsx
import React from 'react';
import { useNavigate, Link } from '../router';
import { AuthForm } from '../components/AuthForm';
import { registerUser } from '../auth/authService';
import { useAuth } from '../auth/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const fields = [
    { name: 'name', label: 'Full name', type: 'text', placeholder: 'John Doe', required: true, validate: (v) => (v.trim() ? null : 'Name is required') },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true, validate: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email') },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91‑9876543210', required: true, validate: (v) => (/^\+?\d{7,15}$/.test(v.replace(/\s+/g, '')) ? null : 'Enter a valid phone') },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', required: true, validate: (v) => (v.length >= 6 ? null : 'Password must be at least 6 chars') },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: '••••••••', required: true, validate: (v, all) => (v === all.password ? null : 'Passwords do not match') },
  ];

  const handleRegister = async (values) => {
    const { name, email, phone, password } = values;
    await registerUser({ name, email, phone, password });
    // login after registration
    login({ name, email });
    navigate('/');
  };

  return (
    <AuthForm
      title="Create your account"
      fields={fields}
      onSubmit={handleRegister}
      submitLabel="Register"
      footer={<p>Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link></p>}
    />
  );
}
