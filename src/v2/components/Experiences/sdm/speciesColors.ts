// ============================================================================
// One color per species, for its occurrence records on the map.
//
// Species are given the next color in the list the first time they are drawn,
// and keep it for as long as the map is open. The colors avoid the greens and
// yellows of the suitability ramp, so points stay readable over a result.
// ============================================================================

export const SPECIES_COLORS = [
  '#2563eb',
  '#e11d48',
  '#f59e0b',
  '#7c3aed',
  '#0891b2',
  '#ea580c',
  '#db2777',
  '#0f172a',
] as const;

/** The species' color, taking the next unused one the first time it is asked for. */
export function speciesColorFor(assigned: Map<string, number>, speciesKey: string): string {
  let index = assigned.get(speciesKey);
  if (index == null) {
    index = assigned.size;
    assigned.set(speciesKey, index);
  }
  return SPECIES_COLORS[index % SPECIES_COLORS.length];
}

/** "#rrggbb" as the red, green, blue and alpha the map's symbols take. */
export function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    alpha,
  ];
}
