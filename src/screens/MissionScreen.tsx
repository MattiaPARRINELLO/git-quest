import { useEffect, useRef, useState } from 'react';
import { findForbiddenCommand, findPrediction, missionText, normalizeCommand, resolvePrediction, starsFor } from '../app/mission';
import { MissionComplete, MissionCompleteBar } from '../components/mission/MissionComplete';
import { MissionBriefing } from '../components/mission/MissionBriefing';
import { MissionPanel } from '../components/mission/MissionPanel';
import { PredictionFeedback, PredictionOverlay } from '../components/mission/PredictionOverlay';
import { SandboxLayout } from '../components/layout/SandboxLayout';
import { afterMission, findMission, isMissionUnlocked } from '../content';
import { briefingFor } from '../content/briefings';
import type { Mission, Prediction } from '../content/types';
import type { RepoState } from '../engine/types';
import type { MissionDraft } from '../story/types';
import type { TerminalEntry } from '../store/useRepoStore';
import { useRepoStore } from '../store/useRepoStore';
import { useProgressStore } from '../store/useProgressStore';
import { useMissionDraftStore } from '../store/useMissionDraftStore';
import { useUiStore } from '../store/useUiStore';
import { routePaths } from '../router/useHashRoute';
import { detachedNotice } from '../story/display';
import { storyBetaEnabled } from '../lib/story-flags';
import { preparedFiles } from '../lib/prepared-files';
import type { PreparedFile } from '../lib/prepared-files';
import { Icon } from '../components/ui/Icon';

interface PendingPrediction {
  readonly prediction: Prediction;
  readonly original: Prediction;
  readonly input: string;
}

interface Completion {
  readonly stars: 1 | 2 | 3;
  readonly used: number;
}

function introEntries(
  mission: Mission,
  start?: { readonly isolated: boolean; readonly recalaged: boolean },
): TerminalEntry[] {
  const entries: TerminalEntry[] = [
    {
      id: 1,
      kind: 'output',
      text: `Mission ${mission.number} — ${mission.title}`,
      tone: 'success',
    },
    { id: 2, kind: 'output', text: `Objectif : ${mission.objective}`, tone: 'muted' },
  ];
  if (start?.isolated === true) {
    entries.push({
      id: 3,
      kind: 'output',
      text: 'Entraînement : ton arbre Nova n’est pas modifié.',
      tone: 'warning',
    });
  }
  if (start?.recalaged === true) {
    entries.push({
      id: 4,
      kind: 'output',
      text: 'Ton dépôt a été remis au propre pour cette mission. Ton parcours reste visible dans le journal.',
      tone: 'warning',
    });
  }
  return entries;
}

/**
 * Un brouillon est repris uniquement s'il vise la même mission ; son état
 * d'entrée est conservé tel quel pour borner undo et reset.
 */

