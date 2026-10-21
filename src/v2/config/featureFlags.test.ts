import { describe, expect, it } from 'vitest';
import { platformSectionFromPath } from '../app/platformSections';
import { getExperienceById } from './experienceRegistry';
import { platformNavItems } from './navigation';

describe('production hiding', () => {
  it('drops the Notebooks nav item when notebooks are disabled', () => {
    expect(platformNavItems(true).some((item) => item.path === '/notebooks')).toBe(true);
    const hidden = platformNavItems(false);
    expect(hidden.some((item) => item.path === '/notebooks')).toBe(false);
    // Everything else stays.
    expect(hidden.map((item) => item.path)).toEqual(['/', '/about', '/monitoring', '/catalog', '/experiences']);
  });

  it('sends the notebooks routes nowhere when disabled, so they redirect home', () => {
    expect(platformSectionFromPath('/notebooks', true)).toBe('notebooks');
    expect(platformSectionFromPath('/notebooks', false)).toBeNull();
    expect(platformSectionFromPath('/notebooks/anything', false)).toBeNull();
    expect(platformSectionFromPath('/experiences', false)).toBe('experiences');
  });

  it('shows Notebooks in tests and dev, where the production flag is off', () => {
    expect(platformSectionFromPath('/notebooks')).toBe('notebooks');
    expect(platformNavItems().some((item) => item.path === '/notebooks')).toBe(true);
  });
});

describe('experience tags', () => {
  it('marks the Species Distribution Model as coming soon but not the Suitability Modeler', () => {
    expect(getExperienceById('sdm')?.comingSoon).toBe(true);
    expect(getExperienceById('suitability')?.comingSoon).toBe(false);
  });
});
