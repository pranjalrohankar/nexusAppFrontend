import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Platform, Linking, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1];

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function normDay(d: string): string {
  const s = d.trim().substring(0, 3).toLowerCase();
  return DAY_NAMES.find(n => n.toLowerCase().startsWith(s)) ?? d;
}

function getWeekRange(weekOffset: number) {
  const today = new Date();
  const day = today.getDay();
  const dayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - dayOffset + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function formatWeekRange(monday: Date, sunday: Date) {
  const m = `${MONTH_NAMES[monday.getMonth()]} ${monday.getDate()}`;
  const s = `${MONTH_NAMES[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  return `${m} - ${s}`;
}

interface ClassItem {
  courseTitle: string;
  batchName: string;
  time: string;
  studentsCount: number;
  meetLink: string;
}

interface DayAgenda {
  dayName: string;
  isToday: boolean;
  classes: ClassItem[];
}

export default function TeacherScheduleScreen() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMyBatches();
      const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      console.log('MY_BATCHES_RAW', JSON.stringify(raw));
      setBatches(raw);
    } catch (e) { console.log('MY_BATCHES_ERR', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { monday, sunday } = getWeekRange(weekOffset);
  const todayName = DAY_NAMES[new Date().getDay()];

  // Parse LocalDate from backend — can be "2026-07-20" string or [2026,7,20] array
  const parseLocal = (s: any): Date | null => {
    if (!s) return null;
    if (Array.isArray(s)) return new Date(s[0], s[1] - 1, s[2]);
    const parts = String(s).split('-').map(Number);
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    return null;
  };

  // Build timetable from real batch data — filter by selected week
  const timetable: DayAgenda[] = DAY_NAMES.map(day => {
    const classes: ClassItem[] = batches
      .filter(b => {
        const days = Array.isArray(b.classDays) ? b.classDays : [];
        if (days.length === 0) return false;
        if (!days.some((d: string) => normDay(String(d)) === day)) return false;
        const bStart = parseLocal(b.startDate);
        const bEnd = parseLocal(b.endDate);
        if (bStart && sunday < bStart) return false;
        if (bEnd && monday > bEnd) return false;
        return true;
      })
      .map(b => ({
        courseTitle: b.selectCourse ?? b.courseName ?? '—',
        batchName: b.batchName ?? '—',
        time: b.classTimings ?? '—',
        studentsCount: b.studentsCount ?? b.studentCount ?? 0,
        meetLink: b.googleMeetLink ?? b.meetLink ?? '',
      }));
    return { dayName: day, isToday: day === todayName && weekOffset === 0, classes };
  });

  // Summary stats — based on week-filtered timetable
  const totalClasses = timetable.reduce((s, d) => s + d.classes.length, 0);
  const uniqueCourses = new Set(timetable.flatMap(d => d.classes.map(c => c.courseTitle))).size;
  const totalHours = Math.round(totalClasses * 1.5);

  // Reorder: start from Monday
  const ordered = [
    ...timetable.slice(1), // Mon–Sat
    timetable[0],          // Sun
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
        <Text style={styles.headerTitle}>Weekly Timetable</Text>
        <Text style={styles.headerSubtitle}>Your teaching schedule for the week</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* WEEK SWITCHER */}
        <View style={styles.weekSwitcher}>
          <TouchableOpacity style={styles.weekArrow} onPress={() => setWeekOffset(w => w - 1)}>
            <Ionicons name="chevron-back" size={20} color="#7B2CBF" />
          </TouchableOpacity>
          <View style={styles.weekCenter}>
            <View style={styles.weekDateRow}>
              <Ionicons name="calendar-outline" size={16} color="#7B2CBF" />
              <Text style={styles.weekRange}>{formatWeekRange(monday, sunday)}</Text>
            </View>
            <Text style={styles.weekClassCount}>{totalClasses} classes this week</Text>
          </View>
          <TouchableOpacity style={styles.weekArrow} onPress={() => setWeekOffset(w => w + 1)}>
            <Ionicons name="chevron-forward" size={20} color="#7B2CBF" />
          </TouchableOpacity>
        </View>

        {/* WEEK SUMMARY */}
        <LinearGradient
          colors={['#FAF5FF', '#FFF7ED']}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>This Week&apos;s Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#7B2CBF' }]}>{totalClasses}</Text>
              <Text style={styles.summaryLabel}>Classes</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#F97316' }]}>{totalHours}</Text>
              <Text style={styles.summaryLabel}>Hours</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: '#16A34A' }]}>{uniqueCourses}</Text>
              <Text style={styles.summaryLabel}>Courses</Text>
            </View>
          </View>
        </LinearGradient>

        {/* TIMETABLE */}
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.timetable}>
            {ordered.map((day, i) => (
              <View key={i} style={styles.dayCard}>
                {/* Day header */}
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    {day.isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.classCount}>
                    {day.classes.length === 0 ? 'No classes' : `${day.classes.length} ${day.classes.length === 1 ? 'class' : 'classes'}`}
                  </Text>
                </View>

                {/* Classes or free day */}
                {day.classes.length === 0 ? (
                  <View style={styles.freeDay}>
                    <View style={styles.coffeeCircle}>
                      <Text style={styles.coffeeEmoji}>☕</Text>
                    </View>
                    <Text style={styles.freeDayText}>Free day - No classes scheduled</Text>
                  </View>
                ) : (
                  day.classes.map((cls, j) => (
                    <View key={j} style={styles.classBlock}>
                      <Text style={styles.classCourse}>{cls.courseTitle}</Text>
                      <Text style={styles.classBatch}>{cls.batchName}</Text>
                      <View style={styles.classMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={13} color="#6B7280" />
                          <Text style={styles.metaText}>{cls.time}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={13} color="#6B7280" />
                          <Text style={styles.metaText}>{cls.studentsCount} students</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ))}
          </View>
        )}

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
  headerTitle: {
    fontSize: 24, fontWeight: '700', color: '#FFF',
  },
  headerSubtitle: { fontSize: 13, fontWeight: '600', color: '#E9D5FF', marginTop: 3 },

  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16 },

  // Week switcher
  weekSwitcher: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
  },
  weekArrow: { padding: 4 },
  weekCenter: { flex: 1, alignItems: 'center' },
  weekDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekRange: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  weekClassCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },

  // Summary
  summaryCard: {
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E9D5FF',
    marginBottom: 20, overflow: 'hidden',
  },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: { width: 0, height: 0 },
  summaryVal: { fontSize: 26, fontWeight: 'bold' },
  summaryLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },

  // Timetable
  timetable: { gap: 14 },
  dayCard: {
    backgroundColor: '#FFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  todayBadge: {
    backgroundColor: '#F97316', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  classCount: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  freeDay: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 24, gap: 8,
  },
  coffeeCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  coffeeEmoji: { fontSize: 28, textAlign: 'center' },
  freeDayText: { fontSize: 12, color: '#9CA3AF' },

  classBlock: {
    margin: 12, marginTop: 10,
    backgroundColor: '#FAF5FF', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#E9D5FF',
  },
  classCourse: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  classBatch: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  classMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#4B5563' },
  meetBtn: {
    backgroundColor: '#7B2CBF', borderRadius: 10, height: 40,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  meetBtnDisabled: { backgroundColor: '#D1D5DB' },
  meetBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
});
