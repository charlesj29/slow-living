// A steady tick for the music scheduler. A timer inside a small Web Worker
// keeps ticking even while the main thread is busy rendering (the classic
// cause of stuttering web music); falls back to a page timer without workers.

export interface Ticker {
  stop: () => void;
}

const WORKER_SOURCE = (ms: number): string => `setInterval(() => postMessage(0), ${String(ms)});`;

export function startTicker(intervalMs: number, onTick: () => void): Ticker {
  if (typeof Worker !== 'undefined') {
    try {
      const url = URL.createObjectURL(
        new Blob([WORKER_SOURCE(intervalMs)], { type: 'text/javascript' }),
      );
      const worker = new Worker(url);
      worker.onmessage = onTick;
      return {
        stop: () => {
          worker.terminate();
          URL.revokeObjectURL(url);
        },
      };
    } catch {
      // Workers blocked (e.g. a strict content policy): use the page timer.
    }
  }
  const timer = window.setInterval(onTick, intervalMs);
  return { stop: () => window.clearInterval(timer) };
}
