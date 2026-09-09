// ============================================================================
// NotebooksPage — template gallery scaffold.
// The in-browser Pyodide editor, .ipynb download, and AI assistant panel are
// ported in a later phase.
// ============================================================================

import { useMemo, useState } from 'react';
import { FileCode, Search } from 'lucide-react';
import { NOTEBOOK_TEMPLATES } from '../config/notebookTemplates';
import { ScaffoldNotice } from '../components/shared/ScaffoldNotice';

export function NotebooksPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return NOTEBOOK_TEMPLATES;

    return NOTEBOOK_TEMPLATES.filter(
      (template) =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [searchQuery]);

  return (
    <div id="notebooks-page" className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-[1400px] px-8 py-8">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">Notebooks</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Template scripts for custom geoprocessing and analysis workflows against
            catalog datasets.
          </p>
        </header>

        <div className="mt-4">
          <ScaffoldNotice id="notebooks-scaffold-notice" title="Notebook runtime not wired up yet">
            Template metadata is in place. Running cells in-browser, downloading
            .ipynb files, and the AI code assistant arrive in a follow-up phase.
          </ScaffoldNotice>
        </div>

        <div className="relative mt-6 max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            id="notebooks-search-input"
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-button border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {filteredTemplates.length === 0 ? (
          <p className="mt-6 text-xs text-gray-500">No templates match your search.</p>
        ) : (
          <div
            id="notebooks-template-grid"
            className="mt-6 grid grid-cols-2 gap-4 2xl:grid-cols-3"
          >
            {filteredTemplates.map((template) => (
              <div
                id={`notebook-card-${template.id}`}
                key={template.id}
                className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-violet-700">
                  <FileCode className="h-4 w-4" />
                </span>

                <h3 className="text-sm font-semibold text-gray-900">{template.title}</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  {template.description}
                </p>

                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
