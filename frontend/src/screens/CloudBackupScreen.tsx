import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get, post, apiHelper } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getData, storeData, KEYS } from '../utils/storage';
import { BackupRecord } from '../types';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CloudBackupScreen() {
  const navigation = useNavigation<any>();
  const { user, t, language } = useApp();
  const isRtl = language === 'ar';

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, paddingBottom: SPACING.sm },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.glassDark, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: SPACING.base },
    accountCard: { backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.base, ...SHADOWS.soft },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    accountInfo: { flex: 1 },
    accountName: { fontSize: FONT_SIZES.md, color: colors.textPrimary, fontWeight: '600' },
    accountEmail: { fontSize: FONT_SIZES.caption, color: colors.textSecondary, marginTop: 2 },
    accountMeta: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border },
    metaLabel: { fontSize: FONT_SIZES.micro, color: colors.textMuted, marginRight: SPACING.sm },
    metaValue: { fontSize: FONT_SIZES.caption, color: colors.textSecondary },
    backupNowCard: { backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.base, ...SHADOWS.soft },
    backupNowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: colors.gold, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, ...SHADOWS.card },
    backupNowBtnDisabled: { opacity: 0.6 },
    backupNowText: { fontSize: FONT_SIZES.md, color: colors.green, fontWeight: '700' },
    progressWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
    progressBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
    progressText: { fontSize: FONT_SIZES.caption, color: colors.gold, fontWeight: '600', width: 40, textAlign: 'right' },
    lastBackupText: { fontSize: FONT_SIZES.micro, color: colors.textMuted, textAlign: 'center', marginTop: SPACING.sm },
    syncCard: { backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.base },
    syncHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    syncTitle: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontWeight: '600' },
    syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    syncLabel: { fontSize: FONT_SIZES.small, color: colors.textSecondary },
    syncHint: { fontSize: FONT_SIZES.micro, color: colors.textMuted, marginTop: SPACING.xs },
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(229,57,53,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.base, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
    errorText: { color: colors.error, fontSize: FONT_SIZES.small, flex: 1 },
    sectionTitle: { fontSize: FONT_SIZES.md, color: colors.textPrimary, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.sm },
    loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.xxl },
    loadingText: { fontSize: FONT_SIZES.small, color: colors.textMuted },
    emptyCard: { alignItems: 'center', paddingVertical: SPACING.xxl, backgroundColor: colors.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.border },
    emptyText: { fontSize: FONT_SIZES.small, color: colors.textSecondary, marginTop: SPACING.sm },
    emptyHint: { fontSize: FONT_SIZES.micro, color: colors.textMuted, marginTop: SPACING.xs, textAlign: 'center', paddingHorizontal: SPACING.xl },
    backupCard: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.sm, borderWidth: 1, borderColor: colors.border },
    backupHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    backupInfo: { flex: 1 },
    backupDate: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontWeight: '600' },
    backupMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    backupSize: { fontSize: FONT_SIZES.micro, color: colors.textMuted },
    backupDot: { fontSize: FONT_SIZES.micro, color: colors.textMuted },
    backupPlatform: { fontSize: FONT_SIZES.micro, color: colors.textMuted },
    backupVersion: { fontSize: FONT_SIZES.micro, color: colors.textMuted },
    backupActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border },
    restoreBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, backgroundColor: COLORS.glassGold, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm },
    restoreText: { fontSize: FONT_SIZES.caption, color: colors.gold, fontWeight: '600' },
    deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, backgroundColor: 'rgba(229,57,53,0.1)', borderRadius: RADIUS.sm, paddingVertical: SPACING.sm },
    deleteText: { fontSize: FONT_SIZES.caption, color: colors.error, fontWeight: '600' },
  }));

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [autoBackup, setAutoBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<BackupRecord[]>(ENDPOINTS.BACKUP_LIST);
      setBackups(data || []);
      if (data && data.length > 0) {
        setLastBackup(data[0].createdAt);
      }
      const auto = await getData<boolean>(KEYS.CLOUD_BACKUP, false);
      setAutoBackup(auto ?? false);
    } catch (err: any) {
      setError(err.message || (isRtl ? 'فشل تحميل النسخ الاحتياطية' : 'Failed to load backups'));
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setBackupProgress(prev => Math.min(prev + 15, 85));
    }, 400);

    try {
      await post(ENDPOINTS.BACKUP_CREATE, {
        platform: Platform.OS,
        version: '1.0.0',
      });
      clearInterval(progressInterval);
      setBackupProgress(100);
      setTimeout(() => setBackupProgress(0), 600);
      await loadBackups();
    } catch (err: any) {
      clearInterval(progressInterval);
      setBackupProgress(0);
      setError(err.message || (isRtl ? 'فشل إنشاء النسخة الاحتياطية' : 'Backup failed'));
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = (backupId: string) => {
    Alert.alert(
      isRtl ? 'استعادة البيانات' : 'Restore Data',
      isRtl ? 'سيتم استبدال جميع البيانات المحلية. هل تريد المتابعة؟' : 'This will replace all local data. Continue?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRtl ? 'استعادة' : 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoring(backupId);
            setError(null);
            try {
              const result = await apiHelper.post(ENDPOINTS.BACKUP_RESTORE(backupId));
              if (result) {
                Alert.alert(
                  isRtl ? 'تم' : 'Done',
                  isRtl ? 'تمت استعادة البيانات بنجاح' : 'Data restored successfully'
                );
              }
            } catch (err: any) {
              setError(err.message || (isRtl ? 'فشل استعادة البيانات' : 'Restore failed'));
            } finally {
              setRestoring(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (backupId: string) => {
    Alert.alert(
      isRtl ? 'حذف النسخة' : 'Delete Backup',
      isRtl ? 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟' : 'Are you sure you want to delete this backup?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiHelper.post(ENDPOINTS.BACKUP_DELETE(backupId), { _method: 'DELETE' });
              setBackups(prev => prev.filter(b => b._id !== backupId));
            } catch (err: any) {
              setError(err.message || (isRtl ? 'فشل حذف النسخة' : 'Delete failed'));
            }
          },
        },
      ]
    );
  };

  const toggleAutoBackup = async (value: boolean) => {
    setAutoBackup(value);
    await storeData(KEYS.CLOUD_BACKUP, value);
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.title}>
              {isRtl ? 'النسخ الاحتياطي' : 'Cloud Backup'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <Ionicons name="person-circle" size={36} color={COLORS.gold} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{user?.name || (isRtl ? 'ضيف' : 'Guest')}</Text>
                  <Text style={styles.accountEmail}>{user?.email || (isRtl ? 'بريد غير مسجل' : 'No email')}</Text>
                </View>
              </View>
              <View style={styles.accountMeta}>
                <Text style={styles.metaLabel}>
                  {isRtl ? 'عضو منذ' : 'Member since'}
                </Text>
                <Text style={styles.metaValue}>{memberSince}</Text>
              </View>
            </View>

            <View style={styles.backupNowCard}>
              <AnimatedPressable
                style={[styles.backupNowBtn, backingUp && styles.backupNowBtnDisabled]}
                onPress={handleBackup}
                disabled={backingUp}
              >
                {backingUp ? (
                  <ActivityIndicator color={COLORS.green} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={22} color={COLORS.green} />
                    <Text style={styles.backupNowText}>
                      {isRtl ? 'نسخ احتياطي الآن' : 'Backup Now'}
                    </Text>
                  </>
                )}
              </AnimatedPressable>

              {backingUp && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${backupProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{backupProgress}%</Text>
                </View>
              )}

              {lastBackup && (
                <Text style={styles.lastBackupText}>
                  <Ionicons name="time" size={12} color={COLORS.textMuted} />{' '}
                  {isRtl ? 'آخر نسخة' : 'Last backup'}: {formatDate(lastBackup)}
                </Text>
              )}
            </View>

            <View style={styles.syncCard}>
              <View style={styles.syncHeader}>
                <Ionicons name="sync" size={18} color={COLORS.gold} />
                <Text style={styles.syncTitle}>
                  {isRtl ? 'المزامنة' : 'Sync'}
                </Text>
              </View>
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>
                  {isRtl ? 'نسخ احتياطي تلقائي' : 'Auto Backup'}
                </Text>
                <Switch
                  value={autoBackup}
                  onValueChange={toggleAutoBackup}
                  trackColor={{ false: COLORS.border, true: COLORS.gold }}
                  thumbColor={autoBackup ? COLORS.darkGreen : COLORS.textMuted}
                />
              </View>
              <Text style={styles.syncHint}>
                {isRtl
                  ? 'سيتم إنشاء نسخة احتياطية تلقائياً بشكل دوري'
                  : 'Automatic periodic backup of your data'}
              </Text>
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {isRtl ? 'سجل النسخ الاحتياطية' : 'Backup History'}
            </Text>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.gold} />
                <Text style={styles.loadingText}>
                  {isRtl ? 'جار التحميل...' : 'Loading...'}
                </Text>
              </View>
            ) : backups.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cloud-offline" size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  {isRtl ? 'لا توجد نسخ احتياطية بعد' : 'No backups yet'}
                </Text>
                <Text style={styles.emptyHint}>
                  {isRtl ? 'اضغط على "نسخ احتياطي الآن" لإنشاء أول نسخة' : 'Tap "Backup Now" to create your first backup'}
                </Text>
              </View>
            ) : (
              backups.map((backup) => (
                <View key={backup._id} style={styles.backupCard}>
                  <View style={styles.backupHeader}>
                    <Ionicons name="cloud-done" size={20} color={COLORS.gold} />
                    <View style={styles.backupInfo}>
                      <Text style={styles.backupDate}>{formatDate(backup.createdAt)}</Text>
                      <View style={styles.backupMeta}>
                        <Text style={styles.backupSize}>{formatSize(backup.size)}</Text>
                        <Text style={styles.backupDot}>·</Text>
                        <Text style={styles.backupPlatform}>
                          {backup.platform === 'ios' ? 'iOS' : backup.platform === 'android' ? 'Android' : backup.platform}
                        </Text>
                        <Text style={styles.backupDot}>·</Text>
                        <Text style={styles.backupVersion}>v{backup.version}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.backupActions}>
                    <AnimatedPressable
                      style={styles.restoreBtn}
                      onPress={() => handleRestore(backup._id)}
                      disabled={restoring === backup._id}
                    >
                      {restoring === backup._id ? (
                        <ActivityIndicator size="small" color={COLORS.gold} />
                      ) : (
                        <>
                          <Ionicons name="refresh" size={16} color={COLORS.gold} />
                          <Text style={styles.restoreText}>
                            {isRtl ? 'استعادة' : 'Restore'}
                          </Text>
                        </>
                      )}
                    </AnimatedPressable>
                    <AnimatedPressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(backup._id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      <Text style={styles.deleteText}>
                        {isRtl ? 'حذف' : 'Delete'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                </View>
              ))
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}


