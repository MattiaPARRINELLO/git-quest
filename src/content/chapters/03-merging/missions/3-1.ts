import { entryState } from '../../../../story/checkpoints';
import {
  allOf,
  branchTip,
  check,
  headBranch,
  headFile,
} from '../../../../engine/validate';
import { commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('avance-rapide');

export const mission31: Mission = {
  id: 'avance-rapide',
  chapterId: 'merging',
  order: 1,
  number: '3.1',
  title: 'Livrer sans cérémonie',
  story:
    "La feature d'export CSV est terminée et main n'a pas bougé depuis. Le release manager veut la livrer ce soir : ici, aucune divergence, Git peut simplement faire glisser l'étiquette main vers le travail déjà fait.",
  situation: 'main est un ancêtre direct de feature : aucun commit de fusion n’existe encore.',
  objective: 'Fusionne feature dans main en avance rapide, sans créer de commit supplémentaire.',
  steps: [
    {
      label: 'Fusionner feature dans main',
      done: (state) => branchTip(state, 'main') === branchTip(state, 'feature'),
    },
    {
      label: 'Ne créer aucun commit de fusion',
      done: (state, ctx) => {
        const entry = ctx?.entry ?? initial;
        return (
          branchTip(state, 'main') === branchTip(state, 'feature') &&
          commitDelta(state, entry) === 0
        );
      },
    },
    {
      label: 'Vérifier que export.ts arrive sur main',
      done: (state) => headFile(state, 'src/export.ts') !== undefined,
    },
  ],
  takeaway: 'Fast-forward : Git déplace l’étiquette, il ne crée pas de commit.',
  difficulty: 2,
  par: 1,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(
        branchTip(state, 'main') === branchTip(state, 'feature'),
        'main doit rejoindre le commit de feature.',
      ),
      check(commitDelta(state, entry) === 0, 'Aucun commit de fusion ne doit être créé.'),
      check(headFile(state, 'src/export.ts') !== undefined, 'Le fichier export.ts doit arriver sur main.'),
    );
  },
  hints: [
    'Quand HEAD est un ancêtre de la cible, Git peut avancer sans commit.',
    'Une seule commande suffit : demande à Git de fusionner feature.',
    'git merge feature.',
  ],
  solution: ['git merge feature'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-merge',
      question: 'Cette fusion va-t-elle créer un nouveau commit ?',
      options: [
        { id: 'oui', label: 'Oui, un commit de fusion' },
        { id: 'non', label: 'Non, avance rapide' },
      ],
      correctOptionId: 'non',
      explanation:
        'main est un ancêtre direct de feature : Git déplace simplement le pointeur main, sans créer de commit.',
    },
  ],
};
