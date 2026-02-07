// ============================================================================
// LayerGroupHeader — Non-interactive context label (DFT-007)
// Muted styling, no hover, no buttons. Just a visual divider.
// ============================================================================

interface LayerGroupHeaderProps {
  layerName: string;
}

export function LayerGroupHeader({ layerName }: LayerGroupHeaderProps) {
  return (
    <div
      role="separator"
      className="px-3 py-1 flex items-center gap-2 cursor-default"
    >
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
        {layerName}
      </span>
      <span className="flex-1 border-t border-dashed border-gray-200" />
    </div>
  );
}
