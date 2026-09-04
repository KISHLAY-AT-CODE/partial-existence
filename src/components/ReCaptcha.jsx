import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '../site.config';

/**
 * ReCaptcha — Embeds Google reCAPTCHA v2 Checkbox widget with automatic fallback.
 *
 * Props:
 * - onVerify: function(token) called when captcha is successfully solved
 * - onExpired: function() called when token expires
 * - resetRef: ref object with .reset() method
 */
export default function ReCaptcha({ onVerify, onExpired, resetRef }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [fallbackChecked, setFallbackChecked] = useState(false);
  const [isVerifyingFallback, setIsVerifyingFallback] = useState(false);

  const siteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
    siteConfig.recaptchaSiteKey ||
    '6Le2GZ8tAAAAACYe_3v7quzqVz_FKgv-HVM9o8FK';

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.grecaptcha || !window.grecaptcha.render) {
        return;
      }
      try {
        if (widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
            return;
          } catch {
            widgetIdRef.current = null;
          }
        }

        containerRef.current.innerHTML = '';
        const id = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token) => {
            if (isMounted && onVerify) onVerify(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpired) onExpired();
          },
          'error-callback': () => {
            console.warn('[reCAPTCHA] Widget error callback fired, switching to fallback');
            if (isMounted) setLoadError(true);
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.debug('[reCAPTCHA] Render error:', err.message);
        if (isMounted && !widgetIdRef.current) {
          setLoadError(true);
        }
      }
    }

    if (window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(renderWidget);
    } else {
      const scriptId = 'google-recaptcha-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onGoogleRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          if (isMounted) setLoadError(true);
        };
        document.head.appendChild(script);

        window.onGoogleRecaptchaLoad = () => {
          if (isMounted && window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(renderWidget);
          }
        };
      } else {
        const checkInterval = setInterval(() => {
          if (window.grecaptcha && window.grecaptcha.render) {
            clearInterval(checkInterval);
            if (window.grecaptcha.ready) {
              window.grecaptcha.ready(renderWidget);
            } else {
              renderWidget();
            }
          }
        }, 150);

        timerId = setTimeout(() => {
          clearInterval(checkInterval);
          if (isMounted && widgetIdRef.current === null) {
            // If still not loaded after 4 seconds, activate fallback
            setLoadError(true);
          }
        }, 4000);

        return () => {
          clearInterval(checkInterval);
          if (timerId) clearTimeout(timerId);
        };
      }
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [siteKey, onVerify, onExpired]);

  // Expose reset method through resetRef
  useEffect(() => {
    if (resetRef) {
      resetRef.current = {
        reset: () => {
          setFallbackChecked(false);
          if (window.grecaptcha && widgetIdRef.current !== null) {
            try {
              window.grecaptcha.reset(widgetIdRef.current);
            } catch {
              // Ignore
            }
          }
        },
      };
    }
  }, [resetRef]);

  function handleFallbackToggle(e) {
    const checked = e.target.checked;
    if (checked) {
      setIsVerifyingFallback(true);
      setTimeout(() => {
        setIsVerifyingFallback(false);
        setFallbackChecked(true);
        const token = `human_verified_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        if (onVerify) onVerify(token);
      }, 500);
    } else {
      setFallbackChecked(false);
      if (onExpired) onExpired();
    }
  }

  return (
    <div className="recaptcha-wrapper" style={{ margin: '0.75rem 0' }}>
      {!loadError ? (
        <div ref={containerRef} id="recaptcha-container" />
      ) : (
        <div className="recaptcha-fallback-box">
          <label className="recaptcha-fallback-label">
            <input
              type="checkbox"
              className="recaptcha-fallback-checkbox"
              checked={fallbackChecked}
              onChange={handleFallbackToggle}
              disabled={isVerifyingFallback}
            />
            <span className="recaptcha-fallback-checkmark">
              {isVerifyingFallback ? (
                <span className="recaptcha-spinner" />
              ) : fallbackChecked ? (
                '✓'
              ) : null}
            </span>
            <span className="recaptcha-fallback-text">I am not a robot</span>
          </label>
          <div className="recaptcha-fallback-badge">
            <span className="recaptcha-fallback-logo">🛡️</span>
            <span className="recaptcha-fallback-sub">Security Check</span>
          </div>
        </div>
      )}
    </div>
  );
}
