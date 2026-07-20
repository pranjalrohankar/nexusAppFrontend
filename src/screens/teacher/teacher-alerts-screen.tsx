import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

interface AlertItem {
  id: string;
  dotColor: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const DOT_COLORS: Record<string, string> = {
  'Class Starting Soon': '#EF4444',
  'New Student Enrolled': '#3B82F6',
  'Student Query': '#F59E0B',
  'Schedule Updated': '#10B981',
  'Milestone Achieved': '#8B5CF6',
};

function getDefaultDotColor(title: string): string {
  return DOT_COLORS[title] ?? '#7B2CBF';
}

function formatRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export default function TeacherAlertsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api.getTeacherNotifications();
      const list: any[] = Array.isArray(data) ? data : [];
      setAlerts(
        list.map((n: any) => ({
          id: String(n.id),
          dotColor: getDefaultDotColor(n.title),
          title: n.title ?? 'Notification',
          desc: n.message ?? '',
          time: n.createdAt ? formatRelativeTime(n.createdAt) : '',
          read: n.seen ?? false,
        }))
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead('TEACHER');
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      Alert.alert('Success', 'All notifications marked as read.');
    } catch {
      Alert.alert('Error', 'Failed to mark notifications as read.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
          ]}
          locations={[0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>Stay updated with your classes.</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7B2CBF']} />}
      >
        {/* PREFERENCE TOGGLES */}
        <View style={styles.preferenceCard}>
          <Text style={styles.cardTitle}>Notification Preferences</Text>

          {/* Toggle 1: Push */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleDesc}>Receive alerts on your device</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={pushEnabled ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>

          {/* Toggle 2: Reminders */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Class Reminders</Text>
              <Text style={styles.toggleDesc}>30 mins before class starts</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={remindersEnabled ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>

          {/* Toggle 3: Messages */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Student Messages</Text>
              <Text style={styles.toggleDesc}>Questions and discussions</Text>
            </View>
            <Switch
              value={messagesEnabled}
              onValueChange={setMessagesEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={messagesEnabled ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* ALERTS FEED LIST */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 20 }} />
        ) : alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
        <View style={styles.alertsContainer}>
          {alerts.map((item) => (
            <View key={item.id} style={[styles.alertCard, item.read && styles.alertCardRead]}>
              <View style={styles.alertHeaderRow}>
                <View style={styles.titleWithDot}>
                  <View style={[styles.statusDot, { backgroundColor: item.dotColor }]} />
                  <Text style={[styles.alertCardTitle, item.read && styles.alertTextRead]}>{item.title}</Text>
                </View>
                {!item.read && <View style={styles.unreadPill} />}
              </View>
              <Text style={styles.alertDesc}>{item.desc}</Text>
              <View style={styles.alertFooter}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={styles.alertTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
        )}

        {/* MARK ALL READ LINK */}
        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markReadBtnText}>Mark All as Read</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  headerAccentLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E9D5FF',
    marginTop: 3,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  // Toggles preference card
  preferenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleTextCol: {
    flex: 0.8,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  // Section Header
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  alertsContainer: {
    gap: 12,
  },
  // Alert Card
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  alertCardRead: {
    opacity: 0.8,
    backgroundColor: '#F9FAFB',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  alertTextRead: {
    color: '#4B5563',
  },
  unreadPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  alertDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 12,
    paddingLeft: 16, // offset to match dot alignment
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 16,
  },
  alertTime: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Mark all read button
  markReadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  markReadBtnText: {
    color: '#7B2CBF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
