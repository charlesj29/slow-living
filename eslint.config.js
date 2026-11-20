import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ---------------------------------------------------------------------------
// Layer rules. Dependency direction: app/pages -> ui/render -> core.
// Each folder gets exactly ONE `no-restricted-imports` block, because a later
// flat-config block replaces (not merges) an earlier one for the same rule.
// Regexes are matched against the raw import specifier, so they cover both
// `@/...` aliases and relative paths.
// ---------------------------------------------------------------------------

const RENDER_LIBS = {
  regex: '^(react|react-dom|react-router|three)(/.*)?$|^@react-three/',
  message: 'Core layer must stay pure TypeScript: no React or Three.js imports.',
};
const NO_APP_OR_PAGES = {
  regex: '(^|/)(app|pages)(/|$)',
  message: 'Only the app/pages layer may import app or page modules.',
};
const NO_UI = {
  regex: '(^|/)ui(/|$)',
  message: 'Render and core must not import UI (DOM) modules.',
};
const NO_RENDER = {
  regex: '(^|/)(render|assets)(/|$)',
  message: 'UI and core must not import render modules.',
};
const NO_GAME_STATE = {
  regex: '(^|/)state$',
  message: 'Core must not import the UI-facing zustand store.',
};
const NO_GAMES = {
  regex: '(^|/)games(/|$)',
  message: 'Shared code must not depend on a specific game.',
};
const ONLY_GAME_PUBLIC_API = {
  regex: '(^|/)games/[^/]+/.+',
  message: "Import a game only through its public API, e.g. '@/games/island'.",
};

const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

const layerRules = [
  {
    name: 'layers/core',
    files: ['src/games/*/core/**/*.{ts,tsx}'],
    rules: restrict(RENDER_LIBS, NO_RENDER, NO_UI, NO_APP_OR_PAGES, NO_GAME_STATE),
  },
  {
    name: 'layers/shared-engine',
    files: ['src/shared/engine/**/*.{ts,tsx}'],
    rules: restrict(RENDER_LIBS, NO_RENDER, NO_UI, NO_APP_OR_PAGES, NO_GAMES),
  },
  {
    name: 'layers/render',
    files: ['src/games/*/render/**/*.{ts,tsx}', 'src/games/*/assets/**/*.{ts,tsx}'],
    rules: restrict(NO_UI, NO_APP_OR_PAGES),
  },
  {
    name: 'layers/shared-render',
    files: ['src/shared/render/**/*.{ts,tsx}'],
    rules: restrict(NO_UI, NO_APP_OR_PAGES, NO_GAMES),
  },
  {
    name: 'layers/ui',
    files: ['src/games/*/ui/**/*.{ts,tsx}'],
    rules: restrict(NO_RENDER, NO_APP_OR_PAGES),
  },
  {
    name: 'layers/shared-ui',
    files: ['src/shared/ui/**/*.{ts,tsx}'],
    rules: restrict(NO_RENDER, NO_APP_OR_PAGES, NO_GAMES),
  },
  {
    name: 'layers/game-root',
    files: ['src/games/*/*.{ts,tsx}'],
    rules: restrict(NO_APP_OR_PAGES),
  },
  {
    name: 'layers/app-and-pages',
    files: ['src/app/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}'],
    rules: restrict(ONLY_GAME_PUBLIC_API),
  },
];

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    name: 'base/typescript',
    files: ['**/*.{ts,tsx,js}'],
    extends: [js.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    name: 'base/react',
    files: ['src/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
  },
  {
    name: 'base/src-conventions',
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports.',
        },
      ],
    },
  },
  ...layerRules,
  prettier,
]);
