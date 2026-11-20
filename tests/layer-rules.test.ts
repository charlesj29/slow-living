// Proves the architecture is enforced: lints virtual files placed in each layer
// and checks that forbidden imports are reported. The files never touch disk.
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: fileURLToPath(new URL('..', import.meta.url)) });

async function restrictedImportCount(filePath: string, importLine: string): Promise<number> {
  const [result] = await eslint.lintText(`${importLine}\nexport const value = x;\n`, {
    filePath,
  });
  return (result?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports').length;
}

const CORE_FILE = 'src/games/island/core/world/example.ts';
const SHARED_ENGINE_FILE = 'src/shared/engine/example.ts';
const RENDER_FILE = 'src/games/island/render/Example.tsx';
const UI_FILE = 'src/games/island/ui/Example.tsx';
const PAGE_FILE = 'src/pages/Example.tsx';

describe('layer import rules', () => {
  it.each([
    ["import x from 'react';"],
    ["import x from 'three';"],
    ["import { x } from '@react-three/fiber';"],
    ["import { x } from '../../render/Tilemap';"],
    ["import { x } from '@/games/island/ui/Hud';"],
    ["import { x } from '../../state';"],
    ["import { x } from '@/app/router';"],
  ])('core rejects: %s', async (importLine) => {
    expect(await restrictedImportCount(CORE_FILE, importLine)).toBe(1);
  });

  it.each([
    ["import { x } from '../config';"],
    ["import { x } from '@/shared/engine/math';"],
    ["import { x } from 'simplex-noise';"],
  ])('core allows: %s', async (importLine) => {
    expect(await restrictedImportCount(CORE_FILE, importLine)).toBe(0);
  });

  it.each([["import x from 'three';"], ["import { x } from '@/games/island/core/config';"]])(
    'shared engine rejects: %s',
    async (importLine) => {
      expect(await restrictedImportCount(SHARED_ENGINE_FILE, importLine)).toBe(1);
    },
  );

  it('render rejects UI imports but allows core', async () => {
    expect(await restrictedImportCount(RENDER_FILE, "import { x } from '../ui/Hud';")).toBe(1);
    expect(await restrictedImportCount(RENDER_FILE, "import { x } from '../core/config';")).toBe(0);
  });

  it('assets (render layer) reject UI imports but allow core and shared render', async () => {
    const ASSETS_FILE = 'src/games/island/assets/example.ts';
    expect(await restrictedImportCount(ASSETS_FILE, "import { x } from '../ui/Hud';")).toBe(1);
    expect(
      await restrictedImportCount(ASSETS_FILE, "import { x } from '@/shared/render/pixelCanvas';"),
    ).toBe(0);
  });

  it('shared render rejects game imports', async () => {
    expect(
      await restrictedImportCount(
        'src/shared/render/Example.tsx',
        "import { x } from '@/games/island';",
      ),
    ).toBe(1);
  });

  it('ui rejects render imports but allows core and state', async () => {
    expect(await restrictedImportCount(UI_FILE, "import { x } from '../render/Tilemap';")).toBe(1);
    expect(await restrictedImportCount(UI_FILE, "import { x } from '../state';")).toBe(0);
  });

  it('pages may only import a game through its public API', async () => {
    expect(await restrictedImportCount(PAGE_FILE, "import { x } from '@/games/island';")).toBe(0);
    expect(
      await restrictedImportCount(
        PAGE_FILE,
        "import { x } from '@/games/island/render/GameCanvas';",
      ),
    ).toBe(1);
  });
});
