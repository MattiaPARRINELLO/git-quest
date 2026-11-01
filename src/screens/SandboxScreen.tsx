import { SandboxLayout } from '../components/layout/SandboxLayout';

export function SandboxScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-3">
        <h1 className="text-[17px] font-medium text-text">Bac à sable</h1>
        <p className="text-[13px] text-muted">Un vrai dépôt Git, sans consigne</p>
      </div>
      <div className="min-h-0 flex-1">
        <SandboxLayout />
      </div>
    </div>
  );
}
