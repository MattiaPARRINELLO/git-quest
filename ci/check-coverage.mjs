#!/usr/bin/env node
/**
 * Enforces the coverage budget of the project.
 *
 * Reads `coverage/coverage-summary.json` (produced by the `json-summary`
 * reporter) and compares the global metrics plus a few critical groups against
 * floors kept slightly below the current values. Lowering a floor is a
 * deliberate act: it belongs in the same commit as the code that caused it.
 *
 * Usage: node ci/check-coverage.mjs [summaryPath]
 */
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

const SUMMARY = process.argv[2] ?? 'coverage/coverage-summary.json';

/** Global floors, in percent. */
const GLOBAL_FLOORS = {
  statements: 87,
  branches: 77,
  functions: 90,
  lines: 87,
};

/**
 * Per-directory floors. `src/engine` is the pedagogical core of the project:
 * it must stay the best-covered part of the codebase.
 */
const GROUP_FLOORS = {
  engine: { statements: 87, branches: 78, functions: 90, lines: 87 },
  app: { statements: 94, branches: 83, functions: 95, lines: 94 },
  explanations: { statements: 50, branches: 5, functions: 90, lines: 50 },
};

/** Minimum overall improvement expectations are out of scope: floors only. */

if (!existsSync(SUMMARY)) {
  console.error(`✗ ${SUMMARY} not found — run vitest with --coverage.reporter=json-summary.`);
  process.exit(1);
}

let summary;
try {
  summary = JSON.parse(readFileSync(SUMMARY, 'utf8'));
} catch (error) {
  console.error(`✗ ${SUMMARY} is not valid JSON: ${error.message}`);
  process.exit(1);
}

const METRICS = ['statements', 'branches', 'functions', 'lines'];
const failures = [];

const pct = (metric) => metric.pct ?? 0;

// ---------------------------------------------------------------------------
// Global floors.
// ---------------------------------------------------------------------------
const total = summary.total;
if (!total) {
  console.error('✗ coverage summary has no "total" entry.');
  process.exit(1);
}

console.log('Coverage report');
console.log('  scope        statements  branches  functions  lines');
console.log(
  METRICS.map((metric) => `${pct(total[metric]).toFixed(2)}%`.padStart(11)).join('') +
    '   (all files)',
);

for (const metric of METRICS) {
  const value = pct(total[metric]);
  const floor = GLOBAL_FLOORS[metric];
  if (value < floor) {
    failures.push(`global ${metric}: ${value.toFixed(2)}% < ${floor}% floor`);
  }
}

// ---------------------------------------------------------------------------
// Per-group floors, recomputed from the per-file entries.
// ---------------------------------------------------------------------------
const groups = new Map();
for (const [file, entry] of Object.entries(summary)) {
  if (file === 'total') continue;
  const match = /src\/([^/]+)\//.exec(file.replaceAll('\\', '/'));
  if (!match) continue;
  const name = match[1];

  if (!groups.has(name)) {
    groups.set(name, {
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 },
    });
  }
  const group = groups.get(name);
  for (const metric of METRICS) {
    const source = entry[metric];
    if (!source) continue;
    group[metric].covered += source.covered ?? 0;
    group[metric].total += source.total ?? 0;
  }
}

for (const [name, floors] of Object.entries(GROUP_FLOORS)) {
  const group = groups.get(name);
  if (!group) {
    failures.push(`group "${name}" has no coverage entries (was the folder renamed?)`);
    continue;
  }
  const values = {};
  for (const metric of METRICS) {
    const { covered, total: count } = group[metric];
    values[metric] = count === 0 ? 100 : (covered / count) * 100;
    if (values[metric] < floors[metric]) {
      failures.push(
        `src/${name} ${metric}: ${values[metric].toFixed(2)}% < ${floors[metric]}% floor`,
      );
    }
  }
  console.log(
    `  src/${name}`.padEnd(15) +
      METRICS.map((metric) => `${values[metric].toFixed(2)}%`.padStart(11)).join(''),
  );
}

// ---------------------------------------------------------------------------
// Report + job summary.
// ---------------------------------------------------------------------------
const status = failures.length === 0 ? '✓ coverage floors met' : '✗ coverage floors broken';
console.log(`\n${status}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`  - ${failure}`);
}

const stepSummary = process.env.GITHUB_STEP_SUMMARY;
if (stepSummary) {
  const rows = METRICS.map(
    (metric) => `| ${metric} | ${pct(total[metric]).toFixed(2)}% | ${GLOBAL_FLOORS[metric]}% |`,
  ).join('\n');
  const groupRows = [...groups.entries()]
    .filter(([name]) => name in GROUP_FLOORS)
    .map(([name, group]) => {
      const cells = METRICS.map((metric) => {
        const { covered, total: count } = group[metric];
        const value = count === 0 ? 100 : (covered / count) * 100;
        return `${value.toFixed(2)}%`;
      });
      return `| src/${name} | ${cells.join(' | ')} |`;
    })
    .join('\n');

  appendFileSync(
    stepSummary,
    `\n### ${status}\n\n| Metric | Value | Floor |\n| --- | --- | --- |\n${rows}\n\n` +
      `| Group | Statements | Branches | Functions | Lines |\n| --- | --- | --- | --- | --- |\n${groupRows}\n`,
  );
}

process.exit(failures.length === 0 ? 0 : 1);
