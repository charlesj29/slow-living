import type { JSX } from 'react';
import { Navigate, useLocation } from 'react-router';

/**
 * Every address other than `/` sends visitors straight to the island (the
 * site has one page). The query string is kept so dev `?seed=` previews work.
 */
export function RedirectToIslandPage(): JSX.Element {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}
