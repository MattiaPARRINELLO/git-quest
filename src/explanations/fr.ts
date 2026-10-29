import type { GitError, GitEvent } from '../engine/types';

/** Traduit un événement du moteur en une phrase simple, pour l'UI et `explain`. */
export function explainEvent(event: GitEvent): string {
  switch (event.type) {
    case 'repo-initialized':
      return `Le dépôt est initialisé dans ${event.path} : HEAD pointe vers la branche « main », encore vide.`;
    case 'commit-created':
      return event.branch === undefined
        ? `Un commit « ${event.commit} » est créé : c'est un snapshot complet des fichiers, sans branche attachée.`
        : `Un commit « ${event.commit} » est créé sur la branche « ${event.branch} ».`;
    case 'branch-created':
      return `La branche « ${event.name} » est créée : c'est un simple pointeur vers ${event.commit}.`;
    case 'branch-deleted':
      return `La branche « ${event.name} » est supprimée (elle pointait vers ${event.wasAt}).`;
    case 'branch-moved':
      return `La branche « ${event.name} » avance de ${event.from ?? '(vide)'} à ${event.to}.`;
    case 'head-attached':
      return `HEAD se rattache à la branche « ${event.branch} » (commit ${event.commit}).`;
    case 'head-detached':
      return `HEAD est maintenant détaché sur ${event.commit} : il ne suit plus aucune branche.`;
    case 'head-moved':
      return 'HEAD suit le nouveau commit ; aucune branche ne bouge.';
    case 'file-staged':
      return `« ${event.path} » est indexé : la prochaine photo (commit) le contiendra.`;
    case 'working-file-created':
      return `Le fichier « ${event.path} » est créé dans le working directory (pas encore suivi).`;
    case 'working-file-edited':
      return `Le fichier « ${event.path} » est modifié dans le working directory.`;
    case 'merge-fast-forward': {
      const target = event.branch === null ? 'HEAD' : `« ${event.branch} »`;
      return `Avance rapide : ${target} rejoint ${event.to} sans créer de commit.`;
    }
    case 'merge-commit':
      return `Un commit de fusion « ${event.commit} » est créé : il a deux parents.`;
    case 'up-to-date':
      return `Rien à fusionner : « ${event.branch} » est déjà à jour.`;
    case 'worktree-added':
      return event.branch === undefined
        ? `Le worktree ${event.path} est ajouté.`
        : `Le worktree ${event.path} est ajouté sur la branche « ${event.branch} ».`;
    case 'worktree-removed':
      return `Le worktree ${event.path} est supprimé ; le dépôt et la branche restent intacts.`;
    case 'worktree-activated':
      return `Le worktree actif devient ${event.path}.`;
  }
}

/** Explication pédagogique d'une erreur Git simulée. */
export function explainError(error: GitError): string {
  switch (error.code) {
    case 'not-a-repository':
      return 'Aucun dépôt Git ici : commence par « git init ».';
    case 'local-changes-would-be-overwritten':
      return 'Ces fichiers ont des modifications locales qui seraient écrasées par la destination. Commit ou annule ces changements avant de changer de branche.';
    case 'untracked-files-would-be-overwritten':
      return 'Des fichiers non suivis portent le même nom que des fichiers de la destination. Git refuses de les écraser.';
    case 'branch-checked-out-elsewhere':
      return 'Une branche ne peut être checkout que dans un seul worktree à la fois. Utilise un autre worktree ou une autre branche.';
    case 'branch-not-fully-merged':
      return 'La branche contient des commits absents de HEAD. « -d » refuse de les perdre ; « -D » force la suppression.';
    case 'merge-would-conflict':
      return 'Les deux branches ont modifié le même fichier de façon différente. Les conflits ne sont pas gérés dans cette version.';
    case 'worktree-has-local-modifications':
      return 'Ce worktree contient des modifications ou des fichiers non suivis. Ajoute « --force » pour les jeter.';
    case 'worktree-remove-main':
      return 'Le worktree principal ne peut pas être supprimé.';
    case 'worktree-remove-active':
      return 'Impossible de supprimer le worktree dans lequel tu te trouves : va ailleurs avec « cd ».';
    case 'branch-not-found':
    case 'invalid-reference':
      return 'La branche ou le commit demandé n’existe pas.';
    case 'branch-already-exists':
      return 'Ce nom de branche est déjà pris.';
    case 'nothing-to-commit':
      return 'Aucune modification indexée : il n’y a rien à photographier.';
    case 'no-changes-added':
      return 'Les modifications existent mais ne sont pas indexées : ajoute-les avec « git add ».';
    case 'pathspec-no-match':
      return 'Aucun fichier ou commit ne correspond à ce nom.';
    case 'directory-not-found':
      return 'Ce chemin ne correspond à aucun worktree connu.';
    case 'no-commits':
      return 'La branche n’a pas encore de commit.';
    default:
      return 'La commande s’arrête sans rien modifier.';
  }
}
