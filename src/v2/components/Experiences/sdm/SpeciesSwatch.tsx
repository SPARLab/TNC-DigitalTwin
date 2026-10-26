// A dot in the species' color on the map, which marks its records and, in the
// panels, which species a heading is about. Nothing is drawn before the species
// has a color.
export function SpeciesSwatch({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <span
      aria-hidden="true"
      data-testid="species-swatch"
      className="inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow-sm ring-1 ring-black/10"
      style={{ background: color }}
    />
  );
}
