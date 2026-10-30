import { Icon } from '../components/ui/Icon';
import { LessonDeck } from '../components/lesson/LessonDeck';
import { chapters, commandLineLesson } from '../content';
import { routePaths } from '../router/useHashRoute';

/** Lecture préalable : décoder la syntaxe d'une commande avant le chapitre 1. */
export function PrologueScreen() {
  const first = chapters[0];

  const lastAction = (
    <a
      href={first === undefined ? routePaths.home : routePaths.lesson(first.id)}
      className="btn btn-accent px-3 py-2 text-sm"
    >
      {first === undefined ? 'Retour aux chapitres' : 'Commencer le chapitre 1'}
      <Icon name="arrow-right" size={15} />
    </a>
  );

  return (
    <LessonDeck
      lesson={commandLineLesson}
      storageId={commandLineLesson.id}
      badge="Prologue"
      backHref={routePaths.home}
      backLabel="Chapitres"
      lastAction={lastAction}
    />
  );
}
