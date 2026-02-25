import type { DataSource } from '../../../types';
import type { ExportActionLayer, ExportActionView } from '../types';

export type ExportCodeLanguage = 'python' | 'r';
export type SupportedCodegenSource = 'inaturalist' | 'dendra';

export interface ExportCodegenRequest {
  language: ExportCodeLanguage;
  layer: ExportActionLayer;
  view: ExportActionView;
  generatedAtIso: string;
  sourceUrl: string;
}

export interface ExportCodegenBaseResult {
  language: ExportCodeLanguage;
  metadata: {
    dataSource: DataSource;
    layerId: string;
    viewId: string;
  };
}

export interface ExportCodegenSuccessResult extends ExportCodegenBaseResult {
  ok: true;
  fileExtension: 'py' | 'R';
  fileName: string;
  title: string;
  snippet: string;
  warnings: string[];
}

export interface ExportCodegenUnsupportedResult extends ExportCodegenBaseResult {
  ok: false;
  reason: 'UNSUPPORTED_SOURCE' | 'MISSING_QUERY_DEFINITION' | 'INVALID_VIEW';
  message: string;
}

export type ExportCodegenResult = ExportCodegenSuccessResult | ExportCodegenUnsupportedResult;

export interface CodegenBundleResult {
  language: ExportCodeLanguage;
  fileExtension: 'py' | 'R';
  fileName: string;
  snippet: string;
  generatedAtIso: string;
  generatedCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

