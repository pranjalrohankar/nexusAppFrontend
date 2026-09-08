import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const STORAGE_KEY_PREFIX = '@nexus_syllabus_completed_topics_';

function buildKey(courseKey: string, instructorName?: string, batchId?: number | string): string {
  if (batchId) {
    return `${STORAGE_KEY_PREFIX}batch_${batchId}`;
  }
  const normCourse = (courseKey || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (instructorName && instructorName.trim().length > 0) {
    const normInst = instructorName.toLowerCase().trim().replace(/\s+/g, '_');
    return `${STORAGE_KEY_PREFIX}${normCourse}_${normInst}`;
  }
  return `${STORAGE_KEY_PREFIX}${normCourse}`;
}

function parseTopicsData(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
      } catch (_) {}
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (trimmed.includes('\n')) {
      return trimmed.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (trimmed.length > 0) {
      return [trimmed];
    }
  }
  return [];
}

/**
 * Returns list of completed topic titles for a course/batch key, optional instructor name, and batchId.
 * Synchronizes with backend database while caching locally for high performance.
 */
export const getCompletedTopicsForCourse = async (
  courseKey: string,
  instructorName?: string,
  batchId?: number | string
): Promise<string[]> => {
  if (!courseKey && !batchId) return [];

  const allCompleted = new Set<string>();

  // 1. Read from local AsyncStorage cache first for immediate responsiveness
  try {
    const keysToTry: string[] = [];
    if (batchId) {
      keysToTry.push(buildKey(courseKey, instructorName, batchId));
    }
    if (courseKey) {
      keysToTry.push(buildKey(courseKey, instructorName));
      keysToTry.push(buildKey(courseKey));
    }

    for (const k of keysToTry) {
      const json = await AsyncStorage.getItem(k);
      if (json) {
        parseTopicsData(json).forEach(t => allCompleted.add(t));
      }
    }
  } catch (_) {}

  // 2. Fetch latest from Backend DB and merge
  try {
    let serverTopics: string[] = [];
    if (batchId) {
      const res = await api.getBatchCoveredTopics(batchId).catch(() => null);
      if (res && res.success && res.coveredTopics) {
        serverTopics = parseTopicsData(res.coveredTopics);
      }
    }

    if (serverTopics.length === 0 && courseKey) {
      const res = await api.getCourseCoveredTopics(courseKey).catch(() => null);
      if (res && res.success && res.coveredTopics) {
        serverTopics = parseTopicsData(res.coveredTopics);
      }
    }

    if (serverTopics.length > 0) {
      serverTopics.forEach(t => allCompleted.add(t));

      // Cache updated list back to local storage
      const finalArr = Array.from(allCompleted);
      const primaryKey = buildKey(courseKey, instructorName, batchId);
      await AsyncStorage.setItem(primaryKey, JSON.stringify(finalArr)).catch(() => {});
      if (courseKey) {
        await AsyncStorage.setItem(buildKey(courseKey), JSON.stringify(finalArr)).catch(() => {});
      }
    }
  } catch (_) {}

  return Array.from(allCompleted);
};

/**
 * Toggles a topic's completion status for a course/batch, instructor, and batchId.
 * Immediately saves to AsyncStorage and persists to backend database so Admin and all enrolled students see updates.
 */
export const toggleTopicCompleted = async (
  courseKey: string,
  topicName: string,
  instructorName?: string,
  batchId?: number | string
): Promise<string[]> => {
  if ((!courseKey && !batchId) || !topicName) return [];
  try {
    const current = await getCompletedTopicsForCourse(courseKey, instructorName, batchId);
    let updated: string[];
    if (current.includes(topicName)) {
      updated = current.filter(t => t !== topicName);
    } else {
      updated = [...current, topicName];
    }

    // 1. Save to local storage immediately
    const primaryKey = buildKey(courseKey, instructorName, batchId);
    const jsonVal = JSON.stringify(updated);
    await AsyncStorage.setItem(primaryKey, jsonVal).catch(() => {});
    if (courseKey) {
      const fallbackKey = buildKey(courseKey);
      await AsyncStorage.setItem(fallbackKey, jsonVal).catch(() => {});
    }

    // 2. Persist to Backend API asynchronously so Admin & Students get updated progress immediately
    const persistPromises: Promise<any>[] = [];
    if (batchId) {
      persistPromises.push(api.updateBatchCoveredTopics(batchId, updated).catch(e => {
        console.warn('Failed to update batch covered topics on backend:', e);
      }));
    }
    if (courseKey) {
      persistPromises.push(api.updateCourseCoveredTopics(courseKey, updated).catch(e => {
        console.warn('Failed to update course covered topics on backend:', e);
      }));
    }
    await Promise.allSettled(persistPromises);

    return updated;
  } catch (e) {
    console.error('Failed to toggle topic completed', e);
    return [];
  }
};

