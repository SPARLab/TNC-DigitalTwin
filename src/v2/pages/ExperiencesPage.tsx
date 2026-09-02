// ============================================================================
// ExperiencesPage — models and simulations gallery scaffold.
// Cards come from the ported experience registry; selecting one opens a
// map-backed configuration workspace in a later phase.
// ============================================================================

import { useMemo, useState } from 'react';
import { Radio, Search } from 'lucide-react';
import {
  EXPERIENCES,
  EXPERIENCE_CATEGORIES,
  getExperiencesByCategory,
} from '../config/experienceRegistry';
import type { ExperienceDefinition } from '../config/experienceRegistry';
import { ScaffoldNotice } from '../components/shared/ScaffoldNotice';

const KIND_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'model', label: 'Models' },
  { value: 'simulation', label: 'Simulations' },
];

function ExperienceCard({ experience }: { experience: ExperienceDefinition }) {
  const Icon = experience.icon;

  return (
    <div
      id={`experience-card-${experience.id}`}
      className="relative flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-4"
    >
      {experience.comingSoon && (
        <span className="absolute right-3 top-3 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
          Coming Soon
        </span>
      )}

      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>

      <h3 className="pr-20 text-sm font-semibold text-gray-900">{experience.name}</h3>
      <p className="text-xs leading-relaxed text-gray-600">{experience.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-gray-600">
          {experience.kind}
        </span>
        {experience.usesRealTimeData && (
          <span className="flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
            <Radio className="h-2.5 w-2.5" />
            Real-time
          </span>
        )}
      </div>
    </div>
  );
}

export function ExperiencesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [realTimeOnly, setRealTimeOnly] = useState(false);

  const hasActiveFilters = Boolean(
    searchQuery || kindFilter || categoryFilter || realTimeOnly,
  );

  const filteredExperiences = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return EXPERIENCES.filter((experience) => {
      if (kindFilter && experience.kind !== kindFilter) return false;
      if (categoryFilter && experience.categoryId !== categoryFilter) return false;
      if (realTimeOnly && !experience.usesRealTimeData) return false;
      if (!query) return true;

      return (
        experience.name.toLowerCase().includes(query) ||
        experience.description.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, kindFilter, categoryFilter, realTimeOnly]);

  return (
    <div id="experiences-page" className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-[1400px] px-8 py-8">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">Experiences</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Configure and run models and simulations against Dangermond Preserve
            datasets.
          </p>
        </header>

        <div className="mt-4">
          <ScaffoldNotice id="experiences-scaffold-notice" title="Experiences are not runnable yet">
            The catalog of experiences below is real, but the geoprocessing panels for
            Suitability and Species Distribution Modeling are ported in a follow-up
            phase.
          </ScaffoldNotice>
        </div>

        <div
          id="experiences-toolbar"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-gray-200 bg-white px-4 py-3"
        >
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              id="experiences-search-input"
              type="search"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-button border border-gray-200 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            id="experiences-kind-filter"
            aria-label="Filter by type"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            className="rounded-button border border-gray-200 px-2 py-1.5 text-xs text-gray-800 focus:border-emerald-500 focus:outline-none"
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            id="experiences-category-filter"
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-button border border-gray-200 px-2 py-1.5 text-xs text-gray-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {EXPERIENCE_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-700">
            <input
              id="experiences-realtime-filter"
              type="checkbox"
              checked={realTimeOnly}
              onChange={(event) => setRealTimeOnly(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Radio className="h-3.5 w-3.5 text-gray-500" />
            Real-time data
          </label>
        </div>

        {hasActiveFilters ? (
          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {filteredExperiences.length} Result
              {filteredExperiences.length === 1 ? '' : 's'}
            </h2>

            {filteredExperiences.length === 0 ? (
              <p className="mt-3 text-xs text-gray-500">
                No experiences match your filters.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-4 2xl:grid-cols-3">
                {filteredExperiences.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>
            )}
          </section>
        ) : (
          EXPERIENCE_CATEGORIES.map((category) => {
            const categoryExperiences = getExperiencesByCategory(category.id);
            if (categoryExperiences.length === 0) return null;
            const CategoryIcon = category.icon;

            return (
              <section key={category.id} className="mt-6">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <CategoryIcon className="h-4 w-4" />
                  {category.label}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-4 2xl:grid-cols-3">
                  {categoryExperiences.map((experience) => (
                    <ExperienceCard key={experience.id} experience={experience} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
