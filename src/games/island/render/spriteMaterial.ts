import { FrontSide, LessDepth, ShaderMaterial, type Color, type Texture } from 'three';
import { DAYLIGHT, type LightingUniforms } from './lighting';

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

// Pixel art has hard alpha: discard transparent texels. Colours are only
// multiplied by the day/night tint (the canvas renders in linear/flat mode).
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

export interface SpriteMaterial extends ShaderMaterial {
  uniforms: {
    map: { value: Texture };
    uFrame: { value: number };
    uTint: { value: Color };
    uLightsOn: { value: number };
  };
}

/** Uniforms every sprite material starts with; lighting ones are shared, not copied. */
function spriteUniforms(
  atlasTexture: Texture,
  lighting: LightingUniforms,
): SpriteMaterial['uniforms'] {
  return {
    map: { value: atlasTexture },
    uFrame: { value: 0 },
    uTint: lighting.uTint,
    uLightsOn: lighting.uLightsOn,
  };
}

export function createSpriteMaterial(
  atlasTexture: Texture,
  lighting: LightingUniforms = DAYLIGHT,
): SpriteMaterial {
  return new ShaderMaterial({
    uniforms: spriteUniforms(atlasTexture, lighting),
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
  uniform vec3 uTint;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.01) discard;
    gl_FragColor = vec4(color.rgb * uTint, color.a);
  }
`;

/**
 * Material for soft cast shadows. They blend over the ground, but write depth
 * and use a strict depth test: where two shadows overlap (same depth), the
 * second is rejected, so overlaps never get darker. Anything standing is
 * closer to the camera and hides the shadow underneath it.
 */
export function createShadowMaterial(
  atlasTexture: Texture,
  lighting: LightingUniforms = DAYLIGHT,
): SpriteMaterial {
  return new ShaderMaterial({
    uniforms: spriteUniforms(atlasTexture, lighting),
    vertexShader: VERTEX_SHADER,
    fragmentShader: SHADOW_FRAGMENT_SHADER,
    side: FrontSide,
    transparent: true,
    depthWrite: true,
    depthFunc: LessDepth,
  }) as SpriteMaterial;
}

// Mist keeps its painted alpha, faded as a whole (it comes and goes with the morning).
const MIST_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uTint;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    float alpha = color.a * uOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color.rgb * uTint, alpha);
  }
`;

export interface MistMaterial extends ShaderMaterial {
  uniforms: SpriteMaterial['uniforms'] & { uOpacity: { value: number } };
}

/**
 * Material for mist banks: blended like the soft shadows, but without writing
 * depth (overlapping banks just thicken a little), and faded by `uOpacity`.
 */
export function createMistMaterial(
  atlasTexture: Texture,
  lighting: LightingUniforms,
): MistMaterial {
  return new ShaderMaterial({
    uniforms: { ...spriteUniforms(atlasTexture, lighting), uOpacity: { value: 0 } },
    vertexShader: VERTEX_SHADER,
    fragmentShader: MIST_FRAGMENT_SHADER,
    side: FrontSide,
    transparent: true,
    depthWrite: false,
  }) as MistMaterial;
}

/** Fades the mist as a whole (0 = gone). */
export function setMistOpacity(material: MistMaterial, opacity: number): void {
  material.uniforms.uOpacity.value = opacity;
}

// Window lights glow by themselves: untinted, and only drawn while lights are on.
const LIGHTS_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform float uLightsOn;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    if (color.a < 0.5 || uLightsOn < 0.5) discard;
    gl_FragColor = color;
  }
`;

/**
 * Material for `*_lights` overlays (lit window panes): hard alpha like any
 * sprite, but not darkened at night, and hidden while the lights are off.
 */
export function createLightsMaterial(
  atlasTexture: Texture,
  lighting: LightingUniforms,
): SpriteMaterial {
  return new ShaderMaterial({
    uniforms: spriteUniforms(atlasTexture, lighting),
    vertexShader: VERTEX_SHADER,
    fragmentShader: LIGHTS_FRAGMENT_SHADER,
    side: FrontSide,
  }) as SpriteMaterial;
}
