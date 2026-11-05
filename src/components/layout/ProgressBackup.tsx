import { useRef, useState } from 'react';
import { useDialogKeyboard } from '../../hooks/useDialogKeyboard';
import { useProgressStore } from '../../store/useProgressStore';
import { parseProgress, serializeProgress } from '../../store/progress-file';
import { isNative } from '../../native/platform';
import { useTranslation } from '../../i18n/useTranslation';
import { Icon } from '../ui/Icon';

type Mode = 'export' | 'import';

// taste-skill-ignore — sauvegarde JSON : le contenu est du code exporté.
const JSON_TEXT_STYLE = { fontFamily: 'var(--font-mono)' } as const;

interface Feedback {
  readonly tone: 'success' | 'error';
  readonly message: string;
}

function fileName(now: Date): string {
  const date = now.toISOString().slice(0, 10);
  return `gitquest-progression-${date}.json`;
}

/**
 * Sauvegarde et restauration de la progression.
 *
 * Le stockage d'une WebView peut être évincé par l'OS : sans export, un joueur
 * qui a terminé les six chapitres peut tout perdre en réinstallant l'app.
 * Le format passe par du texte copiable partout, y compris dans la coquille
 * native où le téléchargement de fichier n'existe pas.
 */
export function ProgressBackup() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode | null>(null);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const close = () => {
    setMode(null);
    setValue('');
    setFeedback(null);
  };

  useDialogKeyboard(dialog, { onCancel: close });

  const open = (next: Mode) => {
    setMode(next);
    setFeedback(null);
    setValue(
      next === 'export'
        ? serializeProgress({
            completed: useProgressStore.getState().completed,
            lessonSlides: useProgressStore.getState().lessonSlides,
            story: useProgressStore.getState().story,
          })
        : '',
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({ tone: 'success', message: t('backup.copySuccess') });
    } catch {
      setFeedback({ tone: 'error', message: t('backup.copyError') });
    }
  };

  const download = () => {
    const blob = new Blob([value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName(new Date());
    link.click();
    URL.revokeObjectURL(url);
  };

  const restore = () => {
    const parsed = parseProgress(value);
    if (!parsed.ok) {
      setFeedback({ tone: 'error', message: parsed.error });
      return;
    }
    useProgressStore.getState().restoreProgress(parsed.file);
    setFeedback({
      tone: 'success',
      message: t('backup.restored', {
        count: Object.keys(parsed.file.completed).length,
      }),
    });
  };

  return (
    <>
      <span className="flex items-center gap-3">
        <button type="button" className="hover:text-text" onClick={() => open('export')}>
          {t('backup.save')}
        </button>
        <button type="button" className="hover:text-text" onClick={() => open('import')}>
          {t('backup.restore')}
        </button>
      </span>

      {mode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'export' ? t('backup.saveTitle') : t('backup.restoreTitle')}
            className="w-full max-w-lg bg-panel outline-none"
          >
            <header className="flex items-center justify-between gap-3  px-5 py-3">
              <span className="flex items-center gap-2 text-[12.5px] text-text">
                <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
                {mode === 'export' ? t('backup.saveTitle') : t('backup.restoreTitle')}
              </span>
              <button
                type="button"
                className="btn h-7 w-7 px-0"
                onClick={close}
                aria-label={t('backup.close')}
              >
                <Icon name="close" size={12} />
              </button>
            </header>

            <div className="space-y-3 px-5 py-4">
              <p className="text-[12px] leading-5 text-muted">
                {mode === 'export' ? t('backup.saveText') : t('backup.restoreText')}
              </p>

              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                readOnly={mode === 'export'}
                spellCheck={false}
                aria-label={
                  mode === 'export' ? t('backup.contentAria') : t('backup.restoreInputAria')
                }
                style={JSON_TEXT_STYLE}
                className="scrollbar-thin h-44 w-full resize-none bg-bg px-3 py-2 text-[13px] leading-5 text-muted outline-none"
                placeholder={mode === 'import' ? '{"format":"gitquest-progress", …}' : undefined}
                data-autofocus
              />

              {feedback !== null && (
                <p
                  role="status"
                  className={
                    feedback.tone === 'success'
                      ? 'text-[12px] text-success'
                      : 'text-[12px] text-danger'
                  }
                >
                  {feedback.message}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2  px-5 py-3">
              {mode === 'export' ? (
                <>
                  {!isNative() && (
                    <button type="button" className="btn" onClick={download}>
                      {t('backup.download')}
                    </button>
                  )}
                  <button type="button" className="btn btn-accent" onClick={() => void copy()}>
                    {t('backup.copy')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={restore}
                  disabled={value.trim() === ''}
                >
                  {t('backup.restoreButton')}
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
