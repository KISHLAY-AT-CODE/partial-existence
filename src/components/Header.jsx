import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderGrid from './HeaderGrid';
import SearchModal from './SearchModal';
import { useAuth } from '../context/AuthContext';
import { siteConfig } from '../site.config';

/**
 * Animated cycling states for "Partial":
 * 1. Italic: "Partial"
 * 2. Partial Derivative Symbol: "∂"
 * 3. Bold: "Partial"
 */
const PARTIAL_STATES = [
  { text: 'Partial', type: 'italic' },
  { text: '∂', type: 'symbol' },
  { text: 'Partial', type: 'bold' },
];

/**
 * Header — Centered site branding with animated partial morph, background warped grid lines, search trigger, and navigation links
 */
export default function Header() {
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [stateIndex, setStateIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setStateIndex((prev) => (prev + 1) % PARTIAL_STATES.length);
        setIsFading(false);
      }, 320);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global hotkey: Ctrl+K / Cmd+K or '/' to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const currentState = PARTIAL_STATES[stateIndex];

  return (
    <>
      <header className="header" id="site-header">
        {/* White grid lines spanning full header with bend & dark void behind Partial Existence */}
        <HeaderGrid />

        {/* Extreme Top Right Bar: Sign In & User Profile */}
        <div className="header__top-right-bar">
          {isAuthenticated && user ? (
            <div className="header__user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="header__user-avatar-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                title={`${user.name} (${user.email})`}
                aria-label={`User menu for ${user.name}`}
                id="header-user-btn"
              >
                <span className="header__user-avatar-initials">
                  {(user.name || 'U')
                    .trim()
                    .split(/\s+/)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="header__user-dropdown">
                  <div className="header__user-dropdown-header">
                    <p className="header__user-dropdown-name">{user.name}</p>
                    <p className="header__user-dropdown-email">{user.email}</p>
                    <span className="header__user-dropdown-badge">✓ Verified Account</span>
                  </div>
                  <div className="header__user-dropdown-divider" />
                  <button
                    type="button"
                    className="header__user-dropdown-item header__user-dropdown-logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="header__auth-btn"
              onClick={() => openAuthModal('login')}
              id="header-auth-btn"
            >
              Sign In
            </button>
          )}
        </div>

        <div className="header__inner">
          <div className="header__brand-row">
            <div className="header__brand">
              <h1 className="header__title">
                <Link to="/" className="header__title-link">
                  <span className="header__partial-slot">
                    <span
                      className={`header__partial header__partial--${currentState.type} ${
                        isFading ? 'header__partial--fading' : ''
                      }`}
                    >
                      {currentState.text}
                    </span>
                  </span>
                  <span className="header__existence">Existence</span>
                </Link>
              </h1>
            </div>

            {/* Round Search Button */}
            <button
              type="button"
              className="header__search-btn"
              onClick={() => setIsSearchOpen(true)}
              title="Search blog posts (Ctrl+K or /)"
              aria-label="Open search dialog"
              id="header-search-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="header__search-icon"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          {siteConfig.nav && siteConfig.nav.length > 0 && (
            <nav className="header__nav" aria-label="Main navigation">
              {siteConfig.nav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
                    id={`nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Full-Page Black & White Vector Grid Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
