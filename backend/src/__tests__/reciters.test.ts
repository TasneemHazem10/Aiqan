import { RECITERS, reciterAudioMap } from '../routes/reciters';

describe('Reciters Data', () => {
  it('should have at least 20 reciters', () => {
    expect(RECITERS.length).toBeGreaterThanOrEqual(20);
  });

  it('every reciter has required fields', () => {
    for (const r of RECITERS) {
      expect(r.id).toBeTruthy();
      expect(r.audioId).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.arabicName).toBeTruthy();
      expect(r.style).toBeTruthy();
      expect(r.country).toBeTruthy();
    }
  });

  it('every id maps to a valid audioId', () => {
    for (const r of RECITERS) {
      expect(reciterAudioMap[r.id]).toBe(r.audioId);
    }
  });

  it('no duplicate ids', () => {
    const ids = RECITERS.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
