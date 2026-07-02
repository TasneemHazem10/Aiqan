import duasData from '../data/duas.json';

describe('Duas Data', () => {
  it('should have at least 8 categories', () => {
    expect(duasData.length).toBeGreaterThanOrEqual(8);
  });

  it('every category has required fields', () => {
    for (const cat of duasData) {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.arabicName).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(Array.isArray(cat.duas)).toBe(true);
    }
  });

  it('every dua has required fields', () => {
    for (const cat of duasData) {
      for (const dua of cat.duas) {
        expect(dua.id).toBeTruthy();
        expect(dua.title).toBeTruthy();
        expect(dua.arabic).toBeTruthy();
        expect(dua.transliteration).toBeTruthy();
        expect(dua.translation).toBeTruthy();
      }
    }
  });

  it('no duplicate dua ids across categories', () => {
    const allIds = duasData.flatMap(c => c.duas.map(d => d.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
