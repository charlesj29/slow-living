import { useEffect, useState, type JSX } from 'react';

const MESSAGES = ['Cooking…', 'Doing its magic…'] as const;
/** Long enough to read; loading is usually done before the message changes. */
const MESSAGE_SECONDS = 1.5;

/** Full-screen loading screen shown while the world (and Three.js) downloads. */
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
      <div className="loading-screen__mark" aria-hidden="true" />
      <p>{MESSAGES[messageIndex]}</p>
    </div>
  );
}
