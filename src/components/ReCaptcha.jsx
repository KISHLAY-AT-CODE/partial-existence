import { useEffect, useRef } from 'react';
import { siteConfig } from '../site.config';

/**
 * ReCaptcha — Embeds Google reCAPTCHA Checkbox widget.
 *
 * Props:
 * - onVerify: function(token) called when captcha is successfully solved
 * - onExpired: function() called when token expires
 * - resetRef: ref object with .reset() method
 */
export default function ReCaptcha({ onVerify, onExpired, resetRef }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
    siteConfig.recaptchaSiteKey ||
    '6Le2GZ8tAAAAACYe_3v7quzqVz_FKgv-HVM9o8FK';

  useEffect(() => {
    let isMounted = true;

    function renderWidget() {
      if (!window.grecaptcha || !containerRef.current || widgetIdRef.current !== null) return;
      try {
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
            if (isMounted && onExpired) onExpired();
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.debug('[reCAPTCHA] Render error:', err.message);
      }
    }

    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
    } else {
      const scriptId = 'google-recaptcha-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onGoogleRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        window.onGoogleRecaptchaLoad = () => {
          if (isMounted) renderWidget();
        };
      } else {
        const checkInterval = setInterval(() => {
          if (window.grecaptcha && window.grecaptcha.render) {
            clearInterval(checkInterval);
            if (isMounted) renderWidget();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [siteKey, onVerify, onExpired]);

  // Expose reset method through resetRef
  useEffect(() => {
    if (resetRef) {
      resetRef.current = {
        reset: () => {
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

  return (
    <div className="recaptcha-wrapper" style={{ margin: '0.75rem 0' }}>
      <div ref={containerRef} id="recaptcha-container" />
    </div>
  );
}
