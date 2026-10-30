import { useEffect, useRef, useState } from 'react';
import { findForbiddenCommand, findPrediction, normalizeCommand, starsFor } from '../app/mission';
import { MissionComplete } from '../components/mission/MissionComplete';
import { MissionPanel } from '../components/mission/MissionPanel';
import { PredictionFeedback, PredictionOverlay } from '../components/mission/PredictionOverlay';
import { SandboxLayout } from '../components/layout/SandboxLayout';
import { afterMission, findMission, isMissionUnlocked } from '../content';
import type { Mission, Prediction } from '../content/types';
import type { TerminalEntry } from '../store/useRepoStore';
import { useRepoStore } from '../store/useRepoStore';
import { useProgressStore } from '../store/useProgressStore';
import { useUiStore } from '../store/useUiStore';
import { routePaths } from '../router/useHashRoute';
import { Icon } from '../components/ui/Icon';

interface PendingPrediction {
  readonly prediction: Prediction;
  readonly input: string;
}

interface Completion {
  readonly stars: 1 | 2 | 3;
  readonly used: number;
}

function introEntries(mission: Mission): TerminalEntry[] {
  return [
    {
      id: 1,
      kind: 'output',
      text: `Mission ${mission.number} — ${mission.title}`,
      tone: 'success',
    },
    { id: 2, kind: 'output', text: `Objectif : ${mission.objective}`, tone: 'muted' },
  ];
}

export function MissionScreen({ missionId }: { readonly missionId: string }) {
  const mission = findMission(missionId);
  const completedMissions = useProgressStore((store) => store.completed);
  const completeMission = useProgressStore((store) => store.completeMission);
  const repoState = useRepoStore((store) => store.state);

  const [commandsUsed, setCommandsUsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [completed, setCompleted] = useState<Completion | null>(null);
  const [pendingPrediction, setPendingPrediction] = useState<PendingPrediction | null>(null);
  const [answered, setAnswered] = useState<Set<Prediction>>(new Set());
  const attemptedCommands = useRef<string[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);

  useEffect(() => {
    if (!mission) return;
    const unlocked = isMissionUnlocked(
      mission.id,
      useProgressStore.getState().completed,
    );
    if (!unlocked) return;

    useRepoStore.getState().startMission(mission.initialState, introEntries(mission));
    setCommandsUsed(0);
    setHintsUsed(0);
    setCompleted(null);
    setPendingPrediction(null);
    setAnswered(new Set());
    setFeedback(null);
    attemptedCommands.current = [];
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

  const finish = (used: number): void => {
    if (isCompleted) return;
    const stars = starsFor(used, mission.par);
    setCompleted({ stars, used });
    setFeedback(null);
    setPendingPrediction(null);
    completeMission(mission.id, stars);
  };

  const run = (input: string): void => {
    attemptedCommands.current = [...attemptedCommands.current, normalizeCommand(input)];
    const result = useRepoStore.getState().execute(input);
    if (!result) return;
    const used = result.scored ? commandsUsed + 1 : commandsUsed;
    if (result.scored) setCommandsUsed(used);
    if (!result.error && result.events.length > 0) {
      const stateOk = mission.validate(result.state, { entry: mission.initialState }).ok;
      const attemptOk = mission.validateAttempt
        ? mission.validateAttempt(attemptedCommands.current).ok
        : true;
      if (stateOk && attemptOk) finish(used);
    }
  };

  const handleCommand = (input: string): void => {
    if (isCompleted) return;
    setFeedback(null);
    const normalized = normalizeCommand(input);

    if (normalized === 'hint') {
      const next = Math.min(mission.hints.length, hintsUsed + 1);
      setHintsUsed(next);
      const store = useRepoStore.getState();
      store.appendCommand(input);
      store.appendOutput(
        next === hintsUsed && next === mission.hints.length
          ? 'Tous les indices sont déjà révélés.'
          : `Indice ${next}/${mission.hints.length} : ${mission.hints[next - 1] ?? ''}`,
        'warning',
      );
      return;
    }

    if (normalized === 'reset-mission') {
      useRepoStore.getState().startMission(mission.initialState, introEntries(mission));
      setCommandsUsed(0);
      setHintsUsed(0);
      setPendingPrediction(null);
      setAnswered(new Set());
      setFeedback(null);
      attemptedCommands.current = [];
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
      setPendingPrediction({ prediction, input });
      useUiStore.getState().setMobileTab('graph');
      return;
    }

    run(input);
  };

  const answerPrediction = (optionId: string): void => {
    if (!pendingPrediction) return;
    const { prediction, input } = pendingPrediction;
    setAnswered((current) => new Set(current).add(prediction));
    setPendingPrediction(null);
    setFeedback({
      correct: optionId === prediction.correctOptionId,
      explanation: prediction.explanation,
    });
    run(input);
  };

  const skipPrediction = (): void => {
    if (!pendingPrediction) return;
    const { prediction, input } = pendingPrediction;
    setAnswered((current) => new Set(current).add(prediction));
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
          <MissionPanel
            mission={mission}
            state={repoState}
            commandsUsed={commandsUsed}
            hintsUsed={hintsUsed}
            onHint={() => setHintsUsed((current) => Math.min(mission.hints.length, current + 1))}
            onSuggest={(command) => useUiStore.getState().prefillCommand(command)}
          />
        }
        {...(overlay === undefined ? {} : { graphOverlay: overlay })}
        {...(pendingPrediction === null
          ? {}
          : { onSelectCommit: selectCommit, onSelectBranch: selectBranch })}
      />

      {completed && (
        <MissionComplete
          mission={mission}
          stars={completed.stars}
          commandsUsed={completed.used}
          after={afterMission(mission.id)}
          onInspect={() => {
            setCompleted(null);
            useUiStore.getState().setMobileTab('terminal');
          }}
        />
      )}
    </>
  );
}
