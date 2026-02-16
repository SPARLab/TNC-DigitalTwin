import type { DataSource } from '../../types';

interface ExportSummaryLayerItem {
  layerId: string;
  layerName: string;
  dataSource: DataSource;
  selectedFormatLabels: string[];
  filteredResultCount?: number;
}

interface ExportSummaryProps {
  layers: ExportSummaryLayerItem[];
}

const SIZE_ESTIMATE_BYTES_PER_ITEM: Record<DataSource, Record<string, number>> = {
  inaturalist: {
    CSV: 250,
    GeoJSON: 1200,
  },
  animl: {
    Metadata: 600,
    Images: 400_000,
    'Thumbnails only': 80_000,
  },
  dendra: {
    Metadata: 450,
    'Datastream CSV': 180,
  },
  dataone: {
    Metadata: 15_000,
    'File links': 1200,
    'Download files': 5_000_000,
  },
  'tnc-arcgis': {
    Metadata: 800,
  },
  ebird: {
    Metadata: 700,
  },
  drone: {
    Metadata: 2000,
  },
  lidar: {
    Metadata: 2500,
  },
};

function getCountNoun(dataSource: DataSource): string {
  switch (dataSource) {
    case 'inaturalist':
      return 'observations';
    case 'animl':
      return 'camera trap records';
    case 'dendra':
      return 'data points';
    case 'dataone':
      return 'datasets';
    default:
      return 'records';
  }
}

function formatEstimatedSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function estimateLayerBytes(layer: ExportSummaryLayerItem): number {
  const count = layer.filteredResultCount;
  if (typeof count !== 'number' || count <= 0) {
    return 0;
  }

  const bytesPerItemByFormat = SIZE_ESTIMATE_BYTES_PER_ITEM[layer.dataSource] || {};
  return layer.selectedFormatLabels.reduce((total, formatLabel) => {
    const bytesPerItem = bytesPerItemByFormat[formatLabel] ?? 0;
    return total + bytesPerItem * count;
  }, 0);
}

function formatLayerSummaryLine(layer: ExportSummaryLayerItem, estimatedBytes: number): string {
  const countNoun = getCountNoun(layer.dataSource);
  const countLabel = typeof layer.filteredResultCount === 'number'
    ? `${layer.filteredResultCount.toLocaleString()} ${countNoun}`
    : `Count pending ${countNoun}`;
  const formatsLabel = layer.selectedFormatLabels.join(' + ');

  if (estimatedBytes > 0) {
    return `${countLabel} (${formatsLabel}, ~${formatEstimatedSize(estimatedBytes)})`;
  }

  return `${countLabel} (${formatsLabel})`;
}

export function ExportSummary({ layers }: ExportSummaryProps) {
  const includedLayers = layers.filter((layer) => layer.selectedFormatLabels.length > 0);
  const layerEstimates = includedLayers.map((layer) => ({
    layer,
    estimatedBytes: estimateLayerBytes(layer),
  }));
  const totalEstimatedBytes = layerEstimates.reduce((sum, item) => sum + item.estimatedBytes, 0);

  return (
    <section
      id="export-builder-summary-section"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      aria-labelledby="export-builder-summary-title"
    >
      <h3 id="export-builder-summary-title" className="text-sm font-semibold text-slate-800">
        Export summary
      </h3>

      {includedLayers.length === 0 ? (
        <p id="export-builder-summary-empty" className="mt-2 text-sm text-slate-600">
          Select at least one format to build an export.
        </p>
      ) : (
        <>
          <ul id="export-builder-summary-list" className="mt-3 space-y-2">
            {layerEstimates.map(({ layer, estimatedBytes }) => (
              <li
                id={`export-builder-summary-item-${layer.layerId}`}
                key={layer.layerId}
                className="text-sm text-slate-700"
              >
                <span id={`export-builder-summary-item-layer-${layer.layerId}`} className="font-semibold text-slate-800">
                  {layer.layerName}:
                </span>{' '}
                <span id={`export-builder-summary-item-copy-${layer.layerId}`}>
                  {formatLayerSummaryLine(layer, estimatedBytes)}
                </span>
              </li>
            ))}
          </ul>

          <div
            id="export-builder-summary-total-row"
            className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
          >
            <span id="export-builder-summary-total-label" className="text-sm font-semibold text-emerald-900">
              Estimated total size
            </span>
            <span id="export-builder-summary-total-value" className="text-sm font-bold text-emerald-800">
              ~{formatEstimatedSize(totalEstimatedBytes)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
