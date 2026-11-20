// Pixel-art palette for a cozy 16-bit look: warm, saturated naturals with
// coloured (not black) outlines. Original colours. Each material has a small
// ramp: outline → dark → base → light → highlight. Light comes from the top-left.
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';

const c = (hex: string): Rgba => hexToRgba(hex);

export interface Ramp {
  readonly outline: Rgba;
  readonly dark: Rgba;
  readonly base: Rgba;
  readonly light: Rgba;
  readonly highlight: Rgba;
}

const ramp = (
  outline: string,
  dark: string,
  base: string,
  light: string,
  highlight: string,
): Ramp => ({
  outline: c(outline),
  dark: c(dark),
  base: c(base),
  light: c(light),
  highlight: c(highlight),
});

export const PALETTE = {
  grass: ramp('#2d6a2a', '#47963a', '#62b844', '#7ccb52', '#9edc6c'),
  sand: ramp('#b08e58', '#d8b980', '#f0d89e', '#f8e7bb', '#fff4d8'),
  path: ramp('#8a6a3c', '#bf9a5e', '#dcbc80', '#e9cf98', '#f4e2b4'),
  deepSea: ramp('#1d4f8c', '#2a64a8', '#3779c0', '#5294d4', '#9cc8ee'),
  shallowSea: ramp('#2f74b8', '#4a92d4', '#5eaae6', '#7cc2f0', '#cfeaff'),
  lakeWater: ramp('#1c6080', '#2a7ea0', '#3894b8', '#54b0d0', '#b0e4f0'),
  lakeShallow: ramp('#2c84a4', '#4aa6c4', '#64bed8', '#80d2e6', '#d4f4fa'),
  foam: { bright: c('#ffffff'), soft: c('#d4eefc') },
  dock: ramp('#4a2c14', '#7c5028', '#a87038', '#c48c4c', '#dcaa6c'),
  bark: ramp('#3a2410', '#5c3a1c', '#80542c', '#a06c3c', '#b8844c'),
  oak: ramp('#173a1a', '#2a6a2c', '#3e8c38', '#5cae48', '#8ed06a'),
  pine: ramp('#0f2e1e', '#1d5434', '#2a7244', '#3e9058', '#68b878'),
  leafy: ramp('#1c4420', '#33783a', '#4a9a44', '#68ba56', '#9ad878'),
  rock: ramp('#36363e', '#66666e', '#8e8e98', '#b4b4be', '#dedee6'),
  shadow: c('#4a9040'),
  /** Soft cast shadows: a dark green-blue drawn semi-transparently over the ground. */
  castShadow: { core: hexToRgba('#14301e', 110), edge: hexToRgba('#14301e', 70) },
  stem: c('#2e7a2c'),
  flowers: {
    red: { petal: c('#f05050'), shade: c('#b83030') },
    yellow: { petal: c('#f8d838'), shade: c('#c8a018') },
    blue: { petal: c('#6c94f8'), shade: c('#4060c0') },
    white: { petal: c('#fafafa'), shade: c('#c8ccd8') },
    centerWarm: c('#f8c030'),
    centerDark: c('#a06018'),
  },
  roof: ramp('#4c1810', '#902c22', '#c44434', '#e06450', '#f4947c'),
  wall: ramp('#4a2c14', '#8c5a2c', '#b87c44', '#d09858', '#e4b474'),
  cabin: {
    door: c('#6c3c1c'),
    doorDark: c('#4a2410'),
    glass: c('#90ccf4'),
    shine: c('#e8f8ff'),
    stone: c('#a0a0a8'),
    stoneDark: c('#6c6c74'),
  },
  fence: ramp('#5a4024', '#a88458', '#dcc094', '#ecd6b0', '#f8ecd4'),
  mailbox: { body: c('#d84040'), dark: c('#962828'), light: c('#f07070'), flag: c('#f8d038') },
} as const;
