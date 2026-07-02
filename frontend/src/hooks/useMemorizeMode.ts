import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { storeData, getData, KEYS } from '../utils/storage';

export function useMemorizeMode(ayahs: { number: number; text: string }[]) {
  const [memorizeMode, setMemorizeMode] = useState(false);
  const [versesHidden, setVersesHidden] = useState(false);
  const [focusedAyahIndex, setFocusedAyahIndex] = useState(0);
  const [revealedWords, setRevealedWords] = useState<Record<number, Set<number>>>({});
  const [incorrectWords, setIncorrectWords] = useState<Record<number, Set<number>>>({});
  const [memorizedAyahs, setMemorizedAyahs] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const ayahDataRef = useRef(ayahs);
  ayahDataRef.current = ayahs;

  const toggleMemorizeMode = useCallback(() => {
    setMemorizeMode(prev => {
      if (prev) {
        setVersesHidden(false);
        setIsRecording(false);
        setIsChecking(false);
        setRevealedWords({});
        setIncorrectWords({});
      } else {
        setVersesHidden(true);
        setFocusedAyahIndex(0);
      }
      return !prev;
    });
  }, []);

  const setFocusedAyah = useCallback((index: number) => {
    setFocusedAyahIndex(Math.max(0, Math.min(ayahDataRef.current.length - 1, index)));
  }, []);

  const getWords = useCallback((text: string) => {
    return text.split(/\s+/).filter(Boolean);
  }, []);

  const startRecording = useCallback(async () => {
    const ayah = ayahDataRef.current[focusedAyahIndex];
    if (!ayah) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Failed to start recording');
    }
  }, [focusedAyahIndex]);

  const stopRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    setIsRecording(false);
    try {
      await rec.stopAndUnloadAsync();
      recordingRef.current = null;
      const uri = rec.getURI();
      if (uri) await processRecording(uri);
    } catch {
      Alert.alert('Error', 'Failed to process recording');
    }
  }, [focusedAyahIndex]);

  const processRecording = async (_uri: string) => {
    const ayah = ayahDataRef.current[focusedAyahIndex];
    if (!ayah) return;
    setIsChecking(false);
    const words = getWords(ayah.text);
    setRevealedWords(prev => {
      const next = { ...prev };
      next[ayah.number] = new Set(words.map((_, i) => i));
      return next;
    });
    setIncorrectWords(prev => {
      const next = { ...prev };
      delete next[ayah.number];
      return next;
    });
  };

  const revealWord = useCallback(() => {
    const ayah = ayahDataRef.current[focusedAyahIndex];
    if (!ayah) return;
    const words = getWords(ayah.text);
    setRevealedWords(prev => {
      const existing = prev[ayah.number] || new Set<number>();
      if (existing.size >= words.length) return prev;
      const next = { ...prev };
      next[ayah.number] = new Set([...existing, existing.size]);
      return next;
    });
  }, [focusedAyahIndex, getWords]);

  const revealAyah = useCallback(() => {
    const ayah = ayahDataRef.current[focusedAyahIndex];
    if (!ayah) return;
    const words = getWords(ayah.text);
    setRevealedWords(prev => {
      const next = { ...prev };
      next[ayah.number] = new Set(words.map((_, i) => i));
      return next;
    });
    setIncorrectWords(prev => {
      const next = { ...prev };
      delete next[ayah.number];
      return next;
    });
  }, [focusedAyahIndex, getWords]);

  const markMemorized = useCallback(async () => {
    const ayah = ayahDataRef.current[focusedAyahIndex];
    if (!ayah) return;
    const key = `${ayah.number}`;
    setMemorizedAyahs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    const count = await getData<number>(KEYS.MEMORIZATION, 0);
    await storeData(KEYS.MEMORIZATION, (count ?? 0) + 1);
  }, [focusedAyahIndex]);

  const prevAyah = useCallback(() => {
    setFocusedAyahIndex(prev => Math.max(0, prev - 1));
    setRevealedWords({});
    setIncorrectWords({});
  }, []);

  const nextAyah = useCallback(() => {
    setFocusedAyahIndex(prev => Math.min(ayahDataRef.current.length - 1, prev + 1));
    setRevealedWords({});
    setIncorrectWords({});
  }, []);

  const isFirstAyah = focusedAyahIndex <= 0;
  const isLastAyah = focusedAyahIndex >= ayahs.length - 1;

  return {
    memorizeMode,
    versesHidden,
    focusedAyahIndex,
    revealedWords,
    incorrectWords,
    memorizedAyahs,
    isRecording,
    isChecking,
    isFirstAyah,
    isLastAyah,
    toggleMemorizeMode,
    setFocusedAyah,
    startRecording,
    stopRecording,
    revealWord,
    revealAyah,
    markMemorized,
    prevAyah,
    nextAyah,
    getWords,
  };
}
