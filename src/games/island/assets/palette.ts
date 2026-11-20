// Placeholder pixel-art palette. Kept small and harmonious; real sprite sheets
// can replace the painted sprites later through the same atlas keys.
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';

const c = (hex: string): Rgba => hexToRgba(hex);

export const PALETTE = {
  grass: { base: c('#5fa04e'), light: c('#74b85a'), dark: c('#4e8a40'), blade: c('#8fce6a') },
  sand: { base: c('#e8d5a0'), light: c('#f4e6bf'), dark: c('#d2ba82') },
  path: { base: c('#b48a5c'), light: c('#c79e6e'), dark: c('#977048'), pebble: c('#8a6644') },
  deepSea: { base: c('#1f4e79'), light: c('#285f8f'), wave: c('#4a84b8') },
  shallowSea: { base: c('#3f86c4'), light: c('#559bd4'), wave: c('#9fd0f0') },
  lakeWater: { base: c('#25808f'), light: c('#2e93a3'), wave: c('#6cc4cc') },
  lakeShallow: { base: c('#4fb0b8'), light: c('#66c2c8'), wave: c('#a8e2e2') },
  foam: { bright: c('#f4fafc'), soft: c('#cfe8f2') },
  dock: { plank: c('#a0703f'), light: c('#bb8a55'), gap: c('#6b4524'), post: c('#5a3a1e') },
  bark: { base: c('#6b4a2b'), dark: c('#4d331d') },
  oak: { base: c('#3f8a3a'), light: c('#5aa84b'), dark: c('#2c6a2d'), outline: c('#1f4d22') },
  pine: { base: c('#2c6e45'), light: c('#3f8b58'), dark: c('#1d5034'), outline: c('#143a26') },
  shadow: c('#447a38'),
  stem: c('#3c7a32'),
  flowers: {
    red: c('#e04848'),
    yellow: c('#f6d243'),
    blue: c('#6a8cf0'),
    white: c('#f7f7f7'),
    centerWarm: c('#ffcf4a'),
    centerDark: c('#b0701c'),
  },
  rock: { base: c('#8d9096'), light: c('#b4b7bc'), dark: c('#696c72'), outline: c('#4c4e54') },
  cabin: {
    log: c('#a06c3c'),
    logLight: c('#b98250'),
    logDark: c('#7a5030'),
    roof: c('#b0503e'),
    roofLight: c('#c96a54'),
    roofDark: c('#82372b'),
    door: c('#5a3a1f'),
    doorFrame: c('#3f2814'),
    glass: c('#a8d8f0'),
    frame: c('#4a3020'),
    stone: c('#8d8f94'),
    stoneDark: c('#6a6c72'),
  },
} as const;
