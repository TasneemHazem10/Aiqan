import { Surah } from '../types';

interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

const SURAH_METADATA: SurahMeta[] = [
  { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 2, name: 'سُورَةُ ٱلْبَقَرَةِ', englishName: 'Al-Baqara', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan' },
  { number: 3, name: 'سُورَةُ آلِ عِمۡرَانَ', englishName: 'Aal-i-Imraan', englishNameTranslation: 'The Family of Imraan', numberOfAyahs: 200, revelationType: 'Medinan' },
  { number: 4, name: 'سُورَةُ ٱلنِّسَاءِ', englishName: 'An-Nisaa', englishNameTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan' },
  { number: 5, name: 'سُورَةُ ٱلْمَائِدَةِ', englishName: 'Al-Maaida', englishNameTranslation: 'The Table', numberOfAyahs: 120, revelationType: 'Medinan' },
  { number: 6, name: 'سُورَةُ ٱلْأَنْعَامِ', englishName: 'Al-An\'aam', englishNameTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan' },
  { number: 7, name: 'سُورَةُ ٱلْأَعْرَافِ', englishName: 'Al-A\'raaf', englishNameTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan' },
  { number: 8, name: 'سُورَةُ ٱلْأَنْفَالِ', englishName: 'Al-Anfaal', englishNameTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan' },
  { number: 9, name: 'سُورَةُ ٱلتَّوْبَةِ', englishName: 'At-Tawba', englishNameTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan' },
  { number: 10, name: 'سُورَةُ يُونُسَ', englishName: 'Yunus', englishNameTranslation: 'Jonas', numberOfAyahs: 109, revelationType: 'Meccan' },
  { number: 11, name: 'سُورَةُ هُودٍ', englishName: 'Hud', englishNameTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan' },
  { number: 12, name: 'سُورَةُ يُوسُفَ', englishName: 'Yusuf', englishNameTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 13, name: 'سُورَةُ ٱلرَّعْدِ', englishName: 'Ar-Ra\'d', englishNameTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan' },
  { number: 14, name: 'سُورَةُ إِبْرَاهِيمَ', englishName: 'Ibrahim', englishNameTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 15, name: 'سُورَةُ ٱلْحِجْرِ', englishName: 'Al-Hijr', englishNameTranslation: 'The Rock', numberOfAyahs: 99, revelationType: 'Meccan' },
  { number: 16, name: 'سُورَةُ ٱلنَّحْلِ', englishName: 'An-Nahl', englishNameTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan' },
  { number: 17, name: 'سُورَةُ ٱلْإِسْرَاءِ', englishName: 'Al-Israa', englishNameTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 18, name: 'سُورَةُ ٱلْكَهْفِ', englishName: 'Al-Kahf', englishNameTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan' },
  { number: 19, name: 'سُورَةُ مَرْيَمَ', englishName: 'Maryam', englishNameTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan' },
  { number: 20, name: 'سُورَةُ طه', englishName: 'Taa-Haa', englishNameTranslation: 'Taa-Haa', numberOfAyahs: 135, revelationType: 'Meccan' },
  { number: 21, name: 'سُورَةُ ٱلْأَنْبِيَاءِ', englishName: 'Al-Anbiyaa', englishNameTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan' },
  { number: 22, name: 'سُورَةُ ٱلْحَجِّ', englishName: 'Al-Hajj', englishNameTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 23, name: 'سُورَةُ ٱلْمُؤْمِنُونَ', englishName: 'Al-Muminoon', englishNameTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan' },
  { number: 24, name: 'سُورَةُ ٱلنُّورِ', englishName: 'An-Noor', englishNameTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan' },
  { number: 25, name: 'سُورَةُ ٱلْفُرْقَانِ', englishName: 'Al-Furqaan', englishNameTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan' },
  { number: 26, name: 'سُورَةُ ٱلشُّعَرَاءِ', englishName: 'Ash-Shu\'araa', englishNameTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan' },
  { number: 27, name: 'سُورَةُ ٱلنَّمْلِ', englishName: 'An-Naml', englishNameTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan' },
  { number: 28, name: 'سُورَةُ ٱلْقَصَصِ', englishName: 'Al-Qasas', englishNameTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 29, name: 'سُورَةُ ٱلْعَنْكَبُوتِ', englishName: 'Al-Ankaboot', englishNameTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan' },
  { number: 30, name: 'سُورَةُ ٱلرُّومِ', englishName: 'Ar-Room', englishNameTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 31, name: 'سُورَةُ لُقْمَانَ', englishName: 'Luqman', englishNameTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan' },
  { number: 32, name: 'سُورَةُ ٱلسَّجْدَةِ', englishName: 'As-Sajda', englishNameTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 33, name: 'سُورَةُ ٱلْأَحْزَابِ', englishName: 'Al-Ahzaab', englishNameTranslation: 'The Clans', numberOfAyahs: 73, revelationType: 'Medinan' },
  { number: 34, name: 'سُورَةُ سَبَإٍ', englishName: 'Saba', englishNameTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 35, name: 'سُورَةُ فَاطِرٍ', englishName: 'Faatir', englishNameTranslation: 'The Originator', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 36, name: 'سُورَةُ يٓسٓ', englishName: 'Yaseen', englishNameTranslation: 'Yaseen', numberOfAyahs: 83, revelationType: 'Meccan' },
  { number: 37, name: 'سُورَةُ ٱلصَّافَّاتِ', englishName: 'As-Saaffaat', englishNameTranslation: 'Those drawn up in Ranks', numberOfAyahs: 182, revelationType: 'Meccan' },
  { number: 38, name: 'سُورَةُ صٓ', englishName: 'Saad', englishNameTranslation: 'The letter Saad', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 39, name: 'سُورَةُ ٱلزُّمَرِ', englishName: 'Az-Zumar', englishNameTranslation: 'The Groups', numberOfAyahs: 75, revelationType: 'Meccan' },
  { number: 40, name: 'سُورَةُ غَافِرٍ', englishName: 'Ghafir', englishNameTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan' },
  { number: 41, name: 'سُورَةُ فُصِّلَتْ', englishName: 'Fussilat', englishNameTranslation: 'Explained in detail', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 42, name: 'سُورَةُ ٱلشُّورَىٰ', englishName: 'Ash-Shura', englishNameTranslation: 'Consultation', numberOfAyahs: 53, revelationType: 'Meccan' },
  { number: 43, name: 'سُورَةُ ٱلزُّخْرُفِ', englishName: 'Az-Zukhruf', englishNameTranslation: 'Ornaments of gold', numberOfAyahs: 89, revelationType: 'Meccan' },
  { number: 44, name: 'سُورَةُ ٱلدُّخَانِ', englishName: 'Ad-Dukhaan', englishNameTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan' },
  { number: 45, name: 'سُورَةُ ٱلْجَاثِيَةِ', englishName: 'Al-Jaathiya', englishNameTranslation: 'Crouching', numberOfAyahs: 37, revelationType: 'Meccan' },
  { number: 46, name: 'سُورَةُ ٱلْأَحْقَافِ', englishName: 'Al-Ahqaf', englishNameTranslation: 'The Dunes', numberOfAyahs: 35, revelationType: 'Meccan' },
  { number: 47, name: 'سُورَةُ مُحَمَّدٍ', englishName: 'Muhammad', englishNameTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan' },
  { number: 48, name: 'سُورَةُ ٱلْفَتْحِ', englishName: 'Al-Fath', englishNameTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 49, name: 'سُورَةُ ٱلْحُجُرَاتِ', englishName: 'Al-Hujuraat', englishNameTranslation: 'The Inner Apartments', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 50, name: 'سُورَةُ قٓ', englishName: 'Qaaf', englishNameTranslation: 'The letter Qaaf', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 51, name: 'سُورَةُ ٱلذَّارِيَاتِ', englishName: 'Adh-Dhaariyat', englishNameTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 52, name: 'سُورَةُ ٱلطُّورِ', englishName: 'At-Tur', englishNameTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan' },
  { number: 53, name: 'سُورَةُ ٱلنَّجْمِ', englishName: 'An-Najm', englishNameTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan' },
  { number: 54, name: 'سُورَةُ ٱلْقَمَرِ', englishName: 'Al-Qamar', englishNameTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan' },
  { number: 55, name: 'سُورَةُ ٱلرَّحْمَٰنِ', englishName: 'Ar-Rahmaan', englishNameTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 56, name: 'سُورَةُ ٱلْوَاقِعَةِ', englishName: 'Al-Waaqia', englishNameTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan' },
  { number: 57, name: 'سُورَةُ ٱلْحَدِيدِ', englishName: 'Al-Hadid', englishNameTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 58, name: 'سُورَةُ ٱلْمُجَادِلَةِ', englishName: 'Al-Mujaadila', englishNameTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan' },
  { number: 59, name: 'سُورَةُ ٱلْحَشْرِ', englishName: 'Al-Hashr', englishNameTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan' },
  { number: 60, name: 'سُورَةُ ٱلْمُمْتَحِنَةِ', englishName: 'Al-Mumtahana', englishNameTranslation: 'She that is to be examined', numberOfAyahs: 13, revelationType: 'Medinan' },
  { number: 61, name: 'سُورَةُ ٱلصَّفِّ', englishName: 'As-Saff', englishNameTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan' },
  { number: 62, name: 'سُورَةُ ٱلْجُمُعَةِ', englishName: 'Al-Jumu\'a', englishNameTranslation: 'Friday', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 63, name: 'سُورَةُ ٱلْمُنَافِقُونَ', englishName: 'Al-Munaafiqoon', englishNameTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 64, name: 'سُورَةُ ٱلتَّغَابُنِ', englishName: 'At-Taghaabun', englishNameTranslation: 'Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 65, name: 'سُورَةُ ٱلطَّلَاقِ', englishName: 'At-Talaaq', englishNameTranslation: 'Divorce', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 66, name: 'سُورَةُ ٱلتَّحْرِيمِ', englishName: 'At-Tahrim', englishNameTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 67, name: 'سُورَةُ ٱلْمُلْكِ', englishName: 'Al-Mulk', englishNameTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 68, name: 'سُورَةُ ٱلْقَلَمِ', englishName: 'Al-Qalam', englishNameTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 69, name: 'سُورَةُ ٱلْحَاقَّةِ', englishName: 'Al-Haaqqa', englishNameTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 70, name: 'سُورَةُ ٱلْمَعَارِجِ', englishName: 'Al-Ma\'aarij', englishNameTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan' },
  { number: 71, name: 'سُورَةُ نُوحٍ', englishName: 'Nooh', englishNameTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 72, name: 'سُورَةُ ٱلْجِنِّ', englishName: 'Al-Jinn', englishNameTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 73, name: 'سُورَةُ ٱلْمُزَّمِّلِ', englishName: 'Al-Muzzammil', englishNameTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 74, name: 'سُورَةُ ٱلْمُدَّثِّرِ', englishName: 'Al-Muddaththir', englishNameTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan' },
  { number: 75, name: 'سُورَةُ ٱلْقِيَامَةِ', englishName: 'Al-Qiyaama', englishNameTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 76, name: 'سُورَةُ ٱلْإِنْسَانِ', englishName: 'Al-Insaan', englishNameTranslation: 'Man', numberOfAyahs: 31, revelationType: 'Medinan' },
  { number: 77, name: 'سُورَةُ ٱلْمُرْسَلَاتِ', englishName: 'Al-Mursalaat', englishNameTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan' },
  { number: 78, name: 'سُورَةُ ٱلنَّبَإِ', englishName: 'An-Naba', englishNameTranslation: 'The Announcement', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 79, name: 'سُورَةُ ٱلنَّازِعَاتِ', englishName: 'An-Naazi\'aat', englishNameTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan' },
  { number: 80, name: 'سُورَةُ عَبَسَ', englishName: 'Abasa', englishNameTranslation: 'He frowned', numberOfAyahs: 42, revelationType: 'Meccan' },
  { number: 81, name: 'سُورَةُ ٱلتَّكْوِيرِ', englishName: 'At-Takwir', englishNameTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan' },
  { number: 82, name: 'سُورَةُ ٱلِٱنْفِطَارِ', englishName: 'Al-Infitaar', englishNameTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 83, name: 'سُورَةُ ٱلْمُطَفِّفِينَ', englishName: 'Al-Mutaffifin', englishNameTranslation: 'Defrauding', numberOfAyahs: 36, revelationType: 'Meccan' },
  { number: 84, name: 'سُورَةُ ٱلِٱنْشِقَاقِ', englishName: 'Al-Inshiqaaq', englishNameTranslation: 'The Splitting Open', numberOfAyahs: 25, revelationType: 'Meccan' },
  { number: 85, name: 'سُورَةُ ٱلْبُرُوجِ', englishName: 'Al-Burooj', englishNameTranslation: 'The Constellations', numberOfAyahs: 22, revelationType: 'Meccan' },
  { number: 86, name: 'سُورَةُ ٱلطَّارِقِ', englishName: 'At-Taariq', englishNameTranslation: 'The Morning Star', numberOfAyahs: 17, revelationType: 'Meccan' },
  { number: 87, name: 'سُورَةُ ٱلْأَعْلَىٰ', englishName: 'Al-A\'laa', englishNameTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 88, name: 'سُورَةُ ٱلْغَاشِيَةِ', englishName: 'Al-Ghaashiya', englishNameTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan' },
  { number: 89, name: 'سُورَةُ ٱلْفَجْرِ', englishName: 'Al-Fajr', englishNameTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 90, name: 'سُورَةُ ٱلْبَلَدِ', englishName: 'Al-Balad', englishNameTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 91, name: 'سُورَةُ ٱلشَّمْسِ', englishName: 'Ash-Shams', englishNameTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan' },
  { number: 92, name: 'سُورَةُ ٱللَّيْلِ', englishName: 'Al-Lail', englishNameTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan' },
  { number: 93, name: 'سُورَةُ ٱلضُّحَىٰ', englishName: 'Ad-Dhuhaa', englishNameTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 94, name: 'سُورَةُ ٱلشَّرْحِ', englishName: 'Ash-Sharh', englishNameTranslation: 'The Consolation', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 95, name: 'سُورَةُ ٱلتِّينِ', englishName: 'At-Tin', englishNameTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 96, name: 'سُورَةُ ٱلْعَلَقِ', englishName: 'Al-Alaq', englishNameTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 97, name: 'سُورَةُ ٱلْقَدْرِ', englishName: 'Al-Qadr', englishNameTranslation: 'The Power, Fate', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 98, name: 'سُورَةُ ٱلْبَيِّنَةِ', englishName: 'Al-Bayyina', englishNameTranslation: 'The Evidence', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 99, name: 'سُورَةُ ٱلزَّلْزَلَةِ', englishName: 'Az-Zalzala', englishNameTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 100, name: 'سُورَةُ ٱلْعَادِيَاتِ', englishName: 'Al-Aadiyaat', englishNameTranslation: 'The Chargers', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 101, name: 'سُورَةُ ٱلْقَارِعَةِ', englishName: 'Al-Qaari\'a', englishNameTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 102, name: 'سُورَةُ ٱلتَّكَاثُرِ', englishName: 'At-Takaathur', englishNameTranslation: 'Competition', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 103, name: 'سُورَةُ ٱلْعَصْرِ', englishName: 'Al-Asr', englishNameTranslation: 'The Declining Day, Epoch', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 104, name: 'سُورَةُ ٱلْهُمَزَةِ', englishName: 'Al-Humaza', englishNameTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan' },
  { number: 105, name: 'سُورَةُ ٱلْفِيلِ', englishName: 'Al-Fil', englishNameTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 106, name: 'سُورَةُ قُرَيْشٍ', englishName: 'Quraish', englishNameTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 107, name: 'سُورَةُ ٱلْمَاعُونَ', englishName: 'Al-Maa\'un', englishNameTranslation: 'Almsgiving', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 108, name: 'سُورَةُ ٱلْكَوْثَرِ', englishName: 'Al-Kawthar', englishNameTranslation: 'Abundance', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 109, name: 'سُورَةُ ٱلْكَافِرُونَ', englishName: 'Al-Kaafiroon', englishNameTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan' },
  { number: 110, name: 'سُورَةُ ٱلنَّصْرِ', englishName: 'An-Nasr', englishNameTranslation: 'Divine Support', numberOfAyahs: 3, revelationType: 'Medinan' },
  { number: 111, name: 'سُورَةُ ٱلْمَسَدِ', englishName: 'Al-Masad', englishNameTranslation: 'The Palm Fibre', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 112, name: 'سُورَةُ ٱلْإِخْلَاصِ', englishName: 'Al-Ikhlaas', englishNameTranslation: 'Sincerity', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 113, name: 'سُورَةُ ٱلْفَلَقِ', englishName: 'Al-Falaq', englishNameTranslation: 'The Dawn', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 114, name: 'سُورَةُ ٱلنَّاسِ', englishName: 'An-Naas', englishNameTranslation: 'Mankind', numberOfAyahs: 6, revelationType: 'Meccan' },
];

let PAGES_BY_SURAH: Record<number, { name: string; englishName: string; englishNameTranslation: string }> = {};
try {
  const pagesData: { pages: { surahs: { number: number; name: string; englishName: string; englishNameTranslation: string }[] }[] }
    = require('./quranPages.json');
  for (const p of pagesData.pages) {
    for (const s of p.surahs) {
      if (!PAGES_BY_SURAH[s.number]) {
        PAGES_BY_SURAH[s.number] = { name: s.name, englishName: s.englishName, englishNameTranslation: s.englishNameTranslation };
      }
    }
  }
} catch {}

export const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
  10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
  18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
  26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
  34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
  42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
  50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
  58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
  66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
  74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
  82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
  90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
  98: 598, 99: 599, 100: 599, 101: 600, 102: 600, 103: 601, 104: 601,
  105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
  112: 604, 113: 604, 114: 604,
};

export const JUZ_START_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
  11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342,
  19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502,
  27: 522, 28: 542, 29: 562, 30: 582,
};

export const JUZ_NAMES: Record<number, string> = {
  1: 'الم', 2: 'سَيَقُولُ', 3: 'تِلْكَ الرُّسُلُ', 4: 'لَنْ تَنَالُوا',
  5: 'وَالْمُحْصَنَاتُ', 6: 'لَا يُحِبُّ', 7: 'وَإِذَا سَمِعُوا',
  8: 'وَلَوْ أَنَّنَا', 9: 'قَالَ الْمَلَأُ', 10: 'وَاعْلَمُوا',
  11: 'يَعْتَذِرُونَ', 12: 'وَمَا مِنْ دَابَّةٍ', 13: 'وَمَا أُبَرِّئُ',
  14: 'رُبَمَا', 15: 'سُبْحَانَ', 16: 'قَالَ أَلَمْ', 17: 'اقْتَرَبَ',
  18: 'قَدْ أَفْلَحَ', 19: 'وَقَالَ الَّذِينَ', 20: 'أَمَّنْ خَلَقَ',
  21: 'اتْلُ مَا أُوحِيَ', 22: 'وَمَنْ يَقْنُتْ', 23: 'وَمَا لِيَ',
  24: 'فَمَنْ أَظْلَمُ', 25: 'إِلَيْهِ يُرَدُّ', 26: 'حم',
  27: 'قَالَ فَمَا خَطْبُكُمْ', 28: 'قَدْ سَمِعَ', 29: 'تَبَارَكَ الَّذِي',
  30: 'عَمَّ',
};

export function getSurahMetadata(): SurahMeta[] {
  return SURAH_METADATA;
}

export function getAllSurahs(): Surah[] {
  return SURAH_METADATA.map((s) => {
    const pageInfo = PAGES_BY_SURAH[s.number];
    return {
      number: s.number,
      name: pageInfo?.name || s.name,
      englishName: s.englishName,
      englishNameTranslation: pageInfo?.englishNameTranslation || s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    };
  });
}
