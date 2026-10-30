import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useDialogKeyboard } from '../../hooks/useDialogKeyboard';
import type { Mission } from '../../content/types';
import type { BriefingLine, MissionBriefing as Briefing } from '../../content/briefings';
import type { PreparedFile } from '../../lib/prepared-files';
import { branchColor } from '../../lib/colors';
import { TEAMMATES } from '../../story/actor';
import { Icon } from '../ui/Icon';

interface MissionBriefingProps {
  readonly mission: Mission;
  readonly briefing: Briefing;
  readonly prepared?: readonly PreparedFile[];
  readonly onClose: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function DialogueLine({ line }: { readonly line: BriefingLine }) {
  if (line.speaker === 'narrateur') {
    return (
      <p className="border-l-2 border-border pl-2.5 text-sm leading-relaxed text-muted">
        {line.text}
      </p>
    );
  }

  const teammate = TEAMMATES[line.speaker];
  if (teammate === undefined) {
    return <p className="text-sm leading-relaxed text-muted">{line.text}</p>;
  }
  const color = branchColor(teammate.id);

  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold"
        style={{ borderColor: color, color, background: `${color}1a` }}
      >
        {initials(teammate.name)}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wide text-text">
          {teammate.name}
          <span className="ml-1.5 font-normal text-muted">· {teammate.role}</span>
        </p>
        <p className="text-sm leading-relaxed text-muted">{line.text}</p>
      </div>
    </div>
  );
}

/**
 * Introduction narrative de mission. Volontairement skippable : un clic sur
 * « Passer l’intro » ou la première commande la referme.
 */
export function MissionBriefing({ mission, briefing, prepared = [], onClose }: MissionBriefingProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialogKeyboard(dialog, { onConfirm: onClose, onCancel: onClose });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm">
      <motion.div
        ref={dialog}
        tabIndex={-1}
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="scrollbar-thin max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-panel p-5 shadow-2xl outline-none sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Briefing ${mission.number}`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Mission {mission.number}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">{briefing.title}</h2>

        <div className="mt-3 space-y-3">
          {briefing.lines.map((line) => (
            <DialogueLine key={`${line.speaker}-${line.text}`} line={line} />
          ))}
        </div>

        {prepared.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-panel-2/50 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Déjà dans ton working dir
            </p>
            <ul className="mt-1.5 space-y-1">
              {prepared.map((file) => (
                <li key={file.path} className="text-[11px] leading-relaxed">
                  <span className="font-mono text-accent-2">{file.path}</span>
                  <span className="ml-2 rounded border border-border px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted">
                    {file.status}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-muted/80">
                    {file.preview}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn justify-center px-3 py-2 text-sm" onClick={onClose}>
            Passer l’intro
          </button>
          <button
            type="button"
            data-autofocus
            className="btn btn-accent justify-center px-3 py-2 text-sm"
            onClick={onClose}
          >
            Entrer dans le dépôt
            <Icon name="arrow-right" size={15} />
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-muted/80" aria-hidden="true">
          Entrée pour entrer · Échap pour passer l’intro
        </p>
      </motion.div>
    </div>
  );
}
