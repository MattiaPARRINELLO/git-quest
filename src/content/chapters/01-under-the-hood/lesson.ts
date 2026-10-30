import { scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const demo = scenario()
  .init()
  .commit('Initial commit', { 'README.md': '# Projet Nova' })
  .build();

export const lesson01: Lesson = {
  id: 'lesson-under-the-hood',
  title: 'Sous le capot',
  slides: [
    {
      kind: 'text',
      title: 'Un commit est une photo',
      paragraphs: [
        'Git ne stocke pas des différences : chaque commit est une photographie complète des fichiers indexés à un instant donné.',
        'C’est pour cela que revenir à un ancien commit ne dépend pas de ceux qui l’entourent : la photo contient tout.',
      ],
      command: 'git commit -m "docs: première version"',
      note: 'Modifier un fichier après le commit ne change jamais la photo déjà prise.',
    },
    {
      kind: 'text',
      title: 'Pourquoi -m ?',
      paragraphs: [
        'Un commit porte toujours un message : c’est la trace écrite de la photo dans l’historique. Git le demande au moment de commiter.',
        'Sans -m, Git ouvre un éditeur de texte et attend que tu écrives le message. -m, abréviation de --message, le fournit directement dans la commande.',
        'Le texte doit être entre guillemets dès qu’il contient des espaces ; sinon Git prend les mots suivants pour des noms de fichiers, pas pour la suite du message.',
      ],
      command: 'git commit -m "docs: première version"',
      note: '-m et --message sont équivalents : une option courte, une option longue.',
    },
    {
      kind: 'diagram',
      title: 'Du disque au snapshot',
      diagram: 'commit-snapshot',
      caption: 'Trois étapes : working dir, index, commit. Seul l’index entre dans la photo.',
    },
    {
      kind: 'text',
      title: 'Les 3 zones : disque, index, commit',
      paragraphs: [
        'Le working dir est ce que tu vois et modifies. L’index est la zone de préparation : c’est lui que le commit photographie.',
        'Un fichier modifié mais non indexé n’entre pas dans le commit. Un fichier jamais suivi (untracked) doit d’abord être ajouté à l’index.',
        'C’est pour cela qu’un commit peut ne contenir qu’une partie de tes modifications.',
      ],
      command: 'git add README.md',
      note: 'Working dir → index → commit : chaque étape est explicite.',
    },
    {
      kind: 'text',
      title: 'Le piège de -am',
      paragraphs: [
        'git commit -am indexe automatiquement les fichiers déjà suivis, puis commit. Pratique pour une correction rapide.',
        'Mais -a ignore les fichiers untracked : un nouveau fichier doit passer par git add, sinon il reste hors du commit.',
      ],
      command: 'git commit -am "fix: rapide"',
      note: 'Un fichier untracked n’est jamais inclus par -a.',
    },
    {
      kind: 'text',
      title: 'Une branche est une étiquette',
      paragraphs: [
        'Une branche comme main n’est qu’un pointeur vers un commit. La créer ne copie aucun fichier et ne déplace rien.',
        'Faire un commit déplace uniquement l’étiquette de la branche sur laquelle HEAD est attaché.',
      ],
      command: 'git branch experiment',
    },
    {
      kind: 'demo',
      title: 'HEAD voyage, main reste',
      initialState: demo,
      caption: 'Suis l’étiquette feature et le marqueur HEAD à chaque étape.',
      steps: [
        { command: 'git branch feature', explanation: 'Une nouvelle étiquette apparaît sur le commit existant.' },
        { command: 'git switch feature', explanation: 'HEAD se rattache à feature ; aucun commit ne bouge.' },
        { command: 'edit notes.txt "idée"', explanation: 'Le fichier arrive dans le working dir, pas encore dans Git.' },
        { command: 'git add notes.txt', explanation: 'Le fichier passe dans l’index : il sera dans la prochaine photo.' },
        { command: 'git commit -m "feat: note"', explanation: 'Seule l’étiquette feature avance. main pointe toujours sur la racine.' },
        { command: 'git switch main', explanation: 'HEAD revient sur main : notes.txt disparaît du working dir.' },
      ],
    },
    {
      kind: 'text',
      title: 'HEAD : « tu es ici »',
      paragraphs: [
        'HEAD est un marqueur mobile. Attaché à une branche, il avance avec elle à chaque commit.',
        'Détaché, il pointe directement sur un commit. Tu verras ce cas au chapitre suivant.',
      ],
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git init', description: 'Crée le dépôt et attache HEAD à main.' },
        { command: 'git status', description: 'Montre working dir, index et état de HEAD.' },
        { command: 'git add <fichier>', description: 'Copie le fichier dans l’index.' },
        { command: 'git commit -m "message"', description: 'Photographie l’index et avance la branche de HEAD.' },
        { command: 'git commit -am "message"', description: 'Indexe les fichiers suivis, mais pas les untracked.' },
        { command: 'git branch <nom>', description: 'Crée une étiquette sur le commit courant.' },
        { command: 'git switch <nom>', description: 'Rattache HEAD à une branche.' },
      ],
    },
  ],
};
