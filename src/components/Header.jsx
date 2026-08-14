import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '../site.config';

/**
 * Header — Blog title and navigation links from site.config.js
 */
export default function Header() {
  const location = useLocation();

  return (
    <header className="header" id="site-header">
      <div className="header__inner">
        <div className="header__brand">
          <h1 className="header__title">
            <Link to="/">{siteConfig.title}</Link>
          </h1>
        </div>
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
      </div>
    </header>
  );
}
