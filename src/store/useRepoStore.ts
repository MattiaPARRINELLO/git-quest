import { create } from 'zustand';
import { routeCommand } from '../app/commands';
import type { RoutedResult } from '../app/commands';
import { explainEvent } from '../explanations/fr';
import { createDemoState, createSandboxState } from '../content/sandbox';
import { promptFor } from '../lib/prompt';
import { storage } from '../storage/storage';
import { useUiStore } from './useUiStore';
import type { GitEvent, OutputTone, RepoState } from '../engine/types';

const SANDBOX_KEY = 'gitquest.sandbox.v1';
const HISTORY_LIMIT = 50;
const ENTRY_LIMIT = 400;

export interface TerminalEntry {
  readonly id: number;
  readonly kind: 'command' | 'output';
  readonly text: string;
  readonly tone?: OutputTone;
}

interface PersistedSandbox {
  readonly version: 1;
  readonly state: RepoState;
  readonly entries: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
}

export type RepoMode = 'sandbox' | 'mission';

export interface RepoStore {
  mode: RepoMode;
  state: RepoState;
  history: RepoState[];
  entries: TerminalEntry[];
  commandHistory: string[];
  lastEvents: { id: number; events: readonly GitEvent[] };
  hydrated: boolean;
  nextEntryId: number;
  execute(input: string): RoutedResult | null;
  appendCommand(input: string): void;
  appendOutput(text: string, tone?: OutputTone): void;
  startMission(state: RepoState, entries: readonly TerminalEntry[], commandHistory?: readonly string[]): void;
  endMission(): void;
  clearTerminal(): void;
  resetSandbox(): void;
  loadDemo(): void;
  hydrate(): Promise<void>;
}

function welcomeEntries(startId: number): TerminalEntry[] {
  return [
    {
      id: startId,
      kind: 'output',
      text: 'Bac à sable GitQuest — dépôt vierge initialisé (HEAD sur main).',
      tone: 'muted',
    },
    {
      id: startId + 1,
      kind: 'output',
      text: 'Tape `help` pour voir les commandes.',
      tone: 'muted',
    },
    {
      id: startId + 2,
      kind: 'output',
      text: 'Les fichiers sont simulés : `edit app.ts "texte"` pour écrire dedans.',
      tone: 'muted',
    },
  ];
}

const initialEntries = welcomeEntries(1);

interface SandboxBackup {
  readonly state: RepoState;
  readonly entries: TerminalEntry[];
  readonly commandHistory: string[];
  readonly history: RepoState[];
  readonly nextEntryId: number;
  readonly lastEvents: { id: number; events: readonly GitEvent[] };
}

let sandboxBackup: SandboxBackup | null = null;

