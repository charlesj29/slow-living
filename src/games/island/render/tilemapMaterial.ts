import { FrontSide, ShaderMaterial, type Texture } from 'three';

// Animated tiles are horizontal strips in the atlas; each vertex carries the u
// distance between frames, so one uniform animates every water tile at once
// (no per-frame CPU work). Static tiles have a stride of 0.
const VERTEX_SHADER = /* glsl */ `
  attribute float animStride;
  uniform float uFrame;
  varying vec2 vUv;
  void main() {
    vUv = uv + vec2(animStride * uFrame, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Pixel art has hard alpha: discard transparent texels (overlay sprites) and
// output colours unchanged (the canvas renders in linear/flat mode).
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.5) discard;
    gl_FragColor = color;
  }
`;

export interface TilemapMaterial extends ShaderMaterial {
  uniforms: {
    map: { value: Texture };
    uFrame: { value: number };
  };
}

export function createTilemapMaterial(atlasTexture: Texture): TilemapMaterial {
  return new ShaderMaterial({
    uniforms: { map: { value: atlasTexture }, uFrame: { value: 0 } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: FrontSide,
  }) as TilemapMaterial;
}

/** Shows the animation frame for `elapsedSeconds` on every animated tile (called once per rendered frame). */
export function showAnimationFrameAt(
  material: TilemapMaterial,
  elapsedSeconds: number,
  frameSeconds: number,
  frameCount: number,
): void {
  material.uniforms.uFrame.value = Math.floor(elapsedSeconds / frameSeconds) % frameCount;
}
