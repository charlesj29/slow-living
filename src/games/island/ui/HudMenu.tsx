import { useEffect, useRef, useState, type JSX, type MouseEvent, type ReactNode } from 'react';
import { isTouchFirst } from '../device';
import './touchControls.css';

function GearIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor">
      <path d="M7 1h2v2h1V2h2v2h-1v1h1v1h2v2h-2v1h-1v1h1v2h-2v-1H9v2H7v-2H6v1H4v-2h1V9H4V8H2V6h2V5h1V4H4V2h2v1h1z M7 6v3h2V6z" />
    </svg>
  );
}

/**
 * On phones the top-left buttons fold into one gear: it opens a small panel
 * with them (tapping elsewhere closes it). They stay mounted while closed, so
 * the music keeps playing and choices are kept. Desktops show them as they are.
 */
export function HudMenu({ children }: { readonly children: ReactNode }): JSX.Element {
  const [isOpen, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  if (!isTouchFirst()) return <>{children}</>;

  const toggle = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur();
    setOpen((open) => !open);
  };
  return (
    <div ref={menuRef} className="island-hud-menu-wrap">
      <button
        type="button"
        className="island-hud-button island-hud-gear"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close settings' : 'Settings'}
      >
        <GearIcon />
      </button>
      <div className={`island-hud-menu${isOpen ? ' is-open' : ''}`}>{children}</div>
    </div>
  );
}
