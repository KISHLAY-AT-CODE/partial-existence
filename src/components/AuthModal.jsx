import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ReCaptcha from './ReCaptcha';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setRecaptchaToken('');
  }, [authModalMode, isAuthModalOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (authModalMode === 'register' && !recaptchaToken) {
      setError('Please verify that you are not a robot (reCAPTCHA is required).');
      return;
    }

    setSubmitting(true);

    try {
      if (authModalMode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Failed to sign in');
        }
      } else {
        const res = await register(name, email, password, recaptchaToken);
        if (!res.success) {
          setError(res.error || 'Failed to create account');
          if (recaptchaRef.current) recaptchaRef.current.reset();
          setRecaptchaToken('');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setRecaptchaToken('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
        >
          ×
        </button>

        {/* Header Branding */}
        <div className="auth-modal-header">
          <h3 className="auth-modal-title">
            {authModalMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="auth-modal-desc">
            {authModalMode === 'login'
              ? 'Sign in to join the discussion and share your reflections.'
              : 'Create an account to join the discussion and get verified author badges.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`auth-modal-tab ${authModalMode === 'login' ? 'auth-modal-tab--active' : ''}`}
            onClick={() => setAuthModalMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-modal-tab ${authModalMode === 'register' ? 'auth-modal-tab--active' : ''}`}
            onClick={() => setAuthModalMode('register')}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && <div className="auth-modal-error">⚠️ {error}</div>}

        {/* Form */}
        <form className="auth-modal-form" onSubmit={handleSubmit}>
          {authModalMode === 'register' && (
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="auth-name">
                Display Name
              </label>
              <input
                id="auth-name"
                type="text"
                className="auth-form-input"
                placeholder="e.g. Kishlay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-form-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="auth-form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="auth-form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {authModalMode === 'register' && (
            <div className="auth-form-group auth-form-group--captcha">
              <ReCaptcha
                onVerify={(token) => {
                  setRecaptchaToken(token);
                  setError('');
                }}
                onExpired={() => setRecaptchaToken('')}
                resetRef={recaptchaRef}
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-modal-submit"
            disabled={submitting}
          >
            {submitting
              ? 'Processing...'
              : authModalMode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="auth-modal-footer">
          {authModalMode === 'login' ? (
            <p>
              Don’t have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setAuthModalMode('register')}
              >
                Create one now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setAuthModalMode('login')}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
