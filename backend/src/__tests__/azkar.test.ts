import azkarData from '../data/azkar.json';

describe('Azkar Data', () => {
  it('should have at least 5 categories', () => {
    expect(azkarData.length).toBeGreaterThanOrEqual(5);
  });

  it('every category has required fields', () => {
    for (const cat of azkarData) {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.arabicName).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(Array.isArray(cat.azkar)).toBe(true);
    }
  });

  it('every dhikr has required fields', () => {
    for (const cat of azkarData) {
      for (const dhikr of cat.azkar) {
        expect(dhikr.id).toBeTruthy();
        expect(dhikr.arabic).toBeTruthy();
        expect(dhikr.transliteration).toBeTruthy();
        expect(dhikr.translation).toBeTruthy();
        expect(typeof dhikr.count).toBe('number');
        expect(dhikr.count).toBeGreaterThan(0);
      }
    }
  });

  it('no duplicate azkar ids across categories', () => {
    const allIds = azkarData.flatMap(c => c.azkar.map(a => a.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
