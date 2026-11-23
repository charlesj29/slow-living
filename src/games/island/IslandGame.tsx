import { useLayoutEffect, useMemo, type JSX } from 'react';
import { CHILL_TUNE } from './assets/chillTune';
import { ISLAND_CONFIG } from './core/config';
import { createGameState } from './core/game/gameState';
import { loadWorld } from './loadWorld';
import { GameCanvas } from './render/GameCanvas';
import { useIslandUiStore } from './state';
import { ControlsHint } from './ui/ControlsHint';
import { AmbientSound } from './ui/AmbientSound';
import { DayNightToggle } from './ui/DayNightToggle';
import { DebugOverlay } from './ui/DebugOverlay';
import { GameClock } from './ui/GameClock';
import { DevSeedBadge } from './ui/DevSeedBadge';
import { DialogBox } from './ui/DialogBox';
import { IslandSwitcher } from './ui/IslandSwitcher';
import { MusicToggle } from './ui/MusicToggle';
import { PortfolioPanel } from './ui/PortfolioPanel';
import { ResumeButton, ResumeView } from './ui/ResumeView';
import { ScreenFade } from './ui/ScreenFade';
import { StudioVisitMemory } from './ui/StudioVisitMemory';
import { WorldErrorPanel } from './ui/WorldErrorPanel';
import { ZoomButtons } from './ui/ZoomButtons';
import { HudMenu } from './ui/HudMenu';
import { TouchControls } from './ui/TouchControls';
import { isTouchFirst } from './device';

export interface IslandGameProps {
  /** A generated island for this seed; undefined = the baked home island. */
  readonly seed?: number;
  /** Asked for another island (dice button or R); the page picks a seed. */
  readonly onNewIsland: () => void;
  /** Asked to go back to the home island. */
  readonly onHome: () => void;
}

/** Loads the world, creates the simulation, and composes the render layer (canvas) and UI overlays. */
export function IslandGame({ seed, onNewIsland, onHome }: IslandGameProps): JSX.Element {
  // Loading is synchronous and fast (parse a few ms, generating a seed ~40 ms).
  const result = useMemo(() => loadWorld(seed), [seed]);
  // The simulation lives in a plain mutable object, created once per world and
  // shared by the canvas (which drives it) and the overlays (which read it).
  // Resting on a bench or touring: the buttons fade or hide.
  const calmMode = useIslandUiStore((state) => state.calmMode);
  const calmClass = calmMode ? ` is-${calmMode}` : '';
  const showTouchControls = isTouchFirst() && ISLAND_CONFIG.touch.controls;
  const game = useMemo(
    () => (result.ok ? createGameState(result.world, ISLAND_CONFIG) : null),
    [result],
  );

  // A new island starts outdoors with no message, and fades in.
  useLayoutEffect(() => {
    const ui = useIslandUiStore.getState();
    ui.setMap(game?.mapId ?? 'island');
    ui.setDialogMessage(null);
    ui.closePanel();
    ui.setResumeOpen(false);
    ui.setScreenDark(false);
    ui.setCalmMode(null);
  }, [game]);

  const switcher = (
    <IslandSwitcher
      key={seed ?? 'home'}
      isHome={seed === undefined}
      onNewIsland={onNewIsland}
      onHome={onHome}
    />
  );
  if (!result.ok || !game) {
    return (
      <>
        <WorldErrorPanel
          title={result.ok ? 'The game could not start' : result.title}
          details={result.ok ? [] : result.details}
        />
        <div className="island-hud-stack">{switcher}</div>
      </>
    );
  }
  return (
    <>
      <GameCanvas game={game} />
      {/* Top right: the clock, with the F3 readout under it. */}
      <div className={`island-top-right${calmClass}`}>
        {ISLAND_CONFIG.debug.showClock && <GameClock game={game} />}
        <DebugOverlay game={game} />
      </div>
      <AmbientSound game={game} />
      <ScreenFade />
      <StudioVisitMemory />
      <DialogBox />
      {/* Phones get the D-pad and interact button; otherwise the controls list. */}
      {showTouchControls ? (
        <TouchControls game={game} />
      ) : (
        <div className={`island-bottom-right${calmClass}`}>
          <ControlsHint />
        </div>
      )}
      {/* The top-left buttons, in one column (folded into a gear on phones). */}
      <div className={`island-hud-stack${calmClass}`}>
        <HudMenu>
          <DayNightToggle />
          <MusicToggle song={CHILL_TUNE} />
          <ResumeButton />
          {switcher}
          <ZoomButtons />
        </HudMenu>
        {import.meta.env.DEV && seed !== undefined && <DevSeedBadge seed={seed} />}
      </div>
      <ResumeView />
      {/* Last, so it covers the buttons too while open. */}
      <PortfolioPanel />
    </>
  );
}