export const useRepoStore = create<RepoStore>((set, get) => ({
  mode: 'sandbox',
  state: createSandboxState(),
  history: [],
  entries: initialEntries,
  commandHistory: [],
  lastEvents: { id: 0, events: [] },
  hydrated: false,
  nextEntryId: 4,

  execute(input) {
    const command = input.trim();
    if (command === '') return null;

    const current = get();
    const prompt = promptFor(current.state);
    const result = routeCommand(
      {
        state: current.state,
        history: current.history,
        mission: null,
        hintsUsed: 0,
      },
      command,
    );

    let nextEntryId = current.nextEntryId;
    const entries: TerminalEntry[] = [
      ...current.entries,
      { id: nextEntryId++, kind: 'command', text: `${prompt} ${command}` },
    ];

    for (const output of result.output) {
      entries.push({
        id: nextEntryId++,
        kind: 'output',
        text: output.text,
        ...(output.tone === undefined ? {} : { tone: output.tone }),
      });
    }

    if (useUiStore.getState().showExplanations) {
      for (const event of result.events) {
        entries.push({
          id: nextEntryId++,
          kind: 'output',
          text: `↳ ${explainEvent(event)}`,
          tone: 'muted',
        });
      }
    }

    const commandHistory = appendHistory(current.commandHistory, command);
    const lastEvents = {
      id: current.lastEvents.id + 1,
      events: result.events,
    };

    set({
      state: result.state,
      history: result.history.slice(-HISTORY_LIMIT),
      entries: entries.slice(-ENTRY_LIMIT),
      commandHistory,
      lastEvents,
      nextEntryId,
    });

    if (result.events.length > 0) noteGraphChange();
    persist();
    return result;
  },

  appendCommand(input) {
    const command = input.trim();
    if (command === '') return;
    const current = get();
    set({
      entries: [
        ...current.entries,
        {
          id: current.nextEntryId,
          kind: 'command' as const,
          text: `${promptFor(current.state)} ${command}`,
        },
      ].slice(-ENTRY_LIMIT),
      nextEntryId: current.nextEntryId + 1,
    });
    persist();
  },

  appendOutput(text, tone) {
    const current = get();
    set({
      entries: [
        ...current.entries,
        {
          id: current.nextEntryId,
          kind: 'output' as const,
          text,
          ...(tone === undefined ? {} : { tone }),
        },
      ].slice(-ENTRY_LIMIT),
      nextEntryId: current.nextEntryId + 1,
    });
    persist();
  },

  startMission(state, entries, commandHistory = []) {
    const current = get();
    if (current.mode === 'sandbox') {
      sandboxBackup = {
        state: current.state,
        entries: current.entries,
        commandHistory: current.commandHistory,
        history: current.history,
        nextEntryId: current.nextEntryId,
        lastEvents: current.lastEvents,
      };
    }
    const maxId = entries.reduce((max, entry) => Math.max(max, entry.id), 0);
    set({
      mode: 'mission',
      state,
      history: [],
      entries: [...entries],
      commandHistory: [...commandHistory],
      lastEvents: { id: current.lastEvents.id + 1, events: [] },
      nextEntryId: maxId + 1,
    });
  },

  endMission() {
    if (get().mode !== 'mission') return;
    if (!sandboxBackup) {
      set({ mode: 'sandbox' });
      return;
    }
    set({ mode: 'sandbox', ...sandboxBackup });
    sandboxBackup = null;
    persist();
  },

  clearTerminal() {
    set({ entries: [] });
  },

  resetSandbox() {
    const current = get();
    const entries = welcomeEntries(current.nextEntryId);
    set({
      state: createSandboxState(),
      history: [],
      entries,
      commandHistory: [],
      lastEvents: { id: current.lastEvents.id + 1, events: [] },
      nextEntryId: current.nextEntryId + entries.length,
    });
    persist();
  },

  loadDemo() {
    const current = get();
    const id = current.nextEntryId;
    set({
      state: createDemoState(),
      history: [],
      entries: [
        {
          id,
          kind: 'output',
          text: 'Démo chargée : main + feature/login + hotfix, un merge commit et un worktree.',
          tone: 'success',
        },
        {
          id: id + 1,
          kind: 'output',
          text: 'Essaie « git log --oneline --graph » ou « git worktree list ».',
          tone: 'muted',
        },
      ],
      commandHistory: [],
      lastEvents: { id: current.lastEvents.id + 1, events: [] },
      nextEntryId: id + 2,
    });
    persist();
  },

  async hydrate() {
    const saved = await storage.get<PersistedSandbox | null>(SANDBOX_KEY, null);
    if (saved && saved.version === 1 && saved.state && saved.state.version === 1) {
      const maxId = saved.entries.reduce((max, entry) => Math.max(max, entry.id), 0);
      set({
        state: saved.state,
        entries: [...saved.entries].slice(-ENTRY_LIMIT),
        commandHistory: [...saved.commandHistory],
        history: [],
        nextEntryId: maxId + 1,
        hydrated: true,
      });
      return;
    }
    set({ hydrated: true });
  },
}));

function appendHistory(history: readonly string[], command: string): string[] {
  const last = history[history.length - 1];
  const next = last === command ? [...history] : [...history, command];
  return next.slice(-100);
}

function noteGraphChange(): void {
  if (useUiStore.getState().mobileTab !== 'graph') {
    useUiStore.getState().noteGraphChange();
  }
}

function persist(): void {
  const { state, entries, commandHistory, mode } = useRepoStore.getState();
  if (mode !== 'sandbox') return;
  void storage
    .set<PersistedSandbox>(SANDBOX_KEY, {
      version: 1,
      state,
      entries,
      commandHistory,
    })
    .catch(() => undefined);
}
