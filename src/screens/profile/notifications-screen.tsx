import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';

interface NotificationsScreenProps {
  onBack: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function getIconForTitle(title: string): { iconName: string; iconColor: string; iconBg: string } {
  if (title.includes('Material')) return { iconName: 'book', iconColor: '#7B2CBF', iconBg: '#FAF5FF' };
  if (title.includes('Class') || title.includes('Live')) return { iconName: 'videocam', iconColor: '#EF4444', iconBg: '#FEE2E2' };
  if (title.includes('Reminder')) return { iconName: 'calendar', iconColor: '#10B981', iconBg: '#ECFDF5' };
  return { iconName: 'notifications', iconColor: '#FF7A00', iconBg: '#FFF7ED' };
}

export default function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [achievementsEnabled, setAchievementsEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [notifsData, upcomingData] = await Promise.all([
        api.getStudentNotifications().catch(() => []),
        api.getStudentUpcomingClasses().catch(() => []),
      ]);

      const apiNotifs: any[] = Array.isArray(notifsData) ? notifsData : [];

      // Build class reminder notifications from upcoming classes (not stored in DB)
      const classNotifs: any[] = ((upcomingData as any[]) ?? []).map((c: any, i: number) => ({
        id: `class-${i}`,
        title: c.isToday ? 'Live Class Starting Soon' : 'Class Reminder',
        message: c.isToday
          ? `${c.course} class is today at ${c.classTimings}`
          : `${c.course} class tomorrow at ${c.classTimings}`,
        createdAt: new Date().toISOString(),
        seen: false,
        isLocal: true,
      }));

      setNotifications([...classNotifs, ...apiNotifs]);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const unreadCount = notifications.filter(n => !n.seen).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER BANNER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount > 0 ? `${unreadCount} New` : 'All Read'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. TOGGLES CARD */}
        <View style={styles.togglesCard}>
          {/* Toggle 1 */}
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIconContainer, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="notifications-outline" size={20} color="#7B2CBF" />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Push Notifications</Text>
              <Text style={styles.toggleSubtitle}>Receive alerts on your device</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={pushEnabled ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Toggle 2 */}
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIconContainer, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="calendar-outline" size={20} color="#FF7A00" />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Class Reminders</Text>
              <Text style={styles.toggleSubtitle}>Get notified before classes</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={remindersEnabled ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Toggle 3 */}
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="ribbon-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Achievements</Text>
              <Text style={styles.toggleSubtitle}>Badge and milestone alerts</Text>
            </View>
            <Switch
              value={achievementsEnabled}
              onValueChange={setAchievementsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={achievementsEnabled ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Toggle 4 (No bottom border) */}
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.toggleIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Messages</Text>
              <Text style={styles.toggleSubtitle}>Chat and announcements</Text>
            </View>
            <Switch
              value={messagesEnabled}
              onValueChange={setMessagesEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={messagesEnabled ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        {/* 3. RECENT SECTION HEADER */}
        <Text style={styles.sectionHeader}>Recent</Text>

        {/* 4. NOTIFICATIONS LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 20 }} />
        ) : notifications.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="notifications-off-outline" size={40} color="#D1D5DB" />
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>No notifications yet</Text>
          </View>
        ) : (
        <View style={styles.notificationsList}>
          {notifications.map((item) => {
            const { iconName, iconColor, iconBg } = getIconForTitle(item.title ?? '');
            const isUnread = !item.seen;
            return (
            <View key={String(item.id)} style={[styles.notificationCard, isUnread && styles.unreadBorder]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                  <Ionicons name={iconName as any} size={18} color={iconColor} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.message}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardTime}>
                {item.isLocal ? 'Today' : item.createdAt ? relativeTime(item.createdAt) : ''}
              </Text>
            </View>
            );
          })}
        </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
  header: {
    backgroundColor: '#7B2CBF',
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
    marginLeft: 16,
  },
  badgeContainer: {
    backgroundColor: '#FF7A00',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  togglesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  unreadBorder: {
    borderColor: '#D8B4FE', // Soft purple border for unread notifications
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  cardTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 8,
    marginLeft: 48,
    fontWeight: '500',
  },
});
