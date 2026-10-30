import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRepoStore } from '../../store/useRepoStore';
import type { TerminalEntry } from '../../store/useRepoStore';
import { promptFor } from '../../lib/prompt';
import { cn } from '../../lib/cn';
import { completeInput } from './autocomplete';
import type { OutputTone } from '../../engine/types';

const TONE_CLASSES: Record<OutputTone, string> = {
  default: 'text-text',
  muted: 'text-muted',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
};

function EntryLine({ entry }: { entry: TerminalEntry }) {
  if (entry.kind === 'command') {
    return (
      <div className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6 text-text">
        {entry.text}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6',
        TONE_CLASSES[entry.tone ?? 'default'],
      )}
    >
      {entry.text}
    </div>
  );
}

interface TerminalProps {
  /** Remplace `store.execute` (mode mission : interception prédiction/forbidden). */
  readonly onCommand?: (input: string) => void;
}

export function Terminal({ onCommand }: TerminalProps) {
  const entries = useRepoStore((store) => store.entries);
  const state = useRepoStore((store) => store.state);
  const commandHistory = useRepoStore((store) => store.commandHistory);
  const executeCommand = useRepoStore((store) => store.execute);
  const clearTerminal = useRepoStore((store) => store.clearTerminal);

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [entries.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    if (input.trim() !== '') {
      if (onCommand) onCommand(input);
      else executeCommand(input);
    }
    setInput('');
    setHistoryIndex(null);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const completion = completeInput(input, state);
      setInput(completion.value);
      setSuggestions(completion.suggestions);
      return;
    }

    if (event.ctrlKey && (event.key === 'l' || event.key === 'L')) {
      event.preventDefault();
      clearTerminal();
      return;
    }

    if (event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
      event.preventDefault();
      setInput('');
      setHistoryIndex(null);
      setSuggestions([]);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      const index =
        historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(commandHistory[index] ?? '');
      setSuggestions([]);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) return;
      if (historyIndex >= commandHistory.length - 1) {
        setHistoryIndex(null);
        setInput('');
        return;
      }
      const index = historyIndex + 1;
      setHistoryIndex(index);
      setInput(commandHistory[index] ?? '');
      return;
    }
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[#08090d] text-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-danger/80" />
            <span className="h-2 w-2 rounded-full bg-warning/80" />
            <span className="h-2 w-2 rounded-full bg-success/80" />
          </span>
          Terminal
        </div>
        <span className="hidden font-mono text-[10px] text-muted sm:inline">
          ↑↓ historique · Tab complétion · Ctrl+L effacer
        </span>
      </div>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Sortie du terminal"
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        {entries.map((entry) => (
          <EntryLine key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="shrink-0 border-t border-border/70 px-3 py-2.5">
        <div className="flex items-start gap-2 font-mono text-[12.5px] leading-6">
          <span className="shrink-0 select-none text-accent-2">{promptFor(state)}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setHistoryIndex(null);
              setSuggestions([]);
            }}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Commande Git"
            className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono text-[12.5px] leading-6 text-text caret-accent outline-none placeholder:text-muted/50"
            placeholder="git status"
          />
        </div>
        {suggestions.length > 1 && (
          <div className="mt-1 pl-1 font-mono text-[11px] text-muted">
            {suggestions.slice(0, 8).join('  ·  ')}
          </div>
        )}
      </div>
    </div>
  );
}
