// Dev-only browser check (no dependencies):
//   node scripts/browser-check.mjs <url> <out.png> [settleMs] [keys]
// keys: comma-separated presses, e.g. "ArrowDown:1200,Minus" (key held for N ms, default a tap).
// Needs the dev server running. Set CHROME_PATH if Chrome lives elsewhere.
// Launches headless Chrome, loads the URL in real time, waits for a canvas,
// then saves a screenshot and prints every console message / exception.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, outPng, waitArg, keysArg] = process.argv.slice(2);
const settleMs = Number(waitArg ?? 1500);
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--use-angle=${process.env.CHROME_ANGLE ?? 'swiftshader'}`,
    '--enable-unsafe-swiftshader',
    '--no-first-run',
    '--window-size=900,760',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find((t) => t.type === 'page');
  } catch {
    /* not up yet */
  }
  if (!target) await sleep(200);
}
if (!target) {
  console.error('Chrome did not start');
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const pending = new Map();
const messages = [];
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    messages.push(
      `[console.${msg.params.type}] ` +
        msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '),
    );
  } else if (msg.method === 'Runtime.exceptionThrown') {
    messages.push(
      `[exception] ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`,
    );
  } else if (msg.method === 'Log.entryAdded') {
    messages.push(`[log.${msg.params.entry.level}] ${msg.params.entry.text}`);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
const started = Date.now();
await send('Page.navigate', { url });
let hasCanvas = false;
while (Date.now() - started < 30000) {
  const r = await send('Runtime.evaluate', {
    expression: '!!document.querySelector("canvas")',
    returnByValue: true,
  });
  if (r.result?.result?.value) {
    hasCanvas = true;
    break;
  }
  await sleep(100);
}
const loadMs = Date.now() - started;
await sleep(settleMs);
const KEY_CODES = {
  ArrowUp: 38,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  Minus: 189,
  Equal: 187,
  F3: 114,
  KeyR: 82,
};
for (const press of (keysArg ?? '').split(',').filter(Boolean)) {
  const [code, holdMs] = press.split(':');
  const key = code.startsWith('Key')
    ? code.slice(3).toLowerCase()
    : code === 'Minus'
      ? '-'
      : code === 'Equal'
        ? '='
        : code;
  const params = { code, key, windowsVirtualKeyCode: KEY_CODES[code] ?? 0 };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
  await sleep(Number(holdMs ?? 50));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  await sleep(150);
}
if (keysArg) await sleep(400);
const info = await send('Runtime.evaluate', {
  expression: `JSON.stringify({ canvas: (() => { const c = document.querySelector('canvas'); return c ? [c.width, c.height] : null; })(), text: document.body.innerText.slice(0, 200) })`,
  returnByValue: true,
});
// Rough frame rate over 2 s (headless Chrome renders WebGL in software, so real GPUs do better).
const fps = await send('Runtime.evaluate', {
  expression:
    'new Promise((done) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else done(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(tick); })',
  awaitPromise: true,
  returnByValue: true,
});
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(outPng, Buffer.from(shot.result.data, 'base64'));
console.log(
  `canvas found: ${hasCanvas} after ${loadMs} ms; ~${fps.result?.result?.value} fps; page: ${info.result.result.value}`,
);
console.log(messages.length ? messages.join('\n') : '(no console messages)');
ws.close();
chrome.kill();
