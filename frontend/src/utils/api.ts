import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import { ApiResponse } from '../types';

const CACHE_PREFIX = 'aiqan_api_cache_';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('aiqan_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('aiqan_token');
      await AsyncStorage.removeItem('aiqan_user');
    }
    return Promise.reject(classifyError(error));
  }
);

function classifyError(error: any): Error {
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
    const err = new Error('NETWORK_ERROR');
    (err as any).isNetworkError = true;
    return err;
  }
  return error;
}

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // cache write failures are non-critical
  }
}

async function tryWithRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err.isNetworkError && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Request failed');
}

export async function get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
  const response = await tryWithRetry(() => api.get<ApiResponse<T>>(endpoint, { params }));
  if (!response.data.success) {
    throw new Error(response.data.error || 'Request failed');
  }
  return response.data.data as T;
}

export async function getCached<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  const cacheKey = endpoint + (params ? JSON.stringify(params) : '');
  const cached = await getFromCache<T>(cacheKey);
  if (cached !== null) return cached;

  try {
    const data = await get<T>(endpoint, params);
    await setCache(cacheKey, data, ttl);
    return data;
  } catch (err: any) {
    if (err.isNetworkError) {
      const stale = await getFromCache<T>(cacheKey + '_stale');
      if (stale !== null) return stale;
    }
    throw err;
  }
}

export async function getWithStale<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<{ data: T; fromCache: boolean }> {
  const cacheKey = endpoint + (params ? JSON.stringify(params) : '');
  const cached = await getFromCache<T>(cacheKey);
  if (cached !== null) return { data: cached, fromCache: true };

  try {
    const data = await get<T>(endpoint, params);
    await setCache(cacheKey, data, ttl);
    return { data, fromCache: false };
  } catch (err: any) {
    if (err.isNetworkError) {
      const stale = await getFromCache<T>(cacheKey + '_stale');
      if (stale !== null) return { data: stale, fromCache: true };
    }
    throw err;
  }
}

export async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await api.post<ApiResponse<T>>(endpoint, body);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Request failed');
  }
  return response.data.data as T;
}

export async function patch<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await api.patch<ApiResponse<T>>(endpoint, body);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Request failed');
  }
  return response.data.data as T;
}

export async function del<T = void>(endpoint: string): Promise<T> {
  const response = await api.delete<ApiResponse<T>>(endpoint);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Request failed');
  }
  return response.data.data as T;
}

export async function invalidateCache(pattern?: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) =>
      k.startsWith(CACHE_PREFIX) && (!pattern || k.includes(pattern))
    );
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // non-critical
  }
}

export default api;

export const apiHelper = { get, post, patch, del, getCached, getWithStale, invalidateCache };
export { apiHelper as api };
