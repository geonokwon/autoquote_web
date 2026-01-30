import { labelForGroup, orderGroups } from '../groupUtils';

describe('groupUtils', () => {
  const mock = [
    { key: 'b', label: 'Group B', order: 20 },
    { key: 'a', label: 'Group A', order: 10 },
    { key: 'c', label: 'Group C', order: 30 }
  ];

  test('orderGroups sorts by order ascending', () => {
    const sorted = orderGroups(mock);
    expect(sorted.map((g) => g.key)).toEqual(['a', 'b', 'c']);
  });

  test('labelForGroup returns label if found', () => {
    expect(labelForGroup(mock, 'b')).toBe('Group B');
  });

  test('labelForGroup falls back to key if not found', () => {
    expect(labelForGroup(mock, 'unknown')).toBe('unknown');
  });
}); 