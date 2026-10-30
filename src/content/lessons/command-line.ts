import type { Lesson } from '../types';

/**
 * Prologue commun à tous les chapitres : décoder la syntaxe d'une commande
 * avant de manipuler un dépôt. Aucun prérequis, aucune mission.
 */
export const commandLineLesson: Lesson = {
  id: 'lesson-command-line',
  title: 'Lire une commande Git',
  slides: [
    {
      kind: 'text',
      title: 'Une commande, trois niveaux',
      paragraphs: [
        'Toute commande Git se lit de gauche à droite : git est le programme, commit la sous-commande, puis viennent les options et leurs valeurs.',
        'Dans git commit -m "docs: première version", -m est une option qui attend une valeur : le message du commit. Sans -m, Git ouvrirait un éditeur pour te demander ce message.',
        'C’est pour cela qu’on écrit -m juste avant le texte entre guillemets : l’option et sa valeur vont ensemble.',
      ],
      command: 'git commit -m "docs: première version"',
      note: '-m vient de « message ». Une option globale, comme --version, se place avant la sous-commande.',
    },
    {
      kind: 'text',
      title: 'Options courtes, options longues',
      paragraphs: [
        'Chaque option a souvent deux écritures : -m et --message, -a et --all. Les deux font exactement la même chose ; la forme longue est juste plus lisible.',
        'Les options courtes peuvent se regrouper : -am signifie -a -m. C’est un raccourci d’écriture, pas une commande différente.',
        'Quand tu regroupes, la valeur attendue suit la dernière option : git commit -am "fix: rapide".',
      ],
      command: 'git commit --message "fix: login"',
      note: '-am "..." = -a (tout le suivi) + -m "..." (message).',
    },
    {
      kind: 'text',
      title: 'Guillemets et placeholders',
      paragraphs: [
        'Un message contient des espaces : sans guillemets, le shell le découpe en plusieurs mots et Git les prend pour des fichiers.',
        'Dans ce cours, <fichier> ou <branche> sont des placeholders : remplace-les par un vrai nom, sans garder les chevrons.',
        '-- marque la fin des options. git checkout -- app.ts force Git à lire app.ts comme un fichier, même si un fichier ou une branche porte un nom ambigu.',
      ],
      command: 'git commit -m "fix: login introuvable"',
      note: 'Sans guillemets, git commit -m fix: login échoue : Git cherche un fichier nommé login.',
    },
    {
      kind: 'text',
      title: 'Lire l’ordre des arguments',
      paragraphs: [
        'Les options et leurs valeurs viennent avant les arguments ; les chemins ou noms de branches ferment généralement la commande.',
        'git commit -m "msg" <fichier> : le message d’abord, le fichier ensuite. git switch -c <branche> : l’option -c puis le nom à créer.',
        'Quand une commande échoue, relis-la dans cet ordre : programme, sous-commande, options, arguments. La plupart des erreurs viennent d’un guillemet oublié ou d’un placeholder non remplacé.',
      ],
      command: 'git log --oneline --graph',
      note: 'Deux options longues se cumulent sans valeur : elles filtrent seulement l’affichage.',
    },
    {
      kind: 'recap',
      title: 'Antisèche de lecture',
      commands: [
        { command: 'git <commande> [options] [arguments]', description: 'La structure de toute commande Git.' },
        { command: '-m "message"', description: 'Une option courte suivie de sa valeur entre guillemets.' },
        { command: '--message "message"', description: 'La même option en forme longue, plus lisible.' },
        { command: '-am', description: 'Deux options courtes groupées : -a et -m.' },
        { command: '<fichier>', description: 'Un placeholder à remplacer, sans les chevrons.' },
        { command: '--', description: 'Fin des options : la suite est un chemin.' },
      ],
    },
  ],
};
