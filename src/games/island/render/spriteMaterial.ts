import { FrontSide, LessDepth, ShaderMaterial, type Texture } from 'three';

// One shader for every sprite (terrain quads and instanced objects). Animated
// sprites are horizontal strips in the atlas; each vertex carries the u
// distance between frames, so a single `uFrame` uniform animates everything
// drawn with the material (no per-frame CPU work). Static sprites use stride 0.
const VERTEX_SHADER = /* glsl */ `
  attribute float animStride;
  uniform float uFrame;
  varying vec2 vUv;
  void main() {
    vUv = uv + vec2(animStride * uFrame, 0.0);
    vec4 local = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * local;
  }
`;

// Pixel art has hard alpha: discard transparent texels and output colours
// unchanged (the canvas renders in linear/flat mode).
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.5) discard;
    gl_FragColor = color;
  }
`;

export interface SpriteMaterial extends ShaderMaterial {
  uniforms: {
    map: { value: Texture };
    uFrame: { value: number };
  };
}

export function createSpriteMaterial(atlasTexture: Texture): SpriteMaterial {
  return new ShaderMaterial({
    uniforms: { map: { value: atlasTexture }, uFrame: { value: 0 } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: FrontSide,
  }) as SpriteMaterial;
}

/** Shows the animation frame for `elapsedSeconds` on every animated sprite (once per rendered frame). */
export function showAnimationFrameAt(
  material: SpriteMaterial,
  elapsedSeconds: number,
  frameSeconds: number,
  frameCount: number,
): void {
  material.uniforms.uFrame.value = Math.floor(elapsedSeconds / frameSeconds) % frameCount;
}

/** Shows a specific frame of every animated sprite drawn with this material (e.g. the player's walk cycle). */
export function setAnimationFrame(material: SpriteMaterial, frameIndex: number): void {
  material.uniforms.uFrame.value = frameIndex;
}

// Shadows keep their painted alpha (blended), unlike every other sprite.
const SHADOW_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.01) discard;
    gl_FragColor = color;
  }
`;

/**
 * Material for soft cast shadows. They blend over the ground, but write depth
 * and use a strict depth test: where two shadows overlap (same depth), the
 * second is rejected, so overlaps never get darker. Anything standing is
 * closer to the camera and hides the shadow underneath it.
 */
export function createShadowMaterial(atlasTexture: Texture): SpriteMaterial {
  return new ShaderMaterial({
    uniforms: { map: { value: atlasTexture }, uFrame: { value: 0 } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: SHADOW_FRAGMENT_SHADER,
    side: FrontSide,
    transparent: true,
    depthWrite: true,
    depthFunc: LessDepth,
  }) as SpriteMaterial;
}
