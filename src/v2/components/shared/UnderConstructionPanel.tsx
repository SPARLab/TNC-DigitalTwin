// ============================================================================
// UnderConstructionPanel — placeholder for sections locked in feedback preview.
// ============================================================================

import { Construction } from 'lucide-react';

interface UnderConstructionPanelProps {
  id: string;
  title: string;
  description?: string;
}

export function UnderConstructionPanel({
  id,
  title,
  description = 'This section is under construction and will be available in a future release.',
}: UnderConstructionPanelProps) {
  return (
    <div
      id={id}
      className="flex h-full w-full items-center justify-center bg-slate-100 px-6"
    >
      <div className="max-w-md rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Construction className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Under construction
        </p>
      </div>
    </div>
  );
}
