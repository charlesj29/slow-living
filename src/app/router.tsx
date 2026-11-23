import { createBrowserRouter } from 'react-router';
import { RedirectToIslandPage } from '@/pages/RedirectToIslandPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { RouteLoadingPage } from '@/pages/RouteLoadingPage';

/** The site may live under a prefix (GitHub Pages: "/<repo>/"); routes are relative to it. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      ErrorBoundary: RouteErrorPage,
      // Rendered while the world (and Three.js) downloads on first load.
      HydrateFallback: RouteLoadingPage,
      children: [
        {
          // The site opens straight into the world, full screen.
          index: true,
          lazy: async () => {
            const { WorldPage } = await import('@/pages/WorldPage');
            return { Component: WorldPage };
          },
        },
        { path: '*', Component: RedirectToIslandPage },
      ],
    },
  ],
  { basename },
);
