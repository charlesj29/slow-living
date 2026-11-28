import { FrontSide, ShaderMaterial, type Color, type Texture } from 'three';
import type { LightingUniforms } from './lighting';

// Plants in the breeze: like the sprite shader, but the top edge of each quad
// leans with the wind while the bottom edge stays rooted, so the sprite shears
// gently (trunks stay put, crowns sway). Each instance gets its own rhythm from
// where it stands. Hard alpha and the day/night tint, as for every sprite.
const VERTEX_SHADER = /* glsl */ `
  attribute float animStride;
  uniform float uFrame;
  uniform float uTime;
  uniform float uWind;
  uniform float uSwayPx;
  varying vec2 vUv;
  void main() {
    vUv = uv + vec2(animStride * uFrame, 0.0);
    vec4 local = vec4(position, 1.0);
    float phase = 0.0;
    #ifdef USE_INSTANCING
      phase = instanceMatrix[3].x * 0.045 + instanceMatrix[3].y * 0.031;
    #endif
    float top = step(0.0, position.y);
    // A slow swell of gusts over a gentle sway.
    float gust = 0.65 + 0.35 * sin(uTime * 0.37 + phase * 0.5);
    local.x += top * uSwayPx * uWind * gust * sin(uTime * 1.7 + phase);
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * local;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uTint;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.5) discard;
    gl_FragColor = vec4(color.rgb * uTint, color.a);
  }
`;

export interface SwayMaterial extends ShaderMaterial {
  uniforms: {
    map: { value: Texture };
    uFrame: { value: number };
    uTint: { value: Color };
    uLightsOn: { value: number };
    uTime: { value: number };
    uWind: { value: number };
    uSwayPx: { value: number };
  };
}

export function createSwayMaterial(
  atlasTexture: Texture,
  lighting: LightingUniforms,
  swayPx: number,
): SwayMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: atlasTexture },
      uFrame: { value: 0 },
      uTint: lighting.uTint,
      uLightsOn: lighting.uLightsOn,
      uTime: { value: 0 },
      uWind: { value: 0 },
      uSwayPx: { value: swayPx },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: FrontSide,
  }) as SwayMaterial;
}

/** Moves the breeze on: the clock and how strong the wind is now. */
export function setBreeze(material: SwayMaterial, seconds: number, wind: number): void {
  material.uniforms.uTime.value = seconds;
  material.uniforms.uWind.value = wind;
}

/** Sprites that sway: trees, bushes and grass tufts (any of their variants). */
export function isSwayingSprite(key: string): boolean {
  return key.startsWith('tree_') || key.startsWith('bush') || key.startsWith('grass_tuft');
}
