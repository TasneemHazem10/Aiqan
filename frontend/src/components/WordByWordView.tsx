import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import api from '../utils/api';

interface WordByWordViewProps {
  arabicText: string;
  translations?: string[];
  fontSize?: number;
  playingWordIndex?: number;
  onWordPress?: (wordIndex: number) => void;
  surahNumber?: number;
  ayahNumber?: number;
}

interface WordData {
  word: string;
  translation?: string;
}

export default function WordByWordView({
  arabicText, translations, fontSize = 24,
  playingWordIndex, onWordPress, surahNumber, ayahNumber,
}: WordByWordViewProps) {
  const styles = useThemedStyles((colors) => ({
    container: { position: 'relative', minHeight: 40 },
    loader: { position: 'absolute', top: -20, right: 0, zIndex: 10 },
    wordsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      writingDirection: 'rtl',
      gap: 4,
    },
    wordWrapper: { alignItems: 'center', marginBottom: 4 },
    wordButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    wordEven: { backgroundColor: 'rgba(212, 160, 23, 0.06)' },
    wordOdd: { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
    wordPlaying: {
      backgroundColor: 'rgba(212, 160, 23, 0.18)',
      borderColor: colors.gold,
    },
    wordSelected: {
      backgroundColor: 'rgba(212, 160, 23, 0.12)',
      borderColor: colors.gold,
    },
    wordText: {
      color: '#1A0A00',
      textAlign: 'right',
      writingDirection: 'rtl',
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
      lineHeight: 48,
    },
    wordTextPlaying: { color: '#8B6914', fontWeight: '700' },
    wordTextSelected: { color: colors.goldDark, fontWeight: '700' },
    tooltip: {
      backgroundColor: 'rgba(10, 28, 20, 0.95)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      marginTop: 2,
      maxWidth: 160,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    tooltipText: { color: colors.cream, fontSize: 12, textAlign: 'center' },
    tooltipMuted: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  }));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wordData, setWordData] = useState<WordData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiAttempted, setApiAttempted] = useState(false);

  const fallbackWords = arabicText.trim().split(/\s+/);

  useEffect(() => {
    if (surahNumber && ayahNumber && !apiAttempted) {
      setApiAttempted(true);
      setLoading(true);
      api.get<any>(`/quran/ayah/${surahNumber}/${ayahNumber}/words`)
        .then((res) => {
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) {
            setWordData(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [surahNumber, ayahNumber]);

  const words = wordData
    ? wordData.map(w => w.word)
    : fallbackWords;

  const wordTranslations = wordData
    ? wordData.map(w => w.translation || '')
    : (translations && translations.length === words.length
        ? translations
        : []);

  const handleWordPress = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onWordPress?.(index);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator size="small" color={COLORS.gold} style={styles.loader} />
      )}
      <View style={styles.wordsRow}>
        {words.map((word, i) => {
          const isPlaying = playingWordIndex === i;
          const isSelected = selectedIndex === i;
          const hasTranslation = !!wordTranslations[i];

          return (
            <View key={`word-${i}-${word}`} style={styles.wordWrapper}>
              <TouchableOpacity
                onPress={() => handleWordPress(i)}
                activeOpacity={0.7}
                style={[
                  styles.wordButton,
                  i % 2 === 0 ? styles.wordEven : styles.wordOdd,
                  isPlaying && styles.wordPlaying,
                  isSelected && styles.wordSelected,
                ]}
              >
                <Text
                  style={[
                    styles.wordText,
                    { fontSize },
                    isPlaying && styles.wordTextPlaying,
                    isSelected && styles.wordTextSelected,
                  ]}
                >
                  {word}
                </Text>
              </TouchableOpacity>
              {isSelected && hasTranslation && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{wordTranslations[i]}</Text>
                </View>
              )}
              {isSelected && !hasTranslation && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipMuted}>—</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

