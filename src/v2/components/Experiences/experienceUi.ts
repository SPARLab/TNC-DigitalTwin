// ============================================================================
// Shared form classes for experience geoprocessing panels.
// Matches the rest of v2 (emerald accents, compact type) rather than the
// mockup's dark CSS variables.
// ============================================================================

export const experienceUi = {
  panel: 'flex flex-col gap-5 p-5',
  description: 'text-xs leading-relaxed text-gray-600',
  section: 'flex flex-col gap-1.5',
  label: 'text-[10px] font-semibold uppercase tracking-wide text-gray-500',
  labelSm: 'text-[10px] font-medium uppercase tracking-wide text-gray-500',
  hint: 'text-[11px] leading-relaxed text-gray-500',
  input:
    'w-full rounded-button border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none',
  toggleGroup: 'flex overflow-hidden rounded-button border border-gray-200',
  toggleBtn:
    'flex-1 px-2 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50',
  toggleBtnActive: 'bg-emerald-50 font-semibold text-emerald-800',
  error:
    'rounded-card border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-800',
  runBtn:
    'flex w-full items-center justify-center gap-1.5 rounded-button bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400',
  iconBtn:
    'rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700',
};
