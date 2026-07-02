import axios from 'axios';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function geminiUrl(model = 'gemini-2.0-flash') {
  return `${GEMINI_BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

export async function generateHifzPlan(memorizationData: Record<string, any>, userLevel = 'beginner') {
  const summary = JSON.stringify(memorizationData).slice(0, 2000);
  const prompt = `You are a Quran memorization coach. The user's memorization data: ${summary}. Create a 14-day revision plan targeting weak ayahs. Structure as JSON: { days: [{ day: 1, tasks: [{surah, ayah, reps}] }], tips: [] }.`;

  try {
    const res = await axios.post(geminiUrl(), {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: 'You are a helpful Quran memorization coach.' }] },
      generationConfig: { maxOutputTokens: 800 },
      safetySettings: SAFETY_SETTINGS,
    });

    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try { return JSON.parse(reply); } catch { return { raw: reply }; }
  } catch (err: any) {
    console.error('Gemini Hifz plan error:', err?.response?.data || err.message || err);
    throw new Error('Failed to generate hifz plan');
  }
}

export async function chatCompletion(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 2048
) {
  try {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, any> = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: SAFETY_SETTINGS,
    };

    const res = await axios.post(geminiUrl(), body);

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err: any) {
    console.error('Gemini chat completion error:', err?.response?.data || err.message || err);
    throw new Error('AI response failed');
  }
}
