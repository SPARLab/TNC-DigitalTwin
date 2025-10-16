export interface Theme {
  id: string;
  name: string;
  header: string;
  subheader: string;
  headerBorder?: string; // Optional custom border, defaults to 'border-gray-200' for light themes
}

export const THEMES: Record<string, Theme> = {
  // Dangermond Theme - Default
  dangermondTheme: {
    id: 'dangermondTheme',
    name: 'Dangermond Theme',
    header: 'bg-gradient-to-b from-[#00703c] to-[#008f4a] text-white',
    subheader: 'bg-gradient-to-b from-gray-200 to-[#fafafa]',
    headerBorder: 'border-transparent',
  },

  // Light vibrant gradient themes
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue (Light)',
    header: 'bg-gradient-to-r from-blue-100 via-cyan-50 to-blue-100',
    subheader: 'bg-gradient-to-r from-blue-50/60 via-cyan-50/40 to-blue-50/40',
  },
  forest: {
    id: 'forest',
    name: 'Forest Green (Light)',
    header: 'bg-gradient-to-r from-emerald-100 via-teal-50 to-green-100',
    subheader: 'bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-green-50/40',
  },
  sunset: {
    id: 'sunset',
    name: 'Coastal Sunset (Light)',
    header: 'bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100',
    subheader: 'bg-gradient-to-r from-orange-50/40 via-amber-50/30 to-yellow-50/40',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Fields (Light)',
    header: 'bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-100',
    subheader: 'bg-gradient-to-r from-purple-50/40 via-indigo-50/30 to-blue-50/40',
  },
  sage: {
    id: 'sage',
    name: 'Sage & Stone (Light)',
    header: 'bg-gradient-to-r from-slate-200 via-teal-100 to-slate-200',
    subheader: 'bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-50',
  },
  sky: {
    id: 'sky',
    name: 'Sky Blue (Light)',
    header: 'bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-100',
    subheader: 'bg-gradient-to-r from-sky-50/50 via-blue-50/30 to-cyan-50/40',
  },

  // Vertical (top-to-bottom) gradient themes
  oceanVertical: {
    id: 'oceanVertical',
    name: 'Ocean Blue (Vertical)',
    header: 'bg-gradient-to-b from-blue-200 to-blue-100',
    subheader: 'bg-gradient-to-b from-blue-100 to-blue-50',
  },
  forestVertical: {
    id: 'forestVertical',
    name: 'Forest Green (Vertical)',
    header: 'bg-gradient-to-b from-emerald-200 to-emerald-100',
    subheader: 'bg-gradient-to-b from-emerald-100 to-emerald-50',
  },
  skyVertical: {
    id: 'skyVertical',
    name: 'Sky Blue (Vertical)',
    header: 'bg-gradient-to-b from-sky-200 to-sky-100',
    subheader: 'bg-gradient-to-b from-sky-100 to-sky-50',
  },
  sageVertical: {
    id: 'sageVertical',
    name: 'Sage & Stone (Vertical)',
    header: 'bg-gradient-to-b from-teal-200 to-slate-100',
    subheader: 'bg-gradient-to-b from-slate-100 to-slate-50',
  },
  lavenderVertical: {
    id: 'lavenderVertical',
    name: 'Lavender (Vertical)',
    header: 'bg-gradient-to-b from-purple-200 to-indigo-100',
    subheader: 'bg-gradient-to-b from-indigo-100 to-indigo-50',
  },
  deepOceanVertical: {
    id: 'deepOceanVertical',
    name: 'Deep Ocean (Vertical)',
    header: 'bg-gradient-to-b from-blue-700 to-blue-600 text-white',
    subheader: 'bg-gradient-to-b from-blue-100 to-blue-50',
  },
  deepForestVertical: {
    id: 'deepForestVertical',
    name: 'Deep Forest (Vertical)',
    header: 'bg-gradient-to-b from-emerald-700 to-emerald-600 text-white',
    subheader: 'bg-gradient-to-b from-emerald-100 to-emerald-50',
  },
  richForestVertical: {
    id: 'richForestVertical',
    name: 'Rich Forest (Vertical)',
    header: 'bg-gradient-to-b from-green-800 to-green-700 text-white',
    subheader: 'bg-gradient-to-b from-green-100 to-green-50',
  },
  jungleVertical: {
    id: 'jungleVertical',
    name: 'Jungle Green (Vertical)',
    header: 'bg-gradient-to-b from-teal-800 to-teal-700 text-white',
    subheader: 'bg-gradient-to-b from-teal-100 to-teal-50',
  },
  slateVertical: {
    id: 'slateVertical',
    name: 'Slate Gray (Vertical)',
    header: 'bg-gradient-to-b from-slate-700 to-slate-600 text-white',
    subheader: 'bg-gradient-to-b from-slate-100 to-slate-50',
  },
  charcoalVertical: {
    id: 'charcoalVertical',
    name: 'Charcoal (Vertical)',
    header: 'bg-gradient-to-b from-gray-800 to-gray-600 text-white',
    subheader: 'bg-gradient-to-b from-gray-100 to-gray-50',
  },
  midnightVertical: {
    id: 'midnightVertical',
    name: 'Midnight (Vertical)',
    header: 'bg-gradient-to-b from-blue-900 to-blue-800 text-white',
    subheader: 'bg-gradient-to-b from-blue-100 to-blue-50',
  },
};

export const DEFAULT_THEME = 'dangermondTheme';

export const THEME_OPTIONS = Object.values(THEMES);

