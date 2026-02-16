import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import { buildServiceUrl, validateWhereClause } from '../../../services/tncArcgisService';
import type { CatalogLayer } from '../../../types';
import {
  GenericFilterUI,
  createEmptyFilterRow,
  type ArcGISFieldOption,
  type PreviewState,
  type TNCFilterRow,
} from './GenericFilterUI';

function normalizeEsriFieldType(fieldType: string | undefined): string {
  return (fieldType || '').toLowerCase();
}

function isNumericField(fieldType: string | undefined): boolean {
  const normalizedType = normalizeEsriFieldType(fieldType);
  return (
    normalizedType.includes('integer')
    || normalizedType.includes('smallinteger')
    || normalizedType.includes('double')
    || normalizedType.includes('single')
    || normalizedType.includes('oid')
  );
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function formatSqlValue(value: string, fieldType: string | undefined): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "''";
  if (isNumericField(fieldType)) {
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? String(parsed) : `'${escapeSqlString(trimmed)}'`;
  }
  return `'${escapeSqlString(trimmed)}'`;
}

function buildRowClause(row: TNCFilterRow, fieldType: string | undefined): string | null {
  const field = row.field.trim();
  const operator = row.operator.trim();
  const value = row.value.trim();
  if (!field || !operator) return null;

  if ((operator === 'is null' || operator === 'is not null')) {
    return operator === 'is null' ? `${field} IS NULL` : `${field} IS NOT NULL`;
  }

  if (!value) return null;

  switch (operator) {
    case '=':
      return `${field} = ${formatSqlValue(value, fieldType)}`;
    case '!=':
      return `${field} <> ${formatSqlValue(value, fieldType)}`;
    case '>':
      return `${field} > ${formatSqlValue(value, fieldType)}`;
    case '<':
      return `${field} < ${formatSqlValue(value, fieldType)}`;
    case '>=':
      return `${field} >= ${formatSqlValue(value, fieldType)}`;
    case '<=':
      return `${field} <= ${formatSqlValue(value, fieldType)}`;
    case 'contains':
      return `${field} LIKE '%${escapeSqlString(value)}%'`;
    case 'starts with':
      return `${field} LIKE '${escapeSqlString(value)}%'`;
    case 'ends with':
      return `${field} LIKE '%${escapeSqlString(value)}'`;
    case 'in': {
      const values = value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
      if (values.length === 0) return null;
      const list = values.map(entry => formatSqlValue(entry, fieldType)).join(', ');
      return `${field} IN (${list})`;
    }
    default:
      return `${field} = ${formatSqlValue(value, fieldType)}`;
  }
}

function buildWhereClause(rows: TNCFilterRow[], fieldTypeByName: Map<string, string | undefined>): string {
  const clauses = rows
    .map(row => buildRowClause(row, fieldTypeByName.get(row.field)))
    .filter((clause): clause is string => !!clause);
  return clauses.length > 0 ? clauses.join(' AND ') : '1=1';
}

function getTargetLayer(activeLayer: CatalogLayer | undefined, selectedSubLayerId: string | undefined): CatalogLayer | null {
  if (!activeLayer) return null;
  const isServiceParent = !!(
    activeLayer.catalogMeta?.isMultiLayerService
    && !activeLayer.catalogMeta?.parentServiceId
    && activeLayer.catalogMeta?.siblingLayers
    && activeLayer.catalogMeta.siblingLayers.length > 0
  );

  if (!isServiceParent) return activeLayer;
  const siblings = activeLayer.catalogMeta?.siblingLayers ?? [];
  return siblings.find(layer => layer.id === selectedSubLayerId) ?? siblings[0] ?? null;
}

function mapSchemaFields(rawFields: Array<Record<string, unknown>> | undefined): ArcGISFieldOption[] {
  if (!rawFields) return [];
  return rawFields
    .map(field => {
      const name = typeof field.name === 'string' ? field.name : '';
      if (!name) return null;
      const alias = typeof field.alias === 'string' ? field.alias : '';
      const type = typeof field.type === 'string' ? field.type : undefined;
      return {
        name,
        label: alias && alias !== name ? `${alias} (${name})` : name,
        type,
      } satisfies ArcGISFieldOption;
    })
    .filter((field): field is ArcGISFieldOption => !!field);
}

