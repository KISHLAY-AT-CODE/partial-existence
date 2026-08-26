import { useState, useEffect } from 'react';

/**
 * Animated cycling states for "Partial":
 * 1. Italic: "Partial"
 * 2. Partial Derivative Symbol: "∂"
 * 3. Bold: "Partial" (with painting multi-color fill)
 */
const PARTIAL_STATES = [
  { text: 'Partial', type: 'italic' },
  { text: '∂', type: 'symbol' },
  { text: 'Partial', type: 'bold' },
];

/**
 * LoadingScreen — Atmospheric fullscreen overlay that plays the Partial Existence
 * animated morph while the website resources load, smoothly fading out once ready.
 */
export default function LoadingScreen() {
  const [stateIndex, setStateIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Play the cycling animation during the loading sequence
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setStateIndex((prev) => (prev + 1) % PARTIAL_STATES.length);
        setIsFading(false);
      }, 220);
    }, 850);

    return () => clearInterval(cycleInterval);
  }, []);

  // Detect when window / document and assets finish loading
  useEffect(() => {
    let timer;
    const minLoadTime = 1350; // Ensure clean visibility of the animation sequence
    const startTime = Date.now();

    function finishLoading() {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 650);
      }, remaining);
    }

    if (document.readyState === 'complete') {
      finishLoading();
    } else {
      window.addEventListener('load', finishLoading, { once: true });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', finishLoading);
    };
  }, []);

  if (!isVisible) return null;

  const currentState = PARTIAL_STATES[stateIndex];

  return (
    <div
      className={`loading-screen ${isExiting ? 'loading-screen--exiting' : ''}`}
      id="site-loading-screen"
      role="status"
      aria-label="Loading Partial Existence"
    >
      <div className="loading-screen__backdrop" />
      <div className="loading-screen__content">
        <div className="loading-screen__title">
          <span className="loading-screen__partial-slot">
            <span
              className={`loading-screen__partial loading-screen__partial--${currentState.type} ${
                isFading ? 'loading-screen__partial--fading' : ''
              }`}
            >
              {currentState.text}
            </span>
          </span>
          <span className="loading-screen__existence">Existence</span>
        </div>

        <div className="loading-screen__bar-wrapper" aria-hidden="true">
          <div className="loading-screen__bar" />
        </div>
      </div>
    </div>
  );
}
