const fs = require('fs');
const path = require('path');

const ALQURAN_BASE = 'https://api.alquran.cloud/v1';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function main() {
  console.log('Fetching complete Quran (Uthmani script) from alquran.cloud...');
  const start = Date.now();

  const { data } = await fetchJson(`${ALQURAN_BASE}/quran/quran-uthmani`);

  const surahs = data.surahs || [];
  if (!surahs.length) throw new Error('No surahs received');

  let totalAyahs = 0;
  const pages = {};

  for (const s of surahs) {
    const surahInfo = {
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
    };

    for (const a of s.ayahs) {
      const pageNum = a.page;
      if (!pages[pageNum]) {
        pages[pageNum] = {
          pageNumber: pageNum,
          juzNumber: a.juz,
          surahs: {},
          ayahs: [],
        };
      }
      if (!pages[pageNum].surahs[s.number]) {
        pages[pageNum].surahs[s.number] = { ...surahInfo };
      }
      pages[pageNum].ayahs.push({
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        manzil: a.manzil,
        page: a.page,
        ruku: a.ruku,
        hizbQuarter: a.hizbQuarter,
        sajda: a.sajda || false,
        surahNumber: s.number,
        surahName: s.name,
        surahEnglishName: s.englishName,
        surahEnglishNameTranslation: s.englishNameTranslation,
        isFirstInSurah: a.numberInSurah === 1,
        translation: null,
      });
      totalAyahs++;
    }
  }

  console.log(`Processed ${totalAyahs} ayahs from ${surahs.length} surahs in ${Date.now() - start}ms`);

  const pagesArray = [];
  for (let i = 1; i <= 604; i++) {
    const p = pages[i];
    if (!p) {
      console.warn(`Warning: Page ${i} has no data`);
      continue;
    }
    pagesArray.push({
      pageNumber: p.pageNumber,
      juzNumber: p.juzNumber,
      surahs: Object.values(p.surahs),
      ayahs: p.ayahs,
    });
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'quranPages.json');
  fs.writeFileSync(outPath, JSON.stringify({ pages: pagesArray }), 'utf-8');

  const stats = fs.statSync(outPath);
  console.log(`\nDone! Wrote ${pagesArray.length} pages to ${outPath}`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total ayahs: ${pagesArray.reduce((s, p) => s + p.ayahs.length, 0)}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
