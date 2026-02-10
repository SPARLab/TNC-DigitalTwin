// ============================================================================
// LayerGroupHeader — Section label for saved item groups
// Styled like the "PINNED LAYERS" header in Map Layers widget
// Full-width, square corners, edge-to-edge
// Includes tree connector stub to first child
// ============================================================================

interface LayerGroupHeaderProps {
  layerName: string;
}

export function LayerGroupHeader({ layerName }: LayerGroupHeaderProps) {
  return (
    <div className="relative">
      <div
        role="separator"
        className="mb-1.5 px-3 py-1 bg-gray-50 border-y border-gray-200 flex items-center cursor-default"
        id={`saved-items-header-${layerName.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          {layerName}
        </span>
      </div>
      
      {/* Tree connector stub from header to first child */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '12px',
          top: '100%',
          height: '6px',
          borderLeft: '1px solid #d1d5db',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
