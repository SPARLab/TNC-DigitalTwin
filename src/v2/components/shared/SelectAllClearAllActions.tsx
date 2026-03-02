import type { MouseEvent } from 'react';

interface SelectAllClearAllActionsProps {
  idPrefix: string;
  onSelectAll: () => void;
  onClearAll: () => void;
  disableSelectAll?: boolean;
  disableClearAll?: boolean;
  className?: string;
  stopPropagation?: boolean;
}

export function SelectAllClearAllActions({
  idPrefix,
  onSelectAll,
  onClearAll,
  disableSelectAll = false,
  disableClearAll = false,
  className = '',
  stopPropagation = false,
}: SelectAllClearAllActionsProps) {
  const handleSelectAll = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
    onSelectAll();
  };

  const handleClearAll = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
    onClearAll();
  };

  const enabledClassName = 'text-emerald-600 hover:text-emerald-700';
  const disabledClassName = 'text-gray-400 cursor-not-allowed';

  return (
    <div
      id={`${idPrefix}-actions`}
      className={`flex items-center justify-start gap-2 px-0.5 ${className}`.trim()}
    >
      <button
        id={`${idPrefix}-select-all`}
        type="button"
        onClick={handleSelectAll}
        disabled={disableSelectAll}
        className={`text-xs font-medium transition-colors ${
          disableSelectAll ? disabledClassName : enabledClassName
        }`}
      >
        Select All
      </button>
      <span id={`${idPrefix}-divider`} className="text-xs text-gray-300 select-none" aria-hidden="true">
        |
      </span>
      <button
        id={`${idPrefix}-clear-all`}
        type="button"
        onClick={handleClearAll}
        disabled={disableClearAll}
        className={`text-xs font-medium transition-colors ${
          disableClearAll ? disabledClassName : enabledClassName
        }`}
      >
        Clear All
      </button>
    </div>
  );
}
