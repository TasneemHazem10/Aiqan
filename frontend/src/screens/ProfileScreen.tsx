import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Modal, useWindowDimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { getData, KEYS } from '../utils/storage';
import LogoDecoration from '../components/LogoDecoration';
import CardSurface from '../components/CardSurface';
import AvatarCircle from '../components/AvatarCircle';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { ACHIEVEMENT_DEFS, SURAH_AYAH_COUNTS } from '../constants/achievements';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },

    header:    { paddingBottom: SPACING.lg, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.base,
      paddingTop:     SPACING.xs,
    },
    navBtn: {
      width:          44,
      height:         44,
      borderRadius:   RADIUS.round,
      backgroundColor: colors.glassDark,
      alignItems:     'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    editBtn: {
      width:          44,
      height:         44,
      borderRadius:   RADIUS.round,
      backgroundColor: colors.glassGold,
      alignItems:     'center',
      justifyContent: 'center',
    },

    profileHero: {
      alignItems:   'center',
      gap:          SPACING.sm,
      marginTop:    SPACING.xl,
      paddingBottom: SPACING.md,
    },
    userName:  { fontSize: FONT_SIZES.xl,    color: colors.textPrimary,   fontFamily: FONTS.display,  fontWeight: '700' },
    userEmail: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body },
    joinDate:  { fontSize: FONT_SIZES.caption, color: colors.textMuted,   fontFamily: FONTS.body },

    avatarWrap: { position: 'relative' },
    avatarOverlay: {
      position: 'absolute', bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: colors.gold,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.bg,
    },

    content:   { padding: SPACING.base },

    statsRow:  { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
    statCard: {
      flex:           1,
      backgroundColor: colors.card,
      borderRadius:   RADIUS.xl,
      padding:        SPACING.md,
      alignItems:     'center',
      gap:            SPACING.xs,
      borderWidth:    1,
      borderColor:    colors.border,
      ...SHADOWS.soft,
    },
    statIconWrap: {
      width:          44,
      height:         44,
      borderRadius:   RADIUS.md,
      alignItems:     'center',
      justifyContent: 'center',
    },
    statValue: { fontSize: FONT_SIZES.xl, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    statLabel: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body, textAlign: 'center' },

    section:        { marginBottom: SPACING.xl },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    sectionTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.display, fontWeight: '700' },
    sectionMeta:  { fontSize: FONT_SIZES.small, color: colors.gold, fontFamily: FONTS.bodyMed },

    achieveSub: { fontSize: 11, color: colors.textMuted, marginBottom: 8 },
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badgeItem: {
      width: (screenWidth - 48) / 3 - 4, borderRadius: 16,
      padding: 12, alignItems: 'center', borderWidth: 1,
    },
    badgeUnlocked:  { backgroundColor: `${colors.gold}10`, borderColor: `${colors.gold}40`, ...SHADOWS.soft },
    badgeLocked: { backgroundColor: colors.glassDark, borderColor: colors.border },
    badgeIcon: { fontSize: 26, marginBottom: 4 },
    badgeIconLocked: { opacity: 0.3 },
    badgeLabel:       { fontSize: 11, color: colors.textPrimary, fontWeight: '500', textAlign: 'center' },
    badgeLabelLocked: { color: colors.textMuted },
    badgeDiff: {
      fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: 0.5, marginTop: 2,
    },
    badgeDiffEasy: { color: '#44CC88' },
    badgeDiffMedium: { color: '#FFB347' },
    badgeDiffHard: { color: '#FF6B6B' },

    modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius:    RADIUS.xxl,
      padding:         SPACING.xl,
      width:           '85%',
      borderWidth:     1,
      borderColor:     colors.border,
      gap:             SPACING.base,
    },
    modalTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold, textAlign: 'center' },
    modalLabel: { fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.bodyMed, marginTop: SPACING.sm },
    modalInputWrap: {
      backgroundColor: colors.glassDark,
      borderRadius:    RADIUS.lg,
      borderWidth:     1,
      borderColor:     colors.border,
      paddingHorizontal: SPACING.md,
    },
    modalInput: { fontSize: FONT_SIZES.base, color: colors.textPrimary, fontFamily: FONTS.body, paddingVertical: SPACING.md },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md },
    modalCancelBtn: {
      paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md, backgroundColor: colors.glassDark,
      alignItems: 'center', justifyContent: 'center',
    },
    modalCancelText: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.bodyBold },
    modalSaveBtn: {
      paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md, backgroundColor: colors.gold,
      alignItems: 'center', justifyContent: 'center',
    },
    modalSaveText: { fontSize: FONT_SIZES.small, color: colors.darkGreen, fontFamily: FONTS.bodyBold },

    achDetailCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.xxl,
      padding: SPACING.xl,
      width: '82%',
      alignItems: 'center',
      gap: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    achDetailIcon: { fontSize: 48, marginBottom: SPACING.xs },
    achDetailTitle: { fontSize: FONT_SIZES.xl, color: colors.textPrimary, fontFamily: FONTS.display, fontWeight: '700', textAlign: 'center' },
    achDetailDesc: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 20 },
    achDetailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
    achDetailDiff: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round },
    achDetailDiffText: { fontSize: FONT_SIZES.micro, fontWeight: '700', letterSpacing: 1 },
    achDetailStatus: { fontSize: FONT_SIZES.small, fontFamily: FONTS.bodyBold },
  }), [screenWidth]);

  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params?: { fromHome?: boolean } }>();
  const fromHome = route.params?.fromHome;
  const { user, dailyStreak, totalDhikr, totalTasbih, updateProfile, updateAvatar, removeAvatar, t, language, activeColors } = useApp();
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [quranAyahs,     setQuranAyahs]     = useState(0);
  const [completedSurahs, setCompletedSurahs] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [activeDaysCount, setActiveDaysCount] = useState(0);
  const [editing,        setEditing]        = useState(false);
  const [editName,       setEditName]       = useState('');
  const [editEmail,      setEditEmail]      = useState('');
  const [selectedAch, setSelectedAch] = useState<typeof achievements[number] | null>(null);
  const isRtl = language === 'ar';

  useEffect(() => {
    const loadData = async () => {
      const memCount = await getData<number>(KEYS.MEMORIZATION, 0) ?? 0;
      setMemorizedCount(memCount);

      const progress = await getData<Record<string, { ayah: number; date: string }>>(KEYS.QURAN_PROGRESS, {}) ?? {};
      setQuranAyahs(Object.keys(progress).length);

      const storedStreak = await getData<number>(KEYS.STREAK, 0) ?? 0;
      const sessions = await getData<Array<any>>(KEYS.MEMORIZATION_SESSIONS, []) ?? [];
      setTotalSessions(sessions.length);

      const history = await getData<Record<string, number>>(KEYS.MEMORIZATION_HISTORY, {}) ?? {};
      const today = new Date().toISOString().split('T')[0];
      let activeDays = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if ((history[ds] || 0) > 0 || (i === 6 && memCount > 0)) activeDays++;
      }
      setActiveDaysCount(activeDays);

      let completeCount = 0;
      Object.entries(progress).forEach(([key, val]) => {
        const surahNum = parseInt(key.replace('s', ''), 10);
        const ayahCount = SURAH_AYAH_COUNTS[surahNum] || 0;
        if (val.ayah >= ayahCount && ayahCount > 0) completeCount++;
      });
      setCompletedSurahs(completeCount);
    };
    loadData();
  }, []);

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        isRtl ? 'صلاحية الوصول' : 'Permission Required',
        isRtl ? 'يرجى السماح بالوصول إلى مكتبة الصور' : 'Please allow access to your photo library'
      );
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const manip = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 256, height: 256 } }],
          { format: SaveFormat.JPEG, compress: 0.5, base64: true }
        );
        if (manip.base64) {
          await updateAvatar(`data:image/jpeg;base64,${manip.base64}`);
        }
      }
    } catch (err) {
      console.warn('Avatar pick failed:', err);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'تعذر حفظ الصورة' : 'Could not save image'
      );
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      isRtl ? 'إزالة الصورة' : 'Remove Photo',
      isRtl ? 'هل أنت متأكد من إزالة صورة الملف الشخصي؟' : 'Are you sure you want to remove your profile photo?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isRtl ? 'إزالة' : 'Remove', style: 'destructive', onPress: () => removeAvatar() },
      ]
    );
  };

  const handleSaveProfile = async () => {
    const data: { name?: string; email?: string } = {};
    const nameValue = editName.trim();
    const emailValue = editEmail.trim();
    if (nameValue) data.name = nameValue;
    if (emailValue) data.email = emailValue;
    if (Object.keys(data).length > 0) {
      try {
        await updateProfile(data);
      } catch {
        Alert.alert(
          isRtl ? 'خطأ في الحفظ' : 'Save Error',
          isRtl ? 'تعذر حفظ التغييرات. يرجى المحاولة مرة أخرى.' : 'Could not save changes. Please try again.'
        );
        return;
      }
    }
    setEditing(false);
  };

  const openEditModal = () => {
    setEditName(user?.name || (isRtl ? 'مستخدم' : 'User'));
    setEditEmail(user?.email || '');
    setEditing(true);
  };

  const achievements = ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: def.check(memorizedCount, dailyStreak, completedSurahs, quranAyahs, activeDaysCount, totalDhikr, totalTasbih, totalSessions),
  }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const stats = [
    { icon: 'flame'    as IoniconName, iconColor: '#FF6B35', value: String(dailyStreak),   label: isRtl ? 'سلسلة الأيام'  : 'Day Streak' },
    { icon: 'sparkles' as IoniconName, iconColor: COLORS.gold, value: totalDhikr > 999 ? `${(totalDhikr/1000).toFixed(1)}k` : String(totalDhikr), label: isRtl ? 'الذكر'        : 'Total Dhikr' },
    { icon: 'repeat'   as IoniconName, iconColor: '#9B59B6', value: totalTasbih > 999 ? `${(totalTasbih/1000).toFixed(1)}k` : String(totalTasbih), label: isRtl ? 'التسبيح'     : 'Tasbih' },
    { icon: 'book'     as IoniconName, iconColor: COLORS.info, value: String(quranAyahs),  label: isRtl ? 'الآيات المقروءة' : 'Ayahs Read' },
  ];

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient colors={GRADIENTS.brand} style={{ paddingTop: 80, paddingBottom: 40, paddingHorizontal: SPACING.base, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => fromHome ? navigation.navigate('Home') : navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={{ fontSize: FONT_SIZES.xl, color: '#F5E6C8', fontFamily: FONTS.display, fontWeight: '700', marginTop: SPACING.xl }}>{isRtl ? 'تعذر تحميل الملف الشخصي' : 'Could not load profile'}</Text>
          <Text style={{ fontSize: FONT_SIZES.small, color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.body, marginTop: SPACING.sm }}>{isRtl ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please log in again'}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <LogoDecoration size={200} opacity={0.04} position="top-right" />
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => fromHome ? navigation.navigate('Home') : navigation.goBack()} style={styles.navBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.headerTitle}>{isRtl ? 'الملف الشخصي' : 'My Profile'}</Text>
            <AnimatedPressable onPress={openEditModal} style={styles.editBtn}>
              <Ionicons name="pencil" size={16} color={COLORS.gold} />
            </AnimatedPressable>
          </View>

          <View style={styles.profileHero}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                <AvatarCircle name={user?.name || 'أ'} size={88} variant="gradient" imageUri={user?.avatar} />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={14} color="#1C1C1E" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.name || (isRtl ? 'ضيف' : 'Guest')}</Text>
            {user?.email ? (
              <Text style={styles.userEmail}>{user.email}</Text>
            ) : null}
            {user?.createdAt && (
              <Text style={styles.joinDate}>
                {isRtl ? 'منذ' : 'Since'} {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SlideUp><View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: `${stat.iconColor}18` }]}>
                <Ionicons name={stat.icon} size={22} color={stat.iconColor} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View></SlideUp>

        <SlideUp delay={100}><View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {isRtl ? 'الإنجازات' : 'Achievements'}
            </Text>
            <Text style={styles.sectionMeta}>
              {unlockedCount}/{achievements.length}
            </Text>
          </View>
          <Text style={styles.achieveSub}>
            {isRtl ? 'اضغط لمعرفة التفاصيل' : 'Tap for details'}
          </Text>
          <AnimatedPressable onPress={() => navigation.navigate('More', { screen: 'PerformanceAnalytics' })} activeOpacity={0.85}>
            <View style={styles.badgesGrid}>
              {achievements.map((ach) => {
                const diffStyle = ach.difficulty === 'easy' ? styles.badgeDiffEasy : ach.difficulty === 'medium' ? styles.badgeDiffMedium : styles.badgeDiffHard;
                return (
                  <TouchableOpacity
                    key={ach.id}
                    onPress={() => setSelectedAch(ach)}
                    activeOpacity={0.7}
                    style={[styles.badgeItem, ach.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}
                  >
                    <Text style={[styles.badgeIcon, !ach.unlocked && styles.badgeIconLocked]}>
                      {ach.icon}
                    </Text>
                    <Text style={[styles.badgeLabel, !ach.unlocked && styles.badgeLabelLocked]}>
                      {isRtl ? ach.labelAr : ach.labelEn}
                    </Text>
                    <Text style={[styles.badgeDiff, diffStyle, !ach.unlocked && { opacity: 0.4 }]}>
                      {ach.difficulty === 'easy' ? (isRtl ? 'سهل' : 'EASY') : ach.difficulty === 'medium' ? (isRtl ? 'متوسط' : 'MEDIUM') : (isRtl ? 'صعب' : 'HARD')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AnimatedPressable>
        </View></SlideUp>

        <View style={{ height: 48 }} />
      </ScrollView>

      <Modal visible={editing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}</Text>

            <Text style={styles.modalLabel}>{isRtl ? 'الاسم' : 'Name'}</Text>
            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder={isRtl ? 'اسمك' : 'Your name'}
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />
            </View>

            <Text style={styles.modalLabel}>{isRtl ? 'البريد الإلكتروني' : 'Email'}</Text>
            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder={isRtl ? 'بريدك الإلكتروني' : 'Your email'}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{isRtl ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>{isRtl ? 'حفظ' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedAch} transparent animationType="fade" onRequestClose={() => setSelectedAch(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedAch(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.achDetailCard}>
            {selectedAch && (
              <>
                <Text style={styles.achDetailIcon}>{selectedAch.icon}</Text>
                <Text style={styles.achDetailTitle}>
                  {isRtl ? selectedAch.labelAr : selectedAch.labelEn}
                </Text>
                <Text style={styles.achDetailDesc}>
                  {isRtl ? selectedAch.descAr : selectedAch.descEn}
                </Text>
                <View style={styles.achDetailRow}>
                  <View style={[
                    styles.achDetailDiff,
                    { backgroundColor: selectedAch.difficulty === 'easy' ? '#44CC8820' : selectedAch.difficulty === 'medium' ? '#FFB34720' : '#FF6B6B20' },
                  ]}>
                    <Text style={[
                      styles.achDetailDiffText,
                      { color: selectedAch.difficulty === 'easy' ? '#44CC88' : selectedAch.difficulty === 'medium' ? '#FFB347' : '#FF6B6B' },
                    ]}>
                      {selectedAch.difficulty === 'easy' ? (isRtl ? 'سهل' : 'EASY') : selectedAch.difficulty === 'medium' ? (isRtl ? 'متوسط' : 'MEDIUM') : (isRtl ? 'صعب' : 'HARD')}
                    </Text>
                  </View>
                  <Text style={[styles.achDetailStatus, { color: selectedAch.unlocked ? '#44CC88' : activeColors.textMuted }]}>
                    {selectedAch.unlocked
                      ? (isRtl ? '✓ مكتسبة' : '✓ Unlocked')
                      : (isRtl ? '🔒 مقفلة' : '🔒 Locked')}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
