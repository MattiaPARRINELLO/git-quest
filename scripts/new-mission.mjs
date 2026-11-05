#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

/**
 * Génère le squelette d'une mission et l'insère dans son chapitre et dans la
 * chaîne story.
 *
 *   npm run new:mission -- --chapter shortcuts --id ma-mission \
 *     --title "Ma mission" [--difficulty 2] [--dry-run]
 *
 * Le numéro et l'ordre sont calculés à partir des missions existantes.
 * Les TODO restants sont listés en fin de commande.
 */

function usage(message) {
  if (message) console.error(`Erreur : ${message}\n`);
  console.error(
    'Usage : npm run new:mission -- --chapter <id> --id <mission-id> --title "<titre>" ' +
      '[--difficulty 1|2|3] [--dry-run]',
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const name = token.slice(2);
    if (name === 'dry-run') {
      args.dryRun = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) usage(`valeur manquante pour --${name}`);
    args[name] = value;
    index += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.chapter === undefined) usage('--chapter est requis');
if (args.id === undefined) usage('--id est requis');
if (args.title === undefined) usage('--title est requis');
if (!/^[a-z0-9][a-z0-9-]*$/.test(args.id)) usage('--id doit être en kebab-case');

const difficulty = Number(args.difficulty ?? '1');
if (![1, 2, 3].includes(difficulty)) usage('--difficulty doit valoir 1, 2 ou 3');

const root = process.cwd();
const chaptersDir = path.join(root, 'src/content/chapters');

function findChapter() {
  const entries = fs
    .readdirSync(chaptersDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  for (const entry of entries) {
    const indexFile = path.join(chaptersDir, entry.name, 'index.ts');
    if (!fs.existsSync(indexFile)) continue;
    const source = fs.readFileSync(indexFile, 'utf8');
    if (new RegExp(`id:\\s*'${args.chapter}'`).test(source)) {
      return { dir: entry.name, indexFile, source };
    }
  }
  return null;
}

const chapter = findChapter();
if (chapter === null) {
  const known = fs
    .readdirSync(chaptersDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .join(', ');
  usage(`chapitre « ${args.chapter} » introuvable (dossiers : ${known})`);
}

const numberMatch = /number:\s*(\d+)/.exec(chapter.source);
if (numberMatch === null) usage('numéro de chapitre introuvable dans index.ts');
const chapterNumber = Number(numberMatch[1]);

const missionsDir = path.join(chaptersDir, chapter.dir, 'missions');
const missionFiles = fs
  .readdirSync(missionsDir)
  .filter((file) => file.endsWith('.ts'))
  .sort((left, right) => left.localeCompare(right, 'en', { numeric: true }));
const order = missionFiles.length + 1;
const number = `${chapterNumber}.${order}`;
const fileBase = `${chapterNumber}-${order}`;
const missionFile = path.join(missionsDir, `${fileBase}.ts`);
const variable = `mission${chapterNumber}${order}`;

if (fs.existsSync(missionFile)) usage(`${path.relative(root, missionFile)} existe déjà`);

const allMissionIds = new Set();
for (const file of fs.readdirSync(path.join(chaptersDir), { recursive: true })) {
  if (!String(file).endsWith('.ts')) continue;
  const source = fs.readFileSync(path.join(chaptersDir, String(file)), 'utf8');
  for (const match of source.matchAll(/^\s+id:\s*'([^']+)'/gm)) allMissionIds.add(match[1]);
}
if (allMissionIds.has(args.id)) usage(`la mission « ${args.id} » existe déjà`);

const missionSource = `import { check } from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import type { Mission } from '../../../types';

export const ${variable}: Mission = {
  id: '${args.id}',
  chapterId: '${args.chapter}',
  order: ${order},
  number: '${number}',
  title: '${args.title}',
  // TODO : une histoire de trois phrases maximum, concrète et située.
  story: 'TODO : raconter la situation en trois phrases maximum.',
  situation: 'TODO : décrire l’état du dépôt au départ.',
  objective: 'TODO : formuler le résultat attendu en une phrase.',
  steps: [
    { label: 'TODO : première condition observable', done: () => false },
    { label: 'TODO : seconde condition observable', done: () => false },
  ],
  takeaway: 'TODO : ce que la mission fait comprendre.',
  difficulty: ${difficulty},
  par: 1,
  initialState: entryState('${args.id}'),
  validate: () => check(false, 'TODO : écrire la validation de la mission.'),
  hints: ['TODO : premier indice', 'TODO : deuxième indice', 'TODO : troisième indice'],
  solution: ['git status'],
  suggestedCommands: ['git status', 'git add .', 'git commit -m "..."'],
};
`;

const importLine = `import { ${variable} } from './missions/${fileBase}';`;
const updatedIndex = (() => {
  const lines = chapter.source.split('\n');
  let lastImport = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^import /.test(lines[index])) lastImport = index;
  }
  if (lastImport === -1) usage('aucun import trouvé dans index.ts');
  lines.splice(lastImport + 1, 0, importLine);
  const joined = lines.join('\n');
  return joined.replace(/missions:\s*\[([^\]]*)\]/, (_match, list) => {
    const trimmed = list.trim().replace(/,$/, '');
    return `missions: [${trimmed === '' ? variable : `${trimmed}, ${variable}`}]`;
  });
})();

const storyFile = path.join(root, 'src/content/story', `${chapter.dir.slice(0, 2)}.ts`);
if (!fs.existsSync(storyFile)) usage(`fichier story introuvable : ${storyFile}`);

const storySource = fs.readFileSync(storyFile, 'utf8');
const storyStub = `  // TODO : décrire le préambule, les slots et la solution de référence.
  {
    missionId: '${args.id}',
    prelude: [],
    slots: [],
    reference: [],
  },`;
const lastArrayClose = storySource.lastIndexOf('\n];');
if (lastArrayClose === -1) usage(`tableau story introuvable dans ${storyFile}`);
const storyBefore = storySource.slice(0, lastArrayClose);
const comma = storyBefore.trimEnd().endsWith(',') ? '' : ',';
const updatedStory = `${storyBefore}${comma}\n${storyStub}${storySource.slice(lastArrayClose)}`;

if (args.dryRun === true) {
  console.log(`--- ${path.relative(root, missionFile)} ---\n${missionSource}`);
  console.log(`--- ${path.relative(root, chapter.indexFile)} ---\n${importLine}`);
  console.log(`--- ${path.relative(root, storyFile)} ---\n${storyStub}`);
  process.exit(0);
}

fs.writeFileSync(missionFile, missionSource);
fs.writeFileSync(chapter.indexFile, updatedIndex);
fs.writeFileSync(storyFile, updatedStory);

console.log(`Mission ${number} créée : ${path.relative(root, missionFile)}`);
console.log(`
Prochaines étapes :
  1. écrire l’histoire, les étapes et la validation dans ${path.relative(root, missionFile)}
  2. décrire le préambule et la référence dans ${path.relative(root, storyFile)}
  3. ajouter un briefing dans src/content/briefings.ts si la mission raconte une scène
  4. lancer : npm run check:content
  5. mettre à jour les traductions : docs/I18N.md`);
