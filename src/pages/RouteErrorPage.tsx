import type { JSX } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

function describeError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${String(error.status)} ${error.statusText}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

export function RouteErrorPage(): JSX.Element {
  const error = useRouteError();
  return (
    <div className="page">
      <h1>Something went wrong</h1>
      <p>{describeError(error)}</p>
      <p>
        <Link to="/">Back to the island</Link>
      </p>
    </div>
  );
}
