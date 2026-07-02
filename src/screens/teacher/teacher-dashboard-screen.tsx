import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';   // ← Added
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface TeacherDashboardScreenProps {
  onViewSchedule?: () => void;
  onUploadRecording?: () => void;   // ← Add this line
  onUploadStudyMaterial?: () => void;
  userName?: string;
}

export default function TeacherDashboardScreen({ onViewSchedule, onUploadRecording, onUploadStudyMaterial, userName = '' }: TeacherDashboardScreenProps) {
  const navigation = useNavigation();   // ← Added
  const [isLive, setIsLive] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  useEffect(() => {
    api.getTeacherProfile()
      .then((res: any) => setTeacherProfile(res?.data ?? null))
      .catch(() => { });
  }, []);

  const displayName = teacherProfile?.name || userName || 'Priya';

  const stats = [
    { label: 'Total Students', val: '156', icon: 'people', bgColor: '#F3E8FF', iconBg: '#7B2CBF', iconColor: '#FFFFFF' },
    { label: 'Active Courses', val: '3', icon: 'book', bgColor: '#FEF3E8', iconBg: '#F97316', iconColor: '#FFFFFF' },
    { label: 'Classes This Week', val: '8', icon: 'calendar', bgColor: '#EFF6FF', iconBg: '#3B82F6', iconColor: '#FFFFFF' },
    { label: 'Completed', val: '24', icon: 'videocam', bgColor: '#F0FDF4', iconBg: '#22C55E', iconColor: '#FFFFFF' },
  ];

  const handleStartClass = () => {
    setIsLive(!isLive);
    if (!isLive) {
      Alert.alert('Live Stream Started', 'You are now broadcasting live to Data Science & ML (Batch A).');
    } else {
      Alert.alert('Broadcast Stopped', 'Live class has ended.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* HEADER */}
      {/* HEADER */}
      <View style={styles.header}>
        {/* Gradient Accent Line - Matching your image */}
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

        <Text style={styles.welcomeText}>Welcome {displayName.split(' ')[0]}!</Text>
        <Text style={styles.headerSubtitle}>Here's your teaching schedule for today</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.iconColor} />
              </View>
              <Text style={styles.statValue}>{stat.val}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* QUICK ACTIONS - Latest Fixed Version */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.uploadRecordingsBtn]}
            onPress={onUploadRecording}          >
            <View style={styles.actionContent}>
              <Ionicons name="videocam-outline" size={28} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Upload Recordings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.uploadMaterialBtn]}
            onPress={onUploadStudyMaterial}   // ← Changed to prop
          >
            <View style={styles.actionContent}>
              <Ionicons name="document-outline" size={28} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Upload Study material</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TODAY'S SCHEDULE */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleIconContainer}>
              <Ionicons name="calendar" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.scheduleTitle}>Today's Schedule</Text>
              <Text style={styles.scheduleDate}>Monday, May 26, 2026</Text>
            </View>
          </View>

          <View style={styles.classCard}>
            <View style={styles.classCardContent}>
              <View style={styles.classLeft}>
                <View style={styles.classBar} />
                <View>
                  <Text style={styles.classTitle}>Data Science & ML</Text>
                  <Text style={styles.classTime}>8:00 PM - 10:00 PM</Text>
                </View>
              </View>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 24,
  },
  headerAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  welcomeText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 15, color: '#E9D5FF', marginTop: 4, fontWeight: '500' },
  scrollView: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1E2937', marginBottom: 2 },
  statLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },

  // Quick Actions
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2937',
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  uploadRecordingsBtn: { backgroundColor: '#7B2CBF' },
  uploadMaterialBtn: { backgroundColor: '#F97316' },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 30,
    gap: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'left',
  },

  // Schedule
  scheduleSection: { marginBottom: 32 },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scheduleIconContainer: {
    width: 42,
    height: 42,
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleTitle: { fontSize: 18, fontWeight: '700', color: '#1E2937' },
  scheduleDate: { fontSize: 14, color: '#64748B' },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  classCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  classBar: { width: 5, height: 48, backgroundColor: '#7B2CBF', borderRadius: 4 },
  classTitle: { fontSize: 17, fontWeight: '700', color: '#1E2937' },
  classTime: { fontSize: 14, color: '#64748B', marginTop: 3 },
  todayBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  todayBadgeText: { color: '#15803D', fontSize: 13, fontWeight: '700' },

  bottomSpacer: { height: 40 },
});