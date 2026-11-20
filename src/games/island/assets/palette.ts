// Placeholder pixel-art palette, inspired by the bright, outlined look of
// classic handheld RPGs (original colours, not copied). Each material has a
// small ramp: outline → dark → base → light → highlight.
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
  grass: ramp('#2f6e2c', '#4f9a40', '#73c458', '#8fd86c', '#b4ec8c'),
  sand: ramp('#a88c50', '#d4b878', '#f0dca0', '#f8eabc', '#fff6d8'),
  path: ramp('#7a5a34', '#a88050', '#d0aa70', '#e2c088', '#f0d6a4'),
  deepSea: ramp('#1c4888', '#2c62b0', '#3c7ccc', '#5a98e0', '#a4d0f8'),
  shallowSea: ramp('#2c6cb4', '#4a8ed8', '#60a8ec', '#7cc0f4', '#d0ecff'),
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
