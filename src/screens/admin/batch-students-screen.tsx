import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Animated, StatusBar, Platform, Modal,
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
  googleMeetLink?: string;
  meetLink?: string;
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
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Reassign Batch Modal State
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedStudentForReassign, setSelectedStudentForReassign] = useState<BatchStudent | null>(null);
  const [targetBatchId, setTargetBatchId] = useState<number | null>(null);
  const [reassigning, setReassigning] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: (Platform.OS as string) !== 'web' }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: (Platform.OS as string) !== 'web' }),
    ]).start(() => setToast(null));
  };

  const loadAllBatches = async () => {
    try {
      const res = await api.getBatches();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setAllBatches(list);
    } catch {}
  };

  useEffect(() => {
    loadStudents();
    loadAllBatches();
  }, []);

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

      setStudents(list);
    } catch (err: any) {
      showToast('Could not load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReassignModal = (student: BatchStudent) => {
    setSelectedStudentForReassign(student);
    setTargetBatchId(null);
    setReassignModalVisible(true);
  };

  const handleConfirmReassign = async () => {
    if (!selectedStudentForReassign) return;
    if (!targetBatchId) {
      showToast('Please select a target batch to reassign to', 'error');
      return;
    }
    const targetBatch = allBatches.find(b => b.id === targetBatchId);
    setReassigning(true);
    try {
      const res = await api.reassignBatchStudent(batch.id, {
        studentId: selectedStudentForReassign.id,
        targetBatchId: targetBatchId,
        targetBatchName: targetBatch?.batchName || '',
      });
      if (res && (res.success !== false)) {
        showToast(`Student moved to ${targetBatch?.batchName || 'new batch'} successfully`, 'success');
        setReassignModalVisible(false);
        loadStudents();
      } else {
        showToast((res as any)?.message || 'Failed to reassign student', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error reassigning batch', 'error');
    } finally {
      setReassigning(false);
    }
  };

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    if (activeFilter === 'Active') return matchSearch && s.active !== false;
    if (activeFilter === 'Inactive') return matchSearch && s.active === false;
    return matchSearch;
  });

  const activeCount = students.filter(s => s.active !== false).length;
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
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
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
                    backgroundColor: student.active !== false ? '#ECFDF5' : '#FEE2E2'
                  }]}>
                    <Text style={[styles.activeBadgeText, {
                      color: student.active !== false ? '#10B981' : '#EF4444'
                    }]}>
                      {student.active !== false ? 'Active' : 'Inactive'}
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
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenReassignModal(student)}
                  >
                    <Ionicons name="swap-horizontal-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.editBtnText}>Change Batch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleOpenReassignModal(student)}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={14} color="#EF4444" />
                    <Text style={styles.removeBtnText}>Move</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── REASSIGN BATCH MODAL ── */}
      <Modal
        visible={reassignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReassignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Change Student Batch</Text>
                <Text style={styles.modalSubtitle}>
                  Move student to another batch of {batch.selectCourse}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReassignModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Student Card Summary */}
              {selectedStudentForReassign && (
                <View style={styles.studentSummaryCard}>
                  <View style={styles.studentSummaryAvatar}>
                    <Text style={styles.studentSummaryAvatarText}>
                      {getInitials(selectedStudentForReassign.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentSummaryName}>{selectedStudentForReassign.name}</Text>
                    <Text style={styles.studentSummaryEmail}>{selectedStudentForReassign.email}</Text>
                    <View style={styles.currentBatchRow}>
                      <Text style={styles.currentBatchLabel}>Current Batch: </Text>
                      <View style={styles.currentBatchBadge}>
                        <Text style={styles.currentBatchBadgeText}>{batch.batchName}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Destination Batch Selection */}
              <Text style={styles.sectionHeader}>Select Target Batch</Text>
              <View style={styles.targetBatchesList}>
                {allBatches
                  .filter(b => b.id !== batch.id && (
                    (b.selectCourse || '').toLowerCase() === (batch.selectCourse || '').toLowerCase() ||
                    (b.selectCourse || '').toLowerCase().includes((batch.selectCourse || '').toLowerCase()) ||
                    (batch.selectCourse || '').toLowerCase().includes((b.selectCourse || '').toLowerCase())
                  ))
                  .map(b => {
                    const isSelected = targetBatchId === b.id;
                    const isCompleted = b.status === 'COMPLETED';
                    const isUpcoming = b.status === 'UPCOMING';
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.targetBatchCard, isSelected && styles.targetBatchCardSelected]}
                        onPress={() => setTargetBatchId(b.id)}
                      >
                        <View style={styles.targetBatchTop}>
                          <Ionicons
                            name={isSelected ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={isSelected ? "#7B2CBF" : "#9CA3AF"}
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={[styles.targetBatchName, isSelected && styles.targetBatchNameSelected]}>
                              {b.batchName}
                            </Text>
                            <Text style={styles.targetBatchCourse}>{b.selectCourse}</Text>
                          </View>
                          <View style={[
                            styles.targetStatusBadge,
                            isCompleted ? styles.targetStatusCompleted :
                              isUpcoming ? styles.targetStatusUpcoming : styles.targetStatusActive
                          ]}>
                            <Text style={[
                              styles.targetStatusText,
                              isCompleted ? styles.targetStatusTextCompleted :
                                isUpcoming ? styles.targetStatusTextUpcoming : styles.targetStatusTextActive
                            ]}>
                              {isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'Active'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.targetBatchDetails}>
                          <View style={styles.targetBatchDetailItem}>
                            <Ionicons name="person-outline" size={12} color="#6B7280" />
                            <Text style={styles.targetBatchDetailText}>{b.instructor || 'Faculty'}</Text>
                          </View>
                          {b.startDate ? (
                            <View style={styles.targetBatchDetailItem}>
                              <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                              <Text style={styles.targetBatchDetailText}>{formatDate(b.startDate)}</Text>
                            </View>
                          ) : null}
                          {b.classTimings ? (
                            <View style={styles.targetBatchDetailItem}>
                              <Ionicons name="time-outline" size={12} color="#6B7280" />
                              <Text style={styles.targetBatchDetailText}>{b.classTimings}</Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                {allBatches.filter(b => b.id !== batch.id && (
                  (b.selectCourse || '').toLowerCase() === (batch.selectCourse || '').toLowerCase() ||
                  (b.selectCourse || '').toLowerCase().includes((batch.selectCourse || '').toLowerCase()) ||
                  (batch.selectCourse || '').toLowerCase().includes((b.selectCourse || '').toLowerCase())
                )).length === 0 && (
                  <View style={styles.emptyTargetBatches}>
                    <Ionicons name="information-circle-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.emptyTargetBatchesText}>
                      No other batches are currently available for {batch.selectCourse}. You can create a new batch in Batch Management.
                    </Text>
                  </View>
                )}
              </View>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setReassignModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, (!targetBatchId || reassigning) && styles.modalConfirmBtnDisabled]}
                  onPress={handleConfirmReassign}
                  disabled={!targetBatchId || reassigning}
                >
                  {reassigning ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>Confirm Change</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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

  /* ── Reassign Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalScroll: {
    padding: 20,
  },
  studentSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    gap: 12,
  },
  studentSummaryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentSummaryAvatarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  studentSummaryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  studentSummaryEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  currentBatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  currentBatchLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  currentBatchBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBatchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  targetBatchesList: {
    gap: 10,
    marginBottom: 20,
  },
  targetBatchCard: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  targetBatchCardSelected: {
    borderColor: '#7B2CBF',
    backgroundColor: '#FAF5FF',
  },
  targetBatchTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetBatchName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  targetBatchNameSelected: {
    color: '#7B2CBF',
  },
  targetBatchCourse: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  targetStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  targetStatusActive: {
    backgroundColor: '#ECFDF5',
  },
  targetStatusUpcoming: {
    backgroundColor: '#FFFBEB',
  },
  targetStatusCompleted: {
    backgroundColor: '#F3F4F6',
  },
  targetStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  targetStatusTextActive: {
    color: '#10B981',
  },
  targetStatusTextUpcoming: {
    color: '#F59E0B',
  },
  targetStatusTextCompleted: {
    color: '#6B7280',
  },
  targetBatchDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  targetBatchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetBatchDetailText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyTargetBatches: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 8,
  },
  emptyTargetBatchesText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
  },
  modalConfirmBtnDisabled: {
    opacity: 0.5,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
