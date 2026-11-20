import { FrontSide, ShaderMaterial, Vector2, type Texture } from 'three';
import type { GrassPatchSettings } from './grassPatches';
import type { SpriteMaterial } from './spriteMaterial';

// Like the sprite shader (animated strips via uFrame, hard alpha), plus soft
// grass patches: grass quads (patchable = 1) are shaded where the smoothed
// patch value, nudged by a 4×4 Bayer dither per art pixel, passes a threshold.
const VERTEX_SHADER = /* glsl */ `
  attribute float animStride;
  attribute float patchable;
  uniform float uFrame;
  varying vec2 vUv;
  varying vec2 vWorld;
  varying float vPatchable;
  void main() {
    vUv = uv + vec2(animStride * uFrame, 0.0);
    vWorld = position.xy;
    vPatchable = patchable;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D uPatch;
  uniform vec2 uMapSizePx;
  uniform float uThreshold;
  uniform float uShade;
  uniform float uSpread;
  varying vec2 vUv;
  varying vec2 vWorld;
  varying float vPatchable;
  const float BAYER[16] = float[16](
    0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0
  );
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.5) discard;
    if (vPatchable > 0.5) {
      // World y is negative downwards; texture row 0 is the top map row.
      float value = texture2D(uPatch, vec2(vWorld.x, -vWorld.y) / uMapSizePx).r;
      vec2 pixel = floor(vWorld);
      int index = int(mod(pixel.x, 4.0)) + int(mod(pixel.y, 4.0)) * 4;
      float dither = (BAYER[index] + 0.5) / 16.0 - 0.5;
      if (value + dither * uSpread > uThreshold) color.rgb *= uShade;
    }
    gl_FragColor = color;
  }
`;

export interface TilemapMaterial extends ShaderMaterial {
  uniforms: SpriteMaterial['uniforms'] & {
    uPatch: { value: Texture };
    uMapSizePx: { value: Vector2 };
    uThreshold: { value: number };
    uShade: { value: number };
    uSpread: { value: number };
  };
}

export function createTilemapMaterial(
  atlasTexture: Texture,
  patchTexture: Texture,
  mapSizePx: { readonly width: number; readonly height: number },
  patches: GrassPatchSettings,
): TilemapMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: atlasTexture },
      uFrame: { value: 0 },
      uPatch: { value: patchTexture },
      uMapSizePx: { value: new Vector2(mapSizePx.width, mapSizePx.height) },
      uThreshold: { value: patches.threshold },
      uShade: { value: patches.shade },
      uSpread: { value: patches.ditherSpread },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: FrontSide,
  }) as TilemapMaterial;
}
