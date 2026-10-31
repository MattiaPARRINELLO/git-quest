#!/usr/bin/env node
/**
 * Validates the production build of the PWA.
 *
 * Runs after `npm run build` and fails when the build is incomplete, when the
 * manifest disagrees with its icons, when source maps leak, or when a size
 * budget is exceeded. No dependency: Node built-ins only.
 *
 * Usage: node ci/check-dist.mjs [distDir]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = process.argv[2] ?? 'dist';

/**
 * Public base path the build was generated for (`VITE_BASE_PATH`) — "/" locally
 * and on root deployments, "/git-quest/" on GitHub Pages. Only used to resolve
 * URLs written in index.html and the manifest back to files in `dist/`.
 */
const BASE = `/${(process.env['PUBLIC_BASE'] ?? '/').replaceAll('/', '')}/`.replaceAll('//', '/');

const stripBase = (url) => (url.startsWith(BASE) ? url.slice(BASE.length) : url);


/** Hard limits. Raise them deliberately, never to unblock a red build. */
const BUDGETS = {
  /** Whole `dist/` on disk, uncompressed. */
  totalBytes: 4 * 1024 * 1024,
  /** Every JS chunk, gzipped (what the browser downloads). */
  jsGzipBytes: 250 * 1024,
  /** Every CSS file, gzipped. */
  cssGzipBytes: 40 * 1024,
  /** Largest single asset (the entry chunk, fonts included), uncompressed. */
  largestAssetBytes: 800 * 1024,
};

const failures = [];
const notes = [];

const fail = (message) => failures.push(message);
const ok = (message) => notes.push(`  ok   ${message}`);
const bytes = (n) => `${(n / 1024).toFixed(1)} kB`;

function requireFile(path, label = path) {
  const full = join(DIST, stripBase(path));
  if (!existsSync(full)) {
    fail(`missing ${label} (${full})`);
    return false;
  }
  ok(label);
  return true;
}

function readIfPresent(path) {
  const full = join(DIST, stripBase(path));
  return existsSync(full) ? readFileSync(full, 'utf8') : null;
}

