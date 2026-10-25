import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in → redirect to /app
  if (user) {
    navigate('/app', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login(email, password);
      if (res?.user) setUser(res.user);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setSubmitting(false);
    }
  };

  const demoLogin = async (role) => {
    if (submitting) return;
    const demoCreds = {
      College: { email: 'college@example.com', password: 'password' },
      Officer: { email: 'officer@example.com', password: 'password' },
      Approver: { email: 'approver@example.com', password: 'password' },
      Management: { email: 'auditor@example.com', password: 'password' },
    }[role];
    if (!demoCreds) return;
    setSubmitting(true);
    try {
      const res = await api.login(demoCreds.email, demoCreds.password);
      if (res?.user) setUser(res.user);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Demo login failed');
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="login-heading" className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="max-w-md w-full card p-8">
        <h1 id="login-heading" className="text-2xl font-bold mb-6 text-center text-ink">Login to FDRGuard</h1>
        {error && <p className="text-bad-700 bg-bad-50 border border-bad-200 rounded-lg px-3 py-2 text-sm mb-4" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-ink">Email</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-ink">Password</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary mt-2 min-h-[44px]"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo quick-login buttons */}
        <div className="mt-6">
          <h2 className="text-center text-sm font-medium mb-3 text-muted">Demo Logins</h2>
          <div className="grid grid-cols-2 gap-2">
            {['College', 'Officer', 'Approver', 'Management'].map((role) => (
              <button
                key={role}
                type="button"
                disabled={submitting}
                onClick={() => demoLogin(role)}
                className="btn btn-ghost text-xs min-h-[44px]"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </section>
  );
}
