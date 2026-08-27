import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderGrid from './HeaderGrid';
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
 * Header — Centered site branding with animated partial morph, background warped grid lines, and navigation links
 */
export default function Header() {
  const location = useLocation();
  const [stateIndex, setStateIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

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

  const currentState = PARTIAL_STATES[stateIndex];

  return (
    <header className="header" id="site-header">
      {/* White grid lines spanning full header with bend & dark void behind Partial Existence */}
      <HeaderGrid />

      <div className="header__inner">
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
  );
}
