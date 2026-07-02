import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  Alert, StatusBar, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio, Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, SlideUp } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';
import { getDownloads, removeDownload, clearDownloads, DownloadItem } from '../utils/downloads';

function formatBytes(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadsScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    clearBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.2)' },
    clearBtnText: { fontSize: 12, color: colors.error, fontWeight: '600' },
    list: { padding: 14 },
    card: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    cardInfo: { flex: 1, marginRight: 12 },
    cardName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    cardDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    cardSize: { fontSize: 11, color: colors.gold, marginTop: 1 },
    cardActions: { flexDirection: 'row', gap: 8 },
    playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { color: colors.textMuted, fontSize: 14 },
  }));

  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [videoItem, setVideoItem] = useState<DownloadItem | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video | null>(null);

  useEffect(() => {
    loadDownloads();
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) { soundRef.current.unloadAsync(); soundRef.current = null; }
    };
  }, []);

  const loadDownloads = async () => {
    const items = await getDownloads();
    setDownloads(items);
  };

  const stopCurrentSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  };

  const playDownload = async (item: DownloadItem) => {
    if (item.type === 'video') {
      setVideoItem(item);
      return;
    }
    try {
      if (playing === item.id) {
        await stopCurrentSound();
        setPlaying(null);
        return;
      }
      await stopCurrentSound();
      const { sound } = await Audio.Sound.createAsync({ uri: item.localUri });
      soundRef.current = sound;
      await sound.playAsync();
      setPlaying(item.id);
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlaying(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      Alert.alert('Error', 'Could not play audio');
    }
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.stopAsync();
      videoRef.current = null;
    }
    setVideoItem(null);
  };

  const deleteDownload = async (item: DownloadItem) => {
    try {
      if (playing === item.id) await stopCurrentSound();
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      await removeDownload(item.id);
      await loadDownloads();
    } catch {
      Alert.alert('Error', 'Could not delete file');
    }
  };

  const clearAll = async () => {
    Alert.alert(
      language === 'ar' ? 'مسح الكل' : 'Clear All',
      language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            await stopCurrentSound();
            for (const d of downloads) {
              await FileSystem.deleteAsync(d.localUri, { idempotent: true }).catch(() => {});
            }
            await clearDownloads();
            setDownloads([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name={language === 'ar' ? 'chevron-forward' : 'chevron-back'} size={20} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('more.downloads')}</Text>
          {downloads.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>{t('common.delete')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FadeIn>
      <FlatList
        data={downloads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: DownloadItem }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
              {item.size && <Text style={styles.cardSize}>{formatBytes(item.size)}</Text>}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.playBtn} onPress={() => playDownload(item)}>
                <Ionicons
                  name={item.type === 'video' ? 'videocam' : playing === item.id ? 'stop' : 'play'}
                  size={16}
                  color={COLORS.darkGreen}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteDownload(item)}>
                <Ionicons name="trash" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <FadeIn>
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </View>
          </FadeIn>
        }
      />
      </FadeIn>

      <Modal visible={!!videoItem} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}
            onPress={closeVideo}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {videoItem && (
            <Video
              ref={videoRef}
              source={{ uri: videoItem.localUri }}
              style={{ width: '100%', aspectRatio: 9 / 16 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
