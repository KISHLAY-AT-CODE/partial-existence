import { useState, useEffect } from 'react';
import { getCookieConsent, setCookieConsent } from '../cookies';

/**
 * ConsentNotice — Modern, floating glassmorphic cookie disclosure popup in footer.
 * Named ConsentNotice to prevent aggressive ad-blockers / Brave Shields from blocking the module.
 */
export default function ConsentNotice() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Check if consent has already been recorded
    const consent = getCookieConsent();
    if (!consent) {
      // Delay entrance slightly for smooth page load experience
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    setCookieConsent('accepted');
    closeNotice();
  }

  function handleEssentialOnly() {
    setCookieConsent('essential');
    closeNotice();
  }

  function closeNotice() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
    }, 400);
  }

  if (!visible) return null;

  return (
    <div
      className={`consent-notice ${closing ? 'consent-notice--closing' : 'consent-notice--opening'}`}
      role="dialog"
      aria-label="Privacy and preferences disclosure"
      id="privacy-disclosure-popup"
    >
      <div className="consent-notice__card">
        <div className="consent-notice__header">
          <div className="consent-notice__icon-wrap" aria-hidden="true">
            🍪
          </div>
          <div>
            <h4 className="consent-notice__title">Cookie & Privacy Notice</h4>
            <span className="consent-notice__badge">Essential Transparency</span>
          </div>
          <button
            className="consent-notice__close"
            onClick={handleEssentialOnly}
            aria-label="Dismiss privacy notice"
            title="Dismiss"
          >
            ×
          </button>
        </div>

        <p className="consent-notice__desc">
          We use first-party essential cookies to remember your comment authorship,
          preserve your like interactions, and prevent duplicate counts on post views.
          No third-party trackers or ads.
        </p>

        <div className="consent-notice__actions">
          <button
            className="consent-notice__btn consent-notice__btn--accept"
            onClick={handleAccept}
            id="cookie-accept-btn"
          >
            Accept & Continue
          </button>
          <button
            className="consent-notice__btn consent-notice__btn--essential"
            onClick={handleEssentialOnly}
            id="cookie-essential-btn"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
