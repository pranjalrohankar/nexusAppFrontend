import AsyncStorage from '@react-native-async-storage/async-storage';

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

/**
 * Returns list of completed topic titles for a course/batch key, optional instructor name, and batchId
 */
export const getCompletedTopicsForCourse = async (
  courseKey: string,
  instructorName?: string,
  batchId?: number | string
): Promise<string[]> => {
  if (!courseKey && !batchId) return [];
  try {
    const keysToTry: string[] = [];
    if (batchId) {
      keysToTry.push(buildKey(courseKey, instructorName, batchId));
    } else {
      keysToTry.push(buildKey(courseKey, instructorName));
      keysToTry.push(buildKey(courseKey));
    }

    const allCompleted = new Set<string>();
    for (const k of keysToTry) {
      const json = await AsyncStorage.getItem(k);
      if (json) {
        try {
          const arr: string[] = JSON.parse(json);
          arr.forEach(t => allCompleted.add(t));
        } catch (_) {}
      }
    }
    return Array.from(allCompleted);
  } catch (e) {
    console.error('Failed to get completed topics', e);
    return [];
  }
};

/**
 * Toggles a topic's completion status for a course/batch, instructor, and batchId
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

    const primaryKey = buildKey(courseKey, instructorName, batchId);
    const jsonVal = JSON.stringify(updated);

    await AsyncStorage.setItem(primaryKey, jsonVal);
    if (!batchId) {
      const fallbackKey = buildKey(courseKey);
      await AsyncStorage.setItem(fallbackKey, jsonVal);
    }

    return updated;
  } catch (e) {
    console.error('Failed to toggle topic completed', e);
    return [];
  }
};
