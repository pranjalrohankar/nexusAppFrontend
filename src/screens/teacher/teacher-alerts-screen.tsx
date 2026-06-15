import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AlertItem {
  id: string;
  dotColor: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export default function TeacherAlertsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(false);

  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', dotColor: '#EF4444', title: 'Class Starting Soon', desc: 'Data Science & ML class starts in 30 minutes.', time: '15 mins ago', read: false },
    { id: '2', dotColor: '#3B82F6', title: 'New Student Enrolled', desc: '2 students joined Full Stack Web Development.', time: '1 hour ago', read: false },
    { id: '3', dotColor: '#F59E0B', title: 'Student Query', desc: 'Rahul Kumar asked a question in Discussion.', time: '3 hours ago', read: false },
    { id: '4', dotColor: '#10B981', title: 'Schedule Updated', desc: 'UI/UX Design class rescheduled to Thursday 6:00 PM.', time: '5 hours ago', read: true },
    { id: '5', dotColor: '#8B5CF6', title: 'Milestone Achieved', desc: 'Your courses reached 100+ enrolments!', time: '1 day ago', read: true }
  ]);

  const handleMarkAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
    Alert.alert('Success', 'All notifications marked as read.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>Stay updated with your classes.</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 6,
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
});
