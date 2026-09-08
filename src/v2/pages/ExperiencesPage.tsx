// ============================================================================
// ExperiencesPage — models and simulations gallery, ported from the
// twin_models webapp ModelsPage. Selecting a card opens a map-backed workspace.
// Suitability and SDM mount their geoprocessing panels; other experiences stay
// on the coming-soon placeholder.
// ============================================================================

import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Radio, Search } from 'lucide-react';
import {
  EXPERIENCES,
  EXPERIENCE_CATEGORIES,
  getExperienceById,
  getExperiencesByCategory,
} from '../config/experienceRegistry';
import type { ExperienceDefinition } from '../config/experienceRegistry';
import { ExperienceWorkspace } from '../components/Experiences/ExperienceWorkspace';

const KIND_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'model', label: 'Models' },
  { value: 'simulation', label: 'Simulations' },
];

function ExperienceCard({
  experience,
  onSelect,
}: {
  experience: ExperienceDefinition;
  onSelect: (id: string) => void;
}) {
  const Icon = experience.icon;

  return (
    <button
      id={`experience-card-${experience.id}`}
      type="button"
      onClick={() => onSelect(experience.id)}
      className={`group relative flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white text-left text-gray-900 transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg ${
        experience.comingSoon ? 'opacity-75 hover:opacity-100' : ''
      }`}
    >
      {experience.comingSoon && (
        <span className="absolute right-2.5 top-2 z-10 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
          Coming Soon
        </span>
      )}

      <div className="relative h-[140px] overflow-hidden">
        <img
          src={experience.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-b from-black/5 to-black/40 p-2.5 text-white/70">
          <Icon className="h-7 w-7" />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1 px-4 pb-4 pt-3">
        <h3 className="text-sm font-bold text-gray-900">{experience.name}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
          {experience.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {experience.kind}
          </span>
          {experience.usesRealTimeData && (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Real-time
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ExperienceGallery() {
  const navigate = useNavigate();
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

  const openExperience = (id: string) => {
    navigate(`/experiences/${id}`);
  };

  return (
    <div id="experiences-page" className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="relative flex h-[45vh] min-h-[240px] items-end overflow-hidden">
        <img
          src="/models.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-gray-950/20 to-gray-950/70"
        />
        <div className="relative px-8 pb-5">
          <h1 className="text-[2.8rem] font-extrabold leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.4)]">
            Experiences
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">
            Configure and run models and simulations against Dangermond Preserve
            datasets.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 py-6 pb-12">
        <div id="experiences-toolbar" className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="experiences-search-input"
              type="search"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-card border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="experiences-kind-filter"
              aria-label="Filter by type"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value)}
              className="rounded-button border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-emerald-500 focus:outline-none"
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
              className="rounded-button border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {EXPERIENCE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-1.5 rounded-button border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:border-emerald-400 hover:text-gray-800">
              <input
                id="experiences-realtime-filter"
                type="checkbox"
                checked={realTimeOnly}
                onChange={(event) => setRealTimeOnly(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Radio className="h-3.5 w-3.5" />
              Real-time Data
            </label>
          </div>
        </div>

        {hasActiveFilters ? (
          <section>
            <h2 className="border-b border-gray-200 pb-1.5 text-xl font-bold text-gray-900">
              {filteredExperiences.length} Result
              {filteredExperiences.length === 1 ? '' : 's'}
            </h2>

            {filteredExperiences.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No experiences match your filters.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {filteredExperiences.map((experience) => (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    onSelect={openExperience}
                  />
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
              <section key={category.id}>
                <h2 className="flex items-center gap-2.5 border-b border-gray-200 pb-1.5 text-xl font-bold text-gray-900">
                  <CategoryIcon className="h-5 w-5 text-gray-400" />
                  {category.label}
                </h2>
                <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {categoryExperiences.map((experience) => (
                    <ExperienceCard
                      key={experience.id}
                      experience={experience}
                      onSelect={openExperience}
                    />
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

export function ExperiencesPage() {
  const { experienceId } = useParams();
  const navigate = useNavigate();

  if (!experienceId) {
    return <ExperienceGallery />;
  }

  const experience = getExperienceById(experienceId);
  if (!experience) {
    return <Navigate to="/experiences" replace />;
  }

  return (
    <ExperienceWorkspace
      experience={experience}
      onClose={() => navigate('/experiences')}
    />
  );
}
