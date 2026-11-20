import { createBrowserRouter } from 'react-router';
import { GamesIndexPage } from '@/pages/GamesIndexPage';
import { IslandRedirectPage } from '@/pages/IslandRedirectPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { RouteLoadingPage } from '@/pages/RouteLoadingPage';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    ErrorBoundary: RouteErrorPage,
    // Rendered while lazy routes load when the app is opened directly on them.
    HydrateFallback: RouteLoadingPage,
    children: [
      {
        // The site opens straight into the world, full screen (no site header).
        index: true,
        lazy: async () => {
          const { WorldPage } = await import('@/pages/WorldPage');
          return { Component: WorldPage };
        },
      },
      {
        Component: Layout,
        children: [
          { path: 'games', Component: GamesIndexPage },
          { path: 'games/island', Component: IslandRedirectPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]);
