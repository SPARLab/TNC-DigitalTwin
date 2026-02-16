// ============================================================================
// Loading Theme Tokens — shared styling for loading indicators across v2.
// Update these tokens to propagate spinner/layout styling app-wide.
// ============================================================================

export const loadingTheme = {
  eyeSlotSpinner: 'w-4 h-4 animate-spin text-blue-600',
  inlineSpinner: 'w-5 h-5 animate-spin text-gray-400',
  inlineText: 'text-sm text-gray-500',
  inlineRow: 'flex items-center justify-center py-8 text-gray-400',
  legendRow: 'flex items-center gap-2 px-4 py-3',
  legendRefreshSpinner: 'w-3.5 h-3.5 animate-spin text-gray-500',
  refreshRow:
    'flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600',
  refreshSpinner: 'w-3.5 h-3.5 animate-spin text-slate-500',
  mapOverlayBackdrop: 'absolute inset-0 flex items-center justify-center bg-white/30 z-20 pointer-events-none',
  mapOverlayCard: 'bg-white px-4 py-3 rounded-lg shadow-md flex items-center gap-2',
  mapOverlaySpinner: 'w-5 h-5 animate-spin text-blue-600',
  mapOverlayText: 'text-sm text-gray-700 font-medium',
} as const;
