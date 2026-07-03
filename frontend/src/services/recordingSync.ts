import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { get, post, patch, del } from '../utils/api';
import { ENDPOINTS, API_BASE } from '../constants/api';
import { storeData, getData, KEYS } from '../utils/storage';
import { VoiceRecordingData } from '../types';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

export async function uploadRecording(recording: VoiceRecordingData): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(recording.uri);
    if (!fileInfo.exists) return false;

    const fileData = await FileSystem.readAsStringAsync(recording.uri, {
      encoding: 'base64',
    });

    const fileName = recording.uri.split('/').pop() || `${recording.id}.wav`;

    await post(ENDPOINTS.RECORDINGS, {
      name: recording.name,
      surahNumber: recording.surahNumber,
      surahName: recording.surahName,
      duration: recording.duration,
      fileData,
      fileName,
    });

    return true;
  } catch {
    return false;
  }
}

export async function fetchCloudRecordings(): Promise<VoiceRecordingData[]> {
  try {
    const res = await get<any[]>(ENDPOINTS.RECORDINGS);
    if (!res || !Array.isArray(res)) return [];

    return res.map((r: any) => ({
      id: r._id || r.id,
      name: r.name,
      surahNumber: r.surahNumber || 0,
      surahName: r.surahName || '',
      uri: r.uri,
      duration: r.duration || 0,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function deleteCloudRecording(id: string): Promise<boolean> {
  try {
    await del(ENDPOINTS.RECORDING(id));
    return true;
  } catch {
    return false;
  }
}

export async function renameCloudRecording(id: string, name: string): Promise<boolean> {
  try {
    await patch(ENDPOINTS.RECORDING(id), { name });
    return true;
  } catch {
    return false;
  }
}

export async function downloadCloudRecording(cloudUri: string, localId: string): Promise<string | null> {
  try {
    const dest = RECORDINGS_DIR + `${localId}.wav`;
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true }).catch(() => {});

    const fullUrl = API_BASE + cloudUri;

    const token = await getData<string>(KEYS.TOKEN);
    const downloadResult = await FileSystem.downloadAsync(fullUrl, dest, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return downloadResult.uri;
  } catch {
    return null;
  }
}

export async function syncRecordings(): Promise<VoiceRecordingData[]> {
  const localRecordings = await getData<VoiceRecordingData[]>(KEYS.VOICE_RECORDINGS, []) ?? [];
  const cloudRecordings = await fetchCloudRecordings();

  if (cloudRecordings.length === 0) return localRecordings;

  const mergedMap = new Map<string, VoiceRecordingData>();

  for (const rec of localRecordings) {
    mergedMap.set(rec.id, rec);
  }

  for (const rec of cloudRecordings) {
    const existing = mergedMap.get(rec.id);
    if (!existing) {
      const localUri = await downloadCloudRecording(rec.uri, rec.id);
      mergedMap.set(rec.id, { ...rec, uri: localUri || rec.uri });
    } else if (new Date(rec.createdAt) > new Date(existing.createdAt)) {
      // Cloud has newer version
      const localUri = await downloadCloudRecording(rec.uri, rec.id);
      mergedMap.set(rec.id, { ...rec, uri: localUri || rec.uri });
    }
  }

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Upload any local-only recordings that aren't on the cloud
  const cloudIds = new Set(cloudRecordings.map((r) => r.id));
  for (const rec of localRecordings) {
    if (!cloudIds.has(rec.id)) {
      await uploadRecording(rec);
    }
  }

  await storeData(KEYS.VOICE_RECORDINGS, merged);
  return merged;
}
