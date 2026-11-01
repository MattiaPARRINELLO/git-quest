import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import type { TerminalEntry } from '../../store/useRepoStore';
import { promptFor } from '../../lib/prompt';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
import { cn } from '../../lib/cn';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { applySuggestion, completeInput } from './autocomplete';
import { KeyBar } from './KeyBar';
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
  const commandPrefill = useUiStore((store) => store.commandPrefill);
  const clearPrefill = useUiStore((store) => store.clearPrefill);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const keyboardOpen = useKeyboardOpen();

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [entries.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clavier ouvert : on recolle l'historique sur la dernière ligne.
  useEffect(() => {
    if (!keyboardOpen) return;
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [keyboardOpen]);

  useEffect(() => {
    if (commandPrefill === null) return;
    setInput(commandPrefill);
    setHistoryIndex(null);
    setSuggestions([]);
    clearPrefill();
    inputRef.current?.focus();
  }, [commandPrefill, clearPrefill]);

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

  const complete = () => {
    const completion = completeInput(input, state);
    setInput(completion.value);
    setSuggestions(completion.suggestions);
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      if (commandHistory.length === 0) return;
      const index =
        historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(commandHistory[index] ?? '');
      setSuggestions([]);
      return;
    }
    if (historyIndex === null) return;
    if (historyIndex >= commandHistory.length - 1) {
      setHistoryIndex(null);
      setInput('');
      return;
    }
    const index = historyIndex + 1;
    setHistoryIndex(index);
    setInput(commandHistory[index] ?? '');
  };

  /**
   * Insère un texte à la position du curseur, sans perdre le clavier tactile :
   * la valeur est contrôlée par React, donc le curseur est replacé après le
   * rendu.
   */
  const insertAtCaret = (text: string) => {
    const element = inputRef.current;
    const start = element?.selectionStart ?? input.length;
    const end = element?.selectionEnd ?? input.length;
    setInput(`${input.slice(0, start)}${text}${input.slice(end)}`);
    setHistoryIndex(null);
    setSuggestions([]);
    const caret = start + text.length;
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(caret, caret);
    });
  };

  const chooseSuggestion = (suggestion: string) => {
    const next = applySuggestion(input, suggestion);
    setInput(next);
    setSuggestions([]);
    setHistoryIndex(null);
    const caret = next.length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(caret, caret);
    });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      complete();
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
      navigateHistory('up');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigateHistory('down');
      return;
    }
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-bg text-text"
      onClick={() => inputRef.current?.focus()}
    >
      {!(isMobile && keyboardOpen) && (
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
            Terminal
          </div>
          <span className="hidden font-mono text-[10px] text-muted/70 sm:inline">
            ↑↓ historique · Tab complétion · Ctrl+L effacer
          </span>
        </div>
      )}

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

      <div
        className={cn(
          'shrink-0 border-t border-border/70 px-3',
          isMobile && keyboardOpen ? 'py-1.5' : 'py-2.5',
        )}
      >
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
            autoCorrect="off"
            aria-label="Commande Git"
            className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono text-[16px] leading-6 text-text caret-accent outline-none placeholder:text-muted/50 sm:text-[12.5px]"
            placeholder="git status"
          />
        </div>
        {suggestions.length > 1 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                // Le clavier tactile reste ouvert : pas de prise de focus.
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.stopPropagation();
                  chooseSuggestion(suggestion);
                }}
                className="rounded border border-border bg-panel-2 px-2.5 py-1.5 font-mono text-[11px] text-text transition-colors active:bg-panel-3"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMobile && (
        <KeyBar
          onInsert={insertAtCaret}
          onComplete={complete}
          onHistory={navigateHistory}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
