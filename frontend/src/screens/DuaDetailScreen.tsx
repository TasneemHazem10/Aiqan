import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { DuaItem } from '../types';
import { getOfflineDuaCategory } from '../services/offlineDuas';
import { COLORS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

type Route = RouteProp<{ DuaDetail: { categoryId: string; title: string } }, 'DuaDetail'>;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function DuaDetailScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: colors.textMuted, fontSize: 14 },
    header: { padding: 16, paddingBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    list: { padding: 14 },
    card: {
      backgroundColor: colors.cardDark, borderRadius: 14, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: `${colors.gold}20`,
    },
    arabic: { fontSize: 20, color: colors.textPrimary, textAlign: 'right', lineHeight: 36, fontFamily: 'serif' },
    transliteration: { fontSize: 13, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
    translation: { fontSize: 13, color: colors.textPrimary, marginTop: 8, lineHeight: 20 },
    source: { fontSize: 11, color: colors.gold, marginTop: 6, fontWeight: '500' },
    benefitsBox: {
      backgroundColor: `${colors.gold}10`, borderRadius: 8, padding: 10, marginTop: 10,
      borderWidth: 1, borderColor: `${colors.gold}30`,
    },
    benefitsLabel: { fontSize: 10, color: colors.gold, fontWeight: '600', marginBottom: 4 },
    benefitsText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  }));

  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { categoryId } = route.params;
  const { t, language, theme } = useApp();
  const isDark = theme === 'dark' || theme === 'amoled';
  const category = getOfflineDuaCategory(categoryId);
  const catColor = category?.color || '#4A1B1B';
  const headerGrad: [string, string] = isDark
    ? [catColor, hexToRgba(catColor, 0.6)]
    : [hexToRgba(catColor, 0.6), hexToRgba(catColor, 0.3)];
  const [duas, setDuas] = useState<DuaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = language === 'ar';

  useEffect(() => {
    const offline = getOfflineDuaCategory(categoryId);
    setDuas(offline?.duas ?? []);
    setLoading(false);
  }, [categoryId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={headerGrad} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </AnimatedPressable>
            <Text style={styles.title}>{t('dua.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {duas.map((dua) => (
          <View key={dua.id} style={styles.card}>
            <Text style={styles.arabic}>{dua.arabic}</Text>
            {dua.transliteration && (
              <Text style={styles.transliteration}>{dua.transliteration}</Text>
            )}
            <Text style={styles.translation}>{dua.translation}</Text>
            {dua.source && <Text style={styles.source}>{dua.source}</Text>}
            {dua.benefits && (
              <View style={styles.benefitsBox}>
                <Text style={styles.benefitsLabel}>{t('dua.benefits')}</Text>
                <Text style={styles.benefitsText}>{dua.benefits}</Text>
              </View>
            )}
          </View>
        ))}
        {duas.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
