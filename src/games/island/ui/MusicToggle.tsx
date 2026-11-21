import { useEffect, useRef, type JSX, type MouseEvent } from 'react';
import { createMusicPlayer, type MusicPlayer } from '@/shared/audio/musicPlayer';
import type { Song } from '@/shared/audio/song';
import { ISLAND_CONFIG } from '../core/config';
import { useIslandUiStore } from '../state';
import './islandUi.css';

const TOGGLE_KEY = 'KeyM';
const STORAGE_KEY = 'island.musicMuted';

function readStoredMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false; // storage blocked (private mode, settings): just start unmuted
  }
}

function storeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // Not remembering the choice is fine.
  }
}

function SpeakerIcon({ muted }: { readonly muted: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges" fill="currentColor">
      <path d="M2 6h3l4-3v10L5 10H2z" />
      {muted ? (
        <path d="M11 6h1v1h1v1h1V7h-1V6h1V5h-1v1h-1V5h-1zM11 10h1V9h1v1h1v1h-1v-1h-1v1h-1z" />
      ) : (
        <path d="M11 6h1v4h-1zM13 4h1v8h-1z" />
      )}
    </svg>
  );
}

/**
 * Background music with a mute button (top-left) and the M key. Browsers only
 * allow sound after the visitor interacts, so the music starts on the first
 * key press or click; the mute choice is remembered for the next visit.
 */
export function MusicToggle({ song }: { readonly song: Song }): JSX.Element {
  const isMuted = useIslandUiStore((state) => state.isMusicMuted);
  const playerRef = useRef<MusicPlayer | null>(null);
  const hasGestureRef = useRef(false);

  useEffect(() => {
    useIslandUiStore.getState().setMusicMuted(readStoredMuted());
    const player = createMusicPlayer(song, ISLAND_CONFIG.music);
    playerRef.current = player;

    const onFirstGesture = (event: Event): void => {
      // A click on the button itself is handled by the toggle.
      if (event.target instanceof Element && event.target.closest('.island-music-toggle')) return;
      hasGestureRef.current = true;
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      if (!useIslandUiStore.getState().isMusicMuted) void player.start();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== TOGGLE_KEY || event.repeat || event.ctrlKey || event.metaKey) return;
      useIslandUiStore.getState().toggleMusicMuted();
    };
    window.addEventListener('pointerdown', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      window.removeEventListener('keydown', onKeyDown);
      player.dispose();
      playerRef.current = null;
    };
  }, [song]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setMuted(isMuted);
    if (!isMuted && hasGestureRef.current) void player.start();
  }, [isMuted]);

  const toggle = (event: MouseEvent<HTMLButtonElement>): void => {
    // Let go of focus, or Space (interact) would press the button again.
    event.currentTarget.blur();
    hasGestureRef.current = true;
    useIslandUiStore.getState().toggleMusicMuted();
  };

  // Remember the choice (button or M) for the next visit.
  useEffect(() => {
    storeMuted(isMuted);
  }, [isMuted]);

  return (
    <button
      type="button"
      className="island-music-toggle"
      onClick={toggle}
      aria-pressed={isMuted}
      aria-label={isMuted ? 'Unmute music (M)' : 'Mute music (M)'}
      title={isMuted ? 'Unmute music (M)' : 'Mute music (M)'}
    >
      <SpeakerIcon muted={isMuted} />
    </button>
  );
}
