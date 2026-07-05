import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Platform, ActivityIndicator, Linking, Share, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

interface BatchItem {
  id: number;
  batchName: string;
  selectCourse: string;
  instructor: string;
  startDate: string;
  endDate: string;
  classDays: string[];
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  studentsCount: number;
  classTimings?: string;
  duration?: string;
  googleMeetLink?: string;
  totalSessions?: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  paymentStatus: string;
  active: boolean;
}

export default function TeacherClassesScreen() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ACTIVE');
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMyBatches();
      if (res.success && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch (e) {
      console.error('Failed to load batches', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const loadStudents = async (batch: BatchItem) => {
    setSelectedBatch(batch);
    setStudentsLoading(true);
    setStudents([]);
    try {
      const res = await api.getBatchStudents(batch.id);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setStudents(list.map((s: any) => ({
        id: String(s.id ?? s.enrollmentId ?? Math.random()),
        name: s.name || s.studentName || '—',
        email: s.email || s.studentEmail || '—',
        phone: s.phone || s.studentPhone || '—',
        enrollmentDate: s.enrollmentDate || s.joinedDate || s.createdAt || '',
        paymentStatus: s.paymentStatus || '',
        active: s.active ?? (s.paymentStatus === 'Paid'),
      })));
    } catch (e) {
      console.error('Failed to load students', e);
    } finally {
      setStudentsLoading(false);
    }
  };

  const formatEnrolledDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return 'Enrolled: ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleCopyLink = async (link: string, id: number) => {
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(link); } catch {}
    } else {
      await Share.share({ message: link, title: 'Google Meet Link' });
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartClass = (link: string) => {
    if (link) Linking.openURL(link);
  };

  const filteredBatches = batches.filter(b => b.status === activeTab);
  const counts = {
    ACTIVE: batches.filter(b => b.status === 'ACTIVE').length,
    UPCOMING: batches.filter(b => b.status === 'UPCOMING').length,
    COMPLETED: batches.filter(b => b.status === 'COMPLETED').length,
  };

  const formatDays = (days: string[]) => days.map(d => d.substring(0, 3)).join(', ');

  // ── STUDENTS DRILLDOWN ──────────────────────────────────────────────────────
  if (selectedBatch) {
    const filtered = students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const activeCount = students.filter(s => s.active).length;

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
        {/* Purple header: accent line + back + course title + batch + search bar */}
        <View style={styles.drillHeader}>
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
              'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
              'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
              'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
              'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
            ]}
            locations={[0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.headerAccentLine}
          />
          <View style={styles.drillHeaderRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedBatch(null); setSearchQuery(''); }}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.drillCourseTitle} numberOfLines={2}>{selectedBatch.selectCourse}</Text>
          </View>
          <Text style={styles.drillBatchSubtitle}>{selectedBatch.batchName}</Text>
          {/* Search bar inside purple header */}
          <View style={styles.drillSearchBar}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.drillSearchInput}
              placeholder="Search students..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#7B2CBF' }]}>{students.length}</Text>
              <Text style={styles.metricLabel}>Total Students</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>{activeCount}</Text>
              <Text style={styles.metricLabel}>Active</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#F97316' }]}>83%</Text>
              <Text style={styles.metricLabel}>Avg. Attendance</Text>
            </View>
          </View>

          <Text style={styles.rosterTitle}>Students ({students.length})</Text>

          {studentsLoading ? (
            <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {students.length === 0 ? 'No students enrolled in this batch' : 'No students match your search'}
              </Text>
            </View>
          ) : (
            <View style={styles.studentList}>
              {filtered.map(s => (
                <View key={s.id} style={styles.studentCard}>
                  {/* Avatar + Name + Enrolled date + Active badge */}
                  <View style={styles.studentHeader}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{getInitials(s.name)}</Text>
                    </View>
                    <View style={styles.studentMeta}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      {s.enrollmentDate ? (
                        <Text style={styles.enrolledDate}>{formatEnrolledDate(s.enrollmentDate)}</Text>
                      ) : null}
                    </View>
                    {s.active && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="person" size={11} color="#FFF" />
                      </View>
                    )}
                  </View>

                  {/* Email + Phone */}
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={13} color="#6B7280" />
                    <Text style={styles.contactText} numberOfLines={1}>{s.email}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={13} color="#6B7280" />
                    <Text style={styles.contactText}>{s.phone}</Text>
                  </View>

                  {/* Attendance + Progress bars */}
                  <View style={styles.barsRow}>
                    <View style={styles.barBlock}>
                      <View style={styles.barLabelRow}>
                        <Text style={styles.barLabel}>Attendance</Text>
                        <Text style={[styles.barPct, { color: '#7B2CBF' }]}>92%</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: '92%', backgroundColor: '#7B2CBF' }]} />
                      </View>
                    </View>
                    <View style={styles.barBlock}>
                      <View style={styles.barLabelRow}>
                        <Text style={styles.barLabel}>Progress</Text>
                        <Text style={[styles.barPct, { color: '#F97316' }]}>78%</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: '78%', backgroundColor: '#F97316' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Send Message */}
                  <TouchableOpacity style={styles.messageBtn}>
                    <Ionicons name="chatbubble-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.messageBtnText}>Send Message</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MAIN CLASSES LIST ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
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
        <Text style={styles.headerTitle}>My Classes</Text>
        <Text style={styles.headerSubtitle}>Manage your courses and Google Meet links.</Text>
      </View>

      {/* TABS */}
      <View style={styles.subTabContainer}>
        {(['ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTabBtn, activeTab === tab && styles.subTabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.subTabText, activeTab === tab && styles.subTabTextActive]}>
              {tab === 'ACTIVE' ? 'Active' : tab === 'UPCOMING' ? 'Upcoming' : 'Completed'} ({counts[tab]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 60 }} />
        ) : filteredBatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} classes</Text>
          </View>
        ) : (
          <View style={styles.classList}>
            {filteredBatches.map(item => (
              <View key={item.id} style={styles.classCard}>
                {/* Title + Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classCardTitle}>{item.selectCourse}</Text>
                    <Text style={styles.classCardBatch}>{item.batchName}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'ACTIVE' ? styles.badgeActive :
                    item.status === 'UPCOMING' ? styles.badgeUpcoming : styles.badgeCompleted
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      item.status === 'ACTIVE' ? styles.badgeTextActive :
                      item.status === 'UPCOMING' ? styles.badgeTextUpcoming : styles.badgeTextCompleted
                    ]}>{item.status}</Text>
                  </View>
                </View>

                {/* Students count + Duration chips */}
                <View style={styles.chipsRow}>
                  <View style={styles.chip}>
                    <Ionicons name="people-outline" size={13} color="#7B2CBF" />
                    <Text style={styles.chipText}>{item.studentsCount} students</Text>
                  </View>
                  {item.duration ? (
                    <View style={styles.chip}>
                      <Ionicons name="time-outline" size={13} color="#7B2CBF" />
                      <Text style={styles.chipText}>{item.duration}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Schedule box */}
                <View style={styles.scheduleBox}>
                  <Text style={styles.scheduleLabel}>Schedule</Text>
                  <Text style={styles.scheduleValue}>
                    {item.classDays && item.classDays.length > 0 ? formatDays(item.classDays) : '—'}
                    {item.classTimings ? ` · ${item.classTimings}` : ''}
                  </Text>
                </View>

                {/* Progress bar */}
                {item.totalSessions != null && item.totalSessions > 0 && (
                  <View style={styles.progressRow}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressVal}>0/{item.totalSessions} Classes</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: '0%' }]} />
                    </View>
                  </View>
                )}

                {/* Google Meet Link */}
                {item.status !== 'COMPLETED' && (
                  <View style={styles.meetBox}>
                    <View style={styles.meetLabelRow}>
                      <Ionicons name="videocam-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.meetLabel}>Google Meet Link</Text>
                    </View>
                    {item.googleMeetLink ? (
                      <View style={styles.meetLinkWrapper}>
                        <Ionicons name="logo-google" size={14} color="#4285F4" />
                        <Text style={styles.meetLinkText} numberOfLines={1}>{item.googleMeetLink}</Text>
                        <TouchableOpacity onPress={() => handleCopyLink(item.googleMeetLink!, item.id)} style={styles.meetIconBtn}>
                          <Ionicons
                            name={copiedId === item.id ? 'checkmark' : 'copy-outline'}
                            size={16}
                            color={copiedId === item.id ? '#10B981' : '#7B2CBF'}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.noMeetText}>No meet link assigned to this course</Text>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.cardActionBtnRow}>
                  <TouchableOpacity style={styles.cardViewStudentsBtn} onPress={() => loadStudents(item)}>
                    <Ionicons name="people-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.cardViewStudentsText}>View Students</Text>
                  </TouchableOpacity>

                  {item.status === 'ACTIVE' && item.googleMeetLink ? (
                    <TouchableOpacity style={styles.cardStartBtn} onPress={() => handleStartClass(item.googleMeetLink!)}>
                      <Ionicons name="videocam" size={14} color="#FFF" />
                      <Text style={styles.cardStartText}>Start Class</Text>
                    </TouchableOpacity>
                  ) : item.status === 'ACTIVE' ? (
                    <View style={[styles.cardStartBtn, { backgroundColor: '#D1D5DB' }]}>
                      <Ionicons name="videocam-off-outline" size={14} color="#9CA3AF" />
                      <Text style={[styles.cardStartText, { color: '#9CA3AF' }]}>No Link</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
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
    paddingBottom: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
  },
  headerAccentLine: { height: 4, marginBottom: 10 },
  backBtn: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  backBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 25, fontWeight: '700', color: '#FFF',
  },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF', marginTop: 4 },
  subTabContainer: {
    flexDirection: 'row', backgroundColor: '#FFF',
    paddingHorizontal: 16, paddingVertical: 10,
    paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  subTabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F3F4F6' },
  subTabBtnActive: { backgroundColor: '#7B2CBF' },
  subTabText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  subTabTextActive: { color: '#FFF', fontWeight: 'bold' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  bottomSpacer: { height: 100 },
  classList: { gap: 16 },
  emptyCard: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: 20, padding: 40,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 12 },

  // ── Class Card ──────────────────────────────────────────────────────────────
  classCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  classCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  classCardBatch: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgeTextActive: { color: '#10B981' },
  badgeUpcoming: { backgroundColor: '#FFF7ED' },
  badgeTextUpcoming: { color: '#EA580C' },
  badgeCompleted: { backgroundColor: '#F3F4F6' },
  badgeTextCompleted: { color: '#6B7280' },

  // Chips row (students + duration)
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F3E8FF', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  chipText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },

  // Schedule box
  scheduleBox: {
    backgroundColor: '#FAF5FF', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14,
  },
  scheduleLabel: { fontSize: 8, color: '#9CA3AF', fontWeight: '600', marginBottom: 3 },
  scheduleValue: { fontSize: 11, fontWeight: '600', color: '#1F2937' },

  // Progress bar
  progressRow: { marginBottom: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  progressVal: { fontSize: 11, fontWeight: 'bold', color: '#1F2937' },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#7B2CBF', borderRadius: 3 },

  // Meet box
  meetBox: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
  },
  meetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  meetLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  meetLinkWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  meetLinkText: { flex: 1, fontSize: 12, color: '#2563EB', fontWeight: '500' },
  meetIconBtn: { padding: 4 },
  noMeetText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },

  // Action buttons
  cardActionBtnRow: { flexDirection: 'row', gap: 12 },
  cardViewStudentsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#7B2CBF',
    height: 42, borderRadius: 12,
  },
  cardViewStudentsText: { color: '#7B2CBF', fontSize: 12, fontWeight: 'bold' },
  cardStartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#7B2CBF', height: 42, borderRadius: 12,
  },
  cardStartText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // ── Drilldown ───────────────────────────────────────────────────────────────
  drillHeader: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 24,
  },
  drillCourseTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  drillBatchSubtitle: { fontSize: 13, color: '#E9D5FF', marginTop: 2, marginLeft: 40, marginBottom: 0 },
  drillHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  drillSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14, height: 44,
    paddingHorizontal: 14, marginTop: 14,
  },
  drillSearchInput: { flex: 1, color: '#1F2937', fontSize: 13 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14,
    height: 46, paddingHorizontal: 14, marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1F2937', fontSize: 13 },
  metricsRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: '#F3F4F6' },
  metricVal: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  metricLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  rosterTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  studentList: { gap: 14 },
  studentCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  studentAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#7B2CBF', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  studentMeta: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  enrolledDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  activeBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  contactText: { fontSize: 12, color: '#4B5563', flex: 1 },
  barsRow: {
    flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 14,
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  barBlock: { flex: 1 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  barPct: { fontSize: 11, fontWeight: 'bold' },
  barBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, height: 38,
  },
  messageBtnText: { fontSize: 12, fontWeight: '600', color: '#7B2CBF' },
});
