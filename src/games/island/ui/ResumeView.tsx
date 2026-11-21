import { useEffect, type JSX, type MouseEvent } from 'react';
import { PORTFOLIO, type PanelId } from '../core/content/portfolio';
import { useIslandUiStore } from '../state';
import { PortfolioPageView } from './PortfolioPageView';
import './resume.css';

/** Contact right after the introduction: busy visitors look for it first. */
const SECTIONS: readonly PanelId[] = [
  'contact',
  'projects',
  'experience',
  'skills',
  'highlights',
  'education',
];

function ResumeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M3 1h7l3 3v11H3zM4 2v12h8V5H9V2zM5 7h6v1H5zM5 9h6v1H5zM5 11h4v1H5z"
      />
    </svg>
  );
}

/** The top-left button that opens the Résumé. */
export function ResumeButton(): JSX.Element {
  const open = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur(); // or Space would press it again
    useIslandUiStore.getState().setResumeOpen(true);
  };
  return (
    <button
      type="button"
      className="island-hud-button island-resume-button"
      onClick={open}
      aria-label="Résumé: the whole portfolio on one page"
      title="Résumé"
    >
      <ResumeIcon />
    </button>
  );
}

/**
 * The whole portfolio as one clean, scrollable page over the game, for busy
 * visitors and phones. Same content as the studio (one source); Esc or × closes.
 */
export function ResumeView(): JSX.Element | null {
  const isOpen = useIslandUiStore((state) => state.isResumeOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Escape') useIslandUiStore.getState().setResumeOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;
  const [intro] = PORTFOLIO.about.pages;
  const close = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.blur();
    useIslandUiStore.getState().setResumeOpen(false);
  };

  return (
    <div className="resume" role="dialog" aria-modal="true" aria-label="Résumé">
      <div className="resume-sheet">
        <button type="button" className="resume-close" onClick={close} aria-label="Close">
          ×
        </button>
        {intro && (
          <header className="resume-intro">
            <PortfolioPageView page={intro} />
          </header>
        )}
        {SECTIONS.map((id) => (
          <section key={id} className="resume-section" aria-label={PORTFOLIO[id].heading}>
            <h2 className="resume-heading">{PORTFOLIO[id].heading}</h2>
            {PORTFOLIO[id].pages.map((page) => (
              <PortfolioPageView key={page.title} page={page} />
            ))}
          </section>
        ))}
        <p className="resume-footer">Close this page to keep exploring the island.</p>
      </div>
    </div>
  );
}
