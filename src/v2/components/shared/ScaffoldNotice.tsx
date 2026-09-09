// ============================================================================
// ScaffoldNotice — shared callout for pages whose layout exists but whose
// behavior lands in a later phase.
// ============================================================================

import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';

interface ScaffoldNoticeProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function ScaffoldNotice({ id, title, children }: ScaffoldNoticeProps) {
  return (
    <div
      id={id}
      className="flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <Construction className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-amber-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">{children}</p>
      </div>
    </div>
  );
}
