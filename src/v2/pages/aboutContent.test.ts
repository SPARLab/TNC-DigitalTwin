import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEAM_MEMBERS, initialsFor } from './aboutContent';

describe('about content', () => {
  it('uses the first and last initials, including hyphenated surnames', () => {
    expect(initialsFor('Will Overbye-Thompson')).toBe('WO');
    expect(initialsFor('Amy Frazier')).toBe('AF');
  });

  it('lists each team member once', () => {
    expect(TEAM_MEMBERS.map((member) => member.name)).toEqual([
      'Amy Frazier',
      'Trisalyn Nelson',
      'Will Overbye-Thompson',
      'Dan Willett',
      'Sophia Leiker',
      'Kelly Easterday',
      'Mark Reynolds',
    ]);
  });

  it('points every team member at a portrait that exists in public/', () => {
    for (const member of TEAM_MEMBERS) {
      expect(member.photoSrc, member.name).toBeDefined();
      expect(existsSync(join(process.cwd(), 'public', member.photoSrc ?? '')), member.name).toBe(true);
    }
  });
});
