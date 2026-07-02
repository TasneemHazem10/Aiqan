const env: Record<string, string | undefined> = process.env as Record<string, string | undefined>;

export const GEMINI_API_KEY = env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export const IS_AI_CONFIGURED = !!GEMINI_API_KEY;
