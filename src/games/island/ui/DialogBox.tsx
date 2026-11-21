import type { JSX, ReactNode } from 'react';
import { ARROW_TOKEN, headingAngle } from '../core/systems/compass';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** A small pixel arrow, rotated to point the way (signposts). */
function DirectionArrow({ heading }: { readonly heading: string }): JSX.Element {
  return (
    <svg
      className="island-dialog-direction"
      viewBox="0 0 16 16"
      role="img"
      aria-label={heading}
      style={{ transform: `rotate(${String(headingAngle(heading))}deg)` }}
    >
      <path d="M2 7h8v2H2zM9 3h2v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1H9z" fill="currentColor" />
    </svg>
  );
}

/** Message text with arrow markers turned into arrow icons. */
function withArrows(message: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of message.matchAll(ARROW_TOKEN)) {
    const index = match.index;
    parts.push(message.slice(last, index));
    parts.push(<DirectionArrow key={index} heading={match[1] ?? 'east'} />);
    last = index + match[0].length;
  }
  parts.push(message.slice(last));
  return parts;
}

/** The message box along the bottom (no reply choices); Space closes it. A small arrow says "more". */
export function DialogBox(): JSX.Element | null {
  const message = useIslandUiStore((state) => state.dialogMessage);
  if (message === null) return null;
  return (
    <div className="island-dialog" role="dialog" aria-live="polite">
      <p className="island-dialog-text">{withArrows(message)}</p>
      <span className="island-dialog-arrow" aria-hidden="true" />
    </div>
  );
}
