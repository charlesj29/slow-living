import { useEffect, useState, type JSX } from 'react';
import { LoadingCottage } from './LoadingCottage';

/** Small, unhurried things the village is doing while the island loads. */
const MESSAGES = [
  'Putting the kettle on…',
  'Lighting the lanterns…',
  'Waking the ducks…',
  'Sweeping the doorstep…',
] as const;
/** Slow enough to read and to feel calm; loading is usually done before the first change. */
const MESSAGE_SECONDS = 2.2;

/**
 * Full-screen loading screen shown while the world (and Three.js) downloads:
 * the little cottage with smoke curling from its chimney and a warm window,
 * on a soft morning sky, with a gentle line about village life underneath.
 * Plain HTML, SVG and CSS, so it shows at once.
 */
export function RouteLoadingPage(): JSX.Element {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % MESSAGES.length);
    }, MESSAGE_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <LoadingCottage />
      {/* Re-keyed so each new line fades in. */}
      <p key={messageIndex} className="loading-screen__message">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
