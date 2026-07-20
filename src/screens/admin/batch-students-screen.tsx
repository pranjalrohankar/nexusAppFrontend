import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Animated, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface BatchStudent {
  id: number;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  onlineStatus?: 'online' | 'offline' | 'always_online';
  joinedDate: string;
  attendance: number;
}

export interface BatchForStudents {
  id: number;
  batchName: string;
  selectCourse: string;
  instructor: string;
  startDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  courseTimings?: string;
}

interface Props {
  batch: BatchForStudents;
  onBack: () => void;
}

const GRADIENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const GRADIENT_LOCS: any = [0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1];

const AVATAR_COLORS = ['#7B2CBF', '#2563EB', '#EA580C', '#16A34A', '#DB2777', '#0891B2'];

function getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(d: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

export default function BatchStudentsScreen({ batch, onBack }: Props) {
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  useEffect(() => { loadStudents(); }, []);

  // Poll every 10s to keep online status fresh without showing spinner
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.getBatchStudents(batch.id);
        const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (raw.length === 0) return;
        setStudents(raw.map((e: any) => ({
          id: e.id ?? e.studentId ?? e.enrollmentId ?? Math.random(),
          name: e.name ?? e.studentName ?? '',
          email: e.email ?? e.studentEmail ?? '',
          phone: e.phone ?? e.studentPhone ?? '',
          active: e.active !== false,
          onlineStatus: e.onlineStatus,
          joinedDate: e.joinedDate ?? e.enrollmentDate ?? '',
          attendance: typeof e.attendance === 'number' ? e.attendance : 0,
        })).filter((s: BatchStudent) => s.name.trim() !== ''));
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [batch.id]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      let list: BatchStudent[] = [];

      // Primary: fetch students by batch ID (uses /api/batches/{id}/students)
      const res = await api.getBatchStudents(batch.id);
      const raw = Array.isArray(res) ? res
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.content) ? res.content
        : [];

      if (raw.length > 0) {
        list = raw.map((e: any) => ({
          id: e.id ?? e.studentId ?? e.enrollmentId ?? Math.random(),
          name: e.name ?? e.studentName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
          email: e.email ?? e.studentEmail ?? '',
          phone: e.phone ?? e.studentPhone ?? '',
          active: e.active !== false,
          onlineStatus: e.onlineStatus,
          joinedDate: e.joinedDate ?? e.enrollmentDate ?? e.createdAt ?? '',
          attendance: typeof e.attendance === 'number' ? e.attendance : 0,
        })).filter((s: BatchStudent) => s.name.trim() !== '');
      } else {
        // Fallback: fetch by course title enrollment
        const fallback = await api.getEnrollmentsByCourse(batch.selectCourse);
        const rawFallback = Array.isArray(fallback) ? fallback
          : Array.isArray(fallback?.data) ? fallback.data
          : [];
        list = rawFallback.map((e: any) => ({
          id: e.id ?? e.studentId ?? Math.random(),
          name: e.studentName ?? e.name ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
          email: e.email ?? e.studentEmail ?? '',
          phone: e.phone ?? e.studentPhone ?? '',
          active: e.paymentStatus === 'Paid' || e.active !== false,
          joinedDate: e.enrollmentDate ?? e.joinedDate ?? '',
          attendance: 0,
        })).filter((s: BatchStudent) => s.name.trim() !== '');
      }

      setStudents(list);
    } catch (err: any) {
      showToast('Could not load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const isActive = s.onlineStatus === 'online' || s.onlineStatus === 'always_online';
    if (activeFilter === 'Active') return matchSearch && isActive;
    if (activeFilter === 'Inactive') return matchSearch && !isActive;
    return matchSearch;
  });

  const activeCount = students.filter(s => s.onlineStatus === 'online' || s.onlineStatus === 'always_online').length;
  const avgAttendance = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length)
    : 0;

  const statusColor = batch.status === 'ACTIVE' ? '#10B981' : batch.status === 'UPCOMING' ? '#F59E0B' : '#6B7280';
  const statusLabel = batch.status === 'ACTIVE' ? 'Active' : batch.status === 'UPCOMING' ? 'Upcoming' : 'Completed';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <LinearGradient
          colors={GRADIENT_COLORS} locations={GRADIENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />

        {/* Row 1: back arrow  +  title col (batch name + course)  +  status badge */}
        <View style={styles.headerRow1}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.batchTitleCol}>
            <Text style={styles.batchTitle} numberOfLines={1} ellipsizeMode="tail">
              {batch.batchName}
            </Text>
            <Text style={styles.batchCourse} numberOfLines={1}>
              {batch.selectCourse}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Meta row: instructor · date · timings */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={12} color="#E9D5FF" />
            <Text style={styles.metaText}>{batch.instructor}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color="#E9D5FF" />
            <Text style={styles.metaText}>{formatDate(batch.startDate)}</Text>
          </View>
          {!!batch.courseTimings && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color="#E9D5FF" />
              <Text style={styles.metaText}>{batch.courseTimings}</Text>
            </View>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {(['All', 'Active', 'Inactive'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── BODY ── */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#7B2CBF' }]}>{students.length}</Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{avgAttendance}%</Text>
            <Text style={styles.statLabel}>Avg Attend.</Text>
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text style={styles.emptyText}>Loading students...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          filtered.map((student, idx) => {
            const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const att = student.attendance;
            const attColor = att >= 80 ? '#10B981' : att >= 60 ? '#F59E0B' : '#EF4444';
            return (
              <View key={String(student.id) + idx} style={styles.studentCard}>
                {/* Card top */}
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                    <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.joinedText}>Joined {formatDate(student.joinedDate)}</Text>
                  </View>
                  <View style={[styles.activeBadge, {
                    backgroundColor: (student.onlineStatus === 'online' || student.onlineStatus === 'always_online') ? '#ECFDF5' : '#FEE2E2'
                  }]}>
                    <Text style={[styles.activeBadgeText, {
                      color: (student.onlineStatus === 'online' || student.onlineStatus === 'always_online') ? '#10B981' : '#EF4444'
                    }]}>
                      {(student.onlineStatus === 'online' || student.onlineStatus === 'always_online') ? 'active' : 'inactive'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.menuBtn}>
                    <Ionicons name="ellipsis-vertical" size={17} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Contact */}
                <View style={styles.infoBlock}>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoText}>{student.email || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoText}>{student.phone || '—'}</Text>
                  </View>
                </View>

                {/* Attendance */}
                <View style={styles.attendanceRow}>
                  <Text style={styles.attendanceLabel}>Attendance</Text>
                  <Text style={[styles.attendancePercent, { color: attColor }]}>{att}%</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${att}%` as any, backgroundColor: attColor }]} />
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn}>
                    <Ionicons name="create-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn}>
                    <Ionicons name="person-remove-outline" size={14} color="#EF4444" />
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  toast: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999, borderRadius: 12, padding: 14, elevation: 8 },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFF', fontWeight: '600', fontSize: 13, textAlign: 'center' },

  /* ── Header ── */
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 10 },

  headerRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
    padding: 8,
  },
  batchTitleCol: {
    flex: 1,
  },
  batchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },

  batchCourse: { fontSize: 15, color: '#E9D5FF', marginTop: 2, marginBottom: 8 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#E9D5FF', fontWeight: '500' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937' },

  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterPillActive: { backgroundColor: '#FFFFFF' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#E9D5FF' },
  filterPillTextActive: { color: '#7B2CBF' },

  /* ── Body ── */
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#F3F4F6' },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  cardMeta: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  joinedText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  activeBadgeText: { fontSize: 11, fontWeight: 'bold' },
  menuBtn: { padding: 4 },

  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    gap: 6,
    marginBottom: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 12, color: '#4B5563', fontWeight: '500', flex: 1 },

  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attendanceLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  attendancePercent: { fontSize: 13, fontWeight: 'bold' },
  progressBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: { height: '100%', borderRadius: 3 },

  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  editBtnText: { fontSize: 12, fontWeight: 'bold', color: '#7B2CBF' },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  removeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#EF4444' },
});
