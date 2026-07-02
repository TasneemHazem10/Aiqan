import { Router, Request, Response } from 'express';

const router = Router();

export interface ReciterInfo {
  id: string;
  audioId: string;
  name: string;
  arabicName: string;
  style: string;
  country: string;
}

export const RECITERS: ReciterInfo[] = [
  { id: 'ar.alafasy', audioId: 'ar.alafasy', name: 'Mishary Rashid Alafasy', arabicName: 'مشاري راشد العفاسي', style: 'Murattal', country: 'Kuwait' },
  { id: 'ar.abdulbasitmurattal', audioId: 'ar.abdulbasitmurattal', name: 'Abdul Basit Abdul Samad (Murattal)', arabicName: 'عبد الباسط عبد الصمد', style: 'Murattal', country: 'Egypt' },
  { id: 'ar.abdulbasitmujawwad', audioId: 'ar.abdulbasitmujawwad', name: 'Abdul Basit Abdul Samad (Mujawwad)', arabicName: 'عبد الباسط عبد الصمد', style: 'Mujawwad', country: 'Egypt' },
  { id: 'ar.sudais', audioId: 'ar.sudais', name: 'Abdur Rahman As-Sudais', arabicName: 'عبد الرحمن السديس', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.shaatree', audioId: 'ar.shaatree', name: 'Abu Bakr Al-Shatri', arabicName: 'أبو بكر الشاطري', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.dosari', audioId: 'ar.dosari', name: 'Yasser Al-Dosari', arabicName: 'ياسر الدوسري', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.mahermuaiqly', audioId: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly', arabicName: 'ماهر المعيقلي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.minshawi', audioId: 'ar.minshawi', name: 'Muhammad Siddiq Al-Minshawi', arabicName: 'محمد صديق المنشاوي', style: 'Murattal', country: 'Egypt' },
  { id: 'ar.hanirifai', audioId: 'ar.hanirifai', name: 'Hani Ar-Rifai', arabicName: 'هاني الرفاعي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.ahmedajamy', audioId: 'ar.ahmedajamy', name: 'Ahmed Al-Ajmi', arabicName: 'أحمد العجمي', style: 'Murattal', country: 'Kuwait' },
  { id: 'ar.hudhaify', audioId: 'ar.hudhaify', name: 'Ali Al-Hudhaify', arabicName: 'علي الحذيفي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.abdurrahim', audioId: 'ar.abdurrahim', name: 'Abdur Rahim', arabicName: 'عبد الرحيم', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.muhammadjibreel', audioId: 'ar.muhammadjibreel', name: 'Muhammad Jibreel', arabicName: 'محمد جبريل', style: 'Murattal', country: 'Egypt' },
  { id: 'ar.saoodshuraym', audioId: 'ar.saoodshuraym', name: 'Saood Ash-Shuraym', arabicName: 'سعود الشريم', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.aymansuwaid', audioId: 'ar.aymansuwaid', name: 'Ayman Suwaid', arabicName: 'أيمن سويد', style: 'Murattal', country: 'Syria' },
  { id: 'ar.ibrahimakhbar', audioId: 'ar.ibrahimakhbar', name: 'Ibrahim Akhbar', arabicName: 'إبراهيم الأخضر', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.parhizgar', audioId: 'ar.parhizgar', name: 'Parhizgar', arabicName: 'پرهیزگار', style: 'Murattal', country: 'Iran' },
  { id: 'ar.abdurrahmaansudais', audioId: 'ar.abdurrahmaansudais', name: 'Abdur Rahman As-Sudais', arabicName: 'عبد الرحمن السديس', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.saadghamidi', audioId: 'ar.saadghamidi', name: 'Saad Al-Ghamdi', arabicName: 'سعد الغامدي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.nasserqatami', audioId: 'ar.nasserqatami', name: 'Nasser Al-Qatami', arabicName: 'ناصر القطامي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.bandarbaleela', audioId: 'ar.bandarbaleela', name: 'Bandar Baleela', arabicName: 'بندر بليلة', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.faresabbad', audioId: 'ar.faresabbad', name: 'Fares Abbad', arabicName: 'فارس عباد', style: 'Murattal', country: 'Yemen' },
  { id: 'ar.ahmednufais', audioId: 'ar.ahmednufais', name: 'Ahmed Al-Nufais', arabicName: 'أحمد النفيس', style: 'Murattal', country: 'Kuwait' },
];

export const reciterAudioMap: Record<string, string> = Object.fromEntries(
  RECITERS.map(r => [r.id, r.audioId])
);

router.get('/', (req: Request, res: Response) => {
  res.json({ success: true, data: RECITERS });
});

router.get('/:id', (req: Request, res: Response) => {
  const reciter = RECITERS.find(r => r.id === req.params.id);
  if (!reciter) {
    return res.status(404).json({ success: false, error: 'Reciter not found' });
  }
  res.json({ success: true, data: reciter });
});

router.get('/:id/audio/:surah', (req: Request, res: Response) => {
  const reciter = RECITERS.find(r => r.id === req.params.id);
  if (!reciter) {
    return res.status(404).json({ success: false, error: 'Reciter not found' });
  }
  const surahNum = parseInt(req.params.surah);
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    return res.status(400).json({ success: false, error: 'Invalid surah number' });
  }
  const paddedSurah = String(surahNum).padStart(3, '0');
  const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter.audioId}/${paddedSurah}.mp3`;
  res.json({ success: true, data: { url: audioUrl, reciter: reciter.name, surah: surahNum } });
});

router.get('/:id/ayah-audio/:ayahNumber', (req: Request, res: Response) => {
  const reciter = RECITERS.find(r => r.id === req.params.id);
  if (!reciter) {
    return res.status(404).json({ success: false, error: 'Reciter not found' });
  }
  const ayahNum = parseInt(req.params.ayahNumber);
  if (isNaN(ayahNum) || ayahNum < 1 || ayahNum > 6236) {
    return res.status(400).json({ success: false, error: 'Invalid ayah number' });
  }
  const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciter.audioId}/${ayahNum}.mp3`;
  res.json({ success: true, data: { url: audioUrl, reciter: reciter.name, ayah: ayahNum } });
});

export default router;
