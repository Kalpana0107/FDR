import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const isMock = import.meta.env.VITE_USE_MOCK === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.login(email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const demoLogin = async (role) => {
    // Simple demo credentials mapping – adjust as needed for your mock data
    const demoCreds = {
      College: { email: 'college@example.com', password: 'password' },
      Officer: { email: 'officer@example.com', password: 'password' },
      Approver: { email: 'approver@example.com', password: 'password' },
      Management: { email: 'auditor@example.com', password: 'password' },
    }[role];
    if (!demoCreds) return;
    try {
      await api.login(demoCreds.email, demoCreds.password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <section aria-labelledby="login-heading" className="flex min-h-screen items-center justify-center bg-ink/5 p-4">
      <div className="max-w-md w-full bg-white dark:bg-ink p-8 rounded-lg shadow-md">
        <h1 id="login-heading" className="text-2xl font-bold mb-6 text-center">Login to FDRGuard</h1>
        {error && <p className="text-danger mb-4" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="w-full btn btn-primary mt-2"
          >
            Sign In
          </button>
        </form>
        {isMock && (
          <div className="mt-6">
            <h2 className="text-center text-sm font-medium mb-3">Demo Logins</h2>
            <div className="grid grid-cols-2 gap-2">
              {['College', 'Officer', 'Approver', 'Management'].map((role) => (
                <button
                  key={role}
                  onClick={() => demoLogin(role)}
                  className="btn btn-outline btn-sm"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
