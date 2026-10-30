import { motion } from 'framer-motion';
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
      <p className="border-l-2 border-border pl-3 text-[14px] leading-7 text-muted">
        {line.text}
      </p>
    );
  }

  const teammate = TEAMMATES[line.speaker];
  if (teammate === undefined) {
    return <p className="text-[14px] leading-7 text-muted">{line.text}</p>;
  }
  const color = branchColor(teammate.id);

  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-medium"
        style={{ border: `1px solid ${color}`, color, background: `${color}14` }}
      >
        {initials(teammate.name)}
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] text-text">
          {teammate.name}
          <span className="ml-1.5 text-muted">· {teammate.role}</span>
        </p>
        <p className="text-[14px] leading-7 text-muted">{line.text}</p>
      </div>
    </div>
  );
}

/**
 * Introduction narrative de mission. Volontairement skippable : un clic sur
 * « Passer l’intro » ou la première commande la referme.
 */
export function MissionBriefing({ mission, briefing, prepared = [], onClose }: MissionBriefingProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/85 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
        className="scrollbar-thin max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel shadow-[var(--shadow)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Briefing ${mission.number}`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
            <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
            Mission {mission.number}
          </span>
          <button
            type="button"
            className="btn h-7 px-2 text-[11.5px]"
            onClick={onClose}
            title="Fermer l’intro"
          >
            Fermer
          </button>
        </header>

        <div className="px-5 py-4">
          <h2 className="display text-[26px] leading-[1.15] text-text">{briefing.title}</h2>

          <div className="mt-4 space-y-3.5">
            {briefing.lines.map((line) => (
              <DialogueLine key={`${line.speaker}-${line.text}`} line={line} />
            ))}
          </div>

          {prepared.length > 0 && (
            <div className="mt-5 border-t border-border pt-3">
              <p className="mono-meta">Déjà dans ton working dir</p>
              <ul className="mt-2 space-y-1.5">
                {prepared.map((file) => (
                  <li key={file.path} className="text-[11.5px] leading-relaxed">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11.5px] text-text">{file.path}</span>
                      <span className="font-mono text-[9.5px] text-muted">{file.status}</span>
                    </div>
                    <span className="mt-0.5 block truncate font-mono text-[10.5px] text-muted/75">
                      {file.preview}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn h-9 justify-center px-3 text-[13px]" onClick={onClose}>
            Passer l’intro
          </button>
          <button
            type="button"
            className="btn btn-accent h-9 justify-center px-3.5 text-[13px]"
            onClick={onClose}
          >
            Entrer dans le dépôt
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
