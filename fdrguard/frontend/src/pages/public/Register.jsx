// file: src/pages/public/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    institutionName: '',
    email: '',
    password: '',
    confirmPassword: '',
    certificate: null,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const isMock = import.meta.env.VITE_USE_MOCK === 'true';

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      // In the mock implementation we just pretend the registration succeeded.
      // Real implementation would POST a multipart/form‑data payload.
      if (isMock) {
        // mock endpoint (you can add a handler later)
        await new Promise((r) => setTimeout(r, 500));
      } else {
        const payload = new FormData();
        payload.append('institution_name', form.institutionName);
        payload.append('email', form.email);
        payload.append('password', form.password);
        if (form.certificate) payload.append('certificate', form.certificate);
        await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/register`, {
          method: 'POST',
          body: payload,
        });
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <section aria-labelledby="register-heading" className="flex min-h-screen items-center justify-center bg-ink/5 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-ink p-8 rounded-lg shadow-md">
        <h1 id="register-heading" className="text-2xl font-bold mb-6 text-center">
          Register Your Institution
        </h1>

        {error && <p className="text-danger mb-4" role="alert">{error}</p>}
        {success && <p className="text-success mb-4">Registration successful! Redirecting to login…</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="institutionName" className="block text-sm font-medium mb-1">
              Institution Name
            </label>
            <input
              type="text"
              id="institutionName"
              name="institutionName"
              required
              value={form.institutionName}
              onChange={handleChange}
              className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="certificate" className="block text-sm font-medium mb-1">
              Institution Certificate (PDF)
            </label>
            <input
              type="file"
              id="certificate"
              name="certificate"
              accept="application/pdf"
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <button type="submit" className="w-full btn btn-primary mt-2">
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-brand hover:underline">
            Log in here
          </a>
        </p>
      </div>
    </section>
  );
}
