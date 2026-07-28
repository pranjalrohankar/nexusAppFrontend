import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@nexus_syllabus_completed_topics_';

function buildKey(courseKey: string, instructorName?: string): string {
  const normCourse = (courseKey || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (instructorName && instructorName.trim().length > 0) {
    const normInst = instructorName.toLowerCase().trim().replace(/\s+/g, '_');
    return `${STORAGE_KEY_PREFIX}${normCourse}_${normInst}`;
  }
  return `${STORAGE_KEY_PREFIX}${normCourse}`;
}

/**
 * Returns list of completed topic titles for a course/batch key and optional instructor name
 */
export const getCompletedTopicsForCourse = async (courseKey: string, instructorName?: string): Promise<string[]> => {
  if (!courseKey) return [];
  try {
    const keysToTry = [
      buildKey(courseKey, instructorName),
      buildKey(courseKey),
    ];
    if (courseKey.includes(' ')) {
      const shortKey = courseKey.split(' ')[0];
      keysToTry.push(buildKey(shortKey, instructorName));
      keysToTry.push(buildKey(shortKey));
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
 * Toggles a topic's completion status for a course/batch and instructor
 */
export const toggleTopicCompleted = async (courseKey: string, topicName: string, instructorName?: string): Promise<string[]> => {
  if (!courseKey || !topicName) return [];
  try {
    const current = await getCompletedTopicsForCourse(courseKey, instructorName);
    let updated: string[];
    if (current.includes(topicName)) {
      updated = current.filter(t => t !== topicName);
    } else {
      updated = [...current, topicName];
    }

    const primaryKey = buildKey(courseKey, instructorName);
    const fallbackKey = buildKey(courseKey);
    const jsonVal = JSON.stringify(updated);

    await AsyncStorage.setItem(primaryKey, jsonVal);
    await AsyncStorage.setItem(fallbackKey, jsonVal);

    if (courseKey.includes(' ')) {
      const shortKey = courseKey.split(' ')[0];
      await AsyncStorage.setItem(buildKey(shortKey, instructorName), jsonVal);
      await AsyncStorage.setItem(buildKey(shortKey), jsonVal);
    }

    return updated;
  } catch (e) {
    console.error('Failed to toggle topic completed', e);
    return [];
  }
};
