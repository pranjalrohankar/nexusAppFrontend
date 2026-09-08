import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Platform, StatusBar, ActivityIndicator, Linking, TextInput, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

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
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

// Returns full day names for this week e.g. ['Sunday','Monday',...]
function getThisWeekDayNames(): string[] {
  return [...DAY_NAMES];
}

// Normalize 'MON'/'Mon'/'Monday' -> 'Monday'
function normDay(d: string): string {
  const s = d.trim().substring(0, 3).toLowerCase();
  return DAY_NAMES.find(n => n.toLowerCase().startsWith(s)) ?? d;
}

interface Props {
  userName?: string;
  onUploadRecording?: () => void;
  onUploadStudyMaterial?: () => void;
  onOpenNotifications?: () => void;
  onViewStudentMarks?: () => void;
}

export default function TeacherDashboardScreen({ onUploadRecording, onUploadStudyMaterial, onOpenNotifications, onViewStudentMarks, userName = '' }: Props) {
  const [displayName, setDisplayName] = useState(userName || 'Teacher');
  const [batches, setBatches] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Google Meet States
  const [meetLink, setMeetLink] = useState('');
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [inputLink, setInputLink] = useState('');

  const loadMeetLink = async () => {
    try {
      const saved = await AsyncStorage.getItem('NEXUS_GOOGLE_MEET_LINK');
      if (saved) {
        setMeetLink(saved);
        setInputLink(saved);
      }
    } catch (_) {}
  };

  const saveMeetLink = async () => {
    try {
      let url = inputLink.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      await AsyncStorage.setItem('NEXUS_GOOGLE_MEET_LINK', url);
      setMeetLink(url);
      setShowMeetModal(false);
      Alert.alert('Success', 'Google Meet link updated successfully!');
    } catch (_) {
      Alert.alert('Error', 'Failed to save link.');
    }
  };

  const openMeetLink = () => {
    if (!meetLink) {
      Alert.alert('No Link Set', 'Please set a Google Meet link first.');
      return;
    }
    Linking.openURL(meetLink).catch(() => {
      Alert.alert('Error', 'Could not open the Google Meet link. Please verify it is a valid URL.');
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    await loadMeetLink();
    try {
      const [profileRes, batchRes] = await Promise.all([
        api.getTeacherProfile().catch(() => null),
        api.getMyBatches().catch(() => null),
      ]);

      const profileData = profileRes?.data ?? profileRes;
      if (profileData?.name) {
        setDisplayName(profileData.name.split(' ')[0]);
      } else if (userName) {
        setDisplayName(userName.split(' ')[0]);
      }
      setProfile(profileData);

      const raw = Array.isArray(batchRes?.data) ? batchRes.data
        : Array.isArray(batchRes) ? batchRes : [];
      setBatches(raw);

      // Fetch enrollment count per assigned course directly from enrollment API
      const courses: any[] = profileData?.assignedCourses ?? [];
      if (courses.length > 0) {
        const counts = await Promise.all(
          courses.map((c: any) =>
            api.getEnrollmentCount(c.title).catch(() => ({ count: 0 }))
          )
        );
        const map: Record<string, number> = {};
        courses.forEach((c: any, i: number) => {
          map[c.title.toLowerCase()] = counts[i]?.count ?? 0;
        });
        setCourseEnrollments(map);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [userName]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeBatches = batches.filter(b => b.status === 'ACTIVE');

  // Use profile.studentsCount — counts unique enrollments across all assigned courses (no double-counting)
  const totalStudents = profile?.studentsCount ?? 0;
  // Use profile.assignedCourses for active course count (courses explicitly assigned to this teacher)
  const activeCourses = profile?.coursesCount ?? profile?.assignedCourses?.length ?? 0;

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
        <View style={styles.headerTopRow}>
          <Text style={styles.logoText}>
            NE<Text style={styles.logoTextGold}>X</Text>US
          </Text>
          <TouchableOpacity style={styles.iconButton} onPress={onOpenNotifications}>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
        </View>
        <Text style={styles.welcomeText}>Welcome {displayName}!</Text>
        <Text style={styles.headerSubtitle}>Here&apos;s your teaching schedule for today</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* STATS GRID */}
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.statsGrid}>
            {stats.map((s, i) => {
              const isTotalStudents = s.label === 'Total Students';
              const CardWrapper = isTotalStudents ? TouchableOpacity : View;
              return (
                <CardWrapper
                  key={i}
                  style={styles.statCard}
                  onPress={isTotalStudents ? onViewStudentMarks : undefined}
                  activeOpacity={isTotalStudents ? 0.7 : 1}
                >
                  <View style={[styles.statIcon, { backgroundColor: s.iconBg }]}>
                    <Ionicons name={s.icon as any} size={20} color="#FFF" />
                  </View>
                  <Text style={styles.statValue}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  {isTotalStudents && (
                    <View style={styles.clickableIndicator}>
                      <Ionicons name="chevron-forward" size={14} color="#7B2CBF" />
                    </View>
                  )}
                </CardWrapper>
              );
            })}
          </View>
        )}

        {/* MY COURSES */}
        {!loading && profile?.assignedCourses?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <View style={{ marginBottom: 28 }}>
              {profile.assignedCourses.map((c: any, i: number) => {
                const enrolled = courseEnrollments[c.title?.toLowerCase()] ?? 0;
                return (
                  <View key={c.courseId ?? i} style={styles.courseRow}>
                    <View style={styles.courseIconWrap}>
                      <Ionicons name="book" size={18} color="#7B2CBF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseTitle}>{c.title}</Text>
                      {c.category ? <Text style={styles.courseCategory}>{c.category}</Text> : null}
                    </View>
                    <View style={styles.enrollBadge}>
                      <Ionicons name="people" size={13} color="#7B2CBF" />
                      <Text style={styles.enrollBadgeText}>{enrolled} students</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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
              <Text style={styles.scheduleTitle}>Today&apos;s Schedule</Text>
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

  meetCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  meetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  meetIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  meetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  meetEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetJoinBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetJoinBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  modalSaveBtn: {
    backgroundColor: '#7B2CBF',
  },
  modalCancelText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '600',
  },

  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
       paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 24,
  },
  headerAccentLine: { height: 4, marginBottom: 10 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoTextGold: {
    color: '#FFB703',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB703',
  },
  welcomeText: { fontSize: 25, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF', marginTop: 4 },
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
    position: 'relative',
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

  // My Courses
  courseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  courseIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
  },
  courseTitle: { fontSize: 14, fontWeight: '700', color: '#1E2937' },
  courseCategory: { fontSize: 12, color: '#64748B', marginTop: 2 },
  enrollBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3E8FF', paddingVertical: 5,
    paddingHorizontal: 10, borderRadius: 20,
  },
  enrollBadgeText: { fontSize: 12, fontWeight: '700', color: '#7B2CBF' },

  clickableIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
