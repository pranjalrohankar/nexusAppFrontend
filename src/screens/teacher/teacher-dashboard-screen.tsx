import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

interface Props {
  onUploadRecording?: () => void;
  onUploadStudyMaterial?: () => void;
  userName?: string;
}

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1];

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function todayLabel() {
  const d = new Date();
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Returns full day names for this week e.g. ['Sunday','Monday',...]
function getThisWeekDayNames(): string[] {
  return [...DAY_NAMES]; // Sun–Sat, all 7 — used to match batch classDays against current week
}

// Normalize 'MON'/'Mon'/'Monday' -> 'Monday'
function normDay(d: string): string {
  const s = d.trim().substring(0, 3).toLowerCase();
  return DAY_NAMES.find(n => n.toLowerCase().startsWith(s)) ?? d;
}

export default function TeacherDashboardScreen({ onUploadRecording, onUploadStudyMaterial, userName = '' }: Props) {
  const [displayName, setDisplayName] = useState(userName || 'Teacher');
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, batchRes] = await Promise.all([
        api.getTeacherProfile().catch(() => null),
        api.getMyBatches().catch(() => null),
      ]);

      if (profileRes?.data?.name || profileRes?.name) {
        setDisplayName((profileRes?.data?.name || profileRes?.name).split(' ')[0]);
      } else if (userName) {
        setDisplayName(userName.split(' ')[0]);
      }

      const raw = Array.isArray(batchRes?.data) ? batchRes.data
        : Array.isArray(batchRes) ? batchRes : [];
      setBatches(raw);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [userName]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeBatches = batches.filter(b => b.status === 'ACTIVE');

  const totalStudents = batches.reduce((sum, b) => sum + (b.studentsCount ?? 0), 0);
  const activeCourses = [...new Set(activeBatches.map(b => b.selectCourse))].length;

  const weekDayNames = getThisWeekDayNames();
  const classesThisWeek = activeBatches.filter(b =>
    Array.isArray(b.classDays) && b.classDays.length > 0
  ).reduce((sum, b) => sum + b.classDays.filter((d: string) =>
    weekDayNames.includes(normDay(d))
  ).length, 0);

  const completedCount = batches.filter(b => b.status === 'COMPLETED').length;

  // ── Today's schedule ───────────────────────────────────────────────────────
  const todayName = DAY_NAMES[new Date().getDay()];
  const todayClasses = activeBatches.filter(b =>
    Array.isArray(b.classDays) && b.classDays.some((d: string) => normDay(d) === todayName)
  );

  const stats = [
    { label: 'Total Students', val: totalStudents, icon: 'people', iconBg: '#7B2CBF' },
    { label: 'Active Courses', val: activeCourses, icon: 'book', iconBg: '#F97316' },
    { label: 'Classes This Week', val: classesThisWeek, icon: 'calendar', iconBg: '#3B82F6' },
    { label: 'Completed', val: completedCount, icon: 'videocam', iconBg: '#22C55E' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <Text style={styles.welcomeText}>Welcome {displayName}!</Text>
        <Text style={styles.headerSubtitle}>Here's your teaching schedule for today</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* STATS GRID */}
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.statsGrid}>
            {stats.map((s, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.iconBg }]}>
                  <Ionicons name={s.icon as any} size={20} color="#FFF" />
                </View>
                <Text style={styles.statValue}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7B2CBF' }]} onPress={onUploadRecording}>
            <Ionicons name="videocam-outline" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>Upload Recordings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F97316' }]} onPress={onUploadStudyMaterial}>
            <Ionicons name="document-outline" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>Upload Study material</Text>
          </TouchableOpacity>
        </View>

        {/* TODAY'S SCHEDULE */}
        <LinearGradient
          colors={['#F9FAFB', 'rgba(250,245,255,0.4)', 'rgba(255,247,237,0.85)']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.scheduleCard}
        >
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleIcon}>
              <Ionicons name="calendar" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.scheduleTitle}>Today's Schedule</Text>
              <Text style={styles.scheduleDate}>{todayLabel()}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#7B2CBF" style={{ marginTop: 12 }} />
          ) : todayClasses.length === 0 ? (
            <View style={styles.noClassRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#9CA3AF" />
              <Text style={styles.noClassText}>No classes scheduled for today</Text>
            </View>
          ) : (
            todayClasses.map((b, i) => (
              <View key={b.id ?? i} style={styles.classRow}>
                <View style={styles.classBar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.classTitle}>{b.selectCourse}</Text>
                  <Text style={styles.classTime}>{b.classTimings ?? b.courseTimings ?? '—'}</Text>
                </View>
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              </View>
            ))
          )}
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },

  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 6 },
  welcomeText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 13, fontWeight: '600', color: '#E9D5FF', marginTop: 3 },

  scrollView: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 20 },

  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12, marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1E2937', marginBottom: 2 },
  statLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },

  // Quick Actions
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E2937', marginBottom: 14 },
  quickActionsRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  actionBtn: {
    flex: 1, height: 68, borderRadius: 20,
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Schedule
  scheduleCard: {
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#E9D5FF',
    overflow: 'hidden',
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  scheduleIcon: {
    width: 44, height: 44, backgroundColor: '#7B2CBF',
    borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  scheduleTitle: { fontSize: 17, fontWeight: '700', color: '#1E2937' },
  scheduleDate: { fontSize: 13, color: '#64748B', marginTop: 2 },

  classRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#FFF',
    borderRadius: 14, marginTop: 8,
  },
  classBar: { width: 4, height: 44, backgroundColor: '#7B2CBF', borderRadius: 4 },
  classTitle: { fontSize: 16, fontWeight: '700', color: '#1E2937' },
  classTime: { fontSize: 13, color: '#64748B', marginTop: 2 },
  todayBadge: {
    backgroundColor: '#F3E8FF', paddingVertical: 5,
    paddingHorizontal: 12, borderRadius: 20,
  },
  todayBadgeText: { color: '#7B2CBF', fontSize: 12, fontWeight: '700' },

  noClassRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  noClassText: { fontSize: 13, color: '#9CA3AF' },
});
