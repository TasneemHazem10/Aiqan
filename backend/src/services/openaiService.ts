import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import FormData from 'form-data';

export async function transcribeAudioBase64(base64: string, filename = 'audio.wav') {
  const buffer = Buffer.from(base64, 'base64');
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `${Date.now()}-${filename}`);
  fs.writeFileSync(filePath, buffer);

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');

  try {
    const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    return res.data.text || '';
  } catch (err: any) {
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    console.error('OpenAI transcription error:', err?.response?.data || err.message || err);
    throw new Error('Transcription failed');
  }
}

export async function generateHifzPlan(memorizationData: Record<string, any>, userLevel = 'beginner') {
  const summary = JSON.stringify(memorizationData).slice(0, 2000);
  const prompt = `You are a Quran memorization coach. The user's memorization data: ${summary}. Create a 14-day revision plan targeting weak ayahs. Structure as JSON: { days: [{ day: 1, tasks: [{surah, ayah, reps}] }], tips: [] }.`;

  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are a helpful Quran memorization coach.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const reply = res.data?.choices?.[0]?.message?.content || '';
    try { return JSON.parse(reply); } catch { return { raw: reply }; }
  } catch (err: any) {
    console.error('OpenAI Hifz plan error:', err?.response?.data || err.message || err);
    throw new Error('Failed to generate hifz plan');
  }
}

export async function chatCompletion(messages: Array<{ role: string; content: string }>, maxTokens = 1000) {
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4.1',
      messages,
      max_tokens: maxTokens,
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    return res.data?.choices?.[0]?.message?.content || '';
  } catch (err: any) {
    console.error('OpenAI chat completion error:', err?.response?.data || err.message || err);
    throw new Error('AI response failed');
  }
}
