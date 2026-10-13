import { describe, expect, it } from 'vitest';
import { TEAM_MEMBERS, buildContactMailto, initialsFor } from './aboutContent';

describe('about content', () => {
  it('builds a mailto link with the selected topic and message', () => {
    const href = buildContactMailto({
      to: 'team@example.org',
      topicLabel: 'Feedback',
      name: 'Ada Lovelace',
      replyEmail: 'ada@example.org',
      message: 'The map legend is hard to read.',
    });

    expect(href.startsWith('mailto:team@example.org?')).toBe(true);
    expect(decodeURIComponent(href)).toContain('Feedback — Dangermond Preserve Digital Twin');
    expect(decodeURIComponent(href)).toContain('Name: Ada Lovelace');
    expect(decodeURIComponent(href)).toContain('The map legend is hard to read.');
  });

  it('uses the first and last initials, including hyphenated surnames', () => {
    expect(initialsFor('Will Overbye-Thompson')).toBe('WO');
    expect(initialsFor('Amy Frazier')).toBe('AF');
  });

  it('lists each team member once, ready for a portrait path', () => {
    expect(TEAM_MEMBERS.map((member) => member.name)).toEqual([
      'Amy Frazier',
      'Trisalyn Nelson',
      'Will Overbye-Thompson',
      'Dan Willett',
      'Sophia Leiker',
      'Kelly Easterday',
      'Mark Reynolds',
    ]);
    expect(TEAM_MEMBERS.every((member) => member.photoSrc === undefined)).toBe(true);
  });
});
