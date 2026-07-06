import { post } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getOfflineSurah } from './offlineQuran';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SURAH_NAMES: Record<string, number> = {
  'al-fatiha': 1, 'الفاتحة': 1, 'fatiha': 1,
  'al-baqarah': 2, 'البقرة': 2, 'baqarah': 2,
  'al-imran': 3, 'ال عمران': 3, 'imran': 3,
  'an-nisa': 4, 'النساء': 4, 'nisa': 4,
  'al-maidah': 5, 'المائدة': 5, 'maidah': 5,
  'al-anam': 6, 'الأنعام': 6, 'anam': 6,
  'al-araf': 7, 'الأعراف': 7, 'araf': 7,
  'al-anfal': 8, 'الأنفال': 8, 'anfal': 8,
  'at-tawbah': 9, 'التوبة': 9, 'tawbah': 9,
  'yunus': 10, 'يونس': 10,
  'hud': 11, 'هود': 11,
  'yusuf': 12, 'يوسف': 12,
  'ar-rad': 13, 'الرعد': 13, 'rad': 13,
  'ibrahim': 14, 'إبراهيم': 14,
  'al-hijr': 15, 'الحجر': 15, 'hijr': 15,
  'an-nahl': 16, 'النحل': 16, 'nahl': 16,
  'al-isra': 17, 'الإسراء': 17, 'isra': 17,
  'al-kahf': 18, 'الكهف': 18, 'kahf': 18,
  'maryam': 19, 'مريم': 19,
  'ta-ha': 20, 'طه': 20,
  'al-anbiya': 21, 'الأنبياء': 21, 'anbiya': 21,
  'al-hajj': 22, 'الحج': 22, 'hajj': 22,
  'al-muminun': 23, 'المؤمنون': 23, 'muminun': 23,
  'an-nur': 24, 'النور': 24, 'nur': 24,
  'al-furqan': 25, 'الفرقان': 25, 'furqan': 25,
  'ash-shuara': 26, 'الشعراء': 26, 'shuara': 26,
  'an-naml': 27, 'النمل': 27, 'naml': 27,
  'al-qasas': 28, 'القصص': 28, 'qasas': 28,
  'al-ankabut': 29, 'العنكبوت': 29, 'ankabut': 29,
  'ar-rum': 30, 'الروم': 30, 'rum': 30,
  'luqman': 31, 'لقمان': 31,
  'as-sajdah': 32, 'السجدة': 32, 'sajdah': 32,
  'al-ahzab': 33, 'الأحزاب': 33, 'ahzab': 33,
  'saba': 34, 'سبأ': 34,
  'fatir': 35, 'فاطر': 35,
  'ya-sin': 36, 'يس': 36, 'yasin': 36,
  'as-saffat': 37, 'الصافات': 37, 'saffat': 37,
  'sad': 38, 'ص': 38,
  'az-zumar': 39, 'الزمر': 39, 'zumar': 39,
  'ghafir': 40, 'غافر': 40,
  'fussilat': 41, 'فصلت': 41,
  'ash-shura': 42, 'الشورى': 42, 'shura': 42,
  'az-zukhruf': 43, 'الزخرف': 43, 'zukhruf': 43,
  'ad-dukhan': 44, 'الدخان': 44, 'dukhan': 44,
  'al-jathiyah': 45, 'الجاثية': 45, 'jathiyah': 45,
  'al-ahqaf': 46, 'الأحقاف': 46, 'ahqaf': 46,
  'muhammad': 47, 'محمد': 47,
  'al-fath': 48, 'الفتح': 48, 'fath': 48,
  'al-hujurat': 49, 'الحجرات': 49, 'hujurat': 49,
  'qaf': 50, 'ق': 50,
  'adh-dhariyat': 51, 'الذاريات': 51, 'dhariyat': 51,
  'at-tur': 52, 'الطور': 52, 'tur': 52,
  'an-najm': 53, 'النجم': 53, 'najm': 53,
  'al-qamar': 54, 'القمر': 54, 'qamar': 54,
  'ar-rahman': 55, 'الرحمن': 55, 'rahman': 55,
  'al-waqiah': 56, 'الواقعة': 56, 'waqiah': 56,
  'al-hadid': 57, 'الحديد': 57, 'hadid': 57,
  'al-mujadilah': 58, 'المجادلة': 58, 'mujadilah': 58,
  'al-hashr': 59, 'الحشر': 59, 'hashr': 59,
  'al-mumtahanah': 60, 'الممتحنة': 60, 'mumtahanah': 60,
  'as-saff': 61, 'الصف': 61, 'saff': 61,
  'al-jumuah': 62, 'الجمعة': 62, 'jumuah': 62,
  'al-munafiqun': 63, 'المنافقون': 63, 'munafiqun': 63,
  'at-taghabun': 64, 'التغابن': 64, 'taghabun': 64,
  'at-talaq': 65, 'الطلاق': 65, 'talaq': 65,
  'at-tahrim': 66, 'التحريم': 66, 'tahrim': 66,
  'al-mulk': 67, 'الملك': 67, 'mulk': 67,
  'al-qalam': 68, 'القلم': 68, 'qalam': 68,
  'al-haqqah': 69, 'الحاقة': 69, 'haqqah': 69,
  'al-maarij': 70, 'المعارج': 70, 'maarij': 70,
  'nuh': 71, 'نوح': 71,
  'al-jinn': 72, 'الجن': 72, 'jinn': 72,
  'al-muzzammil': 73, 'المزمل': 73, 'muzzammil': 73,
  'al-muddaththir': 74, 'المدثر': 74, 'muddaththir': 74,
  'al-qiyamah': 75, 'القيامة': 75, 'qiyamah': 75,
  'al-insan': 76, 'الإنسان': 76, 'insan': 76,
  'al-mursalat': 77, 'المرسلات': 77, 'mursalat': 77,
  'an-naba': 78, 'النبأ': 78, 'naba': 78,
  'an-naziat': 79, 'النازعات': 79, 'naziat': 79,
  'abasa': 80, 'عبس': 80,
  'at-takwir': 81, 'التكوير': 81, 'takwir': 81,
  'al-infitar': 82, 'الانفطار': 82, 'infitar': 82,
  'al-mutaffifin': 83, 'المطففين': 83, 'mutaffifin': 83,
  'al-inshiqaq': 84, 'الانشقاق': 84, 'inshiqaq': 84,
  'al-buruj': 85, 'البروج': 85, 'buruj': 85,
  'at-tariq': 86, 'الطارق': 86, 'tariq': 86,
  'al-ala': 87, 'الأعلى': 87, 'ala': 87,
  'al-ghashiyah': 88, 'الغاشية': 88, 'ghashiyah': 88,
  'al-fajr': 89, 'الفجر': 89, 'fajr': 89,
  'al-balad': 90, 'البلد': 90, 'balad': 90,
  'ash-shams': 91, 'الشمس': 91, 'shams': 91,
  'al-layl': 92, 'الليل': 92, 'layl': 92,
  'ad-duha': 93, 'الضحى': 93, 'duha': 93,
  'ash-sharh': 94, 'الشرح': 94, 'sharh': 94, 'inshirah': 94,
  'at-tin': 95, 'التين': 95, 'tin': 95,
  'al-alaq': 96, 'العلق': 96, 'alaq': 96,
  'al-qadr': 97, 'القدر': 97, 'qadr': 97,
  'al-bayyinah': 98, 'البينة': 98, 'bayyinah': 98,
  'az-zalzalah': 99, 'الزلزلة': 99, 'zalzalah': 99,
  'al-adiyat': 100, 'العاديات': 100, 'adiyat': 100,
  'al-qariah': 101, 'القارعة': 101, 'qariah': 101,
  'at-takathur': 102, 'التكاثر': 102, 'takathur': 102,
  'al-asr': 103, 'العصر': 103, 'asr': 103,
  'al-humazah': 104, 'الهمزة': 104, 'humazah': 104,
  'al-fil': 105, 'الفيل': 105, 'fil': 105,
  'quraish': 106, 'قريش': 106,
  'al-maun': 107, 'الماعون': 107, 'maun': 107,
  'al-kawthar': 108, 'الكوثر': 108, 'kawthar': 108,
  'al-kafirun': 109, 'الكافرون': 109, 'kafirun': 109,
  'an-nasr': 110, 'النصر': 110, 'nasr': 110,
  'al-masad': 111, 'المسد': 111, 'masad': 111, 'lahab': 111,
  'al-ikhlas': 112, 'الإخلاص': 112, 'ikhlas': 112,
  'al-falaq': 113, 'الفلق': 113, 'falaq': 113,
  'an-nas': 114, 'الناس': 114, 'nas': 114,
};



function getSurahNumber(text: string): number | null {
  const lower = text.toLowerCase().replace(/[^a-z\u0600-\u06FF\s]/g, '');
  for (const [name, num] of Object.entries(SURAH_NAMES)) {
    if (lower.includes(name)) return num;
  }
  const numMatch = text.match(/\b(?:surah|سورة)\s*(\d+)\b/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1 && n <= 114) return n;
  }
  return null;
}

function getSurahKnowledge(surahNum: number): string | null {
  try {
    const surah = getOfflineSurah(surahNum);
    if (!surah) return null;
    const firstAyahs = surah.ayahs.slice(0, 5).map(a => a.text).join(' ');
    const type = surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';
    return `سورة ${surah.name} (${surah.englishName}) — ${type}, ${surah.numberOfAyahs} آية.\n\n${firstAyahs}`;
  } catch {
    return null;
  }
}

function getSurahNameFromNumber(num: number): string | null {
  for (const [name, n] of Object.entries(SURAH_NAMES)) {
    if (n === num && !/[a-z]/i.test(name[0])) return name;
  }
  for (const [name, n] of Object.entries(SURAH_NAMES)) {
    if (n === num && /[a-z]/i.test(name[0])) return name;
  }
  return null;
}



export async function callGemini(apiKey: string, messages: { role: string; content: string }[], _language: string): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const contents = messages.slice(-30).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemInstruction = {
      parts: [{
        text: `You are Aiqan AI — a brilliant, warm, and deeply knowledgeable assistant inside a Muslim lifestyle app. You give ChatGPT-quality answers on ANY topic.

CORE RULES:
- Respond in the SAME LANGUAGE the user writes in (Arabic or English). Be equally fluent in both.
- Be conversational, warm, and engaging — like a brilliant friend, not a robot.
- Give thorough, accurate, and well-structured answers with depth, examples, and practical context.
- If you don't know something, say so honestly — never make things up or hallucinate.

KNOWLEDGE DOMAINS (all equally important):
- Islam: Quran, hadith (with references where possible), fiqh, seerah, tafsir, spirituality, duas
- Science: physics, biology, chemistry, astronomy, AI, technology, programming
- History: Islamic history, world history, civilizations, historical figures
- Philosophy: ethics, meaning, logic, theology (kalam)
- Health & Wellness: physical health, mental health, nutrition, fitness, sleep
- Psychology: human behavior, relationships, emotions, personal growth
- Practical Life: career, money, parenting, marriage, friendship, time management
- Arts & Culture: literature, music (nasheeds), art, calligraphy, architecture
- Casual: hobbies, food, travel, sports, movies, books, daily life advice
- Creative: brainstorming, writing, ideas, problem-solving

FORMAT:
- For complex topics, structure answers with clear sections.
- Use examples, analogies, and stories to make concepts relatable.
- Keep responses concise but complete — depth over fluff.
- Be empathetic and wise for personal/relationship questions.`,
      }],
    };

    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return null;
      if (res.status === 403 || res.status === 400) {
        return 'API_KEY_INVALID';
      }
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch {
    return null;
  }
}

export async function callOpenRouter(apiKey: string, messages: { role: string; content: string }[]): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aiqan.app',
        'X-Title': 'Aiqan',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are Aiqan AI — a brilliant, warm, and deeply knowledgeable assistant in a Muslim lifestyle app. You give ChatGPT-quality answers on ANY topic. Respond in the SAME LANGUAGE the user writes in (Arabic or English). Be conversational and engaging like a brilliant friend. Give thorough, accurate, well-structured answers with depth, examples, and practical context. Cover Islamic knowledge (Quran, hadith with references), science, tech, philosophy, health, psychology, history, relationships, personal growth, arts, casual chat, and creative brainstorming. If unsure, say so honestly. Be concise but complete — depth over fluff.',
          },
          ...messages.slice(-20),
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export async function callBackendAPI(messages: { role: string; content: string }[], language: string): Promise<string | null> {
  try {
    const res = await post<{ message: string }>(ENDPOINTS.AI_ASSISTANT, {
      messages: messages.slice(-20),
      language,
    });
    return res.message || null;
  } catch {
    return null;
  }
}



