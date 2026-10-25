import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          setError('Only PDF files are accepted.');
          e.target.value = '';
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError('File must be smaller than 10 MB.');
          e.target.value = '';
          return;
        }
        setError(null);
      }
      setForm((prev) => ({ ...prev, [name]: file || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // Mock: just simulate a delay
      const isMock = import.meta.env.VITE_USE_MOCK !== 'false';
      if (isMock) {
        await new Promise((r) => setTimeout(r, 500));
      } else {
        const payload = new FormData();
        payload.append('institution_name', form.institutionName);
        payload.append('email', form.email);
        payload.append('password', form.password);
        if (form.certificate) payload.append('certificate', form.certificate);
        const res = await fetch(`${import.meta.env.VITE_API_BASE || '/api'}/auth/register`, {
          method: 'POST',
          body: payload,
        });
        if (!res.ok) throw new Error(`Registration failed: ${res.statusText}`);
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="register-heading" className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="max-w-lg w-full card p-8">
        <h1 id="register-heading" className="text-2xl font-bold mb-6 text-center text-ink">
          Register Your Institution
        </h1>

        {error && <p className="text-bad-700 bg-bad-50 border border-bad-200 rounded-lg px-3 py-2 text-sm mb-4" role="alert">{error}</p>}
        {success && <p className="text-ok-700 bg-ok-50 border border-ok-200 rounded-lg px-3 py-2 text-sm mb-4">Registration successful! Redirecting to login…</p>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="institutionName" className="block text-sm font-medium mb-1 text-ink">
              Institution Name
            </label>
            <input
              type="text"
              id="institutionName"
              name="institutionName"
              required
              value={form.institutionName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-1 text-ink">
              Contact Email
            </label>
            <input
              type="email"
              id="reg-email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium mb-1 text-ink">
              Password
            </label>
            <input
              type="password"
              id="reg-password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-ink">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="certificate" className="block text-sm font-medium mb-1 text-ink">
              Institution Certificate (PDF only, max 10 MB)
            </label>
            <input
              type="file"
              id="certificate"
              name="certificate"
              accept="application/pdf"
              onChange={handleChange}
              className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink file:cursor-pointer min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary mt-2 min-h-[44px]"
          >
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </section>
  );
}
