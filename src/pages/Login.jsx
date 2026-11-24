// src/pages/Login.jsx
import React from 'react';
import { useNavigate, Link } from '../router';
import { AuthForm } from '../components/AuthForm';
import { loginUser } from '../auth/authService';
import { useAuth } from '../auth/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const fields = [
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true, validate: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email') },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', required: true },
  ];

  const handleLogin = async (values) => {
    const user = await loginUser(values);
    login(user);
    navigate('/');
  };

  return (
    <AuthForm
      title="Welcome back"
      fields={fields}
      onSubmit={handleLogin}
      submitLabel="Log in"
      footer={<p>New here? <Link to="/register" className="text-indigo-600 hover:underline">Create an account</Link></p>}
    />
  );
}
