import { useCallback, useEffect, useRef, type JSX, type MouseEvent } from 'react';
import { PORTFOLIO } from '../core/content/portfolio';
import { useIslandUiStore } from '../state';
import { PortfolioPageView } from './PortfolioPageView';
import './portfolioPanel.css';

const PREVIOUS_KEYS = new Set(['ArrowLeft', 'KeyA']);
const NEXT_KEYS = new Set(['ArrowRight', 'KeyD']);
/** Next page, or close after the last one (like the message box). */
const ADVANCE_KEYS = new Set(['Space', 'Enter']);
/**
 * Just after opening, a tap on the backdrop is ignored: on phones the tap that
 * opened the panel can finish (its click) on the backdrop now under the finger.
 */
const OPEN_GRACE_MS = 400;

/**
 * The portfolio card a studio piece opens: one part of the portfolio, page by
 * page. Keys: ←/→ page, Space/Enter next (closing after the last), Esc close;
 * buttons for mouse and touch. The game stands still while it is open.
 */
export function PortfolioPanel(): JSX.Element | null {
  const open = useIslandUiStore((state) => state.panel);
  const panel = open ? PORTFOLIO[open.id] : null;
  const count = panel?.pages.length ?? 0;
  const page = open ? Math.min(Math.max(open.page, 0), Math.max(0, count - 1)) : 0;

  const close = useCallback(() => {
    useIslandUiStore.getState().closePanel();
  }, []);

  // When the panel last opened (not on page turns), for the backdrop's grace period.
  const isOpen = open !== null;
  const openedAt = useRef(0);
  useEffect(() => {
    if (isOpen) openedAt.current = performance.now();
  }, [isOpen]);
  const goTo = useCallback(
    (next: number) => {
      if (next >= 0 && next < count) useIslandUiStore.getState().setPanelPage(next);
    },
    [count],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      if (event.code === 'Escape') close();
      else if (PREVIOUS_KEYS.has(event.code)) goTo(page - 1);
      else if (NEXT_KEYS.has(event.code)) goTo(page + 1);
      else if (ADVANCE_KEYS.has(event.code)) {
        event.preventDefault(); // no page scroll, no button press
        if (page + 1 < count) goTo(page + 1);
        else close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, page, count, close, goTo]);

  if (!open || !panel) return null;
  const current = panel.pages[page];
  // Let go of focus after a click, or Space would press the button again.
  const press =
    (action: () => void) =>
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.currentTarget.blur();
      action();
    };

  return (
    <div
      className="portfolio-backdrop"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        if (performance.now() - openedAt.current < OPEN_GRACE_MS) return;
        close();
      }}
    >
      <section
        className="portfolio-panel"
        role="dialog"
        aria-modal="true"
        aria-label={panel.heading}
      >
        <header className="portfolio-header">
          <span className="portfolio-heading">{panel.heading}</span>
          {count > 1 && (
            <span className="portfolio-counter">
              {page + 1} / {count}
            </span>
          )}
          <button
            type="button"
            className="portfolio-close"
            onClick={press(close)}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="portfolio-scroll">
          {current && <PortfolioPageView key={page} page={current} />}
        </div>
        {count > 1 && (
          <footer className="portfolio-footer">
            <button
              type="button"
              className="portfolio-nav"
              onClick={press(() => goTo(page - 1))}
              disabled={page === 0}
            >
              ‹ Previous
            </button>
            <span className="portfolio-dots" aria-hidden="true">
              {panel.pages.map((item, i) => (
                <span key={item.title} className={i === page ? 'is-current' : undefined} />
              ))}
            </span>
            <button
              type="button"
              className="portfolio-nav"
              onClick={press(() => goTo(page + 1))}
              disabled={page + 1 >= count}
            >
              Next ›
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
