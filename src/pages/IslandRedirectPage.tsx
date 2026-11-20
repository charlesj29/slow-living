import type { JSX } from 'react';
import { Navigate, useLocation } from 'react-router';

/** The island used to live at /games/island; send old links (and ?seed= previews) to /. */
export function IslandRedirectPage(): JSX.Element {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}