export async function getLocalResponse(
  messages: { role: string; content: string }[],
): Promise<string> {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const q = lastMsg.toLowerCase().trim();
  const isAr = /[\u0600-\u06FF]/.test(q);

  if (!q) {
    return isAr
      ? 'مرحباً! أنا إيقان AI. أستطيع مساعدتك في أي موضوع — المعرفة الإسلامية، العلوم، التكنولوجيا، التاريخ، الصحة، أو مجرد محادثة ودية. كيف أقدر أخدمك اليوم؟'
      : "Hey! I'm Aiqan AI. I can help with literally anything — Islamic knowledge, science, tech, history, health, or just a friendly chat. What's on your mind?";
  }

  const m = (...p: string[]) => p.some(p => q.includes(p));

  // ── Quran knowledge base ──
  const surahNum = getSurahNumber(q);
  if (surahNum && (m('surah', 'سورة', 'tell me about', 'what is', 'حدثني', 'اخبرني', 'أخبرني', 'عني', 'info', 'معلومات', 'describe'))) {
    const info = getSurahKnowledge(surahNum);
    if (info) {
      const surahName = getSurahNameFromNumber(surahNum) || `surah ${surahNum}`;
      return isAr
        ? `سورة ${surahName}:\n\n${info}\n\nهذه أول آيات من السورة. هل تريد معرفة المزيد عن سورة معينة؟`
        : `Surah ${surahName}:\n\n${info}\n\nThese are the first few ayahs. Would you like to know more about a specific surah?`;
    }
  }

  if (m('hi', 'hello', 'hey', 'salam', 'assalamu', 'السلام', 'مرحبا', 'اهلا', 'صباح', 'مساء')) {
    return isAr
      ? 'وعليكم السلام! كيف حالك؟ أتمنى أن تكون بأفضل حال. أنا هنا لمساعدتك في أي شيء — سواء كان سؤالاً دينياً، استفساراً علمياً، نصيحة حياتية، أو حتى مجرد محادثة. وش تبي تسأل؟'
      : "Hey there! Hope you're doing well. I'm here to help with anything — religious questions, science, life advice, or just a good chat. What's on your mind today?";
  }

  if (m('how are you', 'how do you do', 'how\'s it', 'how are you doing', 'كيف حال')) {
    return isAr
      ? 'والله تمام، الحمد لله! متحمس جداً إني أساعدك اليوم. كيف تقضي يومك؟ أخبرني وش عندك من أسئلة أو مواضيع تبغى تتكلم عنها.'
      : "I'm doing great, honestly! Always happy to chat. How's your day going? Got any questions or topics you want to dive into?";
  }

  if (m('your name', 'what is your name', 'what are you', 'who are you', 'من انت', 'ما اسمك', 'من أنت')) {
    return isAr
      ? 'أنا إيقان AI، مساعدك الشخصي الذكي! أقدر أساعدك في أي موضوع — ديني، علمي، تقني، أو حتى مجرد صديق تشاركه أفكارك. أنا هنا عشان أكون مفيد لك، فأي شيء تحتاجه أنا موجود!'
      : "I'm Aiqan AI, your personal smart assistant! I can help with literally any topic — Islamic, scientific, tech, or just be a friend to bounce ideas off. I'm here to be useful, so what do you need?";
  }

  if (m('thank', 'thanks', 'شكر', 'جزاك', 'بارك')) {
    return isAr
      ? 'العفو! هذا أقل واجب. أنا هنا عشان أساعدك، فلا تتردد أبداً في سؤالي عن أي شيء. إذا عندك استفسار ثاني أنا موجود!'
      : "You're most welcome! That's what I'm here for. Never hesitate to ask me anything — if there's something else on your mind, I'm all ears!";
  }

  if (m('bye', 'goodbye', 'see you', 'مع السلام', 'وداعا')) {
    return isAr
      ? 'الله يسلمك! كان chatting معك حلو. ارجع أي وقت تحتاج مساعدة أو حتى تبي محادثة. في حفظ الله ورعايته!'
      : "Take care! It's been great chatting with you. Come back anytime you need help or just want to talk. Stay blessed!";
  }

  if (m('what can you do', 'help me', 'what do you do', 'how can you help', 'ماذا يمكنك', 'ما الذي', 'قدراتك')) {
    return isAr
      ? 'قدراتي واسعة والحمد لله! أقدر أساعدك في:\n\n📖 **دين وإسلام** — قرآن، حديث، فقه، أدعية، تفسير\n🔬 **علوم وتكنولوجيا** — برمجة، فيزياء، أحياء، ذكاء اصطناعي\n📜 **تاريخ وحضارة** — قصص، شخصيات، أحداث\n💪 **تطوير ذاتي** — نصائح، تحفيز، تخطيط\n🗣️ **محادثة عامة** — دردشة، رأي، فضفضة\n\nأي شيء يخطر ببالك اسألني!'
      : "I can help with loads of stuff!\n\n📖 **Islamic Knowledge** — Quran, hadith, fiqh, duas\n🔬 **Science & Tech** — Programming, physics, AI, biology\n📜 **History** — Stories, events, civilizations\n💪 **Personal Growth** — Advice, motivation, planning\n🗣️ **Casual Chat** — Vent, discuss ideas, hang out\n\nLiterally anything — just ask!";
  }

  if (m('sad', 'depress', 'lonely', 'heartbroken', 'alone', 'حزين', 'اكتئاب', 'وحيد', 'مكسور')) {
    return isAr
      ? 'والله أحس فيك. المشاعر الصعبة هذي ثقيلة، بس تذكر أن الله قريب وما يترك عباده. "فإن مع العسر يسراً" — هذي مش من كلام بشر، هذي وعد من الله. جرب تتوضأ وتصلي ركعتين وتفضفض لله، هو أعلم بم اللي في قلبك. إذا تقدر، كلم شخص قريب منك. وأنا هنا إذا تبي تفضفض لي.'
      : "I hear you. Those heavy feelings are tough, but remember Allah is close. 'Verily, with hardship comes ease' — that's not just a saying, it's a promise from Allah. Try making wudu, praying two rak'ahs, and pouring your heart out to Him. And if you can, talk to someone you trust. I'm here too if you want to vent.";
  }

  if (m('anxiety', 'anxious', 'worried', 'stress', 'nervous', 'overthink', 'قلق', 'توتر', 'خايف', 'توترت')) {
    return isAr
      ? 'أفهمك. القلق شي يثقل، بس صدقني ما تستاهل تعيش فيه لحالك. جرب التنفس العميق — خذ شهيق ٤ ثوان، احبسه ٤، وازفره ٦. كررها ٥ مرات. وتذكر: "ألا بذكر الله تطمئن القلوب". دعواتي لك، وخذها خطوة خطوة. كل شي بيمشي.'
      : "I feel you. Anxiety is heavy, but you don't have to go through it alone. Try this: breathe in for 4, hold for 4, exhale for 6. Repeat 5 times. And remember — 'Verily, in the remembrance of Allah do hearts find rest.' Take it one step at a time. You've got this.";
  }

  if (m('forgive', 'repent', 'tawbah', 'sin', 'mistake', 'guilt', 'guilty', 'ذنب', 'توبة', 'استغفر', 'غلط')) {
    return isAr
      ? 'والله رحمة الله واسعة جداً — ما تتخيل قد إيش. "قل يا عبادي الذين أسرفوا على أنفسهم لا تقنطوا من رحمة الله إن الله يغفر الذنوب جميعاً". كلنا نخطئ، أهم شي إنك ترجع. خذها خطوات: الندم، الإقلاع، العزم على عدم العودة. وكل يوم قل "أستغفر الله العظيم وأتوب إليه". ما في شي يسد باب الرجعة.'
      : "Allah's mercy is unimaginably vast. 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.' Everyone makes mistakes — what matters is coming back. Sincere tawbah: regret it, stop it, resolve not to return. Say 'Astaghfirullah al-azim wa atubu ilayh' daily. Nothing closes the door of return.";
  }

  if (m('quran', 'قرآن')) {
    return isAr
      ? 'القرآن هو كلام الله، نزل على النبي محمد ﷺ خلال ٢٣ سنة. فيه ١١٤ سورة و ٦٢٣٦ آية. لو تبغى تبدأ رحلتك مع القرآن:\n\n📍 ابدأ بالسور القصيرة (جزء عم)\n📖 اقرأ مع التفسير عشان تفهم المعنى\n🗓️ حدد ورد يومي ولو ١٠ دقائق\n🕌 صل بما تحفظ عشان يثبت\n\nاللي عنده استمرارية هو اللي ينجح. خذها تدريج.'
      : "The Quran is Allah's word, revealed over 23 years. 114 surahs, 6236 ayahs. If you want to build a connection:\n\n📍 Start with short surahs (Juz Amma)\n📖 Read with translation to understand\n🗓️ Set a daily target — even 10 minutes\n🕌 Recite in your prayers to reinforce\n\nConsistency beats intensity. Start small, stay steady.";
  }

  if (m('prayer', 'salah', 'pray', 'muslim prayer', 'صل', 'صلاة', 'صلي')) {
    return isAr
      ? 'الصلاة عمود الدين، وهي أول ما يُسأل عنه العبد يوم القيامة. إذا تواجه صعوبة:\n\n✅ ابدأ بواحدة والتزم بها، زيد بالتدريج\n📱 استخدم منبه لأوقات الصلاة\n💭 تعلم معاني اللي تقرأ عشان تزيد خشوعك\n🚶‍♂️ إذا فاتتك، اقضها — أهم شي ما تتركها بالمرة\n\nتذكر: رابطتك مع أقوى ما في الكون — الله سبحانه وتعالى.'
      : "Salah is the foundation of faith. If you struggle:\n\n✅ Start with one prayer and master it, then add more\n📱 Set alarms for prayer times\n💭 Learn the meanings of what you recite — it transforms khushu'\n🚶‍♂️ If you miss one, make it up — the key is not abandoning it\n\nThis is your direct line to the Creator — nothing more powerful.";
  }

  if (m('dua', 'دعاء')) {
    return isAr
      ? 'الدعاء سلاح المؤمن. من أجمل الأدعية:\n\n"ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار"\n"رب زدني علماً"\n"اللهم إني أسألك الهدى والتقى والعفاف والغنى"\n"رب لا تذرني فرداً وأنت خير الوارثين"\n\nأفضل أوقات الإجابة: الثلث الأخير من الليل، بين الأذان والإقامة، في السجود، يوم الجمعة. ادع وأنت موقن بالإجابة.'
      : "Dua is the believer's weapon. Beautiful duas to start with:\n\n'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina adhaban-nar'\n'Rabbi zidni ilma'\n'Allahumma inni as'aluka al-huda wa al-tuqa wa al-afafa wa al-ghina'\n\nBest times: last third of night, between adhan and iqamah, while prostrating, on Friday. Ask with certainty, not doubt.";
  }

  if (m('prophet', 'muhammad', 'رسول', 'نبي', 'صلى', 'محمد')) {
    return isAr
      ? 'النبي محمد ﷺ أعظم إنسان عرفته البشرية. خلقه كان القرآن. كان:\n\n😊 يضحك ويمزح مع أصحابه\n🐱 حنون على الحيوانات والاطفال\n🙏 يقف الليل حتى تورمت قدماه\n🤲 يحب أمته ويرحمها\n💍 يعيش حياة متواضعة رغم قيادته\n\nقالت عائشة رضي الله عنها: "كان خلقه القرآن". درس عملي في الرحمة والصدق. نصلي عليه: اللهم صل على محمد.'
      : "Prophet Muhammad ﷺ is the greatest human to walk this earth. His character was the Quran in action:\n\n😊 He smiled and joked with companions\n🐱 He was gentle with animals and children\n🙏 He prayed until his feet swelled\n🤲 He deeply loved his community\n💍 He lived humbly despite leading a nation\n\nAishah said: 'His character was the Quran.' A living example of mercy, honesty, and integrity. Send blessings upon him: Allahumma salli ala Muhammad.";
  }

  if (m('ramadan', 'رمضان', 'fast', 'fasting', 'صوم', 'صيام')) {
    return isAr
      ? 'رمضان شهر القرآن والرحمة. فرصة عظيمة للتغيير:\n\n🎯 حدد أهداف واقعية (ختم القرآن، صلة الرحم)\n📖 اقرأ بالتفسير عشان التدبر\n🤝 تصدق ولو بالقليل يومياً\n🕌 حافظ على صلاة التراويح\n💪 بعد رمضان، حافظ على العادات الحلوة\n\nرمضان مو بس عن الطعام، هو مدرسة تدربنا على التقوى طوال السنة.'
      : "Ramadan is the month of the Quran and mercy. A golden chance for real change:\n\n🎯 Set realistic goals (Quran completion, charity, family ties)\n📖 Read with translation for reflection\n🤝 Give daily charity\n🕌 Pray taraweeh\n💪 After Ramadan, keep the good habits\n\nRamadan isn't just about food — it's a training ground for the whole year.";
  }

  if (m('hajj', 'umrah', 'حج', 'عمرة')) {
    return isAr
      ? 'الحج والعمرة رحلتان لله. الحج ركن الإسلام الخامس، والعمرة قربة عظيمة في أي وقت. الحج يجمع ملايين المسلمين على طاعة واحدة — منظر مهيب. أفضل ما في الحج: الوقوف بعرفة، قال النبي ﷺ: "الحج عرفة". أدعية مستجابة، قلوب خاشعة، ومغفرة بإذن الله.'
      : "Hajj and Umrah are journeys to Allah. Hajj gathers millions in one act of worship — a breathtaking sight. The Prophet ﷺ said: 'Hajj is Arafah' — standing at Arafah is its peak. Supplications answered, hearts humbled, and forgiveness by Allah's will. May Allah grant us all the opportunity.";
  }

  if (m('islam', 'muslim', 'إسلام', 'مسلم')) {
    return isAr
      ? 'الإسلام: الاستسلام لله وحده. خمسة أركان: الشهادتان، الصلاة، الزكاة، الصوم، الحج. وستة أركان إيمان: الإيمان بالله، الملائكة، الكتب، الرسل، اليوم الآخر، والقدر.\n\nالإسلام دين يجمع بين الروح والعقل — يدعوك للتفكر في الكون والخشوع للخالق. دين يعطيك غاية للحياة وأخلاقاً للتعامل.'
      : "Islam is submission to the will of Allah. Five pillars: Shahadah, Salah, Zakat, Sawm, Hajj. Six articles of faith: Allah, angels, books, messengers, the Last Day, divine decree.\n\nIslam blends spirituality and intellect — it invites you to reflect on the universe while staying grounded in worship. A way of life with purpose and meaning.";
  }

  if (m('death', 'die', 'afterlife', 'akhira', 'موت', 'آخرة', 'قبر', 'الموت')) {
    return isAr
      ? 'نعم، الموت حقيقة. "كل نفس ذائقة الموت". بس بدل ما نخاف منه، خلنا نستعد له. قال النبي ﷺ: "أكثروا ذكر هادم اللذات".\n\nالجنة والنار حق. واللي يحدد مصيرنا هو رحمة الله أولاً، ثم أعمالنا. الخبر الجميل: رحمة الله واسعة جداً. أحسن الظن بالله، اعمل الصالحات، واستغفر دائماً.'
      : "Death is real — 'Every soul will taste death.' But instead of fearing it, prepare for it. The Prophet ﷺ said: 'Remember often the destroyer of pleasures.'\n\nHeaven and Hell are real. What determines our fate is Allah's mercy first, then our deeds. The good news: His mercy is vast. Think well of Allah, do good, and always seek forgiveness.";
  }

  if (m('tawheed', 'توحيد')) {
    return isAr
      ? 'التوحيد هو أساس كل شيء. معناه: إفراد الله بالعبادة، الربوبية، الأسماء والصفات. "قل هو الله أحد، الله الصمد".\n\nالتوحيد هو الغاية التي خلقنا من أجلها. هو أول دعوة الرسل: "اعبدوا الله ما لكم من إله غيره". كل العبادات تدور حول هذا المفهوم العظيم.'
      : "Tawheed is the foundation of everything — the oneness of Allah in His lordship, worship, and names/attributes. 'Say: He is Allah, the One, Allah the Eternal.'\n\nIt's the very purpose of creation and the core message of every prophet. Everything in Islam revolves around this profound concept.";
  }

  if (m('hadith', 'حديث', 'sunnah', 'سنة')) {
    return isAr
      ? 'الحديث النبوي هو المصدر الثاني للتشريع بعد القرآن. أصح الكتب: صحيح البخاري ومسلم.\n\nمن الأحاديث اللي تجبر القلب:\n"لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه"\n"خيركم خيركم لأهله"\n"إنما الأعمال بالنيات"\n"اتق الله حيثما كنت وأتبع السيئة الحسنة تمحها وخالق الناس بخلق حسن"'
      : "Hadith is the second source of Islamic law after the Quran. The most authentic: Sahih Bukhari and Muslim.\n\nBeautiful hadiths:\n'None of you truly believes until he loves for his brother what he loves for himself'\n'The best of you are those who are best to their families'\n'Indeed, actions are judged by intentions'\n'Fear Allah wherever you are, follow a bad deed with a good one, and treat people with good character'";
  }

  if (m('science', 'scientific', 'physics', 'biology', 'chemistry', 'astronomy', 'علوم', 'علم', 'فيزياء', 'كيمياء')) {
    return isAr
      ? 'العلم هو نافذة على عظمة الخلق. كل ما نتعلم أكثر عن الكون، نزداد إدراكاً لعظمة الخالق. القرآن أشار لظواهر علمية قبل قرون — توسع الكون، دورة الماء، تطور الجنين.\n\nأي فرع علمي يثير فضولك؟ الفضاء، الذكاء الاصطناعي، الفيزياء الكمية — كلها مواضيع حلوة نتناقش فيها!'
      : "Science is a window into the marvels of creation. The more we learn, the more we appreciate the Creator's greatness. The Quran referenced natural phenomena centuries before discovery — the expanding universe, water cycle, embryonic development.\n\nWhat field interests you? Space? AI? Quantum physics? There's so much fascinating stuff to explore!";
  }

  if (m('history', 'تاريخ', 'civilization', 'حضارة', 'قديم')) {
    return isAr
      ? 'التاريخ مليء بالدروس والعبر. الحضارة الإسلامية كانت من أروع الحضارات — من الأندلس للهند، قدمت للعالم الجبر والطب والفلك.\n\nالخوارزمي وضع أسس الجبر (كلمة Algorithm أصلاً من اسمه!)\nابن سينا كتب القانون في الطب\nابن الهيثم اكتشف المنهج العلمي\n\nالحضارة الإسلامية حفظت علوم اليونان وطورتها. أي فترة تاريخية تهمك؟'
      : "History is packed with lessons! Islamic civilization was among the greatest — from Spain to India, giving the world algebra, medicine, and astronomy.\n\nAl-Khwarizmi founded algebra (the word Algorithm comes from his name!)\nIbn Sina wrote the Canon of Medicine\nIbn al-Haytham pioneered the scientific method\n\nWhat period fascinates you?";
  }

  if (m('computer', 'programming', 'code', 'software', 'app', 'developer', 'website', 'برمجة', 'حاسوب', 'تطبيق', 'مطور')) {
    return isAr
      ? 'عالم البرمجة عالم واسع وممتع! هالتطبيق مبني بـ React Native و TypeScript.\n\nإذا تبي تبدأ:\n🐍 Python — أفضل لغة للمبتدئين\n🌐 HTML + CSS + JavaScript — أساسيات الويب\n📱 React Native — لتطبيقات الموبايل\n\nالبرمجة تعلمك التفكير المنطقي وحل المشكلات. عندك فكرة تطبيق وتبي تسويها؟ احكي لي ونخطط سوا!'
      : "Programming is a creative and logical playground! This app is built with React Native and TypeScript.\n\nWant to start?\n🐍 Python — best for beginners\n🌐 HTML + CSS + JavaScript — web basics\n📱 React Native — mobile apps\n\nProgramming teaches you problem-solving and logical thinking. Got an app idea? Let's talk about it!";
  }

  if (m('health', 'exercise', 'diet', 'fitness', 'workout', 'gym', 'صحة', 'رياضة', 'حمية', 'جيم', 'تمارين')) {
    return isAr
      ? 'الصحة هي تاج على رؤوس الأصحاء! لجسدك عليك حق — قال النبي ﷺ: "اغتنم خمساً قبل خمس: صحتك قبل سقمك".\n\nنصائح بسيطة:\n🏃‍♂️ ٣٠ دقيقة مشي يومياً\n🥗 أكل متوازن — تمر، زيتون، خضار\n💧 ٨ أكواب ماء\n😴 نوم ٧-٨ ساعات\n🧘‍♂️ ذكر واستغفار عشان راحة البال\n\nالسر في الاستمرارية، ليس في الكمال.'
      : "Health is a crown on healthy heads! Your body has a right over you. The Prophet ﷺ said: 'Take advantage of five before five: your health before sickness.'\n\nSimple tips:\n🏃‍♂️ 30 min walk daily\n🥗 Balanced diet — dates, olives, veggies\n💧 8 glasses of water\n😴 7-8 hours sleep\n🧘‍♂️ Dhikr for peace of mind\n\nThe secret is consistency, not perfection.";
  }

  if (m('study', 'exam', 'school', 'university', 'student', 'study tips', 'focus', 'exam tips', 'دراسة', 'امتحان', 'جامعة', 'مدرسة', 'تعلم', 'مذاكرة')) {
    return isAr
      ? 'الدراسة رحلة، والله يبارك لك فيها. نصائح عملية:\n\n⏰ خلي دراستك ٢٥ دقيقة وراحة ٥ دقائق (تقنية بومودورو)\n📝 راجع خلال ٢٤ ساعة من أول مرة تدرس\n🧠 علّم غيرك — أثبت طريقة للفهم\n📱 أبعد الجوال\n🤲 قل "رب زدني علماً"\n\nالأهم: توكل على الله واجتهد. النتيجة بيد الله، لكن الجهد بيدك.'
      : "Studying is a journey. Practical tips:\n\n⏰ Study in 25-min blocks with 5-min breaks (Pomodoro technique)\n📝 Review within 24 hours of first learning\n🧠 Teach someone else — it's the best way to truly learn\n📱 Put your phone away\n🤲 Make dua: 'Rabbi zidni ilma'\n\nTrust Allah and do your best. The result is in His hands, but the effort is yours.";
  }

  if (m('food', 'cook', 'recipe', 'eating', 'اكل', 'طبخ', 'وصفة', 'طعام', 'أكل')) {
    return isAr
      ? 'الطعام من نعم الله الكبيرة! دائماً ابدأ بسم الله واختتم بالحمد لله. قال النبي ﷺ: "ما ملأ ابن آدم وعاء شراً من بطنه." — يعني لا تسرف.\n\nالتمر، الزيتون، التين، العسل، الرمان — كلها مذكورة في القرآن ومفيدة جداً. عندك أكلة مفضلة؟ شاركني!'
      : "Food is one of Allah's greatest blessings! Start with Bismillah and end with Alhamdulillah. The Prophet ﷺ said: 'The son of Adam fills no vessel worse than his stomach.'\n\nDates, olives, figs, honey, pomegranates — all mentioned in the Quran and packed with nutrition. Got a favorite dish? Share with me!";
  }

  if (m('work', 'job', 'career', 'business', 'entrepreneur', 'عمل', 'وظيفة', 'مهنة', 'مشروع')) {
    return isAr
      ? '"إن الله يحب إذا عمل أحدكم عملاً أن يتقنه" — قالها النبي ﷺ.\n\nنصائح مهنية:\n💎 كن صادقاً وأميناً — هذي هي سمعتك\n🙏 حافظ على صلاتك حتى في ضغط العمل\n🎯 حدد أهدافك بوضوح\n📚 استمر في التعلم\n🤝 عامل زملاءك بإحسان\n\nإذا تبي تستشير في قرار مهني، صل استخارة. أنا هنا أساعدك.'
      : "'Allah loves that when one of you does a job, he does it perfectly' — Prophet Muhammad ﷺ.\n\nCareer tips:\n💎 Be honest — your integrity is your reputation\n🙏 Never compromise your prayers\n🎯 Set clear goals\n📚 Keep learning\n🤝 Treat colleagues with respect\n\nFacing a big decision? Pray istikhara. I'm here if you want to talk it through.";
  }

  if (m('money', 'finance', 'wealth', 'debt', 'investment', 'budget', 'مال', 'فلوس', 'دين', 'ربا', 'ميزانية')) {
    return isAr
      ? 'المال فتنة واختبار. "ولا تجعل يدك مغلولة إلى عنقك ولا تبسطها كل البسط" (الإسراء ٢٩) — التوازن هو المفتاح.\n\nمبادئ:\n💰 كسب حلال أهم من كثرته\n🚫 تجنب الربا\n🤲 أخرج زكاتك\n📊 خطط ميزانيتك\n💪 سدد ديونك ولا تتعجل\n\nالبركة في المال أهم من المبلغ نفسه.'
      : "Wealth is a test. 'And do not make your hand tied to your neck nor stretch it to its utmost reach' (17:29) — balance is key.\n\nPrinciples:\n💰 Halal earning matters more than quantity\n🚫 Avoid riba (interest)\n🤲 Pay zakat\n📊 Budget wisely\n💪 Pay off debts gradually\n\nBlessing (barakah) in your money matters more than the amount.";
  }

  if (m('parent', 'mother', 'father', 'mom', 'dad', 'أم', 'أب', 'والد', 'والدين')) {
    return isAr
      ? 'بر الوالدين من أعظم القربات لله. "وقضى ربك ألا تعبدوا إلا إياه وبالوالدين إحساناً" (الإسراء ٢٣).\n\nالنبي ﷺ قال: "الجنة تحت أقدام الأمهات". رقة الأم، كرامة الأب — كلهم يستحقون أحسن معاملة. حتى لو اختلفت معهم، ابق محسناً. "رب ارحمهما كما ربياني صغيراً".'
      : "Honoring parents is among the greatest deeds. 'And your Lord has decreed that you worship none but Him and that you be dutiful to your parents' (17:23).\n\nThe Prophet ﷺ said: 'Paradise lies at the feet of mothers.' A mother's tenderness, a father's dignity — both deserve our best. Even when you disagree, remain kind. 'My Lord, have mercy upon them as they brought me up.'";
  }

  if (m('love', 'relationship', 'marriage', 'nikah', 'husband', 'wife', 'حب', 'زواج', 'نكاح', 'زوج', 'زوجة', 'ارتباط')) {
    return isAr
      ? 'الحب في الإسلام شي جميل إذا كان بالحلال. "وجعل بينكم مودة ورحمة" (الروم ٢١). المودة مش بس حب — هي العشرة الطيبة والاحترام.\n\nنصائح:\n🤲 صل استخارة قبل أي قرار كبير\n👨‍👩‍👧‍👧 أشرك أهلك\n💬 التواصل الصادق أساس أي علاقة\n🙏 حافظ على حدود الله — البركة في الحلال\n\nالعلاقة الناجحة مبنيّة على الاحترام والتفاهم قبل كل شي.'
      : "Love in Islam is beautiful when kept halal. 'He placed between you affection and mercy' (30:21).\n\nTips:\n🤲 Pray istikhara before big decisions\n👨‍👩‍👧‍👧 Involve your family\n💬 Honest communication is the foundation\n🙏 Keep Allah's boundaries — barakah is in halal\n\nA successful relationship is built on respect and understanding above all.";
  }

  if (m('children', 'kids', 'baby', 'parenting', 'طفل', 'أطفال', 'ولد', 'تربية', 'أمومة')) {
    return isAr
      ? 'الأطفال أمانة من الله. "المال والبنون زينة الحياة الدنيا" (الكهف ٤٦).\n\nالتربية بالقدوة أفضل من الكلام:\n😊 عاملهم بحب ولين\n📖 علمهم عن الله بلطف مش تخويف\n🙏 كن أنت القدوة اللي تبي تشوفها فيهم\n🤲 ادع لهم بالصلاح دائماً\n\nكان النبي ﷺ يمر على الأطفال ويسلم عليهم ويمسح رؤوسهم. القدوة الحسنة تترك أثراً لا يمحى.'
      : "Children are a trust from Allah. 'Wealth and children are the adornment of this worldly life' (18:46).\n\nThe best parenting is by example:\n😊 Treat them with love and gentleness\n📖 Teach them about Allah with kindness, not fear\n🙏 Be the role model you want them to see\n🤲 Always pray for their righteousness\n\nThe Prophet ﷺ would greet children and pat their heads. Your example leaves a lasting mark.";
  }

  if (m('patience', 'sabr', 'صبر')) {
    return isAr
      ? 'الصبر نصف الإيمان. "إن الله مع الصابرين" (البقرة ١٥٣).\n\nثلاثة أنواع:\n🕌 صبر على الطاعة — الاستمرار رغم الكسل\n🚫 صبر عن المعصية — ترك الحرام رغم الرغبة\n❤️ صبر على البلاء — الرضا بقضاء الله\n\nوتذكر: "فإن مع العسر يسراً، إن مع العسر يسراً" — كررها مرتين، يعنيها الله بكثرة. الفرج قريب.'
      : "Patience (sabr) is half of faith. 'Indeed Allah is with the patient' (2:153).\n\nThree types:\n🕌 Patience in worship — consistency despite laziness\n🚫 Patience from sin — leaving what's forbidden\n❤️ Patience through trials — accepting Allah's decree\n\nAnd remember: 'With hardship comes ease, with hardship comes ease' — repeated twice, emphasizing certainty. Relief is near.";
  }

  if (m('grateful', 'gratitude', 'thankful', 'شكر', 'حمد', 'شاكر')) {
    return isAr
      ? '"لئن شكرتم لأزيدنكم" (إبراهيم ٧). الله يعد بالزيادة لمن يشكر. تخيل — كل شكر يزيدك خير!\n\n💡 جرب تكتب ٣ أشياء تشكر الله عليها كل يوم\n😊 قل الحمد لله بصدق طوال اليوم\n👀 ركز على النعم مش على النواقص\n\nكان النبي ﷺ يقوم الليل حتى تورمت قدماه شكراً لله. الشكر يجعل حياتك أخف وأسعد.'
      : "'If you are grateful, I will surely increase you' (14:7) — Allah promises more to those who give thanks.\n\n💡 Write 3 things you're grateful for daily\n😊 Say Alhamdulillah with sincerity throughout the day\n👀 Focus on what you have, not what you lack\n\nThe Prophet ﷺ would pray until his feet swelled in gratitude. Gratitude literally rewires your brain for happiness.";
  }

  if (m('motivate', 'motivation', 'inspire', 'goal', 'dream', 'تحفيز', 'تشجيع', 'هدف', 'حلم')) {
    return isAr
      ? 'أنت أقوى مما تظن. قال النبي ﷺ: "احرص على ما ينفعك، واستعن بالله ولا تعجز."\n\n💡 ابدأ صغير — خطوة واحدة اليوم أفضل من خطة كبيرة بكره\n📝 اكتب أهدافك\n🤲 استعن بالله\n🚶‍♂️ خذ خطوة ولو صغيرة\n🏆 احتفل بكل إنجاز\n\nماضيك لا يحدد مستقبلك. كل يوم فرصة جديدة. ما الذي تريد تحقيقه؟'
      : "You're stronger than you think. The Prophet ﷺ said: 'Strive for that which benefits you, seek help from Allah, and do not be helpless.'\n\n💡 Start small — one step today beats a grand plan for tomorrow\n📝 Write down your goals\n🤲 Seek Allah's help\n🚶‍♂️ Take one step, however small\n🏆 Celebrate every win\n\nYour past doesn't define your future. Every day is a fresh start. What do you want to achieve?";
  }

  if (m('tawakkul', 'trust allah', 'توكل')) {
    return isAr
      ? 'التوكل: اعقلها وتوكل. النبي ﷺ قالها — اربط ناقتك وبعدين توكل. معناها: خذ بالأسباب أولاً، وبعدين ترك النتيجة لله.\n\nالتوكل مش استسلام — هو بذل الجهد مع الثقة بالله. سو اللي عليك، وارضَ بالنتيجة. خطة الله دائماً أحسن من خطتك، حتى لو ما فهمتها الحين.'
      : "Tawakkul: tie your camel, then trust in Allah. The Prophet ﷺ said exactly that — take action first, then leave the outcome to Allah.\n\nIt's not passivity — it's doing your best while trusting Allah. Do what you can, then be at peace with the result. Allah's plan is always better than yours, even when you don't see it yet.";
  }

  if (m('neighbor', 'جار', 'جيران')) {
    return isAr
      ? 'حسن الجوار من علامات الإيمان. "ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه" (البخاري).\n\n😊 سلم على جارك\n🍲 شاركه الطعام\n🤝 تعاهده\n🚫 لا تؤذيه\n\nالجار له حق ولو كان غير مسلم. هذه أخلاق الإسلام الحقيقية.'
      : "Good treatment of neighbors is a sign of faith. 'Jibril kept advising me about the neighbor until I thought he would make him an heir' (Bukhari).\n\n😊 Greet your neighbor\n🍲 Share food\n🤝 Check on them\n🚫 Don't cause harm\n\nA neighbor has rights even if they're not Muslim. This is the true character of Islam.";
  }

  if (m('mental health', 'therapy', 'counseling', 'psychological', 'صحة نفسية', 'علاج نفسي', 'أخصائي')) {
    return isAr
      ? 'الصحة النفسية مهمة جداً. "ألا بذكر الله تطمئن القلوب" (الرعد ٢٨). لكن أيضاً استشارة المختصين شي طبيعي ومطلوب.\n\nاللي تبغى تعرفه:\n✔️ طلب المساعدة المهنية قوة، مش ضعف\n✔️ النبي ﷺ نفسه مر بأوقات حزن\n✔️ صحتك النفسية أمانة\n✔️ ما في عيب في المشاعر السلبية\n\nاهتم بنفسك، كلم اللي تثق فيهم، حافظ على صلاتك، وإذا احتجت مختص لا تتردد.'
      : "Mental health matters deeply. 'Verily, in the remembrance of Allah do hearts find rest' (13:28). But seeking professional help is also natural and important.\n\nKey things:\n✔️ Seeking help is strength, not weakness\n✔️ The Prophet ﷺ himself experienced moments of sadness\n✔️ Your mental health is an amanah (trust)\n✔️ Negative emotions are normal\n\nTake care of yourself, talk to people you trust, maintain your prayers, and don't hesitate to see a professional if needed.";
  }

  if (m('women', 'woman', 'female', 'girl', 'امرأة', 'نساء', 'بنت', 'فتاة')) {
    return isAr
      ? 'الإسلام كرم المرأة وأعطاها حقوقها الكاملة قبل ١٤٠٠ سنة:\n\n💰 حق الملكية والتصرف بمالها\n📚 حق التعليم\n🤝 حق اختيار الزوج\n🏠 حق الميراث\n\nالنبي ﷺ قال: "النساء شقائق الرجال." خديجة كانت سيدة أعمال، عائشة عالمة حديث، فاطمة قدوة التقوى.\n\nالممارسات الثقافية اللي تظلم المرأة هي ضد تعاليم الإسلام.'
      : "Islam elevated women's status 1400 years ago:\n\n💰 Right to own property and manage wealth\n📚 Right to education\n🤝 Right to choose a spouse\n🏠 Right to inheritance\n\nThe Prophet ﷺ said: 'Women are the twin halves of men.' Khadijah was a businesswoman, Aisha a scholar, Fatimah a role model.\n\nCultural practices that oppress women go against Islamic teachings.";
  }

  if (m('hijab', 'حجاب')) {
    return isAr
      ? 'الحجاب رحلة شخصية بين المرأة وربها. "وقل للمؤمنات يغضضن من أبصارهن ويحفظن فروجهن ولا يبدين زينتهن" (النور ٣١).\n\nالكثير من الأخوات يصفن الحجاب بالتحرر — تحرر من الحكم على المظهر، واحترام على أساس العقل والشخصية.\n\nإذا تفكرين فيه، خذي خطوة بثقة. رحلتك مع الله، وهو معك.'
      : "Hijab is a personal journey between a woman and her Creator. 'And tell the believing women to lower their gaze and guard their private parts and not expose their adornment' (24:31).\n\nMany sisters describe hijab as liberating — being judged for your mind and character, not your appearance.\n\nIf you're considering it, take the step with confidence. It's your journey with Allah.";
  }

  if (m('jihad', 'جهاد')) {
    return isAr
      ? 'الجهاد في الإسلام يعني "الجهد"، مش "الحرب". الجهاد الأكبر هو جهاد النفس — مقاومة الهوى، الصبر، التحكم في الغضب.\n\nالجهاد يمكن أن يكون:\n📖 طلب العلم\n💰 الصدقة\n😊 الابتسامة\n🤝 الأمر بالمعروف\n\nقال النبي ﷺ: "رجعنا من الجهاد الأصغر إلى الجهاد الأكبر." الإسلام يحرم قتل المدنيين والاعتداء.'
      : "Jihad literally means 'struggle' — not 'war.' The greater jihad is the spiritual struggle against your own ego — resisting temptation, being patient, controlling anger.\n\nJihad can be:\n📖 Seeking knowledge\n💰 Giving charity\n😊 Smiling\n🤝 Enjoining good\n\nThe Prophet ﷺ said: 'We have returned from the lesser jihad to the greater jihad.' Islam strictly prohibits killing civilians.";
  }

  if (m('arabic', 'عربي', 'learn arabic', 'تعلم', 'اللغة')) {
    return isAr
      ? 'اللغة العربية لغة القرآن، وهي من أجمل اللغات!\n\n📝 نصايح للتعلم:\n🔤 ابدأ بالحروف العربية\n📖 تعلم كلمات الصلاة والأذكار اليومية\n🎧 استمع للقرآن بتجويد\n🗣️ حاول تتكلم ولو كلمات بسيطة\n📱 استخدم تطبيق إيقان للكلمة بكلمة\n\nحتى ١٠ دقائق يومياً تصنع فرق كبير مع الوقت.'
      : "Arabic is the language of the Quran — one of the most beautiful languages!\n\n📝 Tips for learning:\n🔤 Start with the Arabic alphabet\n📖 Learn words from your daily prayers\n🎧 Listen to Quran recitation\n🗣️ Try speaking, even simple words\n📱 Use the Aiqan app's word-by-word feature\n\nEven 10 minutes daily makes a huge difference over time.";
  }

  if (m('weather', 'temperature', 'news', 'الطقس', 'الوقت', 'أخبار')) {
    return isAr
      ? 'للأسف ما عندي وصول للبيانات الحية حالياً. لكن أقدر أساعدك في أي موضوع ثاني! افتح الشاشة الرئيسية عشان تشوف الوقت والطقس.'
      : "I can't access live data right now, sorry! But I can help with anything else. Check your home screen for time and weather info.";
  }

  if (m('philosophy', 'meaning of life', 'existential', 'purpose', 'فلسفة', 'معنى الحياة', 'الوجود')) {
    return isAr
      ? 'سؤال عميق! عبر التاريخ، الفلاسفة والعلماء والأنبياء كلهم بحثوا عن معنى الحياة. في الإسلام، الجواب واضح وجميل: "وما خلقت الجن والإنس إلا ليعبدون" — غايتنا هي معرفة الله وعبادته. لكن المعنى أيضاً يكمن في: خدمة الآخرين، بناء شيء نافع، التعلم والنمو، الحب والعلاقات.\n\nكل إنسان عنده رسالة خاصة فيه. وش تحس أنت إنه هدفك في الحياة؟'
      : "Deep question! Throughout history, philosophers, scientists, and prophets have all explored life's meaning. In Islam, the answer is clear and beautiful: 'I did not create jinn and humans except to worship Me' — our purpose is knowing and worshipping Allah. But meaning also lies in: serving others, building something useful, learning and growing, love and relationships.\n\nEvery person has a unique calling. What do you feel your purpose is?";
  }

  if (m('programming', 'coding', 'javascript', 'python', 'typescript', 'react', 'app development', 'website', 'برمجة', 'كود', 'جافا', 'بيثون', 'تطوير')) {
    return isAr
      ? 'عالم البرمجة واسع وممتع! أقدر أساعدك في:\n\n💻 **أساسيات** — متغيرات، دوال، شروط، حلقات\n🌐 **تطوير ويب** — HTML, CSS, JavaScript, React\n📱 **تطبيقات موبايل** — React Native, Flutter\n🗄️ **قواعد بيانات** — SQL, MongoDB\n🤖 **ذكاء اصطناعي** — Machine Learning, APIs\n\nعندك سؤال محدد عن برمجة؟ أو تبي تبدأ في مجال معين؟ احكي لي!'
      : "Programming is vast and exciting! I can help with:\n\n💻 **Basics** — variables, functions, loops, conditions\n🌐 **Web Dev** — HTML, CSS, JavaScript, React\n📱 **Mobile Apps** — React Native, Flutter\n🗄️ **Databases** — SQL, MongoDB\n🤖 **AI/ML** — APIs, prompt engineering\n\nGot a specific coding question? Or want to start learning a stack? Let's talk!";
  }

  if (m('book', 'read', 'reading', 'novel', 'كتاب', 'قراءة', 'رواية', 'مكتبة')) {
    return isAr
      ? 'القراءة غذاء العقل! 📚\n\nمن الكتب اللي أنصح فيها:\n📖 **"الأخلاق والسير"** لابن حزم\n📖 **"مفاتيح الجنان"** — أدعية منتقاة\n📖 **"العادات الذرية"** لجيمس كلير — عن بناء العادات\n📖 **"قصة القرآن"** — رحلة ميسرة لفهم الوحي\n\nوش نوع الكتب اللي تحب تقرأها؟ أقدر أرشح لك عناوين بناءً على اهتماماتك!'
      : "Reading is food for the soul! 📚\n\nBooks I'd recommend:\n📖 **'Atomic Habits'** by James Clear — life-changing habit building\n📖 **'The Alchemist'** by Paulo Coelho — a beautiful story about purpose\n📖 **'Reclaim Your Heart'** by Yasmin Mogahed — healing and growth\n📖 **'Sapiens'** by Yuval Noah Harari — the story of humanity\n\nWhat genres do you enjoy? I can tailor recommendations to your interests!";
  }

  if (m('hobby', 'hobbies', 'free time', 'fun', 'entertainment', 'هواية', 'هوايات', 'تسلية')) {
    return isAr
      ? 'الهوايات تريح النفس وتنشط العقل! من الهوايات المفيدة:\n\n✍️ **الكتابة** — يوميات، خواطر، تدوين\n🌱 **الزراعة** — حتى نبتة صغيرة تفرق\n🎨 **الرسم أو التصميم** — إبداع وتفريغ طاقة\n🏃 **المشي أو الرياضة** — صحة ونشاط\n📖 **القراءة** — عالم كامل بين دفتي كتاب\n🎧 **البودكاست** — تعلم وأنت تتنقل\n\nوش هي الهوايات اللي تحبها أو تبغى تجربها؟'
      : "Hobbies refresh the mind and soul! Great options:\n\n✍️ **Writing** — journaling, poetry, blogging\n🌱 **Gardening** — even a small plant makes a difference\n🎨 **Drawing/Design** — creative expression\n🏃 **Walking/Fitness** — health and energy\n📖 **Reading** — whole worlds between pages\n🎧 **Podcasts** — learn on the go\n\nWhat hobbies do you enjoy or want to try?";
  }

  if (m('nature', 'environment', 'planet', 'earth', 'tree', 'ocean', 'animal', 'طبيعة', 'بيئة', 'أرض', 'شجر', 'بحر', 'حيوان')) {
    return isAr
      ? 'الطبيعة آية من آيات الله! "وفي الأرض آيات للموقنين" (الذاريات ٢٠).\n\n🌿 تأمل في خلق الله: الجبال رواسي، البحار زاخرة بالحياة، السماء بلا عمد. الكون في توازن دقيق.\n\nالنظام البيئي مذهل — كل كائن له دور. النحل يلقح الأزهار، الغابات تنتج الأكسجين، المحيطات تنظم المناخ.\n\nأجمل مكان طبيعي زرته أو تحب تزوره؟'
      : "Nature is a sign of Allah! 'And on the earth are signs for those who are certain' (51:20).\n\n🌿 Reflect on creation: mountains as stabilizers, oceans teeming with life, the sky held without pillars. The ecosystem is perfectly balanced — every creature has a role.\n\nBees pollinate flowers, forests produce oxygen, oceans regulate climate. It's all connected.\n\nWhat's the most beautiful natural place you've visited or want to visit?";
  }

  if (m('self improvement', 'personal growth', 'better myself', 'change', 'habit', 'develop', 'goal setting', 'productivity', 'تحسين', 'تطوير ذات', 'تغيير', 'عادة', 'إنتاجية')) {
    return isAr
      ? 'التطوير الذاتي رحلة عمر! نصائح عملية:\n\n🎯 **قاعدة ١٪** — تحسن ١٪ كل يوم = ٣٧ مرة أفضل في السنة\n📝 **اكتب أهدافك** — الهدف المكتوب له قوة مختلفة\n⏰ **تقنية بومودورو** — ٢٥ دقيقة تركيز، ٥ راحة\n🙏 **الاستغفار والذكر** — يفتح أبواب البركة\n👥 **اصحب من يدفعك للأمام** — البيئة تصنع الفرق\n\nالسر: الاستمرارية، لا الكمال. خطوة صغيرة اليوم أفضل من خطة ضخمة بكرة.\n\nوش أول عادة نفس تغيرها في حياتك؟'
      : "Personal growth is a lifelong journey! Practical tips:\n\n🎯 **The 1% Rule** — improve 1% daily = 37x better in a year\n📝 **Write your goals** — written goals have power\n⏰ **Pomodoro Technique** — 25min focus, 5min break\n🙏 **Daily dhikr** — opens doors of barakah\n👥 **Surround yourself with growth-minded people** — environment is everything\n\nThe secret: consistency, not perfection. One small step today beats a grand plan tomorrow.\n\nWhat's the first habit you want to change?";
  }

  if (m('social media', 'instagram', 'tiktok', 'twitter', 'facebook', 'screen time', 'phone addiction', 'وسائل التواصل', 'انستغرام', 'تيك توك', 'تواصل', 'إدمان')) {
    return isAr
      ? 'أتفهمك! وسائل التواصل سلاح ذو حدين. فوائدها: تواصل مع الأهل، فرص تعلم، مصدر رزق. لكن الإدمان عليها مضرة.\n\nنصائح للاستخدام المتوازن:\n⏱️ حدد وقت محدد يومياً\n🔇 أوقف الإشعارات (هذي مدمرة للتركيز)\n📱 استخدم مؤقت التطبيقات\n🚫 خلى الجوال برا غرفة النوم\n🎯 اسأل نفسك: هل هذا مفيد ولا مجرد عادة؟\n\nالهدف مو قطعها بالكامل، لكن التحكم فيها بدل ما تتحكم فيك.'
      : "I hear you! Social media is a double-edged sword. Benefits: staying connected, learning opportunities, income sources. But addiction is real.\n\nTips for balanced use:\n⏱️ Set a daily time limit\n🔇 Turn off notifications (they destroy focus)\n📱 Use app timers\n🚫 Keep phone out of the bedroom\n🎯 Ask: is this useful or just habit?\n\nThe goal isn't quitting completely — it's being in control instead of controlled.";
  }

  // ── NEW TOPICS ──

  if (m('music', 'song', 'nasheed', 'أنشودة', 'أغنية', 'موسيقى', 'نشيد')) {
    return isAr
      ? 'الموسيقى والأناشيد موضوع واسع. في الإسلام، العلماء اختلفوا في حكم الموسيقى. الأغلب يرون أن الآلات الموسيقية محرمة، والأناشيد بدون آلات جائزة. لكن كل إنسان عنده قناعته.\n\nالأناشيد الإسلامية فيها خير كثير — رفع للهمة، تذكير بالله. أنصح بقناة "أناشيد الرحمة" أو منشدي: سامي يوسف، معن عبّود، وغيرهم.\n\nوش نوع الموسيقى أو الأناشيد اللي تعجبك؟'
      : "Music and nasheeds cover a wide spectrum. In Islam, scholars differ on music. Most agree that musical instruments are impermissible, while nasheeds (acapella) are permissible. Everyone has their own conviction.\n\nIslamic nasheeds can be uplifting and inspiring. I'd recommend exploring different styles and finding what brings you closer to Allah.\n\nWhat kind of music or nasheeds do you enjoy?";
  }

  if (m('sport', 'football', 'soccer', 'basketball', 'tennis', 'athlete', 'game', 'team', 'كرة', 'رياضة', 'ملعب', 'رياضي')) {
    return isAr
      ? 'الرياضة صحة وطاقة إيجابية! النبي ﷺ شجع على الرياضة — "علموا أولادكم السباحة والرماية وركوب الخيل".\n\n⚽ كرة القدم أكثر رياضة شعبية\n🏀 كرة السلة\n🎾 التنس\n🏃 الجري\n🏋️ رفع الأثقال\n\nالرياضة تعلم الانضباط والعمل الجماعي. وش الرياضة المفضلة عندك؟ وهل تشجع أي نادي أو منتخب؟'
      : "Sports are great for health and positive energy! The Prophet ﷺ encouraged sports — 'Teach your children swimming, archery, and horse riding.'\n\n⚽ Football/soccer is the most popular sport worldwide\n🏀 Basketball\n🎾 Tennis\n🏃 Running\n🏋️ Weightlifting\n\nSports teach discipline and teamwork. What's your favorite sport? Any team you support?";
  }

  if (m('ai', 'artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'llm', 'neural network', 'ذكاء اصطناعي', 'تعلم آلة')) {
    return isAr
      ? 'الذكاء الاصطناعي من أسرع المجالات تطوراً! باختصار:\n\n🧠 **التعلم العميق** — شبكات عصبية تحاكي الدماغ\n📝 **LLMs** — نماذج لغوية مثل GPT و Gemini تفهم وتكتب\n🎨 **توليد الصور** — DALL-E, Midjourney\n🔬 **تطبيقات طبية** — تشخيص الأمراض\n\nالموضوع كبير ومثير! أقدر أشرح لك أي جزء بالتفصيل. هل عندك سؤال معين عن AI؟'
      : "AI is one of the fastest-evolving fields! In a nutshell:\n\n🧠 **Deep Learning** — neural networks inspired by the brain\n📝 **LLMs** — language models like GPT and Gemini that understand and write\n🎨 **Image Generation** — DALL-E, Midjourney\n🔬 **Medical AI** — disease diagnosis\n\nIt's a huge and fascinating field! I can explain any part in detail. Got a specific AI question?";
  }

  if (m('space', 'universe', 'galaxy', 'star', 'planet', 'moon', 'solar system', 'nasa', 'spacex', 'فضاء', 'كون', 'نجم', 'كوكب', 'مجرة')) {
    return isAr
      ? 'الكون مذهل! "إن في خلق السموات والأرض لآيات لأولي الألباب" (آل عمران ١٩٠).\n\n🌌 **الكون يتوسع** — وهذا ذكره القرآن قبل ١٤٠٠ سنة!\n🪐 **المجموعة الشمسية** — ٨ كواكب\n🌟 **المجرات** — أكثر من ٢٠٠ مليار مجرة\n🔭 **الثقوب السوداء** — أغرب ما في الكون\n\nالكون يسعنا ويسع عظمة خالقه. وش يثير فضولك في الفضاء؟'
      : "The universe is mind-blowing! 'Indeed, in the creation of the heavens and the earth are signs for those of understanding' (3:190).\n\n🌌 **The universe is expanding** — mentioned in the Quran 1400 years ago!\n🪐 **Solar system** — 8 planets\n🌟 **Galaxies** — over 200 billion\n🔭 **Black holes** — the strangest phenomena\n\nThe universe contains us and the greatness of its Creator. What space topic fascinates you?";
  }

  if (m('animal', 'pet', 'cat', 'dog', 'bird', 'horse', 'fish', 'lion', 'حيوان', 'قطة', 'كلب', 'عصفور', 'حصان', 'سمك', 'أسد')) {
    return isAr
      ? 'الحيوانات عالم رائع! "وما من دابة في الأرض ولا طائر يطير بجناحيه إلا أمم أمثالكم" (الأنعام ٣٨).\n\n🐱 القطط — النبي ﷺ كان حنون مع القطط\n🐕 الكلاب — جائز للحراسة والصيد\n🐎 الخيول — ورد فضلها في القرآن\n🐦 الطيور — في كل مكان آية\n\nالرفق بالحيوان من الإيمان. عندك حيوان أليف؟ حدثني عنه!'
      : "Animals are a wonderful world! 'There is no creature on earth nor bird that flies with its wings except communities like you' (6:38).\n\n🐱 Cats — the Prophet ﷺ was gentle with cats\n🐕 Dogs — permissible for guarding and hunting\n🐎 Horses — their virtue is mentioned in the Quran\n🐦 Birds — signs of Allah everywhere\n\nKindness to animals is part of faith. Do you have a pet? Tell me about it!";
  }

  if (m('politics', 'government', 'president', 'election', 'democracy', 'سياسة', 'حكومة', 'انتخابات', 'رئيس')) {
    return isAr
      ? 'السياسة مجال واسع. الإسلام يوجهنا للعدل والشورى: "وأمرهم شورى بينهم" (الشورى ٣٨).\n\nالمسلم مطالب بأن يكون عادلًا أمينًا في أي نظام سياسي يعيش فيه. أهم شيء: نصوت بضمير، نشارك بإيجابية، ولا ننسى أن العدل أساس الحكم.\n\nعندك سؤال عن موضوع سياسي معين؟'
      : "Politics is a broad field. Islam guides us toward justice and consultation: 'And their affairs are conducted by mutual consultation' (42:38).\n\nA Muslim should be just and honest in any political system they live in. Key things: vote with conscience, participate positively, and remember that justice is the foundation of governance.\n\nGot a specific political topic in mind?";
  }

  if (m('cooking', 'recipe', 'kitchen', 'bake', 'chef', 'طبخ', 'وصفة', 'مطبخ', 'طباخ')) {
    return isAr
      ? 'الطبخ فن وعلم! ما أجمل رائحة الأكل في البيت!\n\n🍳 من أطباقي المفضلة:\n🥘 **المندي** — لحم وأرز بنكهة الفحم\n🥟 **السمبوسة** — مقرمشة ولذيذة\n🍲 **الشوربة** — العدس أو الطماطم\n🧁 **الكعك والمعمول** — حلى العيد\n\nعندك وصفة مفضلة حاب تشاركها؟ أو تحتاج وصفة معينة؟'
      : "Cooking is both an art and a science! Nothing beats the smell of home cooking!\n\n🍳 Some favorites:\n🥘 **Mandi** — spiced meat and rice with charcoal flavor\n🥟 **Samosas** — crispy and delicious\n🍲 **Soups** — lentil or tomato\n🧁 **Ma'amoul** — date-filled cookies for Eid\n\nGot a favorite recipe to share? Or need a specific recipe?";
  }

  if (m('photography', 'photo', 'camera', 'تصوير', 'كاميرا', 'صورة')) {
    return isAr
      ? 'التصوير فن رائع! التقط لحظة، احفظ ذاكرة.\n\n📸 نصائح للتصوير بهاتفك:\n☀️ استخدم الإضاءة الطبيعية\n📐 اتبع قاعدة التثليث\n🎯 ركز على نقطة واحدة\n✨ جرب الزوايا المختلفة\n🖼️ نظف عدسة الكاميرا أولاً!\n\nوش تحب تصور؟ مناظر طبيعية، بورتريهات، طعام؟'
      : "Photography is an amazing art! Capture a moment, preserve a memory.\n\n📸 Phone photography tips:\n☀️ Use natural light\n📐 Follow the rule of thirds\n🎯 Focus on one subject\n✨ Try different angles\n🖼️ Clean your lens first!\n\nWhat do you like to photograph? Landscapes, portraits, food?";
  }

  if (m('garden', 'plant', 'tree', 'flower', 'زراعة', 'نبات', 'شجرة', 'وردة', 'حديقة')) {
    return isAr
      ? 'الزراعة عبادة! قال النبي ﷺ: "ما من مسلم يغرس غرساً إلا كان له صدقة".\n\n🌱 نصائح للمبتدئين:\n🌿 ابدأ بنباتات سهلة (صبار، ريحان، نعناع)\n💧 لا تكثر من الماء — الجذور تحتاج تتنفس\n☀️ ضع النبات في مكان مناسب للضوء\n🌱 استخدم تربة جيدة\n\nالنباتات تريح النفس وتذكرنا بعظمة الخالق. عندك نباتات في البيت؟'
      : "Gardening is worship! The Prophet ﷺ said: 'Whenever a Muslim plants a tree, it is charity for him.'\n\n🌱 Tips for beginners:\n🌿 Start with easy plants (succulents, basil, mint)\n💧 Don't overwater — roots need to breathe\n☀️ Place in suitable light\n🌱 Use good soil\n\nPlants calm the soul and remind us of the Creator's greatness. Do you have plants at home?";
  }

  if (m('sleep', 'insomnia', 'dream', 'nap', 'nightmare', 'نوم', 'أرق', 'حلم', 'كابوس', 'منام')) {
    return isAr
      ? 'النوم آية من آيات الله. "وجعلنا نومكم سباتاً" (النبأ ٩).\n\n💤 نصائح لنوم هادئ:\n😴 أذكار النوم تطرد الشيطان\n📱 أبعد الجوال قبل النوم بنصف ساعة\n🌙 أطفئ الأنوار — الظلام يحفز الميلاتونين\n🧘‍♂️ تنفس عميق ٤-٧-٨ (شهيق ٤، حبس ٧، زفير ٨)\n☕ تجنب الكافيين بعد العصر\n\nالنوم الجيد نصف الصحة. تعاني من الأرق؟ جرب أذكار النوم.'
      : "Sleep is a sign of Allah. 'And We made your sleep a rest' (78:9).\n\n💤 Tips for better sleep:\n😴 Bedtime athkar repel shaytan\n📱 No screens 30 min before bed\n🌙 Keep it dark — melatonin needs darkness\n🧘‍♂️ 4-7-8 breathing (inhale 4, hold 7, exhale 8)\n☕ No caffeine after afternoon\n\nGood sleep is half your health. Struggling with insomnia? Try the bedtime athkar.";
  }

  if (m('dream', 'interpret', 'dream interpretation', 'tafsir', 'تفسير الأحلام', 'حلم', 'رؤيا', 'تفسير')) {
    return isAr
      ? 'الرؤى والأحلام جزء من النبوة. قال النبي ﷺ: "الرؤيا الصالحة جزء من ستة وأربعين جزءاً من النبوة".\n\nثلاثة أنواع:\n🤲 رؤيا من الله — بشرى أو إرشاد\n😟 حلم من الشيطان — يخوّف ويحزن\n💭 حديث نفس — من التفكير اليومي\n\nللرؤيا الصالحة: احمد الله وشاركها مع من تحب.\nللحلم المزعج: استعذ بالله من الشيطان، غيّر جانب نومك، ولا تشاركه.\n\nتفسير الأحلام علم دقيق. الأحلام غالباً تكون حديث نفس.'
      : "Dreams and visions are part of prophethood. The Prophet ﷺ said: 'Good dreams are one of forty-six parts of prophethood.'\n\nThree types:\n🤲 A vision from Allah — glad tidings or guidance\n😟 A nightmare from shaytan — to frighten and sadden\n💭 Self-talk — from daily thoughts\n\nFor good dreams: praise Allah, share with loved ones.\nFor bad dreams: seek refuge in Allah, change sleeping position, don't share.\n\nDream interpretation is a precise science. Most dreams are just self-talk.";
  }

  if (m('time management', 'schedule', 'planning', 'organize', 'إدارة وقت', 'جدول', 'تخطيط', 'تنظيم')) {
    return isAr
      ? 'الوقت هو الحياة! "والعصر إن الإنسان لفي خسر" (العصر).\n\n⏰ نصائح:\n📝 قاعدة ٢-دقيقة: إذا المهمة تأخذ أقل من دقيقتين، اسويها حالاً\n🎯 حدد أهم ٣ مهام كل يوم\n📅 استخدم تقويم أو Planner\n🚫 تعلم تقول "لا" للأشياء غير المهمة\n⏱️ جرب تقنية بومودورو: ٢٥ دقيقة عمل، ٥ راحة\n\nالسر: التخطيط يسبق التنفيذ. ١٠ دقائق تخطيط يومي توفر ساعات.'
      : "Time is life! 'By time, indeed mankind is in loss' (103).\n\n⏰ Tips:\n📝 The 2-minute rule: if it takes <2 min, do it now\n🎯 Pick your top 3 tasks daily\n📅 Use a calendar or planner\n🚫 Learn to say no to non-essentials\n⏱️ Try Pomodoro: 25min work, 5min break\n\nThe secret: planning before execution. 10min of daily planning saves hours.";
  }

  if (m('friend', 'friendship', 'companion', 'صحبة', 'صداقة', 'صديق')) {
    return isAr
      ? 'الصحبة الصالحة كنز! قال النبي ﷺ: "المرء على دين خليله، فلينظر أحدكم من يخالل."\n\n💡 نصائح لاختيار الأصدقاء:\n🤝 ابحث عن الصادق الأمين\n🙏 من يذكرك بالله إذا نسيت\n📈 من يدفعك للأمام وليس للخلف\n💬 من تستمع له ويستمع لك\n\nقالوا: "الصاحب ساحب." البيئة الصالحة تصنع الإنسان. أحط نفسك باللي يرفعونك.'
      : "Good company is treasure! The Prophet ﷺ said: 'A person follows the religion of his close friend, so let each of you look at who he takes as a close friend.'\n\n💡 Tips for choosing friends:\n🤝 Seek honesty and trustworthiness\n🙏 Someone who reminds you of Allah\n📈 Someone who pushes you forward\n💬 Someone who listens and you listen to\n\n'You are the company you keep.' Good environment makes the person. Surround yourself with those who elevate you.";
  }

  if (m('success', 'achievement', 'accomplish', 'win', 'winner', 'نجاح', 'إنجاز', 'تفوق', 'نجحت')) {
    return isAr
      ? 'النجاح رحلة مو وجهة. قال النبي ﷺ: "احرص على ما ينفعك، واستعن بالله ولا تعجز."\n\n🔑 م keys النجاح:\n🎯 **وضوح الهدف** — تعرف تبي إيش\n📝 **تخطيط** — بدون خطة أنت تخطط للفشل\n🤲 **توكل على الله** — تسعى وتدعو\n💪 **استمرارية** — المثابرة تذلل الصعاب\n📚 **تعلم مستمر** — كل يوم شيء جديد\n\nعرفني وش النجاح بالنسبة لك؟ كل إنسان عنده تعريفه الخاص.'
      : "Success is a journey, not a destination. The Prophet ﷺ said: 'Strive for what benefits you, seek help from Allah, and do not be helpless.'\n\n🔑 Keys to success:\n🎯 **Clear vision** — know what you want\n📝 **Planning** — without it you're planning to fail\n🤲 **Tawakkul** — strive then trust Allah\n💪 **Consistency** — persistence overcomes obstacles\n📚 **Continuous learning** — something new daily\n\nTell me, what does success mean to you? Everyone has their own definition.";
  }

  // ── Specific prophets ──
  if (m('musa', 'moses', 'فرعون', 'موسى', 'بني إسرائيل', 'بنو إسرائيل', 'طور سيناء', 'عصا')) {
    return isAr
      ? 'موسى عليه السلام من أعظم الأنبياء وأكثرهم ذكراً في القرآن. أرسله الله لفرعون مصر الذي طغى وتجبر. من أبرز قصصه:\n\n👶 ولادته في عام قتل الأطفال — ألهم الله أمه أن تلقيه في اليم\n🏛️ نشأ في قصر فرعون\n🌿 هرب إلى مدين وعاش مع شعيب\n🔥 ناداه الله من الشجرة في وادي طوى\n🧑‍🦯🧑‍🦯 أيده الله بمعجزات: العصا (ثعبان) واليد البيضاء\n🌊 انفلاق البحر ونجاة بني إسرائيل وهلاك فرعون\n📜 تلقى التوراة\n\nقصته مليئة بالعبر: أن الله مع الصابرين، وأن العاقبة للمتقين.'
      : "Prophet Musa (Moses) is one of the greatest prophets, mentioned most in the Quran. He was sent to Pharaoh who had become tyrannical. Key moments:\n\n👶 Born during a genocide — Allah inspired his mother to cast him in the river\n🏛️ Raised in Pharaoh's own palace\n🌿 Fled to Madyan and lived with Shu'ayb\n🔥 Allah spoke to him from the burning bush\n🧑‍🦯🧑‍🦯 Miracles: staff turning into a serpent, shining hand\n🌊 Parting of the Red Sea\n📜 Received the Torah\n\nHis story teaches that Allah is with the patient, and the final victory belongs to the righteous.";
  }

  if (m('isa', 'jesus', 'المسيح', 'عيسى', 'ابن مريم', 'مريم', 'إنجيل')) {
    return isAr
      ? 'عيسى ابن مريم عليه السلام — نبي الله العظيم. قصته فريدة:\n\n👶 وُلد بمعجزة من أم مريم العذراء بدون أب\n🗣️ تكلم في المهد وأخبرهم أنه نبي الله\n🕊️ أيده الله بمعجزات: إحياء الموتى، إبراء الأكمه والأبرص، خلق طير من طين، إنزال المائدة من السماء\n📖 أوحى الله إليه الإنجيل\n✝️ رفعه الله إليه ولم يصلب (عقيدة الإسلام تخالف عقيدة الصلب)\n\nالإسلام يكرم عيسى ويعتبره من أولي العزم من الرسل. وهو نزل آخر الزمان ليحكم بالشريعة الإسلامية.'
      : "Prophet Isa (Jesus), son of Mary — a mighty prophet of Allah. His story is unique:\n\n👶 Born miraculously to virgin Mary without a father\n🗣️ Spoke as a baby in the cradle\n🕊️ Miracles: healing the blind and leper, raising the dead, creating birds from clay, bringing down a table from heaven\n📖 Received the Gospel (Injeel)\n✝️ Allah raised him up — he was not crucified (Islamic belief)\n\nIslam honors Jesus as one of the five greatest prophets. He will return at the end of times to rule by Islamic law.";
  }

  if (m('ibrahim', 'abraham', 'إبراهيم', 'خليل الله', 'الخليل', 'الكعبة', 'النار')) {
    return isAr
      ? 'إبراهيم عليه السلام — خليل الله وأبو الأنبياء. من أقوى قصص الإيمان:\n\n🌙 حاجّه قومه في النجوم والقمر والشمس حتى آمن بالله وحده\n🔥 ألقي في النار فجعلها الله برداً وسلاماً\n🗡️ رأى في المنام أنه يذبح ابنه إسماعيل فاستسلما لأمر الله — ثم فداه الله بذبح عظيم\n🏗️ بنى الكعبة مع إسماعيل — "ربنا تقبل منا"\n🤲 دعاؤه: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة"\n\nإبراهيم عليه السلام هو مثال التسليم المطلق لله — "إذ قال له ربه أسلم قال أسلمت لرب العالمين".'
      : "Prophet Ibrahim (Abraham) — the friend of Allah and father of prophets. One of the most powerful examples of faith:\n\n🌙 Debated his people about stars, moon, and sun until he affirmed Allah alone\n🔥 Thrown into fire — Allah made it cool and safe\n🗡️ Dreamt of sacrificing his son Ismail — both submitted to Allah's will, then Allah ransomed with a great sacrifice\n🏗️ Built the Kaaba with Ismail\n🤲 His dua: 'Our Lord, give us good in this world and good in the Hereafter'\n\nIbrahim is the ultimate example of total submission — 'When his Lord said to him: Submit, he said: I have submitted to the Lord of the worlds.'";
  }

  if (m('yusuf', 'joseph', 'يوسف', 'يوسف عليه السلام', 'يعقوب', 'سورة يوسف', 'أحسن القصص')) {
    return isAr
      ? 'قصة يوسف عليه السلام — "أحسن القصص". سورة كاملة تحكي قصته:\n\n👦 أحب بني يعقوب لأبيه — حسده إخوته\n🌊 ألقوه في البئر\n💰 بيع كعبد في مصر\n🏡 راودته امرأة العزيز عن نفسه — فاختار السجن على المعصية\n⛓️ سجن سنوات طويلة\n👑 خرج وأصبح عزيز مصر (وزير المالية)\n🤝 اجتمع بإخوته وعفا عنهم\n\nأعظم دروس القصة: الصبر على البلاء، الثقة بالله، والعفو عند المقدرة. "إنه من يتق ويصبر فإن الله لا يضيع أجر المحسنين".'
      : "The story of Prophet Yusuf (Joseph) — 'the best of stories.' An entire surah tells his tale:\n\n👦 His father Jacob's favorite — his brothers grew jealous\n🌊 Thrown into a well\n💰 Sold as a slave in Egypt\n🏡 Tempted by the minister's wife — chose prison over sin\n⛓️ Spent years in prison\n👑 Became Egypt's treasurer\n🤝 Reunited with his brothers and forgave them\n\nThe greatest lessons: patience through trials, trust in Allah, and forgiveness when you have power.";
  }

  if (m('nuh', 'noah', 'نوح', 'الطوفان', 'السفينة')) {
    return isAr
      ? 'نوح عليه السلام — أول أولي العزم من الرسل. دعا قومه ٩٥٠ سنة!\n\n🚢 بنى السفينة بأمر الله\n😢 قومه سخروا منه واستكبروا\n🌊 الطوفان أغرق كل من كفر\n\nمن أبرز الدروس: الصبر في الدعوة، مهما طالت المدة. لا تيأس من هداية الناس — نوح دعا قروناً ولم يستجب إلا قليل.'
      : "Prophet Nuh (Noah) — the first of the five great messengers. He called his people for 950 years!\n\n🚢 Built the ark by Allah's command\n😢 His people mocked him and were arrogant\n🌊 The flood drowned every disbeliever\n\nKey lesson: patience in da'wah, no matter how long it takes. Nuh called for centuries and only a few responded.";
  }

  if (m('sulaiman', 'solomon', 'سليمان', 'الهدهد', 'بلقيس', 'النمل', 'الجن')) {
    return isAr
      ? 'سليمان عليه السلام — نبي وملك عظيم. من قصصه:\n\n🐜 يفهم لغة الحيوانات — سمع نملة تحذر قومها!\n💨 سخر الله له الريح\n👹 سخر له الجن\n🐦 قصته مع الهدهد وملكة سبأ (بلقيس)\n🏛️ بنى المسجد الأقصى\n\nسليمان عليه السلام علمنا أن الملك الحقيقي بالشكر لله. قال: "هذا من فضل ربي ليبلوني أأشكر أم أكفر".'
      : "Prophet Sulaiman (Solomon) — a prophet and mighty king. His stories:\n\n🐜 Understood animal language — heard an ant warn its colony!\n💨 The wind was subjugated to him\n👹 The jinn worked for him\n🐦 The story of the hoopoe bird and Queen of Sheba (Bilqis)\n🏛️ Built Al-Aqsa Mosque\n\nSulaiman teaches us that true kingship lies in gratitude to Allah: 'This is from the favor of my Lord to test me whether I will be grateful or ungrateful.'";
  }

  if (m('dawud', 'david', 'داود', 'جالوت', 'مزمار', 'الزبور', 'طالوت')) {
    return isAr
      ? 'داود عليه السلام — نبي وملك ومحارب عظيم:\n\n💪 قتل جالوت بالمقلاع (داود وجالوت)\n📖 أوحي إليه الزبور\n🗣️ سخر الله له الجبال تسبح معه\n🔨 ألان الله له الحديد — كان يصنع الدروع\n🎵 كان حسن الصوت — قال النبي ﷺ إن داود أعطي مزماراً من مزامير الجنة\n\nداود علمنا أن الإيمان بالله يمكن أن يهزم أي جبار.'
      : "Prophet Dawud (David) — a prophet, king, and warrior:\n\n💪 Killed Goliath with a slingshot\n📖 Received the Zabur (Psalms)\n🗣️ Mountains glorified Allah with him\n🔨 Iron was made soft in his hands — he made armor\n🎵 He had a beautiful voice — the Prophet ﷺ said Dawud was given a flute from Paradise\n\nDawud teaches us that faith in Allah can defeat any tyrant.";
  }

  if (m('adam', 'آدم', 'حواء', 'ابليس', 'الشيطان', 'الجنة', 'هبوط')) {
    return isAr
      ? 'آدم عليه السلام — أبونا جميعاً وأول إنسان. خلقه الله بيده من طين ونفخ فيه من روحه:\n\n👥 خلق حواء من ضلعه\n🏡 أسكنهما الجنة\n🍎 وسوس لهما إبليس فأكلا من الشجرة\n😢 نزلا إلى الأرض\n🤲 تلقى آدم كلمات من ربه فتاب عليه — "فتلقى آدم من ربه كلمات فتاب عليه"\n\nقصة آدم تعلمنا أن الخطأ بشري، وأن باب التوبة مفتوح دائماً. كلنا نخطئ — أهم شيء نعود لله.'
      : "Prophet Adam — our father and the first human. Allah created him with His own hands from clay and breathed His spirit into him:\n\n👥 Eve was created from his rib\n🏡 They lived in Paradise\n🍎 Iblis whispered to them — they ate from the tree\n😢 Descended to Earth\n🤲 Adam received words from his Lord and repented — 'Then Adam received from his Lord words and He accepted his repentance'\n\nAdam's story teaches us that making mistakes is human, and the door of repentance is always open.";
  }

  // ── More Islamic concepts ──
  if (m('jannah', 'paradise', 'heaven', 'firdaus', 'جنة', 'فردوس', 'نعيم')) {
    return isAr
      ? 'الجنة دار النعيم التي أعدها الله لعباده المتقين. "فلا تعلم نفس ما أخفي لهم من قرة أعين جزاء بما كانوا يعملون" (السجدة ١٧).\n\n🌿 **أوصاف الجنة:** أنهار من ماء وعسل ولبن وخمر، قصور، حدائق، حور عين، رضوان من الله\n🏆 **أعلى درجة:** الفردوس الأعلى\n🕌 **أعلى نعيم:** رؤية الله سبحانه وتعالى\n\n💡 الطريق: الإيمان + العمل الصالح + رحمة الله. أكثر من "اللهم إني أسألك الجنة".'
      : "Jannah (Paradise) is the eternal bliss Allah has prepared for His righteous servants. 'No soul knows what joy is kept hidden for them as a reward for what they used to do' (32:17).\n\n🌿 **Descriptions:** rivers of water, milk, honey, wine; palaces; gardens; companionship; and the greatest — Allah's pleasure\n🏆 **Highest level:** Al-Firdaws\n🕌 **Greatest reward:** Seeing Allah Himself\n\n💡 The path: faith + good deeds + Allah's mercy. Frequently say: 'Allahumma inni as'aluka al-jannah' (O Allah, I ask You for Paradise).";
  }

  if (m('jahannam', 'hell', 'جهنم', 'نار', 'جحيم', 'سعير')) {
    return isAr
      ? 'جهنم — نار الله الموقدة التي أعدها للكافرين والظالمين. "فاتقوا النار التي وقودها الناس والحجارة" (البقرة ٢٤).\n\n🔥 **أوصافها:** شديدة الحرارة، عميقة، فيها عذاب أليم\n📖 **ذكرت في القرآن** بكثرة للتحذير\n\nلكن رحمة الله واسعة! "قل يا عبادي الذين أسرفوا على أنفسهم لا تقنطوا من رحمة الله إن الله يغفر الذنوب جميعاً". اجتهد في الطاعة، واستغفر دائماً.'
      : "Jahannam (Hell) — the blazing fire of Allah prepared for disbelievers and wrongdoers. 'Then fear the Fire whose fuel is men and stones' (2:24).\n\n🔥 **Descriptions:** intense heat, bottomless pits, severe punishment\n📖 **Frequently mentioned** in the Quran as a warning\n\nBut Allah's mercy is vast! 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.' Strive in obedience and always seek forgiveness.";
  }

  if (m('angel', 'malaika', 'jibril', 'gabriel', 'mikail', 'israfil', 'malik', 'ملك', 'ملاك', 'جبريل', 'ميكائيل', 'إسرافيل', 'ملك الموت')) {
    return isAr
      ? 'الملائكة — خلق من نور، خلقهم الله لعبادته وتنفيذ أوامره. "لا يعصون الله ما أمرهم ويفعلون ما يؤمرون" (التحريم ٦).\n\n👼 **جبريل** — الموكل بالوحي\n🌧️ **ميكائيل** — الموكل بالأرزاق والمطر\n📯 **إسرافيل** — صاحب الصور (النفخ في البوق يوم القيامة)\n✍️ **ملكين** — الحفظة، يكتبون الحسنات والسيئات\n💀 **ملك الموت (عزرائيل)** — قبض الأرواح\n🏰 **مالك** — خازن النار\n\nالإيمان بالملائكة ركن من أركان الإيمان. يحفظوننا، يكتبون أعمالنا، ويستغفرون للمؤمنين.'
      : "Angels (Malaika) — created from light, they worship Allah and execute His commands. 'They do not disobey Allah in what He commands them and do as they are commanded' (66:6).\n\n👼 **Jibril** — brought revelation to prophets\n🌧️ **Mikail** — in charge of provision and rain\n📯 **Israfil** — will blow the trumpet on Judgment Day\n✍️ **Two angels** — recording deeds, good and bad\n💀 **Angel of Death (Azrael)** — takes souls\n🏰 **Malik** — guardian of Hell\n\nBelief in angels is a pillar of faith. They protect us, record our deeds, and seek forgiveness for believers.";
  }

  if (m('zakat', 'زكاة', 'صدقة', 'charity', 'alms')) {
    return isAr
      ? 'الزكاة ركن الإسلام الثالث. "وأقيموا الصلاة وآتوا الزكاة" — آيات كثيرة تقرن الصلاة بالزكاة.\n\n💰 **زكاة المال:** ٢.٥% من المدخرات التي حال عليها الحول\n🌾 **زكاة الزرع:** ١٠% (سقي بدون آلة) أو ٥% (بآلة)\n🐪 **زكاة الأنعام:** في الإبل والبقر والغنم\n\n💡 **مصارف الزكاة** (التوبة ٦٠): الفقراء، المساكين، العاملين عليها، المؤلفة قلوبهم، الرقاب، الغارمين، في سبيل الله، ابن السبيل\n\nالصدقة — ولو بالقليل — تدفع البلاء وتزيد البركة. "ما نقص مال من صدقة".'
      : "Zakat is the third pillar of Islam. 'Establish prayer and give zakat' — countless verses pair them together.\n\n💰 **Zakat on wealth:** 2.5% of savings held for one lunar year\n🌾 **Zakat on crops:** 10% (rain-fed) or 5% (irrigated)\n🐪 **Zakat on livestock:** camels, cattle, sheep/goats\n\n💡 **Recipients** (9:60): the poor, needy, zakat workers, those whose hearts are to be reconciled, slaves, debtors, in Allah's cause, travelers\n\nCharity — even small amounts — repels calamity and increases blessings. 'Charity never decreases wealth.'";
  }

  if (m('shirk', 'شرك', 'idol', 'شرك بالله')) {
    return isAr
      ? 'التوحيد أعظم الحقوق — والشرك أعظم الذنوب. "إن الله لا يغفر أن يشرك به ويغفر ما دون ذلك لمن يشاء" (النساء ٤٨).\n\nالشرك: صرف العبادة لغير الله — دعاء غير الله، الذبح لغير الله، الخوف من غير الله.\n\n💡 الشرك نوعان:\n🔴 **شرك أكبر** — يخرج من الملة\n🟠 **شرك أصغر** — كالرياء (يعمل العمل ليراه الناس)\n\nاحفظ قلبك: "رب أعني على ذكرك وشكرك وحسن عبادتك".'
      : "Tawheed is the greatest right — and shirk is the greatest sin. 'Indeed, Allah does not forgive association with Him, but He forgives what is less than that' (4:48).\n\nShirk: directing worship to other than Allah — praying to other than Allah, sacrificing to other than Allah, fearing other than Allah.\n\n💡 Two types:\n🔴 **Major shirk** — removes you from Islam\n🟠 **Minor shirk** — like showing off (riya)\n\nProtect your heart: 'My Lord, help me to remember You, thank You, and worship You well.'";
  }

  if (m('qadr', 'destiny', 'fate', 'predestination', 'قدر', 'قضاء')) {
    return isAr
      ? 'الإيمان بالقدر ركن الإيمان السادس. أن تؤمن بأن كل شيء بقدر الله — الخير والشر.\n\n🟢 **مراتب القدر:**\n📜 العلم — الله يعلم كل شيء قبل أن يكون\n📝 الكتابة — كتب كل شيء في اللوح المحفوظ\n🔄 المشيئة — ما شاء الله كان وما لم يشأ لم يكن\n🔨 الخلق — الله خالق كل شيء\n\nنصيحة: آمن بالقدر، لكن اعمل واجتهد. "اعملوا فكل ميسر لما خلق له". القدر ليس عذراً للكسل.'
      : "Belief in divine decree (Qadr) is the sixth pillar of faith. Believing that everything happens by Allah's decree — good and bad.\n\n🟢 **Levels of Qadr:**\n📜 Knowledge — Allah knows everything before it happens\n📝 Writing — everything is written in the Preserved Tablet\n🔄 Will — whatever Allah wills happens, whatever He doesn't will doesn't\n🔨 Creation — Allah is the Creator of all things\n\nAdvice: believe in qadr, but strive and work hard. 'Work, for everyone is facilitated for what he was created for.' Qadr is not an excuse for laziness.";
  }

  if (m('rizq', 'provision', 'sustenance', 'رزق', 'الرزاق')) {
    return isAr
      ? '"وفي السماء رزقكم وما توعدون" (الذاريات ٢٢). الرزق بيد الله وحده.\n\n💡 طرق زيادة الرزق:\n🤲 **التقوى** — "ومن يتق الله يجعل له مخرجا ويرزقه من حيث لا يحتسب"\n📖 **الاستغفار** — "استغفروا ربكم إنه كان غفاراً يرسل السماء عليكم مدراراً"\n🔗 **صلة الرحم** — تزيد في العمر والرزق\n💰 **الصدقة** — "ما نقص مال من صدقة"\n\nلا تقلق من رزقك — الله كتبه لك قبل أن تولد. اسعَ، توكل، واستغفر.'
      : "'And in the heaven is your provision and whatever you are promised' (51:22). Provision (rizq) is solely in Allah's hands.\n\n💡 Ways to increase rizq:\n🤲 **Taqwa** — 'Whoever fears Allah, He will make a way out and provide from where he does not expect'\n📖 **Istighfar** — 'Seek forgiveness of your Lord, He is ever forgiving, He will send rain upon you in abundance'\n🔗 **Family ties** — increase life and provision\n💰 **Charity** — 'Charity never decreases wealth'\n\nDon't worry about your provision — Allah wrote it before you were born. Strive, trust, and seek forgiveness.";
  }

  if (m('barakah', 'بركة', 'blessing')) {
    return isAr
      ? 'البركة: زيادة الخير مع القلة. ممكن يكون عندك القليل لكن فيه بركة تكفيك وتزيدك.\n\n💡 أسباب البركة:\n📖 **قراءة القرآن** — فيه بركة لكل شيء\n🤲 **البسملة** — قل "بسم الله" قبل كل شيء\n⏰ **الاستيقاظ المبكر** — دعا النبي ﷺ بالبركة لأمته في البكور\n🕌 **الصلوات** — تفتح أبواب البركة\n💪 **رضا الوالدين** — بركة في العمر والرزق\n\nالبركة أجمل من الكثرة!'
      : "Barakah: a divine blessing where little becomes abundant and sufficient. You may have little but with barakah it's more than enough.\n\n💡 Sources of barakah:\n📖 **Reading Quran** — brings blessings to everything\n🤲 **Bismillah** — say 'In the name of Allah' before everything\n⏰ **Early rising** — the Prophet ﷺ prayed for barakah in the early morning\n🕌 **Prayers** — open doors of blessing\n💪 **Honoring parents** — barakah in life and provision\n\nBarakah is better than abundance!";
  }

  if (m('istikhara', 'استخارة')) {
    return isAr
      ? 'صلاة الاستخارة — تطلب من الله فيها الخيرة في أمر معين. علّمنا النبي ﷺ:\n\n🕌 **تصلي ركعتين** من غير الفريضة\n🤲 **تدعو بالدعاء المأثور:** "اللهم إني أستخيرك بعلمك وأستقدرك بقدرتك..."\n\nبعد الاستخارة: توكّل على الله وامضِ في الأمر. إذا تيسّر وتسهّل ففيه خير، وإذا تعسّر فالخير في غيره. لا تنتظر رؤيا أو علامة — مجرد التيسير يكفي.\n\nاستشر أولاً، استخر ثانياً، ثم توكل.'
      : "Salat al-Istikhara — seeking Allah's guidance in a matter. The Prophet ﷺ taught us:\n\n🕌 **Pray 2 rak'ahs** of non-obligatory prayer\n🤲 **Recite the dua:** 'Allahumma inni astakhiruka bi'ilmika...'\n\nAfter istikhara: trust Allah and proceed. If it becomes easy and smooth, there's good in it. If obstacles arise, the good is elsewhere. Don't wait for a dream or sign — ease is enough.\n\nConsult first, pray istikhara, then trust Allah.";
  }

  if (m('nikah', 'marriage', 'wedding', 'زواج', 'نكاح', 'عقد', 'عرس', 'خطوبة', 'خطبة')) {
    return isAr
      ? 'النكاح سنة الأنبياء. "وأنكحوا الأيامى منكم والصالحين من عبادكم وإمائكم" (النور ٣٢).\n\n🤵 **شروط النكاح:**\n✅ موافقة ولي الزوجة\n✅ شاهدين عدلين\n✅ مهر (صداق)\n✅ خلو من الموانع الشرعية\n\n💡 نصائح لزواج ناجح:\n🤲 استخارة قبل القرار\n💬 تواصل صادق ومفتوح\n🙏 التسامح والتفاهم\n💰 الشفافية المالية\n👨‍👩‍👧‍👧 حسن العشرة\n\n"خيركم خيركم لأهله وأنا خيركم لأهلي" — قالها النبي ﷺ.'
      : "Nikah (marriage) is the way of the prophets. 'And marry the unmarried among you' (24:32).\n\n🤵 **Requirements:**\n✅ Consent of the bride's guardian (wali)\n✅ Two righteous witnesses\n✅ Mahr (dower)\n✅ No legal impediments\n\n💡 Tips for a successful marriage:\n🤲 Pray istikhara before deciding\n💬 Honest and open communication\n🙏 Forgiveness and understanding\n💰 Financial transparency\n👨‍👩‍👧‍👧 Kind companionship\n\n'The best of you are those who are best to their families, and I am the best of you to my family' — Prophet Muhammad ﷺ.";
  }

  if (m('adhan', 'call to prayer', 'أذان', 'مؤذن', 'بلال')) {
    return isAr
      ? 'الأذان — نداء التوحيد خمس مرات كل يوم. "الله أكبر، الله أكبر... حي على الصلاة، حي على الفلاح".\n\n🎵 **فضل الأذان:**\n🤲 دعوة المستجاب بين الأذان والإقامة\n🏆 المؤذنون أطول الناس أعناقاً يوم القيامة\n😈 الشيطان يفر عند سماع الأذان\n\n📿 أذكار بعد الأذان:\n"اللهم رب هذه الدعوة التامة والصلاة القائمة آت محمداً الوسيلة والفضيلة وابعثه مقاماً محموداً الذي وعدته"\n\nبلال بن رباح — أشهر مؤذن في الإسلام.'
      : "The Adhan — the call to tawheed five times daily. 'Allahu Akbar, Allahu Akbar... Hayya alas-salah, Hayya alal-falah'.\n\n🎵 **Virtues of the Adhan:**\n🤲 Duas between adhan and iqamah are answered\n🏆 The callers to prayer will have the longest necks on Judgment Day\n😈 Shaytan flees when hearing the adhan\n\n📿 After the adhan say:\n'Allahumma rabba hadhihi-d-da'wati tammah...'\n\nBilal ibn Rabah — the most famous mu'adhdhin in Islam.";
  }

  // ── More life topics ──
  if (m('car', 'drive', 'driving', 'سيارة', 'قيادة', 'سواقة')) {
    return isAr
      ? 'السيارات عالم واسع! السيارات الحديثة تطورت بشكل لا يصدق — من السيارات الكهربائية (تسلا، لوسيد) إلى السيارات الهجينة والهايبرد.\n\nنصائح مهمة:\n🚦 **الأمان أولاً** — حزام الأمان، مراعاة السرعة\n🛠️ **صيانة دورية** — زيت، فرامل، إطارات\n💡 **اقتصاد الوقود** — السرعة الثابتة توفر البنزين\n\nعندك سيارة معينة تفكر تشتريها؟ أو سؤال عن الصيانة؟'
      : "Cars are a fascinating world! Modern vehicles have evolved incredibly — from electric cars (Tesla, Lucid) to hybrids.\n\nImportant tips:\n🚦 **Safety first** — seatbelt, obey speed limits\n🛠️ **Regular maintenance** — oil, brakes, tires\n💡 **Fuel economy** — steady speed saves gas\n\nGot a specific car you're considering buying? Or a maintenance question?";
  }

  if (m('tech', 'gadget', 'technology', 'smartphone', 'iphone', 'android', 'laptop', 'تكنولوجيا', 'تقنية', 'جوال', 'هاتف', 'آيفون', 'أندرويد')) {
    return isAr
      ? 'التكنولوجيا تتغير بسرعة هائلة! كل يوم فيه جديد.\n\n📱 **الجوالات:** أيفون، سامسونغ، شاومي، هواوي — كل شركة فيها اللي يميزها\n💻 **الأجهزة:** ماك بوك، ويندوز، كروم بوك\n⌚ **الساعات الذكية:** Apple Watch، Galaxy Watch\n🎧 **السماعات:** AirPods، سماعات إلغاء الضوضاء\n\nأحدث صيحة؟ الذكاء الاصطناعي دخل في كل شيء — من الكاميرات للتطبيقات.\n\nعندك سؤال عن جهاز معين تبي تشتريه؟ أو مشكلة تقنية؟'
      : "Technology changes at an incredible pace! Something new every day.\n\n📱 **Phones:** iPhone, Samsung, Xiaomi, Huawei — each has unique strengths\n💻 **Computers:** MacBook, Windows, Chromebook\n⌚ **Smartwatches:** Apple Watch, Galaxy Watch\n🎧 **Headphones:** AirPods, noise-canceling\n\nThe latest trend? AI is everywhere now — from cameras to apps.\n\nGot a question about a specific device you want to buy? Or a tech problem?";
  }

  if (m('movie', 'film', 'cinema', 'tv show', 'series', 'netflix', 'youtube', 'فيلم', 'مسلسل', 'سينما', 'نتفلكس', 'يوتيوب')) {
    return isAr
      ? 'السينما والتلفزيون عالم كبير! أقدر أعطيك اقتراحات بناءً على ذوقك:\n\nإذا تحب:\n🎬 **الدراما التاريخية** — عن الحضارات والشخصيات\n🤣 **الكوميديا** — للضحك وتغيير المزاج\n🧠 **الأفلام الوثائقية** — تعلم وإثراء\n⚔️ **الأكشن** — إثارة وتشويق\n💭 **الأنمي** — قصص عميقة ورسوم جميلة\n\nلكن تذكر: اختر المحتوى اللي ينفعك ويريح بالك. الوقت أغلى من أن نضيعه.'
      : "Movies and TV are a huge world! I can give recommendations based on your taste:\n\nIf you like:\n🎬 **Historical drama** — about civilizations and figures\n🤣 **Comedy** — for a laugh and mood lift\n🧠 **Documentaries** — learning and enrichment\n⚔️ **Action** — excitement and thrills\n💭 **Anime** — deep stories and beautiful art\n\nBut remember: choose content that benefits you and brings you peace. Time is too precious to waste.";
  }

  if (m('art', 'draw', 'painting', 'design', 'creative', 'فن', 'رسم', 'تصميم', 'إبداع')) {
    return isAr
      ? 'الفن نافذة الروح! الإبداع موهبة ويمكن تنميتها:\n\n🎨 **الرسم** — بقلم الرصاص، ألوان زيتية، أكريليك\n🖌️ **التصميم الرقمي** — فوتوشوب، إليستريتور، Procreate\n📷 **التصوير** (موضوع كامل!) — ضوء، تكوين، قصة\n✍️ **الخط العربي** — فن إسلامي أصيل\n💻 **UI/UX** — تصميم تجربة المستخدم\n\nأهم نصيحة؟ تدرب يومياً ولو ١٠ دقائق. الموهبة بدون ممارسة ما تسوي شي. وش نوع الفن اللي تحبه؟'
      : "Art is the window of the soul! Creativity is a gift that can be nurtured:\n\n🎨 **Drawing** — pencil, oil, acrylic\n🖌️ **Digital design** — Photoshop, Illustrator, Procreate\n📷 **Photography** (a whole topic!) — light, composition, story\n✍️ **Arabic calligraphy** — authentic Islamic art\n💻 **UI/UX** — user experience design\n\nBest advice? Practice daily, even 10 minutes. Talent without practice goes nowhere. What type of art do you enjoy?";
  }

  if (m('fashion', 'clothes', 'style', 'wear', 'outfit', 'موضة', 'ملابس', 'أناقة', 'لبس', 'ازياء')) {
    return isAr
      ? 'الأناقة تعبير عن الشخصية. في الإسلام، اللباس الحسن مطلوب — "خذوا زينتكم عند كل مسجد" (الأعراف ٣١).\n\n👔 **نصائح عامة:**\n🔵 ألوان تتناسب مع لون بشرتك\n👖 ملابس تناسب مقاسك (لا واسع ولا ضيق)\n👞 الحذاء يرفع الإطلالة\n🧥 الطبقات تعطي شكلاً أفضل\n\nللمحجبات: الأناقة مع الحجاب فن! أقمشة انسيابية، ألوان متناسقة، إكسسوارات بسيطة.\n\nالموضة تتغير، لكن أناقتك تعبّر عنك أنت.'
      : "Style is an expression of personality. In Islam, dressing well is encouraged — 'Take your adornment at every mosque' (7:31).\n\n👔 **General tips:**\n🔵 Colors that complement your skin tone\n👖 Clothes that fit well (neither too loose nor too tight)\n👞 Shoes elevate the whole look\n🧥 Layers create a better silhouette\n\nFor hijabis: elegance with hijab is an art! Flowing fabrics, coordinated colors, minimal accessories.\n\nFashion changes, but your style expresses YOU.";
  }

  if (m('coffee', 'tea', 'قهوة', 'شاي', 'كافيين', 'عربي')) {
    return isAr
      ? 'القهوة والشاي مش بس مشروبات — هي ثقافة وطقوس!\n\n☕ **قهوة عربية** — مع الهيل والزعفران، رمز الكرم\n☕ **اسبريسو** — إيطالية، قوية ومركزة\n☕ **كابتشينو** — إسبريسو مع حليب ورغوة\n🍵 **شاي أحمر** — كلاسيكي\n🍵 **شاي أخضر** — صحي ومنعش\n🌿 **شاي النعناع** — مغربي أصيل\n\nفوائد معقولة: القهوة تحسن التركيز وتمنع النعاس. الشاي غني بمضادات الأكسدة.\n\nوش مشروبك المفضل؟'
      : "Coffee and tea aren't just drinks — they're culture and rituals!\n\n☕ **Arabic coffee** — with cardamom and saffron, a symbol of hospitality\n☕ **Espresso** — Italian, strong and concentrated\n☕ **Cappuccino** — espresso with milk and foam\n🍵 **Black tea** — classic\n🍵 **Green tea** — healthy and refreshing\n🌿 **Mint tea** — authentic Moroccan\n\nModerate benefits: coffee improves focus, tea is rich in antioxidants.\n\nWhat's your favorite drink?";
  }

  if (m('language', 'learn language', 'english', 'french', 'spanish', 'turkish', 'لغة', 'تعلم لغة', 'إنجليزي', 'فرنسي', 'إسباني', 'تركي')) {
    return isAr
      ? 'تعلم لغات جديدة يفتح عقلك لعوالم جديدة!\n\n💡 **نصائح مجرّبة:**\n📱 **انغمس** — غير لغة جوالك للغة اللي تتعلمها\n🎧 **استمع** — بودكاست، أغاني، أفلام باللغة المستهدفة\n🗣️ **تحدث** — حتى لو أخطأت، الممارسة تصنع الفرق\n📖 **اقرأ** — ابدأ بقصص قصيرة\n⏰ **خصص ١٥ دقيقة يومياً** — الاستمرارية أهم من الكثافة\n\n"من تعلم لغة قوم أمن شرهم." تعلم اللغات يوسع مداركك ويقربك من ثقافات مختلفة. وش اللغة اللي حاب تتعلمها؟'
      : "Learning new languages opens your mind to new worlds!\n\n💡 **Proven tips:**\n📱 **Immerse** — change your phone to the target language\n🎧 **Listen** — podcasts, songs, movies\n🗣️ **Speak** — even with mistakes, practice makes the difference\n📖 **Read** — start with short stories\n⏰ **15 minutes daily** — consistency beats intensity\n\n'A person who learns another language gains another soul.' What language do you want to learn?";
  }

  if (m('travel', 'trip', 'vacation', 'destination', 'traveler', 'سفر', 'رحلة', 'سياحة', 'مسافر')) {
    return isAr
      ? 'السفر يوسع الأفق ويثري الروح! "قل سيروا في الأرض فانظروا كيف بدأ الخلق" (العنكبوت ٢٠).\n\n🌍 **وجهات مميزة:**\n🕌 **اسطنبول** — تاريخ وحضارة\n🏛️ **الأندلس** — إسبانيا، آثار المسلمين\n🏜️ **العلا** — جمال الطبيعة في السعودية\n🏝️ **جزر المالديف** — جنة على الأرض\n🗼 **ماليزيا** — تنوع وطبيعة\n\n💡 نصائح:\n📋 خطط مسبقاً\n💵 احسب ميزانيتك\n🙏 أدعية السفر\n📸 استمتع بكل لحظة\n\nأجمل مكان زرته أو حاب تزوره؟'
      : "Travel expands your horizons and enriches your soul! 'Travel through the land and observe how He began creation' (29:20).\n\n🌍 **Top destinations:**\n🕌 **Istanbul** — history and civilization\n🏛️ **Andalusia** — Spain, Muslim heritage\n🏜️ **AlUla** — nature's beauty in Saudi\n🏝️ **Maldives** — paradise on earth\n🗼 **Malaysia** — diversity and nature\n\n💡 Tips:\n📋 Plan ahead\n💵 Budget wisely\n🙏 Travel duas\n📸 Enjoy every moment\n\nBest place you've visited or want to visit?";
  }

  // ── Engaging conversational fallback ──
  // Use conversation context to give a more relevant response
  const firstWords = q.split(/\s+/).slice(0, 4).join(' ');

  // Check if this looks like a follow-up question
  const prevMsg = messages.length > 1 ? messages[messages.length - 2]?.content || '' : '';
  const isFollowUp = prevMsg && (
    m('what about', 'tell me more', 'و', 'ماذا عن', 'اخبرني', 'أخبرني', 'زيدني', 'more', 'also', 'أيضا', 'كمان', 'هل') ||
    q.length < 15
  );

  if (isFollowUp && prevMsg) {
    const prevSnippet = prevMsg.length > 40 ? prevMsg.slice(0, 40) + '...' : prevMsg;
    if (isAr) {
      return `متابعة جميلة! 😊 بالنسبة لسؤالك عن "${firstWords}"، قاعدة معرفتي المحلية تغطي مواضيع محددة، ومعرفتي في "${prevSnippet}" قد ما أقدر أساعد.\n\nجرب تسألني بسؤال واحد محدد عن:\n📖 القرآن والتفسير والأحاديث\n🔬 العلوم والتكنولوجيا والبرمجة\n💪 الصحة والرياضة والتطوير الذاتي\n📜 التاريخ والحضارات\n🤝 العلاقات والمشورة الشخصية\n\nوإذا تبغى إجابات غير محدودة، أضف مفتاح Gemini API من الإعدادات 🚀`;
    }
    return `Great follow-up! 😊 Regarding "${firstWords}" — my local knowledge covers specific topics, and about "${prevSnippet}" I've shared what I can.\n\nTry asking about one specific topic from:\n📖 Quran and Islamic knowledge\n🔬 Science, tech, and programming\n💪 Health, fitness, and personal growth\n📜 History and civilizations\n🤝 Relationships and life advice\n\nFor unlimited answers, add a Gemini API key in settings 🚀`;
  }

  if (isAr) {
    return `سؤالك عن "${firstWords}" شيّق! 😊 حالياً قاعدة معرفتي المحلية تغطي مواضيع محددة.\n\nلكن عندي قدرات مفيدة — أقدر أساعدك في:\n📖 القرآن والتفسير والأحاديث\n🔬 العلوم والتكنولوجيا والبرمجة\n💪 الصحة والرياضة والتطوير الذاتي\n📜 التاريخ والحضارات\n🤝 العلاقات والمشورة الشخصية\n\nللحصول على إجابات ذكية غير محدودة، أضف مفتاح Gemini API من الإعدادات — أو اسألني عن موضوع معين 🤲`;
  }

  return `Interesting question about "${firstWords}"! 😊 My local knowledge base covers many topics but not everything.\n\nHere's what I CAN help you with:\n📖 Quran and Islamic knowledge\n🔬 Science, tech, and programming\n💪 Health, fitness, and personal growth\n📜 History and civilizations\n🤝 Relationships and life advice\n\nFor unlimited smart answers, add a Gemini API key in settings. Or ask me about a specific topic! 🙌`;
}