/** Reads width/height from a PNG IHDR chunk, without any image library. */
function pngSize(path) {
  const buffer = readFileSync(join(DIST, stripBase(path)));
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') return null;
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

// ---------------------------------------------------------------------------
// 1. Presence of the artifacts a browser and the service worker need.
// ---------------------------------------------------------------------------
console.log(`Checking build output in ${DIST}/`);

if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ does not exist — run "npm run build" first.`);
  process.exit(1);
}

const required = [
  'index.html',
  'manifest.webmanifest',
  'registerSW.js',
  'sw.js',
  'favicon.svg',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
];
for (const file of required) requireFile(file);

// Workbox emits a hashed runtime next to the service worker.
const distFiles = walk(DIST).map((full) => relative(DIST, full).split('\\').join('/'));
if (!distFiles.some((file) => /^workbox-[0-9a-f]+\.js$/.test(file))) {
  fail('missing workbox-*.js runtime emitted by vite-plugin-pwa');
} else {
  ok('workbox runtime');
}

// ---------------------------------------------------------------------------
// 2. index.html: shell markers, French locale, hashed bundles.
// ---------------------------------------------------------------------------
const html = readIfPresent('index.html');
if (html === null) {
  fail('cannot read index.html');
} else {
  const expectations = [
    ['<div id="root"></div>', 'React mount point'],
    ['lang="fr"', 'French document language'],
    [`<link rel="manifest" href="${BASE}manifest.webmanifest">`, 'web manifest link'],
    ['registerSW.js', 'service worker registration'],
    ['viewport-fit=cover', 'safe-area viewport meta'],
  ];
  for (const [needle, label] of expectations) {
    if (html.includes(needle)) ok(`index.html: ${label}`);
    else fail(`index.html is missing ${label} (expected "${needle}")`);
  }

  const scriptMatch = html.match(/<script type="module"[^>]+src="([^"]*\/assets\/[^"]+\.js)"/);
  if (scriptMatch) {
    if (!scriptMatch[1].startsWith(BASE)) {
      fail(`index.html entry bundle ${scriptMatch[1]} ignores the public base ${BASE}`);
    } else {
      ok(`index.html: entry bundle ${scriptMatch[1]}`);
      requireFile(scriptMatch[1], 'entry bundle file');
    }
  } else {
    fail('index.html has no hashed module entry script under <base>/assets/');
  }

  if (!html.includes('crossorigin')) {
    fail('index.html: hashed assets should be emitted with crossorigin');
  }
}

// Source maps must never ship: they expose sources and bloat the PWA cache.
const maps = distFiles.filter((file) => extname(file) === '.map');
if (maps.length > 0) fail(`source maps leaked in the build: ${maps.join(', ')}`);
else ok('no source maps in the build');

// ---------------------------------------------------------------------------
// 3. Manifest: installability essential fields + icons that really match.
// ---------------------------------------------------------------------------
const manifestRaw = readIfPresent('manifest.webmanifest');
if (manifestRaw !== null) {
  let manifest = null;
  try {
    manifest = JSON.parse(manifestRaw);
    ok('manifest.webmanifest is valid JSON');
  } catch (error) {
    fail(`manifest.webmanifest is not valid JSON: ${error.message}`);
  }

  if (manifest) {
    const fields = {
      name: (v) => typeof v === 'string' && v.length > 0,
      short_name: (v) => typeof v === 'string' && v.length > 0 && v.length <= 12,
      start_url: (v) => typeof v === 'string' && v.length > 0,
      scope: (v) => typeof v === 'string' && v.length > 0,
      display: (v) => v === 'standalone',
      lang: (v) => v === 'fr',
      theme_color: (v) => /^#[0-9a-f]{6}$/i.test(v ?? ''),
      background_color: (v) => /^#[0-9a-f]{6}$/i.test(v ?? ''),
      icons: (v) => Array.isArray(v) && v.length >= 3,
    };
    for (const [key, isValid] of Object.entries(fields)) {
      if (isValid(manifest[key])) ok(`manifest: ${key}`);
      else fail(`manifest: invalid or missing "${key}" (got ${JSON.stringify(manifest[key])})`);
    }

    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const declared = new Set();
    for (const icon of icons) {
      if (typeof icon.src !== 'string') {
        fail('manifest: an icon has no src');
        continue;
      }
      declared.add(icon.src);
      if (!requireFile(icon.src, `manifest icon ${icon.src}`)) continue;

      const expected = /^(\d+)x(\d+)$/.exec(icon.sizes ?? '');
      if (!expected) {
        fail(`manifest: icon ${icon.src} has an unparsable size "${icon.sizes}"`);
        continue;
      }
      if (icon.type === 'image/png') {
        const size = pngSize(icon.src);
        if (!size) {
          fail(`manifest: icon ${icon.src} is not a readable PNG`);
        } else if (size.width !== Number(expected[1]) || size.height !== Number(expected[2])) {
          fail(
            `manifest: icon ${icon.src} claims ${icon.sizes} but is ${size.width}x${size.height}`,
          );
        } else {
          ok(`icon ${icon.src} is really ${icon.sizes}`);
        }
      }
    }

    if (icons.some((icon) => icon.purpose === 'maskable')) ok('manifest: maskable icon');
    else fail('manifest: no maskable icon (Android adaptive icon)');

    for (const required of ['192x192', '512x512']) {
      if (icons.some((icon) => icon.sizes === required)) ok(`manifest: ${required} icon`);
      else fail(`manifest: missing ${required} icon`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Service worker: precaches the shell, cache-busts on every build.
// ---------------------------------------------------------------------------
const sw = readIfPresent('sw.js');
if (sw !== null) {
  if (/precacheAndRoute|precache/i.test(sw)) ok('sw.js: precache routing');
  else fail('sw.js does not precache assets');

  if (sw.includes('index.html')) ok('sw.js: precaches index.html');
  else fail('sw.js does not precache index.html (offline shell broken)');

  if (/clientsClaim|skipWaiting/i.test(sw)) ok('sw.js: update strategy');
  else notes.push('  warn sw.js has no clientsClaim/skipWaiting');

  if (!/self\.__WB_MANIFEST|revision/.test(sw)) {
    fail('sw.js has no revisioned precache manifest (stale cache risk)');
  }
}

// ---------------------------------------------------------------------------
// 5. Size budgets, gzipped like a real transfer.
// ---------------------------------------------------------------------------
const files = walk(DIST).map((full) => ({
  path: relative(DIST, full).split('\\').join('/'),
  size: statSync(full).size,
}));

const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
if (totalBytes > BUDGETS.totalBytes) {
  fail(`dist/ is ${bytes(totalBytes)}, over the ${bytes(BUDGETS.totalBytes)} budget`);
} else {
  ok(`dist/ weighs ${bytes(totalBytes)} (budget ${bytes(BUDGETS.totalBytes)})`);
}

const largest = files.reduce((max, file) => (file.size > max.size ? file : max), files[0]);
if (largest && largest.size > BUDGETS.largestAssetBytes) {
  fail(`largest asset ${largest.path} is ${bytes(largest.size)} (budget ${bytes(BUDGETS.largestAssetBytes)})`);
} else if (largest) {
  ok(`largest asset ${largest.path} (${bytes(largest.size)})`);
}

const gzipped = (extension) =>
  files
    .filter((file) => file.path.endsWith(extension))
    .reduce((sum, file) => sum + gzipSync(readFileSync(join(DIST, file.path))).length, 0);

const jsGzip = gzipped('.js');
if (jsGzip > BUDGETS.jsGzipBytes) {
  fail(`JS payload is ${bytes(jsGzip)} gzipped, over the ${bytes(BUDGETS.jsGzipBytes)} budget`);
} else {
  ok(`JS payload ${bytes(jsGzip)} gzipped (budget ${bytes(BUDGETS.jsGzipBytes)})`);
}

const cssGzip = gzipped('.css');
if (cssGzip > BUDGETS.cssGzipBytes) {
  fail(`CSS payload is ${bytes(cssGzip)} gzipped, over the ${bytes(BUDGETS.cssGzipBytes)} budget`);
} else {
  ok(`CSS payload ${bytes(cssGzip)} gzipped (budget ${bytes(BUDGETS.cssGzipBytes)})`);
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log(notes.join('\n'));

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} build check(s) failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\n✓ build OK (${files.length} files)`);
