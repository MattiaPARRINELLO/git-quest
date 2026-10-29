import { create } from 'zustand';
import { routeCommand } from '../app/commands';
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

export interface RepoStore {
  state: RepoState;
  history: RepoState[];
  entries: TerminalEntry[];
  commandHistory: string[];
  lastEvents: { id: number; events: readonly GitEvent[] };
  hydrated: boolean;
  nextEntryId: number;
  execute(input: string): void;
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
      text: 'Astuce : « explain <commande> » pour comprendre avant d’exécuter.',
      tone: 'muted',
    },
  ];
}

const initialEntries = welcomeEntries(1);

export const useRepoStore = create<RepoStore>((set, get) => ({
  state: createSandboxState(),
  history: [],
  entries: initialEntries,
  commandHistory: [],
  lastEvents: { id: 0, events: [] },
  hydrated: false,
  nextEntryId: 3,

  execute(input) {
    const command = input.trim();
    if (command === '') return;

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
  const { state, entries, commandHistory } = useRepoStore.getState();
  void storage
    .set<PersistedSandbox>(SANDBOX_KEY, {
      version: 1,
      state,
      entries,
      commandHistory,
    })
    .catch(() => undefined);
}
