import { Code2, Download, FileCode2, Link2, Loader2 } from 'lucide-react';

interface ExportBuilderFooterProps {
  onCancel: () => void;
  onGenerateLinks: () => void;
  onExportZip: () => void;
  onGeneratePythonCode: () => void;
  onGenerateRCode: () => void;
  isProcessing: boolean;
  processingAction: 'zip' | 'links' | 'python' | 'r' | null;
  hasSelections: boolean;
  hasCodegenSelections: boolean;
}

export function ExportBuilderFooter({
  onCancel,
  onGenerateLinks,
  onExportZip,
  onGeneratePythonCode,
  onGenerateRCode,
  isProcessing,
  processingAction,
  hasSelections,
  hasCodegenSelections,
}: ExportBuilderFooterProps) {
  return (
    <div
      id="export-builder-footer"
      className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4"
    >
      <button
        id="export-builder-cancel-button"
        type="button"
        onClick={onCancel}
        disabled={isProcessing}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        Cancel
      </button>

      <div id="export-builder-footer-actions" className="flex items-center gap-3">
        <button
          id="export-builder-generate-python-code-button"
          type="button"
          onClick={onGeneratePythonCode}
          disabled={isProcessing || !hasCodegenSelections}
          className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processingAction === 'python' && isProcessing ? (
            <Loader2 id="export-builder-generate-python-code-spinner" className="h-4 w-4 animate-spin" />
          ) : (
            <Code2 id="export-builder-generate-python-code-icon" className="h-4 w-4" />
          )}
          {processingAction === 'python' && isProcessing ? 'Generating...' : 'Get Python Code'}
        </button>

        <button
          id="export-builder-generate-r-code-button"
          type="button"
          onClick={onGenerateRCode}
          disabled={isProcessing || !hasCodegenSelections}
          className="flex items-center gap-2 rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processingAction === 'r' && isProcessing ? (
            <Loader2 id="export-builder-generate-r-code-spinner" className="h-4 w-4 animate-spin" />
          ) : (
            <FileCode2 id="export-builder-generate-r-code-icon" className="h-4 w-4" />
          )}
          {processingAction === 'r' && isProcessing ? 'Generating...' : 'Get R Code'}
        </button>

        <button
          id="export-builder-generate-links-button"
          type="button"
          onClick={onGenerateLinks}
          disabled={isProcessing || !hasSelections}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processingAction === 'links' && isProcessing ? (
            <Loader2 id="export-builder-generate-links-spinner" className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 id="export-builder-generate-links-icon" className="h-4 w-4" />
          )}
          {processingAction === 'links' && isProcessing ? 'Generating...' : 'Generate Links'}
        </button>

        <button
          id="export-builder-export-zip-button"
          type="button"
          onClick={onExportZip}
          disabled={isProcessing || !hasSelections}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processingAction === 'zip' && isProcessing ? (
            <Loader2 id="export-builder-export-zip-spinner" className="h-4 w-4 animate-spin" />
          ) : (
            <Download id="export-builder-export-zip-icon" className="h-4 w-4" />
          )}
          {processingAction === 'zip' && isProcessing ? 'Building ZIP...' : 'Export ZIP'}
        </button>
      </div>
    </div>
  );
}
