// ============================================================================
// About page copy — description, contact topics, and team bios.
// Portraits live in public/people and are set with photoSrc (for example
// '/people/amy_frazier.jpg'). A member without a photo shows initials.
// ============================================================================

export const ABOUT_HERO_IMAGE = '/landing.jpg';

export const ABOUT_PARAGRAPHS = [
  'Welcome to the Dangermond Preserve Research and Discovery Digital Twin! The Nature Conservancy’s Point Conception Institute and the Center for Spatial Science at the University of California, Santa Barbara are partnering with Esri to create one of the first digital twins of nature at the Jack and Laura Dangermond Preserve, a 24,364-acre property owned and managed by The Nature Conservancy.',
  'The Dangermond Preserve Research and Discovery Digital Twin is a virtual environmental system that functions like a research bench for scientific discovery and enables data-driven conservation decision making using the signatures of spatial and temporal patterns — past, present, and future — to understand how the world works.',
  'At the core of the Dangermond Preserve Research and Discovery Digital Twin is an automated data pipeline architecture that ingests continuous streams from IoT sensors, wildlife cameras, and third-party scientific APIs such as iNaturalist and the Global Biodiversity Information Facility (GBIF). These pipelines transform incoming data and route it into a cloud-based, PostGIS-enabled database for storage and preprocessing. The data architecture provides the backbone for development of models and decision-making tools for conservation. We are adding open-source experiences to view, model, and compare maps, enabling scientific discovery by anyone, anywhere.',
  'We invite you to use the data, models, and visualization to ask questions that matter to you! Together, we can leverage the power of spatial thinking and data to help meet conservation research and practice needs.',
];

export const CONTACT_TOPICS = [
  {
    id: 'questions',
    label: 'Questions',
    description: 'Ask about the preserve, the data, or how to use the platform.',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Tell us what is working and what should work better.',
  },
  {
    id: 'requests',
    label: 'Functionality & data requests',
    description: 'Ask for a dataset, a layer, or a capability that is not here yet.',
  },
] as const;

export interface TeamMember {
  id: string;
  name: string;
  bio: string;
  /** Public path to a portrait. Omit until a photo is available. */
  photoSrc?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'amy-frazier',
    name: 'Amy Frazier',
    photoSrc: '/people/amy_frazier.jpg',
    bio: 'Amy Frazier is a Professor and the Jack and Laura Dangermond Chair of Conservation at the University of California, Santa Barbara.',
  },
  {
    id: 'trisalyn-nelson',
    name: 'Trisalyn Nelson',
    photoSrc: '/people/trisalyn_nelson.jpg',
    bio: 'Trisalyn Nelson is a Professor and the Jack and Laura Dangermond Chair of Geography at the University of California, Santa Barbara. She is also Director for the Center for Spatial Science at UC Santa Barbara.',
  },
  {
    id: 'will-overbye-thompson',
    name: 'Will Overbye-Thompson',
    photoSrc: '/people/will_overbye_thompson.jpg',
    bio: 'Will Overbye-Thompson is a GIS Researcher at the University of California, Santa Barbara and a GIS Developer with the Center for Spatial Science.',
  },
  {
    id: 'dan-willett',
    name: 'Dan Willett',
    photoSrc: '/people/dan_willett.jpeg',
    bio: 'Dan Willett is a PhD Student at the University of California, Santa Barbara and a GIS Developer with the Center for Spatial Science.',
  },
  {
    id: 'sophia-leiker',
    name: 'Sophia Leiker',
    photoSrc: '/people/sophia-leiker.jpg',
    bio: 'Sophia Leiker is the Spatial Data Science Associate at the Point Conception Institute, The Nature Conservancy’s research center at the Jack and Laura Dangermond Preserve.',
  },
  {
    id: 'kelly-easterday',
    name: 'Kelly Easterday',
    photoSrc: '/people/kelly_easterday.jpg',
    bio: 'Kelly Easterday is the Director of Conservation Technology at the Point Conception Institute, The Nature Conservancy’s research center at the Jack and Laura Dangermond Preserve.',
  },
  {
    id: 'mark-reynolds',
    name: 'Mark Reynolds',
    photoSrc: '/people/mark-reynolds.jpg',
    bio: 'Mark Reynolds is Director of the Point Conception Institute, The Nature Conservancy’s research center at the Jack and Laura Dangermond Preserve.',
  },
];

export function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}
