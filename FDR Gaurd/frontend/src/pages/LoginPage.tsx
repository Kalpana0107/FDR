import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { login as apiLogin } from '../api/fdr';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { access_token } = await apiLogin(email, password);
      await login(access_token);
      toast.success('Welcome back!');
      // navigate handled by useEffect above after user is set
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'college_a' | 'college_b') => {
    if (role === 'admin') { setEmail('admin@aicte.gov.in'); setPassword('Admin@1234'); }
    else if (role === 'college_a') { setEmail('college_a@techA.edu.in'); setPassword('College@1234'); }
    else { setEmail('college_b@techB.edu.in'); setPassword('College@1234'); }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-container">
        {/* Left Panel */}
        <div className="login-panel login-panel-left">
          <div className="login-brand">
            <Shield size={56} className="brand-icon" />
            <h1 className="brand-title">FDR Guard</h1>
            <p className="brand-subtitle">AICTE Security Deposit &amp; FDR Management Portal</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Secure FDR submission and tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Real-time status updates</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Document management and audit trail</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <span>Role-based access control</span>
            </div>
          </div>
          <p className="login-disclaimer">
            ⚠️ This is a demonstration portal with synthetic data only.
            Not connected to real AICTE or banking systems.
          </p>
        </div>

        {/* Right Panel */}
        <div className="login-panel login-panel-right">
          <div className="login-form-header">
            <h2>Sign In</h2>
            <p>Access your FDR management portal</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.gov.in"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="input-with-icon">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? <span className="loading-spinner-sm" /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials</p>
            <div className="demo-buttons">
              <button className="demo-btn" onClick={() => fillDemo('admin')}>
                AICTE Admin
              </button>
              <button className="demo-btn" onClick={() => fillDemo('college_a')}>
                College A User
              </button>
              <button className="demo-btn" onClick={() => fillDemo('college_b')}>
                College B User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
