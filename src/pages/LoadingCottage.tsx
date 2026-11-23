import type { JSX } from 'react';

// The cottage from the tab icon (16×16 pixel art), without its smoke: the
// loading screen animates soft puffs out of the chimney instead. The window
// glows warm, as if someone inside has just put the kettle on.
// prettier-ignore
const ROWS = [
  '................',
  '................',
  '................',
  '..........oo....',
  '.....oooooco....',
  '....oRRRRRcRo...',
  '...orrrrrrrrro..',
  '..orrrrrrrrrrro.',
  '.ooooooooooooooo',
  '..oyyyyyyyyyyo..',
  '..oyLLyyyyddyo..',
  '..oyLLyyyyddyo..',
  '..oyyyyyyyddyo..',
  '..oooooooooooo..',
  '.gggggggggggggg.',
  '................',
];

const COLORS: Readonly<Record<string, string>> = {
  o: '#3a2416', // outline
  r: '#c24a36', // roof
  R: '#dc6a4e', // roof, sunlit top
  c: '#8c8c94', // chimney
  y: '#f3e3c0', // walls
  L: '#ffd27a', // the lit window
  d: '#7a4a28', // door
  g: '#6aa84f', // grass
};

/** One rect per run of same-coloured pixels; the window's rects can glow. */
function pixels(): JSX.Element[] {
  const rects: JSX.Element[] = [];
  ROWS.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const letter = row[x] ?? '.';
      let end = x;
      while (end + 1 < row.length && row[end + 1] === letter) end++;
      const fill = COLORS[letter];
      if (fill) {
        rects.push(
          <rect
            key={`${String(x)},${String(y)}`}
            x={x}
            y={y}
            width={end - x + 1}
            height={1}
            fill={fill}
            className={letter === 'L' ? 'loading-cottage__window' : undefined}
          />,
        );
      }
      x = end + 1;
    }
  });
  return rects;
}

/** The pixel cottage with smoke rising from its chimney (the puffs are CSS). */
export function LoadingCottage(): JSX.Element {
  return (
    <div className="loading-cottage" aria-hidden="true">
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className="loading-cottage__house">
        {pixels()}
      </svg>
      <span className="loading-cottage__puff" />
      <span className="loading-cottage__puff" />
      <span className="loading-cottage__puff" />
    </div>
  );
}
