export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AchievementDef {
  id: string;
  icon: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  difficulty: Difficulty;
  check: (
    mem: number,
    streak: number,
    surahs: number,
    reading: number,
    days: number,
    dhikr: number,
    tasbih: number,
    sessions: number,
  ) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // ═══════════════════════════════════════════
  // EASY — Quick wins for new users
  // ═══════════════════════════════════════════

  { id: 'first_ayah', icon: '🌟', labelEn: 'First Ayah', labelAr: 'أول آية', descEn: 'Memorize your very first ayah of the Quran. Every great journey begins with a single step.', descAr: 'احفظ أول آية من القرآن الكريم. كل رحلة عظيمة تبدأ بخطوة واحدة.', difficulty: 'easy', check: (mem) => mem >= 1 },
  { id: 'first_surah', icon: '📚', labelEn: 'First Surah', labelAr: 'أول سورة', descEn: 'Complete memorizing an entire surah from the Quran. A wonderful achievement!', descAr: 'أتممت حفظ سورة كاملة من القرآن الكريم. إنجاز رائع!', difficulty: 'easy', check: (_m, _s, surahs) => surahs >= 1 },
  { id: 'three_streak', icon: '🔥', labelEn: '3-Day Streak', labelAr: '٣ أيام متتالية', descEn: 'Maintain a learning streak for 3 consecutive days. Consistency is key!', descAr: 'حافظ على الاستمرارية لمدة ٣ أيام متتالية. الاستمرارية هي المفتاح!', difficulty: 'easy', check: (_m, streak) => streak >= 3 },
  { id: 'week_streak', icon: '🔥', labelEn: '7-Day Streak', labelAr: '٧ أيام متتالية', descEn: 'Maintain a learning streak for a full week. A full week of dedication!', descAr: 'حافظ على الاستمرارية لمدة أسبوع كامل. أسبوع كامل من الالتزام!', difficulty: 'easy', check: (_m, streak) => streak >= 7 },
  { id: 'fourteen_streak', icon: '🔥', labelEn: '14-Day Streak', labelAr: '١٤ يومًا متتالية', descEn: 'Maintain a learning streak for 14 consecutive days. Two weeks strong!', descAr: 'حافظ على الاستمرارية لمدة ١٤ يومًا متتالية. أسبوعان من العزيمة!', difficulty: 'easy', check: (_m, streak) => streak >= 14 },
  { id: 'first_dhikr', icon: '📿', labelEn: 'First Dhikr', labelAr: 'أول ذكر', descEn: 'Recite your first dhikr. Remembering Allah brings peace to the heart.', descAr: 'قل أول ذكر لله. ذكر الله يطمئن القلب.', difficulty: 'easy', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 1 },
  { id: 'dhikr_100', icon: '📿', labelEn: '100 Dhikr', labelAr: '١٠٠ ذكر', descEn: 'Recite 100 dhikr in total. Every remembrance counts.', descAr: 'قل ١٠٠ ذكر. كل ذكر يحسب لك.', difficulty: 'easy', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 100 },
  { id: 'dhikr_500', icon: '📿', labelEn: '500 Dhikr', labelAr: '٥٠٠ ذكر', descEn: 'Recite 500 dhikr. Your tongue is constantly moist with remembrance.', descAr: 'قل ٥٠٠ ذكر. لسانك رطب بذكر الله.', difficulty: 'easy', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 500 },
  { id: 'tasbih_100', icon: '🔄', labelEn: '100 Tasbih', labelAr: '١٠٠ تسبيحة', descEn: 'Count 100 tasbih. Glorifying Allah throughout the day.', descAr: 'عد ١٠٠ تسبيحة. تسبيح الله في اليوم.', difficulty: 'easy', check: (_m, _s, _su, _r, _d, _dh, tasbih) => tasbih >= 100 },
  { id: 'tasbih_500', icon: '🔄', labelEn: '500 Tasbih', labelAr: '٥٠٠ تسبيحة', descEn: 'Count 500 tasbih. SubhanAllah, Alhamdulillah, Allahu Akbar!', descAr: 'عد ٥٠٠ تسبيحة. سبحان الله، والحمد لله، والله أكبر!', difficulty: 'easy', check: (_m, _s, _su, _r, _d, _dh, tasbih) => tasbih >= 500 },
  { id: 'ten_ayahs', icon: '📖', labelEn: '10 Ayahs', labelAr: '١٠ آيات', descEn: 'Memorize 10 ayahs of the Quran. You are building momentum!', descAr: 'احفظ ١٠ آيات من القرآن. أنت تبني زخمًا رائعًا!', difficulty: 'easy', check: (mem) => mem >= 10 },
  { id: 'twentyfive_ayahs', icon: '📖', labelEn: '25 Ayahs', labelAr: '٢٥ آية', descEn: 'Memorize 25 ayahs. That is over a page of the Quran!', descAr: 'احفظ ٢٥ آية. هذا أكثر من صفحة كاملة!', difficulty: 'easy', check: (mem) => mem >= 25 },
  { id: 'first_session', icon: '🎯', labelEn: 'First Session', labelAr: 'أول جلسة', descEn: 'Complete your first dedicated memorization session. Structured learning begins!', descAr: 'أكمل أول جلسة حفظ مخصصة. التعلم المنظم يبدأ!', difficulty: 'easy', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 1 },
  { id: 'five_sessions', icon: '🎯', labelEn: '5 Sessions', labelAr: '٥ جلسات', descEn: 'Complete 5 memorization sessions. Building a strong habit!', descAr: 'أكمل ٥ جلسات حفظ. بناء عادة قوية!', difficulty: 'easy', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 5 },
  { id: 'reading_100', icon: '📖', labelEn: '100 Ayahs Read', labelAr: '١٠٠ آية مقروءة', descEn: 'Read 100 ayahs of the Quran. The words of Allah illuminate your path.', descAr: 'اقرأ ١٠٠ آية من القرآن. كلمات الله تنير طريقك.', difficulty: 'easy', check: (_m, _s, _su, reading) => reading >= 100 },
  { id: 'dedicated_7', icon: '⏰', labelEn: '7 Active Days', labelAr: '٧ أيام نشطة', descEn: 'Be active in the app for 7 different days. You are building a routine!', descAr: 'كن نشيطًا في التطبيق لمدة ٧ أيام مختلفة. أنت تبني روتينًا!', difficulty: 'easy', check: (_m, _s, _su, _r, days) => days >= 7 },
  { id: 'double_digits', icon: '🔢', labelEn: 'Double Digits', labelAr: 'خانة العشرات', descEn: 'Reach double digits in memorized ayahs (10+). The numbers are growing!', descAr: 'وصلت إلى خانة العشرات في الآيات المحفوظة. الأرقام في ازدياد!', difficulty: 'easy', check: (mem) => mem >= 10 },

  // ═══════════════════════════════════════════
  // MEDIUM — Moderate dedication
  // ═══════════════════════════════════════════

  { id: 'fifty_ayahs', icon: '🏅', labelEn: '50 Ayahs', labelAr: '٥٠ آية', descEn: 'Memorize 50 ayahs. Halfway to a juz!', descAr: 'احفظ ٥٠ آية. نصف الطريق إلى جزء!', difficulty: 'medium', check: (mem) => mem >= 50 },
  { id: 'hundred_ayahs', icon: '🎖️', labelEn: '100 Ayahs', labelAr: '١٠٠ آية', descEn: 'Memorize 100 ayahs. That is over 5 pages of the Quran!', descAr: 'احفظ ١٠٠ آية. هذا أكثر من ٥ صفحات!', difficulty: 'medium', check: (mem) => mem >= 100 },
  { id: 'twohundred_ayahs', icon: '🎖️', labelEn: '200 Ayahs', labelAr: '٢٠٠ آية', descEn: 'Memorize 200 ayahs. You have memorized a significant portion!', descAr: 'احفظ ٢٠٠ آية. حفظت جزءًا كبيرًا من القرآن!', difficulty: 'medium', check: (mem) => mem >= 200 },
  { id: 'three_surahs', icon: '📚', labelEn: '3 Surahs', labelAr: '٣ سور', descEn: 'Complete memorizing 3 full surahs. A collection of complete chapters!', descAr: 'أكمل حفظ ٣ سور كاملة. مجموعة من السور الكاملة!', difficulty: 'medium', check: (_m, _s, surahs) => surahs >= 3 },
  { id: 'five_surahs', icon: '📚', labelEn: '5 Surahs', labelAr: '٥ سور', descEn: 'Complete memorizing 5 full surahs. Half a dozen chapters mastered!', descAr: 'أكمل حفظ ٥ سور كاملة. نصف دستة من السور أتقنتها!', difficulty: 'medium', check: (_m, _s, surahs) => surahs >= 5 },
  { id: 'month_streak', icon: '💪', labelEn: '30-Day Streak', labelAr: '٣٠ يومًا متتالية', descEn: 'Maintain a streak for a full month. That is true dedication!', descAr: 'حافظ على الاستمرارية لمدة شهر كامل. هذا هو الالتزام الحقيقي!', difficulty: 'medium', check: (_m, streak) => streak >= 30 },
  { id: 'sixty_streak', icon: '💪', labelEn: '60-Day Streak', labelAr: '٦٠ يومًا متتالية', descEn: 'Maintain a streak for 60 days. Two months of non-stop learning!', descAr: 'حافظ على الاستمرارية لمدة ٦٠ يومًا. شهران من التعلم المتواصل!', difficulty: 'medium', check: (_m, streak) => streak >= 60 },
  { id: 'first_juz', icon: '📖', labelEn: 'Juz Reader', labelAr: 'قراءة جزء', descEn: 'Read a full juz (20+ ayahs). You are making progress through the Quran!', descAr: 'اقرأ جزءًا كاملاً (٢٠+ آية). أنت تتقدم في القرآن!', difficulty: 'medium', check: (_m, _s, _su, reading) => reading >= 20 },
  { id: 'five_juz', icon: '📖', labelEn: '5 Juz Read', labelAr: 'قراءة ٥ أجزاء', descEn: 'Read 100+ ayahs — equivalent to 5 juz. You are becoming a true reader!', descAr: 'اقرأ ١٠٠+ آية — ما يعادل ٥ أجزاء. أنت تصبح قارئًا حقيقيًا!', difficulty: 'medium', check: (_m, _s, _su, reading) => reading >= 100 },
  { id: 'dedicated_30', icon: '⏰', labelEn: '30 Active Days', labelAr: '٣٠ يومًا نشطة', descEn: 'Be active in the app for 30 different days. A full month of engagement!', descAr: 'كن نشيطًا في التطبيق لمدة ٣٠ يومًا مختلفًا. شهر كامل من النشاط!', difficulty: 'medium', check: (_m, _s, _su, _r, days) => days >= 30 },
  { id: 'dedicated_100', icon: '⏰', labelEn: '100 Active Days', labelAr: '١٠٠ يوم نشط', descEn: 'Be active in the app for 100 different days. Three months of consistency!', descAr: 'كن نشيطًا في التطبيق لمدة ١٠٠ يوم مختلف. ثلاثة أشهر من الاستمرارية!', difficulty: 'medium', check: (_m, _s, _su, _r, days) => days >= 100 },
  { id: 'dhikr_1000', icon: '🔁', labelEn: '1K Dhikr', labelAr: '١٠٠٠ ذكر', descEn: 'Recite 1,000 dhikr. One thousand moments of remembrance!', descAr: 'قل ١٠٠٠ ذكر. ألف لحظة من الذكر!', difficulty: 'medium', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 1000 },
  { id: 'dhikr_5000', icon: '🔁', labelEn: '5K Dhikr', labelAr: '٥٠٠٠ ذكر', descEn: 'Recite 5,000 dhikr. Your heart is constantly connected to Allah.', descAr: 'قل ٥٠٠٠ ذكر. قلبك متصل دائمًا بالله.', difficulty: 'medium', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 5000 },
  { id: 'tasbih_1000', icon: '🔄', labelEn: '1K Tasbih', labelAr: '١٠٠٠ تسبيحة', descEn: 'Count 1,000 tasbih. Glorifying Allah in abundance!', descAr: 'عد ١٠٠٠ تسبيحة. تسبيح الله بكثرة!', difficulty: 'medium', check: (_m, _s, _su, _r, _d, _dh, tasbih) => tasbih >= 1000 },
  { id: 'tasbih_5000', icon: '🔄', labelEn: '5K Tasbih', labelAr: '٥٠٠٠ تسبيحة', descEn: 'Count 5,000 tasbih. Your tasbih beads have seen great barakah!', descAr: 'عد ٥٠٠٠ تسبيحة. سبحتك رأت بركة عظيمة!', difficulty: 'medium', check: (_m, _s, _su, _r, _d, _dh, tasbih) => tasbih >= 5000 },
  { id: 'twentyfive_sessions', icon: '🎯', labelEn: '25 Sessions', labelAr: '٢٥ جلسة', descEn: 'Complete 25 memorization sessions. Learning is now a habit!', descAr: 'أكمل ٢٥ جلسة حفظ. التعلم أصبح عادة!', difficulty: 'medium', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 25 },
  { id: 'fifty_sessions', icon: '🎯', labelEn: '50 Sessions', labelAr: '٥٠ جلسة', descEn: 'Complete 50 memorization sessions. Half a hundred study sessions!', descAr: 'أكمل ٥٠ جلسة حفظ. خمسون جلسة دراسية!', difficulty: 'medium', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 50 },
  { id: 'reading_500', icon: '📖', labelEn: '500 Ayahs Read', labelAr: '٥٠٠ آية مقروءة', descEn: 'Read 500 ayahs of the Quran. That is nearly half the Quran!', descAr: 'اقرأ ٥٠٠ آية من القرآن. هذا يقرب من نصف القرآن!', difficulty: 'medium', check: (_m, _s, _su, reading) => reading >= 500 },

  // ═══════════════════════════════════════════
  // HARD — Major milestones
  // ═══════════════════════════════════════════

  { id: 'fivehundred_ayahs', icon: '🎖️', labelEn: '500 Ayahs', labelAr: '٥٠٠ آية', descEn: 'Memorize 500 ayahs. That is a quarter of the Quran memorized!', descAr: 'احفظ ٥٠٠ آية. هذا ربع القرآن محفوظ!', difficulty: 'hard', check: (mem) => mem >= 500 },
  { id: 'thousand_ayahs', icon: '🎖️', labelEn: '1K Ayahs', labelAr: '١٠٠٠ آية', descEn: 'Memorize 1,000 ayahs. You are well on your way to becoming a hafidh!', descAr: 'احفظ ١٠٠٠ آية. أنت في طريقك لتصبح حافظًا!', difficulty: 'hard', check: (mem) => mem >= 1000 },
  { id: 'twentyfive_hundred_ayahs', icon: '💎', labelEn: '2.5K Ayahs', labelAr: '٢٥٠٠ آية', descEn: 'Memorize 2,500 ayahs. Over a third of the Quran is in your heart!', descAr: 'احفظ ٢٥٠٠ آية. أكثر من ثلث القرآن في قلبك!', difficulty: 'hard', check: (mem) => mem >= 2500 },
  { id: 'five_thousand_ayahs', icon: '💎', labelEn: '5K Ayahs', labelAr: '٥٠٠٠ آية', descEn: 'Memorize 5,000 ayahs. Almost the entire Quran! Nearly there!', descAr: 'احفظ ٥٠٠٠ آية. تقريبًا القرآن كامل! أوشكت على الوصول!', difficulty: 'hard', check: (mem) => mem >= 5000 },
  { id: 'ten_surahs', icon: '📚', labelEn: '10 Surahs', labelAr: '١٠ سور', descEn: 'Complete memorizing 10 full surahs. A significant portion of the Quran!', descAr: 'أكمل حفظ ١٠ سور كاملة. جزء كبير من القرآن!', difficulty: 'hard', check: (_m, _s, surahs) => surahs >= 10 },
  { id: 'twenty_surahs', icon: '📚', labelEn: '20 Surahs', labelAr: '٢٠ سورة', descEn: 'Complete memorizing 20 full surahs. You are becoming a true hafidh!', descAr: 'أكمل حفظ ٢٠ سورة كاملة. أنت تصبح حافظًا حقًا!', difficulty: 'hard', check: (_m, _s, surahs) => surahs >= 20 },
  { id: 'thirtyfive_surahs', icon: '📚', labelEn: '35 Surahs', labelAr: '٣٥ سورة', descEn: 'Complete memorizing 35 surahs. Most of the Quran is now in your heart!', descAr: 'أكمل حفظ ٣٥ سورة. معظم القرآن الآن في قلبك!', difficulty: 'hard', check: (_m, _s, surahs) => surahs >= 35 },
  { id: 'fifty_surahs', icon: '📚', labelEn: '50 Surahs', labelAr: '٥٠ سورة', descEn: 'Complete memorizing 50 surahs. Halfway through all surahs!', descAr: 'أكمل حفظ ٥٠ سورة. نصف السور مكتملة!', difficulty: 'hard', check: (_m, _s, surahs) => surahs >= 50 },
  { id: 'all_surahs', icon: '👑', labelEn: 'All Surahs', labelAr: 'كل السور', descEn: 'Complete memorizing all 114 surahs of the Quran. A monumental achievement!', descAr: 'أكمل حفظ جميع سور القرآن الـ ١١٤. إنجاز عظيم!', difficulty: 'hard', check: (_m, _s, surahs) => surahs >= 114 },
  { id: 'dhikr_10000', icon: '⭐', labelEn: '10K Dhikr', labelAr: '١٠٠٠٠ ذكر', descEn: 'Recite 10,000 dhikr. Ten thousand acts of remembrance!', descAr: 'قل ١٠٠٠٠ ذكر. عشرة آلاف ذكر!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 10000 },
  { id: 'dhikr_25000', icon: '⭐', labelEn: '25K Dhikr', labelAr: '٢٥٠٠٠ ذكر', descEn: 'Recite 25,000 dhikr. Your devotion is extraordinary!', descAr: 'قل ٢٥٠٠٠ ذكر. إخلاصك استثنائي!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, dhikr) => dhikr >= 25000 },
  { id: 'tasbih_10000', icon: '⭐', labelEn: '10K Tasbih', labelAr: '١٠٠٠٠ تسبيحة', descEn: 'Count 10,000 tasbih. Ten thousand glorifications of Allah!', descAr: 'عد ١٠٠٠٠ تسبيحة. عشرة آلاف تسبيحة!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, _dh, tasbih) => tasbih >= 10000 },
  { id: 'tasbih_25000', icon: '⭐', labelEn: '25K Tasbih', labelAr: '٢٥٠٠٠ تسبيحة', descEn: 'Count 25,000 tasbih. Constantly glorifying the Almighty!', descAr: 'عد ٢٥٠٠٠ تسبيحة. تسبيح دائم للعلي القدير!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, _dh, tasbih) => tasbih >= 25000 },
  { id: 'complete_quran', icon: '🏆', labelEn: 'Quran Complete', labelAr: 'ختم القرآن', descEn: 'Read all 6,236 ayahs of the Quran. You have completed the entire Book of Allah!', descAr: 'اقرأ جميع آيات القرآن الـ ٦٢٣٦. ختمت كتاب الله كاملاً!', difficulty: 'hard', check: (_m, _s, _su, reading) => reading >= 6236 },
  { id: 'master_hafidh', icon: '💎', labelEn: 'Master Hafidh', labelAr: 'حافظ القرآن', descEn: 'Memorize the entire Quran (6,236 ayahs). You are now a hafidh of the Quran! MashaAllah!', descAr: 'احفظ القرآن كاملًا (٦٢٣٦ آية). أصبحت حافظًا للقرآن! ما شاء الله!', difficulty: 'hard', check: (mem) => mem >= 6236 },
  { id: 'year_streak', icon: '🔥', labelEn: '365-Day Streak', labelAr: 'سنة كاملة', descEn: 'Maintain a streak for an entire year. A full year of non-stop learning!', descAr: 'حافظ على الاستمرارية لمدة سنة كاملة. عام كامل من التعلم المتواصل!', difficulty: 'hard', check: (_m, streak) => streak >= 365 },
  { id: 'ninety_streak', icon: '💪', labelEn: '90-Day Streak', labelAr: '٩٠ يومًا متتالية', descEn: 'Maintain a streak for 90 days. Three months of unwavering dedication!', descAr: 'حافظ على الاستمرارية لمدة ٩٠ يومًا. ثلاثة أشهر من الالتزام الثابت!', difficulty: 'hard', check: (_m, streak) => streak >= 90 },
  { id: 'hundred_eighty_streak', icon: '🔥', labelEn: '180-Day Streak', labelAr: '١٨٠ يومًا متتالية', descEn: 'Maintain a streak for 180 days. Six months of consistent learning!', descAr: 'حافظ على الاستمرارية لمدة ١٨٠ يومًا. ستة أشهر من التعلم المنتظم!', difficulty: 'hard', check: (_m, streak) => streak >= 180 },
  { id: 'ramadan_devotee', icon: '🌙', labelEn: 'Ramadan Devotee', labelAr: 'متعبد رمضان', descEn: 'Stay active throughout Ramadan (30 days). Blessed month, blessed dedication!', descAr: 'كن نشيطًا طوال شهر رمضان (٣٠ يومًا). شهر مبارك والتزام مبارك!', difficulty: 'hard', check: (_m, streak) => streak >= 30 },
  { id: 'hundred_sessions', icon: '🎯', labelEn: '100 Sessions', labelAr: '١٠٠ جلسة', descEn: 'Complete 100 memorization sessions. A hundred focused study sessions!', descAr: 'أكمل ١٠٠ جلسة حفظ. مائة جلسة دراسية مركزة!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 100 },
  { id: 'twohundred_fifty_sessions', icon: '🎯', labelEn: '250 Sessions', labelAr: '٢٥٠ جلسة', descEn: 'Complete 250 memorization sessions. Your dedication knows no bounds!', descAr: 'أكمل ٢٥٠ جلسة حفظ. إخلاصك لا حدود له!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 250 },
  { id: 'reading_1000', icon: '📖', labelEn: '1K Ayahs Read', labelAr: '١٠٠٠ آية مقروءة', descEn: 'Read 1,000 ayahs of the Quran. A thousand verses of divine guidance!', descAr: 'اقرأ ١٠٠٠ آية من القرآن. ألف آية من الهدى الإلهي!', difficulty: 'hard', check: (_m, _s, _su, reading) => reading >= 1000 },
  { id: 'reading_2500', icon: '📖', labelEn: '2.5K Ayahs Read', labelAr: '٢٥٠٠ آية مقروءة', descEn: 'Read 2,500 ayahs. You have read through over a third of the Quran!', descAr: 'اقرأ ٢٥٠٠ آية. قرأت أكثر من ثلث القرآن!', difficulty: 'hard', check: (_m, _s, _su, reading) => reading >= 2500 },
  { id: 'reading_5000', icon: '📖', labelEn: '5K Ayahs Read', labelAr: '٥٠٠٠ آية مقروءة', descEn: 'Read 5,000 ayahs. Almost the entire Quran read! Nearly there!', descAr: 'اقرأ ٥٠٠٠ آية. قرأت تقريبًا القرآن كاملًا! أوشكت!', difficulty: 'hard', check: (_m, _s, _su, reading) => reading >= 5000 },
  { id: 'dedicated_365', icon: '⏰', labelEn: '365 Active Days', labelAr: '٣٦٥ يومًا نشطًا', descEn: 'Be active for 365 different days. A full year of engagement with the Quran!', descAr: 'كن نشيطًا لمدة ٣٦٥ يومًا مختلفًا. عام كامل من التواصل مع القرآن!', difficulty: 'hard', check: (_m, _s, _su, _r, days) => days >= 365 },
  { id: 'ten_juz', icon: '📖', labelEn: '10 Juz Read', labelAr: 'قراءة ١٠ أجزاء', descEn: 'Read 200+ ayahs — equivalent to 10 juz. You are well on your way!', descAr: 'اقرأ ٢٠٠+ آية — ما يعادل ١٠ أجزاء. أنت في الطريق الصحيح!', difficulty: 'hard', check: (_m, _s, _su, reading) => reading >= 200 },
  { id: 'twenty_juz', icon: '📖', labelEn: '20 Juz Read', labelAr: 'قراءة ٢٠ جزءًا', descEn: 'Read 400+ ayahs — equivalent to 20 juz. You are a true reciter!', descAr: 'اقرأ ٤٠٠+ آية — ما يعادل ٢٠ جزءًا. أنت قارئ حقيقي!', difficulty: 'hard', check: (_m, _s, _su, reading) => reading >= 400 },
  { id: 'fivehundred_sessions', icon: '🏅', labelEn: '500 Sessions', labelAr: '٥٠٠ جلسة', descEn: 'Complete 500 memorization sessions. An incredible milestone of discipline!', descAr: 'أكمل ٥٠٠ جلسة حفظ. إنجاز لا يُصدق من الانضباط!', difficulty: 'hard', check: (_m, _s, _su, _r, _d, _dh, _ta, sessions) => sessions >= 500 },
];

export const SURAH_AYAH_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6,
};
