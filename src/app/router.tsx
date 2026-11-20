import { createBrowserRouter } from 'react-router';
import { GamesIndexPage } from '@/pages/GamesIndexPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { RouteLoadingPage } from '@/pages/RouteLoadingPage';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: RouteErrorPage,
    // Rendered while lazy routes load when the app is opened directly on them.
    HydrateFallback: RouteLoadingPage,
    children: [
      { index: true, Component: HomePage },
      { path: 'games', Component: GamesIndexPage },
      {
        path: 'games/island',
        // Lazy so Three.js is only downloaded when a game is opened.
        lazy: async () => {
          const { IslandGamePage } = await import('@/pages/IslandGamePage');
          return { Component: IslandGamePage };
        },
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
