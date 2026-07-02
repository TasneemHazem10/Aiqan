import { getData, storeData, KEYS } from './storage';

export interface DownloadItem {
  id: string;
  name: string;
  url: string;
  localUri: string;
  date: string;
  size?: number;
  type: 'audio' | 'video' | 'other';
}

export async function getDownloads(): Promise<DownloadItem[]> {
  return (await getData<DownloadItem[]>(KEYS.DOWNLOADS, [])) || [];
}

export async function addDownload(item: DownloadItem): Promise<void> {
  const existing = await getDownloads();
  const updated = [item, ...existing.filter(d => d.id !== item.id)];
  await storeData(KEYS.DOWNLOADS, updated);
}

export async function removeDownload(id: string): Promise<void> {
  const existing = await getDownloads();
  await storeData(KEYS.DOWNLOADS, existing.filter(d => d.id !== id));
}

export async function clearDownloads(): Promise<void> {
  await storeData(KEYS.DOWNLOADS, []);
}
