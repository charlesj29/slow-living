import { describe, expect, it } from 'vitest';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../config';
import { closePortfolioPanel, createGameState, stepGame } from '../game/gameState';
import { ISLAND_KEY_BINDINGS } from '../systems/controls';
import { findInteractTarget } from '../systems/interaction';
import { buildInteriorWorld, INTERIORS } from '../world/interiors';
import { OBJECT_REGISTRY } from '../world/objects';
import { PORTFOLIO, type PortfolioPage } from './portfolio';
import { STUDIO_PANELS } from './studio';

// The files published under public/portfolio (listed by Vite, not loaded).
const PUBLISHED = new Set(
  Object.keys(import.meta.glob('/public/portfolio/*', { query: '?url', import: 'default' })).map(
    (path) => path.replace('/public/', ''),
  ),
);
const published = (file: string): boolean => PUBLISHED.has(file);
const allPages: PortfolioPage[] = Object.values(PORTFOLIO).flatMap((panel) => [...panel.pages]);
const TILE = ISLAND_CONFIG.map.tileSizePx;
const SETTINGS = {
  ...ISLAND_CONFIG.player,
  ...ISLAND_CONFIG.interaction,
  villagerPages: () => ['Hi!'],
  signPages: () => ['A sign'],
};

describe('portfolio content', () => {
  it('gives every studio piece a panel with at least one page', () => {
    for (const id of Object.values(STUDIO_PANELS)) {
      expect(PORTFOLIO[id].pages.length).toBeGreaterThan(0);
    }
  });

  it('has one project per phone on the shelf', () => {
    expect(PORTFOLIO.projects.pages).toHaveLength(OBJECT_REGISTRY.phone_wall.footprint.width);
  });

  it('only links to files that exist or to web pages', () => {
    for (const page of allPages) {
      if (page.image) expect(published(page.image.src), page.image.src).toBe(true);
      for (const link of page.links ?? []) {
        if ('copy' in link || /^https:/.test(link.href)) continue;
        expect(published(link.href), link.href).toBe(true);
      }
      if (page.image) expect(page.image.alt.length).toBeGreaterThan(10);
    }
  });

  it('contact: Email copies the address, WhatsApp opens a chat; no LinkedIn anywhere', () => {
    const links = PORTFOLIO.contact.pages.flatMap((page) => page.links ?? []);
    expect(links).toContainEqual(
      expect.objectContaining({ label: 'Email', copy: 'chrlsjnthn@gmail.com' }),
    );
    expect(links).toContainEqual(
      expect.objectContaining({ label: 'WhatsApp', href: 'https://wa.me/6287897883900' }),
    );
    expect(JSON.stringify(PORTFOLIO)).not.toMatch(/linkedin/i);
  });

  it('writes about Charles without "I" (third person)', () => {
    const text = allPages.flatMap((page) => [page.body ?? '', ...(page.bullets ?? [])]).join(' ');
    expect(text).not.toMatch(/\bI\b|\bmy\b/);
  });
});

describe('opening the portfolio in the studio', () => {
  const studio = INTERIORS.studio;
  if (!studio) throw new Error('no studio');
  const world = buildInteriorWorld(studio);
  const wall = studio.furniture.find((item) => item.kind === 'phone_wall');
  if (!wall) throw new Error('no phone wall');

  function standBelow(tileX: number, tileY: number): ReturnType<typeof createGameState> {
    const state = createGameState(world, ISLAND_CONFIG);
    Object.assign(state.player, { x: (tileX + 0.5) * TILE, y: (tileY + 0.4) * TILE, facing: 'up' });
    return state;
  }

  it('each phone opens its own project', () => {
    for (let n = 0; n < OBJECT_REGISTRY.phone_wall.footprint.width; n++) {
      const state = standBelow(wall.x + n, wall.y + 1);
      const target = findInteractTarget(world, state.player, [], SETTINGS, TILE);
      expect(target?.kind === 'object' ? target.panel : null).toEqual({
        id: 'projects',
        page: n,
      });
    }
  });

  it('holds the player still while the panel is open; closing it does not reopen it', () => {
    const state = standBelow(wall.x + 1, wall.y + 1);
    stepGame(state, 1 / 60, ISLAND_CONFIG);
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'Space');
    stepGame(state, 1 / 60, ISLAND_CONFIG);
    releaseKey(state.input, ISLAND_KEY_BINDINGS, 'Space');
    expect(state.panel).toEqual({ id: 'projects', page: 1 });
    expect(state.dialog).toBeNull();

    const y = state.player.y;
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');
    for (let i = 0; i < 10; i++) stepGame(state, 1 / 60, ISLAND_CONFIG);
    expect(state.player.y).toBe(y);
    releaseKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');

    // Space closes it in the UI; the same press must not open it again.
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'Space');
    closePortfolioPanel(state);
    stepGame(state, 1 / 60, ISLAND_CONFIG);
    expect(state.panel).toBeNull();
  });
});
