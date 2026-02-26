import { ChevronLeft, ChevronRight } from 'lucide-react';

type BrowsePaginationControlsProps = {
  idPrefix: string;
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel?: string;
  nextLabel?: string;
  isOneBased?: boolean;
  containerClassName?: string;
  buttonClassName?: string;
  labelClassName?: string;
};

export function BrowsePaginationControls({
  idPrefix,
  page,
  totalPages,
  onPrevious,
  onNext,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  isOneBased = false,
  containerClassName,
  buttonClassName,
  labelClassName,
}: BrowsePaginationControlsProps) {
  const displayPage = isOneBased ? page : page + 1;
  const displayTotalPages = Math.max(totalPages, 1);
  const isOnFirstPage = isOneBased ? page <= 1 : page <= 0;
  const isOnLastPage = isOneBased ? page >= totalPages : page >= totalPages - 1;

  const resolvedContainerClassName = containerClassName ?? 'flex items-center justify-between border-t border-gray-100 pt-2';
  const resolvedButtonClassName =
    buttonClassName ??
    'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed';
  const resolvedLabelClassName = labelClassName ?? 'text-xs text-gray-500';

  return (
    <div id={`${idPrefix}-pagination`} className={resolvedContainerClassName}>
      <button
        id={`${idPrefix}-pagination-prev`}
        onClick={onPrevious}
        disabled={isOnFirstPage}
        className={resolvedButtonClassName}
      >
        <ChevronLeft id={`${idPrefix}-pagination-prev-icon`} className="h-3.5 w-3.5" />
        {previousLabel}
      </button>

      <span id={`${idPrefix}-pagination-label`} className={resolvedLabelClassName}>
        Page {displayPage} of {displayTotalPages}
      </span>

      <button
        id={`${idPrefix}-pagination-next`}
        onClick={onNext}
        disabled={isOnLastPage}
        className={resolvedButtonClassName}
      >
        {nextLabel}
        <ChevronRight id={`${idPrefix}-pagination-next-icon`} className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