export function TNCArcGISBrowseTab() {
  const {
    activeLayer,
    pinLayer,
    isLayerPinned,
    getPinnedByLayerId,
    syncTNCArcGISFilters,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
  } = useLayers();
  const { layerMap } = useCatalog();
  const { getSchema, loadSchema } = useTNCArcGIS();

  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );
  const schema = targetLayer ? getSchema(targetLayer.id) : undefined;
  const schemaFields = useMemo(() => mapSchemaFields(schema?.fields), [schema?.fields]);
  const fieldTypeByName = useMemo(
    () => new Map(schemaFields.map(field => [field.name, field.type])),
    [schemaFields],
  );
  const defaultField = schemaFields[0]?.name ?? '';

  const [rows, setRows] = useState<TNCFilterRow[]>([createEmptyFilterRow()]);
  const [previewState, setPreviewState] = useState<PreviewState>({ status: 'idle' });
  const [previewCount, setPreviewCount] = useState<number | undefined>(undefined);

  const lastConsumedHydrateRef = useRef(0);
  const lastConsumedClearRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  useEffect(() => {
    if (!targetLayer) return;
    if (schema) return;
    void loadSchema(targetLayer);
  }, [targetLayer, schema, loadSchema]);

  useEffect(() => {
    if (!targetLayer) return;
    const viewChanged = activeLayer?.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    const clearRequested = lastFiltersClearedTimestamp > lastConsumedClearRef.current;
    prevHydrateViewIdRef.current = activeLayer?.viewId;

    if (!viewChanged && !editRequested && !clearRequested) return;
    if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;
    if (clearRequested) lastConsumedClearRef.current = lastFiltersClearedTimestamp;

    const pinned = getPinnedByLayerId(targetLayer.id);
    const sourceFilters = activeLayer?.viewId && pinned?.views
      ? pinned.views.find(view => view.id === activeLayer.viewId)?.tncArcgisFilters
      : pinned?.tncArcgisFilters;

    if (!sourceFilters || (sourceFilters.fields ?? []).length === 0) {
      setRows([createEmptyFilterRow(defaultField)]);
      setPreviewCount(undefined);
      setPreviewState({ status: 'idle' });
      return;
    }

    setRows(sourceFilters.fields!.map(filter => ({
      id: crypto.randomUUID(),
      field: filter.field,
      operator: filter.operator || '=',
      value: filter.value || '',
    })));
    setPreviewCount(pinned?.resultCount);
    setPreviewState({ status: 'idle' });
  }, [
    activeLayer?.viewId,
    defaultField,
    getPinnedByLayerId,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    targetLayer,
  ]);

  const whereClause = useMemo(
    () => buildWhereClause(rows, fieldTypeByName),
    [rows, fieldTypeByName],
  );

  useEffect(() => {
    if (!targetLayer) return;
    const normalizedRows = rows.map(row => ({
      field: row.field,
      operator: row.operator,
      value: row.value,
    }));
    syncTNCArcGISFilters(
      targetLayer.id,
      { whereClause, fields: normalizedRows },
      previewCount,
      activeLayer?.viewId,
    );
  }, [activeLayer?.viewId, previewCount, rows, syncTNCArcGISFilters, targetLayer, whereClause]);

  const isPinned = targetLayer ? isLayerPinned(targetLayer.id) : false;

  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyFilterRow(defaultField)]);
  };

  const handleClearAll = () => {
    setRows([createEmptyFilterRow(defaultField)]);
    setPreviewCount(undefined);
    setPreviewState({ status: 'idle' });
  };

  const handleRemoveRow = (rowId: string) => {
    setRows(prev => {
      if (prev.length === 1) return prev;
      return prev.filter(row => row.id !== rowId);
    });
  };

  const handleChangeRow = (rowId: string, patch: Partial<Omit<TNCFilterRow, 'id'>>) => {
    setRows(prev => prev.map(row => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const handlePreviewResults = useCallback(async () => {
    if (!targetLayer?.catalogMeta) {
      setPreviewState({
        status: 'error',
        message: 'Cannot preview: missing ArcGIS service metadata for this layer.',
      });
      return;
    }

    setPreviewState({ status: 'loading' });
    const serviceUrl = buildServiceUrl(targetLayer.catalogMeta);
    const validation = await validateWhereClause(serviceUrl, whereClause);

    if (validation.valid) {
      const count = validation.count ?? 0;
      setPreviewCount(count);
      setPreviewState({
        status: 'success',
        message: `Success: ${count} feature${count === 1 ? '' : 's'} match.`,
      });
    } else {
      setPreviewCount(undefined);
      setPreviewState({
        status: 'error',
        message: `SQL error: ${validation.error || 'unknown ArcGIS query error.'}`,
      });
    }
  }, [targetLayer, whereClause]);

  if (!activeLayer || activeLayer.dataSource !== 'tnc-arcgis') {
    return (
      <div id="tnc-arcgis-browse-not-tnc-root" className="space-y-3">
        <p id="tnc-arcgis-browse-not-tnc-text" className="text-sm text-gray-600">
          Activate a TNC ArcGIS layer to build field filters.
        </p>
      </div>
    );
  }

  if (!targetLayer) {
    return (
      <div id="tnc-arcgis-browse-no-target-root" className="space-y-3">
        <p id="tnc-arcgis-browse-no-target-text" className="text-sm text-gray-600">
          Select a specific service layer before applying filters.
        </p>
      </div>
    );
  }

  return (
    <div id="tnc-arcgis-browse-tab" className="space-y-4">
      {schemaFields.length === 0 ? (
        <div id="tnc-arcgis-browse-schema-loading-root" className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p id="tnc-arcgis-browse-schema-loading-text" className="text-sm text-gray-600">
            Loading layer fields...
          </p>
        </div>
      ) : (
        <GenericFilterUI
          layerLabel={targetLayer.name}
          fields={schemaFields}
          rows={rows}
          whereClause={whereClause}
          previewState={previewState}
          onAddRow={handleAddRow}
          onClearAll={handleClearAll}
          onRemoveRow={handleRemoveRow}
          onChangeRow={handleChangeRow}
          onPreviewResults={handlePreviewResults}
        />
      )}

      <div id="tnc-arcgis-browse-pin-actions" className="pt-1">
        {isPinned ? (
          <div
            id="tnc-arcgis-browse-pinned-badge"
            className="w-full rounded-lg border border-emerald-200 bg-emerald-50 py-3 text-center text-sm font-medium text-emerald-700"
          >
            Pinned ✓
          </div>
        ) : (
          <button
            id="tnc-arcgis-browse-pin-layer-button"
            type="button"
            onClick={() => pinLayer(targetLayer.id)}
            className="w-full rounded-lg border border-blue-200 px-3 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
          >
            Pin Layer
          </button>
        )}
      </div>
    </div>
  );
}
