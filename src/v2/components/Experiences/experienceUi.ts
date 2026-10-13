// ============================================================================
// Shared form classes for experience geoprocessing panels.
// Matches the rest of v2 (emerald accents) rather than the mockup's dark CSS.
// ============================================================================

export const experienceUi = {
  panel: 'flex min-w-0 flex-col gap-5 p-5',
  heading: 'text-base font-semibold text-gray-900',
  description: 'text-sm leading-relaxed text-gray-600',
  section: 'flex flex-col gap-2',
  label: 'text-xs font-semibold uppercase tracking-wide text-gray-500',
  labelSm: 'text-xs font-medium uppercase tracking-wide text-gray-500',
  hint: 'text-sm leading-relaxed text-gray-500',
  body: 'text-sm leading-relaxed text-gray-700',
  input:
    'min-w-0 w-full rounded-button border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none',
  toggleGroup: 'flex overflow-hidden rounded-button border border-gray-200',
  toggleBtn:
    'flex-1 px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50',
  toggleBtnActive: 'bg-emerald-50 font-semibold text-emerald-800',
  error:
    'rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-800',
  runBtn:
    'flex w-full items-center justify-center gap-1.5 rounded-button bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400',
  iconBtn:
    'rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700',
};
