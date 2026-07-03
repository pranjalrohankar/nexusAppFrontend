import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Modal, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import BatchStudentsScreen from './batch-students-screen';

type FilterTab = 'All' | 'Active' | 'Upcoming' | 'Completed';
type BatchStatus = 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
type ClassDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface Batch {
  id: number;
  batchName: string;
  selectCourse: string;
  instructor: string;
  startDate: string;
  endDate: string;
  classDays: ClassDay[];
  status: BatchStatus;
  studentsCount?: number;
  courseTimings?: string;
}

interface Course {
  id: number;
  title: string;
  classTimings?: string;
}

interface Teacher {
  id: string;
  name: string;
}

export default function AdminBatchesScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);

  const [formBatchName, setFormBatchName] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<BatchStatus>('UPCOMING');
  const [formClassDays, setFormClassDays] = useState<ClassDay[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchRes, courseRes, teacherRes] = await Promise.all([
        api.getBatches(),
        api.getAllCourses(),
        api.getTeachers(),
      ]);
      const rawBatches: Batch[] = batchRes || [];
      setCourses(courseRes.success ? courseRes.data : []);
      setTeachers(teacherRes.success ? teacherRes.data.map((t: any) => ({ id: t.teacherId || t.id, name: t.name })) : []);

      const batchesWithCounts = await Promise.all(
        rawBatches.map(async (b) => {
          try {
            const res = await api.getEnrollmentCount(b.selectCourse);
            return { ...b, studentsCount: res?.count ?? 0 };
          } catch {
            return { ...b, studentsCount: 0 };
          }
        })
      );
      setBatches(batchesWithCounts);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) || b.selectCourse.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'All') return matchesSearch;
    return matchesSearch && b.status === filterTab.toUpperCase();
  });

  const activeCount = batches.filter(b => b.status === 'ACTIVE').length;
  const upcomingCount = batches.filter(b => b.status === 'UPCOMING').length;
  const completedCount = batches.filter(b => b.status === 'COMPLETED').length;

  const handleOpenAddModal = () => {
    setSelectedBatch(null);
    setFormBatchName('');
    setFormCourse('');
    setFormInstructor('');
    setFormStartDate('');
    setFormEndDate('');
    setFormStatus('UPCOMING');
    setFormClassDays([]);
    setModalVisible(true);
  };

  const handleOpenEditModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormBatchName(batch.batchName);
    setFormCourse(batch.selectCourse);
    setFormInstructor(batch.instructor);
    setFormStartDate(batch.startDate);
    setFormEndDate(batch.endDate);
    setFormStatus(batch.status);
    setFormClassDays(batch.classDays || []);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formBatchName || !formCourse || !formInstructor || !formStartDate || !formEndDate || formClassDays.length === 0) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        batchName: formBatchName,
        selectCourse: formCourse,
        instructor: formInstructor,
        startDate: formStartDate,
        endDate: formEndDate,
        classDays: formClassDays,
        status: formStatus,
      };
      console.log('Saving batch:', payload);
      if (selectedBatch) {
        const res = await api.updateBatch(selectedBatch.id, payload);
        console.log('Update response:', res);
        showToast('Batch updated successfully', 'success');
      } else {
        const res = await api.createBatch(payload);
        console.log('Create response:', res);
        showToast('Batch created successfully', 'success');
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(err?.message || 'Failed to save batch', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteBatch(id);
      showToast('Batch deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete batch', 'error');
    }
  };

  const toggleClassDay = (day: ClassDay) => {
    setFormClassDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const getStatusColor = (status: BatchStatus) => {
    if (status === 'ACTIVE') return '#10B981';
    if (status === 'UPCOMING') return '#F59E0B';
    return '#6B7280';
  };

  const formatClassDays = (days: ClassDay[]) => {
    return days.map(d => d.substring(0, 3)).join(', ');
  };

  // Show BatchStudentsScreen when View Students is tapped
  if (viewingBatch) {
    return (
      <BatchStudentsScreen
        batch={viewingBatch}
        onBack={() => setViewingBatch(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)',
          ]}
          locations={[0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <View style={styles.headerTop}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Batches</Text>
            <Text style={styles.headerSubtitle}>{batches.length} total batches</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* Search bar inside header */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search batches, courses, instructors..."
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'All' && styles.filterTabActiveAll]}
            onPress={() => setFilterTab('All')}
          >
            <Text style={[styles.filterTabText, filterTab === 'All' && styles.filterTabTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, styles.filterTabGreen, filterTab === 'Active' && styles.filterTabActiveGreen]}
            onPress={() => setFilterTab('Active')}
          >
            <Text style={[styles.filterTabText, styles.filterTabTextGreen, filterTab === 'Active' && styles.filterTabTextActive]}>
              Active {activeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, styles.filterTabAmber, filterTab === 'Upcoming' && styles.filterTabActiveAmber]}
            onPress={() => setFilterTab('Upcoming')}
          >
            <Text style={[styles.filterTabText, styles.filterTabTextAmber, filterTab === 'Upcoming' && styles.filterTabTextActive]}>
              Upcoming {upcomingCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, styles.filterTabGrayBg, filterTab === 'Completed' && styles.filterTabActiveGray]}
            onPress={() => setFilterTab('Completed')}
          >
            <Text style={[styles.filterTabText, styles.filterTabTextGray, filterTab === 'Completed' && styles.filterTabTextActive]}>
              Completed {completedCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card - matching students/teachers style */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Batch Cards */}
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
        ) : filteredBatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No batches found</Text>
          </View>
        ) : (
          filteredBatches.map((batch) => {
            const selectedCourse = courses.find(c => c.title === batch.selectCourse);
            return (
              <View key={batch.id} style={styles.batchCard}>
                {/* Card Header: icon + name/course + status + menu */}
                <View style={styles.batchHeader}>
                  <View style={styles.batchIconBox}>
                    <Ionicons name="book" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.batchHeaderText}>
                    <Text style={styles.batchName}>{batch.batchName}</Text>
                    <Text style={styles.batchCourse}>{batch.selectCourse}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(batch.status) }]}>
                    <Text style={styles.statusText}>
                      {batch.status === 'ACTIVE' ? 'Active' : batch.status === 'UPCOMING' ? 'Upcoming' : 'Completed'}
                    </Text>
                  </View>
                  <TouchableOpacity style={{ marginLeft: 6 }}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Info Grid: 2 columns */}
                <View style={styles.batchInfoGrid}>
                  {/* Left column */}
                  <View style={styles.infoColumn}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>{batch.instructor}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>
                        {batch.startDate
                          ? new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No date'}
                      </Text>
                    </View>
                    {batch.classDays && batch.classDays.length > 0 && (
                      <View style={styles.daysChipRow}>
                        <View style={styles.daysChip}>
                          <Text style={styles.daysChipText}>{formatClassDays(batch.classDays)}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  {/* Right column */}
                  <View style={styles.infoColumn}>
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>
                        {selectedCourse?.classTimings || batch.courseTimings || '—'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>
                        {batch.endDate
                          ? new Date(batch.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No end date'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="people-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>{batch.studentsCount ?? 0} students</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.batchActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEditModal(batch)}>
                    <Ionicons name="create-outline" size={15} color="#7B2CBF" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(batch.id)}>
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewStudentsBtn}
                    onPress={() => setViewingBatch({ ...batch, courseTimings: selectedCourse?.classTimings || '' })}
                  >
                    <Text style={styles.viewStudentsBtnText}>View Students</Text>
                    <Ionicons name="chevron-forward" size={15} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.modalTitle}>{selectedBatch ? 'Edit Batch' : 'Add New Batch'}</Text>
                <Text style={styles.modalSubtitle}>Fill in batch details</Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>

              <Text style={styles.fieldLabel}>Batch Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Batch A - Jan 2026" value={formBatchName} onChangeText={setFormBatchName} />

              <Text style={styles.fieldLabel}>Select Course *</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => { setShowCourseDropdown(!showCourseDropdown); setShowInstructorDropdown(false); }}>
                <Ionicons name="book-outline" size={16} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !formCourse && styles.dropdownPlaceholder]}>{formCourse || 'Select Courses'}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showCourseDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {courses.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={{ color: '#9CA3AF' }}>No courses available</Text>
                      </View>
                    ) : (
                      courses.map(c => (
                        <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => { setFormCourse(c.title); setShowCourseDropdown(false); }}>
                          <Text>{c.title}</Text>
                          {formCourse === c.title && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.fieldLabel}>Instructor *</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => { setShowInstructorDropdown(!showInstructorDropdown); setShowCourseDropdown(false); }}>
                <Text style={[styles.dropdownText, !formInstructor && styles.dropdownPlaceholder]}>{formInstructor || 'Select Instructor'}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showInstructorDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {teachers.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={{ color: '#9CA3AF' }}>No teachers available</Text>
                      </View>
                    ) : (
                      teachers.map(t => (
                        <TouchableOpacity key={t.id} style={styles.dropdownItem} onPress={() => { setFormInstructor(t.name); setShowInstructorDropdown(false); }}>
                          <Text>{t.name}</Text>
                          {formInstructor === t.name && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.sectionTitle}>SCHEDULE</Text>
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={formStartDate}
                    onChangeText={setFormStartDate}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fieldLabel}>End Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={formEndDate}
                    onChangeText={setFormEndDate}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Class Days *</Text>
              <View style={styles.daysRow}>
                {(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as ClassDay[]).map(day => (
                  <TouchableOpacity key={day} style={[styles.dayChip, formClassDays.includes(day) && styles.dayChipActive]} onPress={() => toggleClassDay(day)}>
                    <Text style={[styles.dayChipText, formClassDays.includes(day) && styles.dayChipTextActive]}>{day.substring(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>STATUS</Text>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusRow}>
                {(['UPCOMING', 'ACTIVE', 'COMPLETED'] as BatchStatus[]).map(status => (
                  <TouchableOpacity key={status} style={[styles.statusChip, formStatus === status && styles.statusChipActive]} onPress={() => setFormStatus(status)}>
                    <Text style={[styles.statusChipText, formStatus === status && styles.statusChipTextActive]}>{status === 'UPCOMING' ? 'Upcoming' : status === 'ACTIVE' ? 'Active' : 'Completed'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.createBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>{selectedBatch ? 'Save Changes' : 'Create Batch'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  toast: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999, borderRadius: 12, padding: 14, elevation: 8 },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFF', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerAccentLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    fontWeight: '600',
    marginTop: 3,
  },
  addBtn: {
    backgroundColor: '#FF9500',
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterTab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(123,44,191,0.10)' },
  filterTabGreen: { backgroundColor: 'rgba(16,185,129,0.12)' },
  filterTabAmber: { backgroundColor: 'rgba(245,158,11,0.12)' },
  filterTabGrayBg: { backgroundColor: 'rgba(107,114,128,0.10)' },
  filterTabActiveAll: { backgroundColor: '#7B2CBF' },
  filterTabActiveGreen: { backgroundColor: '#10B981' },
  filterTabActiveAmber: { backgroundColor: '#F59E0B' },
  filterTabActiveGray: { backgroundColor: '#6B7280' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#7B2CBF' },
  filterTabTextGreen: { color: '#10B981' },
  filterTabTextAmber: { color: '#F59E0B' },
  filterTabTextGray: { color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  // Stats card matching students/teachers
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#F3F4F6' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  batchCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  batchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  batchIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#4F6EF7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  batchHeaderText: { flex: 1 },
  batchName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  batchCourse: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  batchInfoGrid: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  infoColumn: { flex: 1, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#4B5563', flex: 1 },
  daysChipRow: { flexDirection: 'row', marginTop: 2 },
  daysChip: { backgroundColor: '#F3E8FF', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start' },
  daysChipText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },
  batchDays: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, marginBottom: 12 },
  batchDaysText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },
  batchActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, alignItems: 'center' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E8FF', paddingVertical: 10, borderRadius: 10, gap: 6 },
  editBtnText: { fontSize: 13, fontWeight: 'bold', color: '#7B2CBF' },
  deleteBtn: { width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  viewStudentsBtn: { flex: 1.4, flexDirection: 'row', backgroundColor: '#7B2CBF', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 4 },
  viewStudentsBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  modalHeader: { backgroundColor: '#7B2CBF', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalSubtitle: { fontSize: 12, color: '#E9D5FF', marginTop: 2 },
  modalScroll: { padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', letterSpacing: 0.5, marginTop: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 48, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#FFF' },
  dropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 48, paddingHorizontal: 12, backgroundColor: '#FFF', gap: 8 },
  dropdownText: { flex: 1, fontSize: 14, color: '#1F2937' },
  dropdownPlaceholder: { color: '#9CA3AF' },
  dropdownList: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginTop: 4, maxHeight: 200, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row' },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  dayChipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  dayChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dayChipTextActive: { color: '#FFF' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusChip: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF', alignItems: 'center' },
  statusChipActive: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' },
  statusChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  statusChipTextActive: { color: '#FFF' },
  createBtn: { backgroundColor: '#7B2CBF', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 40 },
  createBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});