export function MissionScreen({ missionId }: { readonly missionId: string }) {
  const mission = findMission(missionId);
  const completedMissions = useProgressStore((store) => store.completed);
  const completeMission = useProgressStore((store) => store.completeMission);
  const repoState = useRepoStore((store) => store.state);

  const [commandsUsed, setCommandsUsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [completed, setCompleted] = useState<Completion | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<PendingPrediction | null>(null);
  const [answered, setAnswered] = useState<Set<Prediction>>(new Set());
  const attemptedCommands = useRef<string[]>([]);
  const entryRef = useRef<RepoState | null>(null);
  const detachedNoticeRef = useRef<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [isolatedMode, setIsolatedMode] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [prepared, setPrepared] = useState<readonly PreparedFile[]>([]);

  useEffect(() => {
    if (!mission) return;
    const unlocked = isMissionUnlocked(
      mission.id,
      useProgressStore.getState().completed,
    );
    if (!unlocked) return;

    const progress = useProgressStore.getState();
    const missionDraft = useMissionDraftStore.getState().draft;
    const draftResumable =
      missionDraft !== null && missionDraft.missionId === mission.id ? missionDraft : null;

    const start =
      draftResumable !== null
        ? { state: draftResumable.state, isolated: false, recalaged: false }
        : progress.beginMission(mission);

    entryRef.current = start.state;

    if (draftResumable !== null) {
      useRepoStore
        .getState()
        .startMission(draftResumable.state, draftResumable.entries, draftResumable.commandHistory);
    } else {
      useRepoStore.getState().startMission(start.state, introEntries(mission, start));
    }
    setPrepared(preparedFiles(start.state));
    setIsolatedMode(start.isolated);
    setShowBriefing(
      draftResumable === null &&
        !start.isolated &&
        !start.recalaged &&
        briefingFor(mission.id) !== undefined,
    );
    setCommandsUsed(draftResumable?.commandsUsed ?? 0);
    setHintsUsed(draftResumable?.hintsUsed ?? 0);
    setCompleted(null);
    setInspecting(false);
    setPendingPrediction(null);
    setAnswered(
      new Set(
        (draftResumable?.answeredQuestions ?? [])
          .map((question) => mission.predictions?.find((prediction) => prediction.question === question))
          .filter((prediction): prediction is Prediction => prediction !== undefined),
      ),
    );
    setFeedback(null);
    attemptedCommands.current =
      draftResumable !== null ? [...draftResumable.attempted] : [];
    detachedNoticeRef.current = null;
    useUiStore.getState().setMobileTab('terminal');

    return () => {
      useRepoStore.getState().endMission();
    };
  }, [mission?.id]);

  if (!mission) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-muted">Mission introuvable.</p>
        <a href={routePaths.home} className="btn">
          Retour aux chapitres
        </a>
      </div>
    );
  }

  const unlocked = isMissionUnlocked(mission.id, completedMissions);
  if (!unlocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-panel-2 text-muted">
          <Icon name="lock" size={18} />
        </span>
        <p className="text-sm font-medium text-text">Mission verrouillée</p>
        <p className="max-w-sm text-xs text-muted">
          Termine d’abord « {mission.number} » et les missions précédentes pour débloquer
          celle-ci.
        </p>
        <a href={routePaths.home} className="btn">
          Voir la carte des chapitres
        </a>
      </div>
    );
  }

  const isCompleted = completed !== null;
  const briefing = briefingFor(mission.id);

  const persistDraft = (usedCommands: number, usedHints: number): void => {
    const draft: MissionDraft = {
      missionId: mission.id,
      entry: entryRef.current ?? mission.initialState,
      state: useRepoStore.getState().state,
      commandsUsed: usedCommands,
      hintsUsed: usedHints,
      attempts: attemptedCommands.current,
    };
    useProgressStore.getState().saveDraft(draft);

    // Brouillon complet (terminal + historique) : repris au rechargement.
    const repo = useRepoStore.getState();
    if (repo.mode === 'mission') {
      useMissionDraftStore.getState().save({
        missionId: mission.id,
        state: repo.state,
        entries: repo.entries,
        commandHistory: repo.commandHistory,
        commandsUsed: usedCommands,
        hintsUsed: usedHints,
        attempted: attemptedCommands.current,
        answeredQuestions: [...answered].map((prediction) => prediction.question),
      });
    }
  };

  const finish = (used: number): void => {
    if (isCompleted) return;
    const stars = starsFor(used, mission.par);
    setCompleted({ stars, used });
    setFeedback(null);
    setPendingPrediction(null);
    completeMission(mission.id, stars, useRepoStore.getState().state);
    useProgressStore.getState().clearDraft();
    useMissionDraftStore.getState().clear();
  };

  const run = (input: string): void => {
    attemptedCommands.current = [...attemptedCommands.current, normalizeCommand(input)];
    const result = useRepoStore.getState().execute(input);
    if (!result) return;
    const used = result.scored ? commandsUsed + 1 : commandsUsed;
    if (result.scored) setCommandsUsed(used);
    let succeeded = false;
    if (!result.error && result.events.length > 0) {
      const notice = detachedNotice(result.state, entryRef.current ?? mission.initialState);
      if (notice !== null && notice !== detachedNoticeRef.current) {
        detachedNoticeRef.current = notice;
        useRepoStore.getState().appendOutput(notice, 'warning');
      }
      const stateOk = mission.validate(result.state, { entry: entryRef.current ?? mission.initialState }).ok;
      const attemptOk = mission.validateAttempt
        ? mission.validateAttempt(attemptedCommands.current).ok
        : true;
      if (stateOk && attemptOk) {
        finish(used);
        succeeded = true;
      }
    }
    // Brouillon persisté après chaque commande qui modifie le dépôt.
    if (!succeeded && result.events.length > 0) persistDraft(used, hintsUsed);
  };

  const handleCommand = (input: string): void => {
    if (isCompleted) return;
    setShowBriefing(false);
    setFeedback(null);
    const normalized = normalizeCommand(input);

    if (normalized === 'hint') {
      const hints = missionText(mission, useRepoStore.getState().state).hints;
      const next = Math.min(hints.length, hintsUsed + 1);
      setHintsUsed(next);
      const store = useRepoStore.getState();
      store.appendCommand(input);
      store.appendOutput(
        next === hintsUsed && next === hints.length
          ? 'Tous les indices sont déjà révélés.'
          : `Indice ${next}/${hints.length} : ${hints[next - 1] ?? ''}`,
        'warning',
      );
      persistDraft(commandsUsed, next);
      return;
    }

    if (normalized === 'reset-mission') {
      useRepoStore
        .getState()
        .startMission(entryRef.current ?? mission.initialState, introEntries(mission));
      setCommandsUsed(0);
      setHintsUsed(0);
      setPendingPrediction(null);
      setAnswered(new Set());
      setFeedback(null);
      attemptedCommands.current = [];
      detachedNoticeRef.current = null;
      persistDraft(0, 0);
      return;
    }

    const forbidden = findForbiddenCommand(mission, input);
    if (forbidden) {
      const store = useRepoStore.getState();
      store.appendCommand(input);
      store.appendOutput(forbidden.message, 'error');
      return;
    }

    const prediction = findPrediction(mission, input, useRepoStore.getState().state);
    if (prediction && !answered.has(prediction)) {
      setPendingPrediction({
        prediction: resolvePrediction(prediction, useRepoStore.getState().state),
        original: prediction,
        input,
      });
      useUiStore.getState().setMobileTab('graph');
      return;
    }

    run(input);
  };

  const answerPrediction = (optionId: string): void => {
    if (!pendingPrediction) return;
    const { prediction, original, input } = pendingPrediction;
    setAnswered((current) => new Set(current).add(original));
    setPendingPrediction(null);
    setFeedback({
      correct: optionId === prediction.correctOptionId,
      explanation: prediction.explanation,
    });
    run(input);
  };

  const skipPrediction = (): void => {
    if (!pendingPrediction) return;
    const { original, input } = pendingPrediction;
    setAnswered((current) => new Set(current).add(original));
    setPendingPrediction(null);
    run(input);
  };

  const selectCommit = (hash: string): void => {
    if (!pendingPrediction) return;
    const option = pendingPrediction.prediction.options.find(
      (candidate) =>
        candidate.target?.kind === 'commit' &&
        (candidate.target.value === hash || hash.startsWith(candidate.target.value)),
    );
    if (option) answerPrediction(option.id);
  };

  const selectBranch = (name: string): void => {
    if (!pendingPrediction) return;
    const option = pendingPrediction.prediction.options.find(
      (candidate) =>
        candidate.target?.kind === 'branch' && candidate.target.value === name,
    );
    if (option) answerPrediction(option.id);
  };

  const overlay = pendingPrediction ? (
    <PredictionOverlay
      prediction={pendingPrediction.prediction}
      onAnswer={answerPrediction}
      onSkip={skipPrediction}
    />
  ) : feedback ? (
    <PredictionFeedback
      correct={feedback.correct}
      explanation={feedback.explanation}
      onContinue={() => {
        setFeedback(null);
        useUiStore.getState().setMobileTab('terminal');
      }}
    />
  ) : undefined;

  return (
    <>
      <SandboxLayout
        onCommand={handleCommand}
        missionPanel={
          <>
            {isolatedMode && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
                <span>Entraînement : ton arbre Nova n’est pas modifié.</span>
                {storyBetaEnabled() && (
                  <button
                    type="button"
                    className="btn px-2 py-1 text-[11px]"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Reprendre l’histoire depuis la mission ${mission.number} ?\n\n` +
                          'Ton arbre Nova actuel et la suite de l’histoire seront remplacés. ' +
                          'Tes étoiles déjà acquises sont conservées.',
                      );
                      if (!confirmed) return;
                      useProgressStore
                        .getState()
                        .adoptIsolated(useRepoStore.getState().state);
                      setIsolatedMode(false);
                    }}
                  >
                    Reprendre l’histoire depuis ici
                  </button>
                )}
              </div>
            )}
            <MissionPanel
              mission={mission}
              state={repoState}
              commandsUsed={commandsUsed}
              hintsUsed={hintsUsed}
              onHint={() => setHintsUsed((current) => Math.min(mission.hints.length, current + 1))}
              onSuggest={(command) => useUiStore.getState().prefillCommand(command)}
            />
          </>
        }
        {...(overlay === undefined ? {} : { graphOverlay: overlay })}
        {...(pendingPrediction === null
          ? {}
          : { onSelectCommit: selectCommit, onSelectBranch: selectBranch })}
      />

      {showBriefing && briefing !== undefined && (
        <MissionBriefing
          mission={mission}
          briefing={briefing}
          prepared={prepared}
          onClose={() => setShowBriefing(false)}
        />
      )}

      {completed && !inspecting && (
        <MissionComplete
          mission={mission}
          stars={completed.stars}
          commandsUsed={completed.used}
          after={afterMission(mission.id)}
          solution={missionText(mission, repoState).solution}
          {...(briefing?.outcome === undefined ? {} : { outcome: briefing.outcome })}
          {...(briefing?.teaser === undefined ? {} : { teaser: briefing.teaser })}
          onInspect={() => {
            setInspecting(true);
            useUiStore.getState().setMobileTab('graph');
          }}
        />
      )}

      {completed && inspecting && (
        <MissionCompleteBar
          mission={mission}
          stars={completed.stars}
          after={afterMission(mission.id)}
          onResume={() => setInspecting(false)}
        />
      )}
    </>
  );
}
