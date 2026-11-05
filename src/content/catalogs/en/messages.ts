/**
 * Traduction des raisons de validation des missions.
 *
 * Les validateurs restent dans les fichiers de mission français : ils portent
 * la logique et leurs raisons sont des chaînes stables. Le pack anglais
 * intercepte le résultat et traduit la raison par correspondance exacte.
 *
 * Une raison absente de cette table reste en français : le test
 * `content-invariants` vérifie que toutes les raisons connues y figurent.
 */
export const messageTranslations: Readonly<Record<string, string>> = {
  'HEAD doit rester sur main.': 'HEAD must stay on main.',
  'HEAD doit revenir sur main.': 'HEAD must return to main.',
  'HEAD doit être sur experiment.': 'HEAD must be on experiment.',
  'HEAD doit être sur docs-final.': 'HEAD must be on docs-final.',
  'Un seul nouveau commit est attendu.': 'Exactly one new commit is expected.',
  'Il faut exactement un nouveau commit.': 'Exactly one new commit is required.',
  'Un seul commit est attendu.': 'Exactly one commit is expected.',
  'Deux nouveaux commits sont attendus.': 'Two new commits are expected.',
  'Un seul commit expérimental est attendu.': 'Exactly one experimental commit is expected.',
  'Aucun commit de fusion ne doit être créé.': 'No merge commit must be created.',
  'Aucun commit supplémentaire ne doit être créé.': 'No extra commit must be created.',
  'Le commit doit contenir la version mise à jour de a.txt.':
    'The commit must contain the updated version of a.txt.',
  'Le commit doit conserver l’ancienne version de b.txt.':
    'The commit must keep the old version of b.txt.',
  'a.txt doit être à jour dans le working dir.':
    'a.txt must be up to date in the working dir.',
  'b.txt doit rester modifié dans le working dir.':
    'b.txt must stay modified in the working dir.',
  'Le commit doit contenir v2.': 'The commit must contain v2.',
  'Le working dir doit encore contenir v3, non commité.':
    'The working dir must still contain v3, uncommitted.',
  'README.md doit finir dans sa nouvelle version.':
    'README.md must end up in its new version.',
  'notes.txt doit finir commité.': 'notes.txt must end up committed.',
  'Le working dir doit être propre à la fin.': 'The working dir must be clean at the end.',
  'Le working dir doit être propre après la fusion.':
    'The working dir must be clean after the merge.',
  'Un nouveau commit sur experiment doit modifier notes.txt.':
    'A new commit on experiment must change notes.txt.',
  'main ne doit pas bouger.': 'main must not move.',
  'main ne doit pas bouger : la doc n’est pas encore livrée.':
    'main must not move: the docs are not shipped yet.',
  'feature ne doit pas bouger.': 'feature must not move.',
  'Le HEAD de experiment doit voir notes.txt.':
    'The HEAD of experiment must see notes.txt.',
  'feature doit contenir feature.ts.': 'feature must contain feature.ts.',
  'main doit contenir main.ts.': 'main must contain main.ts.',
  'main ne doit pas contenir feature.ts.': 'main must not contain feature.ts.',
  'Les deux branches doivent avoir divergé.': 'The two branches must have diverged.',
  'feature doit avoir avancé après son commit.': 'feature must have moved forward after its commit.',
  'sauvetage doit pointer sur le commit expérimental.':
    'sauvetage must point at the experimental commit.',
  'sauvetage doit conserver exp.txt.': 'sauvetage must keep exp.txt.',
  'main doit rejoindre le commit de feature.': 'main must join the commit of feature.',
  'Le fichier export.ts doit arriver sur main.': 'The file export.ts must arrive on main.',
  'main doit pointer sur un commit.': 'main must point at a commit.',
  'Le commit de fusion doit avoir exactement deux parents.':
    'The merge commit must have exactly two parents.',
  'notify.ts doit être fusionné.': 'notify.ts must be merged.',
  'config.ts doit être conservé.': 'config.ts must be kept.',
  'Le working dir doit contenir notify.ts après la fusion.':
    'The working dir must contain notify.ts after the merge.',
  'La branche feature-login doit être supprimée.': 'The feature-login branch must be deleted.',
  'La branche experiment doit être supprimée.': 'The experiment branch must be deleted.',
  'Choisis consciemment : fusionner experiment puis -d, ou forcer avec -D.':
    'Choose deliberately: merge experiment then use -d, or force with -D.',
  'La fusion doit intégrer exp.txt.': 'The merge must bring in exp.txt.',
  'La suppression forcée doit laisser main inchangée.':
    'The forced deletion must leave main unchanged.',
  'Essaie d’abord git branch -d experiment et observe le refus de Git.':
    'First try git branch -d experiment and see Git refuse.',
  'La fusion doit être terminée, pas laissée en conflit.':
    'The merge must be finished, not left in conflict.',
  'Le sommet de main doit être un commit de fusion à deux parents.':
    'The tip of main must be a merge commit with two parents.',
  'README.md doit contenir une version fusionnée, sans marqueurs.':
    'README.md must contain a merged version, without markers.',
  'Le worktree hotfix doit exister.': 'The hotfix worktree must exist.',
  'Le correctif doit être présent sur hotfix.': 'The fix must be present on hotfix.',
  'Le WIP de feature doit rester intact.': 'The WIP of feature must stay intact.',
  'Le worktree principal doit rester sur feature.':
    'The main worktree must stay on feature.',
  'Le terminal doit revenir au worktree principal.':
    'The terminal must return to the main worktree.',
  'Le worktree docs doit exister.': 'The docs worktree must exist.',
  'La branche docs doit contenir le guide.': 'The docs branch must contain the guide.',
  'Le WIP de README.md sur main doit rester intact.':
    'The WIP of README.md on main must stay intact.',
  'Le guide ne doit pas apparaître dans le worktree principal.':
    'The guide must not appear in the main worktree.',
  'Le worktree temporaire doit être supprimé.':
    'The temporary worktree must be removed.',
  'La branche hotfix doit survivre.': 'The hotfix branch must survive.',
  'La branche hotfix ne doit pas bouger.': 'The hotfix branch must not move.',
  'Le correctif doit rester dans l’historique.': 'The fix must stay in the history.',
  'Le commit doit contenir la nouvelle configuration.':
    'The commit must contain the new configuration.',
  'README.md ne doit pas entrer dans ce commit.':
    'README.md must not enter this commit.',
  'app.ts ne doit pas entrer dans ce commit.': 'app.ts must not enter this commit.',
  'Les autres modifications doivent rester dans le working dir.':
    'The other modifications must stay in the working dir.',
  'La branche docs-final doit exister.': 'The docs-final branch must exist.',
  'docs-final doit contenir la documentation finale.':
    'docs-final must contain the final documentation.',
  'app.ts doit être commité dans sa version v3.':
    'app.ts must be committed in its v3 version.',
  'src/config.ts doit être commité dans sa version finale.':
    'src/config.ts must be committed in its final version.',
  'main.ts doit être commité dans sa version finale.':
    'main.ts must be committed in its final version.',
  'src/health.ts doit être ajouté et commité.':
    'src/health.ts must be added and committed.',
  'Le remote origin doit exister.': 'The origin remote must exist.',
  'origin doit pointer vers l’URL du projet.': 'origin must point at the project URL.',
  'main doit avoir un commit.': 'main must have a commit.',
  'origin/main doit pointer sur le même commit que main.':
    'origin/main must point at the same commit as main.',
  'main doit suivre origin/main (pense à -u).': 'main must track origin/main (remember -u).',
  'La référence de suivi origin/main doit être à jour.':
    'The origin/main tracking reference must be up to date.',
  'La récupération doit être terminée, sans conflit ouvert.':
    'The fetch must be finished, with no open conflict.',
  'origin/main doit exister.': 'origin/main must exist.',
  'main doit pointer sur le commit de origin/main.':
    'main must point at the commit of origin/main.',
  'Le working dir doit contenir la version de Léa.':
    'The working dir must contain Léa’s version.',
  'main doit garder son upstream.': 'main must keep its upstream.',
  'La fusion du pull doit être terminée.': 'The merge from the pull must be finished.',
  'main doit se terminer par un commit de fusion à deux parents.':
    'main must end with a merge commit with two parents.',
  'src/notify.ts doit contenir la version fusionnée, sans marqueurs.':
    'src/notify.ts must contain the merged version, without markers.',
};
