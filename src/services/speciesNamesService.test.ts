import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NON_TERRESTRIAL_SPECIES } from './nonTerrestrialSpecies';
import { ANIMAL_GROUPS, searchSpeciesNames } from './speciesNamesService';

function whereOf(fetchMock: ReturnType<typeof vi.fn>): string {
  const url = new URL(String(fetchMock.mock.calls[0][0]));
  return url.searchParams.get('where') ?? '';
}

describe('searchSpeciesNames', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('leaves fish out for every kingdom and animal group', async () => {
    for (const kingdom of ['Animalia', 'Plantae', 'all'] as const) {
      fetchMock.mockClear();
      await searchSpeciesNames({ kingdom, animalGroup: 'all' });
      const where = whereOf(fetchMock);
      // Ray-finned fish have a NULL class, the other fish classes are listed
      expect(where).toContain("kingdom <> 'Animalia'");
      expect(where).toContain('taxonomic_class IS NOT NULL');
      expect(where).toContain("'Elasmobranchii'");
    }
  });

  it('keeps the land animals GBIF gives no class', async () => {
    await searchSpeciesNames({ kingdom: 'Animalia', animalGroup: 'all' });
    const where = whereOf(fetchMock);
    expect(where).toContain("'Calephelis nemesis'");
    expect(where).toContain("'Bipalium kewense'");
  });

  it('leaves out the listed marine mammals', async () => {
    await searchSpeciesNames({ kingdom: 'Animalia', animalGroup: 'mammals' });
    const where = whereOf(fetchMock);
    expect(where).toContain('species NOT IN (');
    for (const name of ['Zalophus californianus', 'Enhydra lutris', 'Tursiops truncatus', 'Megaptera novaeangliae']) {
      expect(where).toContain(`'${name}'`);
    }
    // A land mammal is not on the list
    expect(where).not.toContain("'Lynx rufus'");
  });

  it('lists each marine mammal once, by scientific name', () => {
    expect(new Set(NON_TERRESTRIAL_SPECIES).size).toBe(NON_TERRESTRIAL_SPECIES.length);
    for (const name of NON_TERRESTRIAL_SPECIES) expect(name).toMatch(/^[A-Z][a-z]+ [a-z]+$/);
  });

  it('keeps the request short enough for a GET', async () => {
    await searchSpeciesNames({ kingdom: 'all', animalGroup: 'all', search: 'sea' });
    expect(String(fetchMock.mock.calls[0][0]).length).toBeLessThan(3000);
  });

  it('only lists species with enough points to model, whatever the filters', async () => {
    for (const kingdom of ['Animalia', 'Plantae', 'Fungi', 'all'] as const) {
      fetchMock.mockClear();
      await searchSpeciesNames({ kingdom, animalGroup: 'all', search: '' });
      expect(whereOf(fetchMock)).toContain('model_points >= 10');
    }
  });

  it('falls back to the list without the point count when the field is missing', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ error: { message: 'Invalid field' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });
    const page = await searchSpeciesNames({ kingdom: 'Animalia' });
    expect(page.modelPointsAvailable).toBe(false);
    const retry = new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('where') ?? '';
    expect(retry).not.toContain('model_points');
  });

  it('offers no Fish group in the picker', () => {
    expect(ANIMAL_GROUPS.map((group) => group.id)).not.toContain('fish');
  });

  it('still combines the fish rule with the other filters', async () => {
    await searchSpeciesNames({ kingdom: 'Animalia', animalGroup: 'birds', search: 'gull' });
    const where = whereOf(fetchMock);
    expect(where).toContain("taxonomic_class = 'Aves'");
    expect(where).toContain('model_points >= 10');
    expect(where).toContain("kingdom <> 'Animalia'");
    expect(where).toContain("LIKE '%GULL%'");
  });
});
