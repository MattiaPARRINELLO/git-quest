#!/usr/bin/env node
/**
 * Smoke-tests the built PWA served by `vite preview`.
 *
 * Starts nothing by itself: the workflow (or you) must run
 * `npx vite preview --port 4173 --strictPort` first. This checks what a real
 * browser would receive over HTTP — status codes, content types, the manifest,
 * the service worker, the icons and SPA deep links.
 *
 * Usage: node ci/smoke-preview.mjs [baseUrl]
 */
const BASE = (process.argv[2] ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const STARTUP_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 60_000);
const REQUEST_TIMEOUT_MS = 10_000;

const failures = [];
const checks = [];

const ok = (name, detail = '') => checks.push(`  ok   ${name}${detail ? ` — ${detail}` : ''}`);
const fail = (name, detail = '') => {
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  checks.push(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
};

async function get(pathname) {
  const response = await fetch(`${BASE}${pathname}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'user-agent': 'gitquest-ci-smoke/1.0' },
  });
  const body = await response.text();
  return { response, body, contentType: response.headers.get('content-type') ?? '' };
}

// ---------------------------------------------------------------------------
// Wait for the preview server. `vite preview` binds shortly after the process
// starts, and a cold CI runner can take a few seconds.
// ---------------------------------------------------------------------------
let home = null;
let lastError = 'no attempt made';
const deadline = Date.now() + STARTUP_TIMEOUT_MS;
while (Date.now() < deadline) {
  try {
    home = await get('/');
    break;
  } catch (error) {
    lastError = error.cause?.code ?? error.message;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
}

if (!home) {
  console.error(`✗ ${BASE} never answered within ${STARTUP_TIMEOUT_MS / 1000}s (${lastError}).`);
  console.error('  Is the server running and bound to this address? `vite preview` binds');
  console.error('  `localhost` (possibly ::1 only) unless you pass --host 127.0.0.1.');
  process.exit(1);
}

console.log(`Smoke-testing ${BASE}`);

// ---------------------------------------------------------------------------
// 1. Document shell.
// ---------------------------------------------------------------------------
if (home.response.status === 200) ok('GET /', '200');
else fail('GET /', `expected 200, got ${home.response.status}`);

if (home.contentType.includes('text/html')) ok('GET / content-type', home.contentType);
else fail('GET / content-type', `expected text/html, got "${home.contentType}"`);

const shellMarkers = [
  ['<div id="root"></div>', 'React mount point'],
  ['lang="fr"', 'French locale'],
  ['manifest.webmanifest', 'manifest link'],
  ['registerSW.js', 'service worker registration'],
];
for (const [needle, label] of shellMarkers) {
  if (home.body.includes(needle)) ok(`shell: ${label}`);
  else fail(`shell: ${label}`, `"${needle}" not found in /`);
}

const entry = [...home.body.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((match) => match[1]);
if (entry.length > 0) {
  ok('shell: entry bundle referenced', entry.join(', '));
} else {
  fail('shell: entry bundle referenced', 'no /assets/*.js script in /');
}

const styles = [...home.body.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((match) => match[1]);
if (styles.length > 0) ok('shell: stylesheet referenced');
else fail('shell: stylesheet referenced', 'no /assets/*.css link in /');

// Every referenced hashed asset must actually be served.
for (const asset of [...entry, ...styles]) {
  try {
    const { response, contentType } = await get(asset);
    if (response.status !== 200) fail(`GET ${asset}`, `expected 200, got ${response.status}`);
    else if (contentType.includes('text/html')) {
      fail(`GET ${asset}`, `served HTML instead of ${asset.includes('.css') ? 'CSS' : 'JS'}`);
    } else ok(`GET ${asset}`, '200');
  } catch (error) {
    fail(`GET ${asset}`, error.message);
  }
}

// ---------------------------------------------------------------------------
// 2. Web manifest.
// ---------------------------------------------------------------------------
try {
  const { response, body, contentType } = await get('/manifest.webmanifest');
  if (response.status !== 200) fail('GET /manifest.webmanifest', `status ${response.status}`);
  else if (!/json/.test(contentType)) fail('manifest content-type', contentType);
  else {
    const manifest = JSON.parse(body);
    ok('manifest', `${manifest.name ?? '(unnamed)'} / ${manifest.icons?.length ?? 0} icons`);
    if (manifest.display !== 'standalone') fail('manifest display', manifest.display);
    if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) {
      fail('manifest icons', 'expected at least 3 icons');
    }
  }
} catch (error) {
  fail('GET /manifest.webmanifest', error.message);
}

// ---------------------------------------------------------------------------
// 3. Service worker + workbox runtime, i.e. the offline capability.
// ---------------------------------------------------------------------------
try {
  const { response, body, contentType } = await get('/sw.js');
  if (response.status !== 200) fail('GET /sw.js', `status ${response.status}`);
  else if (contentType.includes('text/html')) fail('GET /sw.js', 'served HTML instead of JS');
  else {
    ok('GET /sw.js', contentType || '200');
    if (!/precache/i.test(body)) fail('sw.js content', 'no precache manifest');
    if (!body.includes('index.html')) fail('sw.js content', 'index.html is not precached');
  }
} catch (error) {
  fail('GET /sw.js', error.message);
}

try {
  const { response } = await get('/registerSW.js');
  if (response.status !== 200) fail('GET /registerSW.js', `status ${response.status}`);
  else ok('GET /registerSW.js', '200');
} catch (error) {
  fail('GET /registerSW.js', error.message);
}

// The service worker imports to `workbox-*.js`: if it 404s, offline is broken.
try {
  const { body } = await get('/sw.js');
  // Workbox is bundled as an AMD module imported without its extension;
  // `define(["./workbox-<hash>"], ...)`.
  const workbox = /workbox-[0-9a-f]+/.exec(body);
  if (!workbox) {
    fail('sw.js imports workbox runtime', 'no workbox-<hash> import found');
  } else {
    const url = `/${workbox[0]}.js`;
    const { response } = await get(url);
    if (response.status !== 200) fail(`GET ${url}`, `status ${response.status}`);
    else ok(`GET ${url}`, '200');
  }
} catch (error) {
  fail('workbox runtime', error.message);
}

// ---------------------------------------------------------------------------
// 4. Icons are really fetchable images.
// ---------------------------------------------------------------------------
for (const icon of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png']) {
  try {
    const response = await fetch(`${BASE}/${icon}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (response.status !== 200) {
      fail(`GET /${icon}`, `status ${response.status}`);
      continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const isPng = buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    if (!isPng) fail(`GET /${icon}`, 'not a PNG');
    else if (buffer.length < 512) fail(`GET /${icon}`, 'suspiciously small for an icon');
    else ok(`GET /${icon}`, `${(buffer.length / 1024).toFixed(1)} kB`);
  } catch (error) {
    fail(`GET /${icon}`, error.message);
  }
}

// ---------------------------------------------------------------------------
// 5. SPA fallback: an unknown path still returns the app shell, never a 404
//    page, so a refresh on any route works (hash router aside).
// ---------------------------------------------------------------------------
try {
  const { response, body } = await get('/chapter/1/lesson');
  if (response.status !== 200) fail('SPA fallback', `status ${response.status} on /chapter/1/lesson`);
  else if (!body.includes('<div id="root">')) fail('SPA fallback', 'shell not returned');
  else ok('SPA fallback', '200 with app shell');
} catch (error) {
  fail('SPA fallback', error.message);
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log(checks.join('\n'));

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} smoke check(s) failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\n✓ smoke test OK (${checks.length} checks)`);
