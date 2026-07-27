import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Modal, ActivityIndicator, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { adminDataCache } from '../../components/layout/app-tabs';
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
  duration?: string;
  classTimings?: string;
  courseTimings?: string;
  googleMeetLink?: string;
  meetLink?: string;
}

interface Course {
  id: number;
  title: string;
  classTimings?: string;
  googleMeetLink?: string;
}

interface Teacher {
  id: string;
  name: string;
}

// ─── Inline Calendar (renders inside the form's ScrollView, not a Modal) ─────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function InlineCalendar({ value, onSelect }: { value: string; onSelect: (date: string) => void }) {
  const todayObj = new Date();
  const initial = value ? new Date(value) : todayObj;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={ic.container}>
      <View style={ic.navRow}>
        <TouchableOpacity onPress={prevMonth} style={ic.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#7B2CBF" />
        </TouchableOpacity>
        <Text style={ic.monthYear}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={ic.navBtn}>
          <Ionicons name="chevron-forward" size={18} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      <View style={ic.dayNames}>
        {DAY_NAMES.map(d => (
          <Text key={d} style={ic.dayName}>{d}</Text>
        ))}
      </View>

      <View style={ic.grid}>
        {cells.map((cell, i) => {
          if (cell === null) return <View key={`e${i}`} style={ic.cell} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;
          const isSel = dateStr === value;
          const isToday = dateStr === todayStr;
          return (
            <TouchableOpacity
              key={`d${cell}`}
              style={[ic.cell, isSel && ic.cellSelected, isToday && !isSel && ic.cellToday]}
              onPress={() => onSelect(dateStr)}
            >
              <Text style={[ic.cellText, isSel && ic.cellTextSel, isToday && !isSel && ic.cellTextToday]}>
                {cell}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ic = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 14,
    marginTop: 8,
    marginBottom: 4,
    // Fluid but capped: fills available width on narrow phones,
    // stops growing past 340 on tablets/web so cells don't stretch huge.
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  monthYear: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  dayNames: { flexDirection: 'row', marginBottom: 6 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  // Percentage width + aspectRatio: 1 makes each cell scale with the
  // (now capped) container, so it stays square and shrinks on small
  // phones instead of using a fixed pixel size that could overflow.
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  cellSelected: { backgroundColor: '#7B2CBF', borderRadius: 999 },
  cellToday: { backgroundColor: '#F3E8FF', borderRadius: 999 },
  cellText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  cellTextSel: { color: '#FFF', fontWeight: '700' },
  cellTextToday: { color: '#7B2CBF', fontWeight: '700' },
});
// ─────────────────────────────────────────────────────────────────────────────

// Derive status purely from today's date vs start/end — used for live display
// AND for auto-selecting status while filling the form.
function deriveStatus(startDate: string, endDate: string): BatchStatus {
  if (!startDate) return 'UPCOMING';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);

  if (start > today) return 'UPCOMING';
  if (end && end < today) return 'COMPLETED';
  return 'ACTIVE';
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
  const [formDuration, setFormDuration] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formClassTime, setFormClassTime] = useState('');
  const [formStatus, setFormStatus] = useState<BatchStatus>('UPCOMING');
  const [formClassDays, setFormClassDays] = useState<ClassDay[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // Which inline calendar is open: 'start' | 'end' | null. Only one at a time.
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => setToast(null));
  };

  // Auto-select status whenever start/end date changes in the form
  useEffect(() => {
    if (!formStartDate) return;
    setFormStatus(deriveStatus(formStartDate, formEndDate));
  }, [formStartDate, formEndDate]);

  useEffect(() => { loadData(); }, []);

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
      setBatches(rawBatches);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Live status for display — ignores whatever is stored in the DB and
  // recomputes from today's date every render, so Upcoming -> Active ->
  // Completed happens automatically without anyone editing the batch.
  const getLiveStatus = (batch: Batch): BatchStatus => deriveStatus(batch.startDate, batch.endDate);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const filteredBatches = [...batches]
    .sort((a, b) => b.id - a.id)
    .filter(b => {
      const matchesSearch = b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.selectCourse.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterTab === 'All') return matchesSearch;
      return matchesSearch && getLiveStatus(b) === filterTab.toUpperCase();
    });

  const totalPages = Math.ceil(filteredBatches.length / PAGE_SIZE);
  const pagedBatches = filteredBatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  React.useEffect(() => { setCurrentPage(1); }, [filterTab, searchQuery]);

  const activeCount = batches.filter(b => getLiveStatus(b) === 'ACTIVE').length;
  const upcomingCount = batches.filter(b => getLiveStatus(b) === 'UPCOMING').length;
  const completedCount = batches.filter(b => getLiveStatus(b) === 'COMPLETED').length;

  const handleOpenAddModal = () => {
    setSelectedBatch(null);
    setFormBatchName('');
    setFormCourse('');
    setFormInstructor('');
    setFormDuration('');
    setFormStartDate('');
    setFormEndDate('');
    setFormClassTime('');
    setFormStatus('UPCOMING');
    setFormClassDays([]);
    setActiveDatePicker(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormBatchName(batch.batchName);
    setFormCourse(batch.selectCourse);
    setFormInstructor(batch.instructor);
    setFormDuration(batch.duration || '');
    setFormStartDate(batch.startDate);
    setFormEndDate(batch.endDate);
    setFormClassTime(batch.classTimings || batch.courseTimings || '');
    setFormStatus(getLiveStatus(batch));
    setFormClassDays(batch.classDays || []);
    setActiveDatePicker(null);
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
        duration: formDuration,
        startDate: formStartDate,
        endDate: formEndDate,
        classDays: formClassDays,
        classTimings: formClassTime,
        courseTimings: formClassTime,
        status: formStatus,
      };
      if (selectedBatch) {
        await api.updateBatch(selectedBatch.id, payload);
        showToast('Batch updated successfully', 'success');
      } else {
        await api.createBatch(payload);
        showToast('Batch created successfully', 'success');
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
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
    } catch {
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

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
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['All','Active','Upcoming','Completed'] as FilterTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                tab === 'Active' && styles.filterTabGreen,
                tab === 'Upcoming' && styles.filterTabAmber,
                tab === 'Completed' && styles.filterTabGrayBg,
                filterTab === tab && (
                  tab === 'All' ? styles.filterTabActiveAll :
                  tab === 'Active' ? styles.filterTabActiveGreen :
                  tab === 'Upcoming' ? styles.filterTabActiveAmber :
                  styles.filterTabActiveGray
                ),
              ]}
              onPress={() => setFilterTab(tab)}
            >
              <Text style={[
                styles.filterTabText,
                tab === 'Active' && styles.filterTabTextGreen,
                tab === 'Upcoming' && styles.filterTabTextAmber,
                tab === 'Completed' && styles.filterTabTextGray,
                filterTab === tab && styles.filterTabTextActive,
              ]}>
                {tab}{tab === 'Active' ? ` ${activeCount}` : tab === 'Upcoming' ? ` ${upcomingCount}` : tab === 'Completed' ? ` ${completedCount}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Card */}
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
          <>
            {pagedBatches.map((batch) => {
              const selectedCourse = courses.find(c => c.title === batch.selectCourse);
              const liveStatus = getLiveStatus(batch);
              return (
                <View key={batch.id} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <View style={styles.batchIconBox}>
                      <Ionicons name="book" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.batchHeaderText}>
                      <Text style={styles.batchName}>{batch.batchName}</Text>
                      <Text style={styles.batchCourse}>{batch.selectCourse}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(liveStatus) }]}>
                      <Text style={styles.statusText}>
                        {liveStatus === 'ACTIVE' ? 'Active' : liveStatus === 'UPCOMING' ? 'Upcoming' : 'Completed'}
                      </Text>
                    </View>
                    <TouchableOpacity style={{ marginLeft: 6 }}>
                      <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.batchInfoGrid}>
                    <View style={styles.infoColumn}>
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>{batch.instructor}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>{formatDate(batch.startDate)}</Text>
                      </View>
                      {batch.classDays && batch.classDays.length > 0 && (
                        <View style={styles.daysChipRow}>
                          {batch.classDays.map(day => (
                            <View key={day} style={styles.daysChip}>
                              <Text style={styles.daysChipText}>{day.substring(0,3)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={styles.infoColumn}>
                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>
                          {batch.classTimings || batch.courseTimings || selectedCourse?.classTimings || '—'}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>{formatDate(batch.endDate)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>{batch.studentsCount ?? 0} students</Text>
                      </View>
                    </View>
                  </View>

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
                      onPress={() => setViewingBatch({
                        ...batch,
                        courseTimings: selectedCourse?.classTimings || batch.courseTimings || '',
                      })}
                    >
                      <Text style={styles.viewStudentsBtnText}>Students</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  onPress={() => setCurrentPage(p => Math.max(1, p-1))}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#D1D5DB' : '#7B2CBF'} />
                </TouchableOpacity>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(page => (
                  <TouchableOpacity
                    key={page}
                    style={[styles.pageNum, currentPage === page && styles.pageNumActive]}
                    onPress={() => setCurrentPage(page)}
                  >
                    <Text style={[styles.pageNumText, currentPage === page && styles.pageNumTextActive]}>{page}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                  disabled={currentPage === totalPages}
                >
                  <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#D1D5DB' : '#7B2CBF'} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
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

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>

              <Text style={styles.fieldLabel}>Batch Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Batch A - Jan 2026" placeholderTextColor="#9CA3AF" value={formBatchName} onChangeText={setFormBatchName} />

              <Text style={styles.fieldLabel}>Select Course *</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => { setShowCourseDropdown(!showCourseDropdown); setShowInstructorDropdown(false); }}>
                <Ionicons name="book-outline" size={16} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !formCourse && styles.dropdownPlaceholder]}>{formCourse || 'Select Course'}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showCourseDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {courses.length === 0 ? (
                      <View style={styles.dropdownItem}><Text style={{ color: '#9CA3AF' }}>No courses available</Text></View>
                    ) : courses.map(c => (
                      <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => { setFormCourse(c.title); setShowCourseDropdown(false); }}>
                        <Text>{c.title}</Text>
                        {formCourse === c.title && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                      </TouchableOpacity>
                    ))}
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
                      <View style={styles.dropdownItem}><Text style={{ color: '#9CA3AF' }}>No teachers available</Text></View>
                    ) : teachers.map(t => (
                      <TouchableOpacity key={t.id} style={styles.dropdownItem} onPress={() => { setFormInstructor(t.name); setShowInstructorDropdown(false); }}>
                        <Text>{t.name}</Text>
                        {formInstructor === t.name && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.sectionTitle}>DURATION & SCHEDULE</Text>

              <Text style={styles.fieldLabel}>Duration</Text>
              <TextInput style={styles.input} placeholder="e.g. 3 Months" placeholderTextColor="#9CA3AF" value={formDuration} onChangeText={setFormDuration} />

              {/* ── Date pickers — tapping one pops the calendar up right in
                     front of that field (floating over the rest of the
                     form); it disappears the moment a date is picked ── */}
              <View style={[styles.dateRowWrap, { zIndex: activeDatePicker ? 100 : 1 }]}>
                <View style={styles.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Start Date *</Text>
                    <TouchableOpacity
                      style={[styles.datePicker, activeDatePicker === 'start' && styles.datePickerActive]}
                      onPress={() => setActiveDatePicker(activeDatePicker === 'start' ? null : 'start')}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#7B2CBF" />
                      <Text style={[styles.datePickerText, !formStartDate && styles.datePickerPlaceholder]}>
                        {formStartDate || 'Pick date'}
                      </Text>
                    </TouchableOpacity>

                    {activeDatePicker === 'start' && (
                      <View style={styles.calendarPopover}>
                        <InlineCalendar
                          value={formStartDate}
                          onSelect={(date) => { setFormStartDate(date); setActiveDatePicker(null); }}
                        />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.fieldLabel}>End Date</Text>
                    <TouchableOpacity
                      style={[styles.datePicker, activeDatePicker === 'end' && styles.datePickerActive]}
                      onPress={() => setActiveDatePicker(activeDatePicker === 'end' ? null : 'end')}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#7B2CBF" />
                      <Text style={[styles.datePickerText, !formEndDate && styles.datePickerPlaceholder]}>
                        {formEndDate || 'Pick date'}
                      </Text>
                    </TouchableOpacity>

                    {activeDatePicker === 'end' && (
                      <View style={[styles.calendarPopover, styles.calendarPopoverRight]}>
                        <InlineCalendar
                          value={formEndDate}
                          onSelect={(date) => { setFormEndDate(date); setActiveDatePicker(null); }}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </View>


              <Text style={styles.fieldLabel}>Class Days *</Text>
              <View style={styles.daysRow}>
                {(['MON','TUE','WED','THU','FRI','SAT','SUN'] as ClassDay[]).map(day => (
                  <TouchableOpacity key={day} style={[styles.dayChip, formClassDays.includes(day) && styles.dayChipActive]} onPress={() => toggleClassDay(day)}>
                    <Text style={[styles.dayChipText, formClassDays.includes(day) && styles.dayChipTextActive]}>{day.substring(0,3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Class Time</Text>
              <TextInput style={styles.input} placeholder="e.g. 8:00 PM - 10:00 PM" placeholderTextColor="#9CA3AF" value={formClassTime} onChangeText={setFormClassTime} />

              {/* ── Status — auto-selected from the dates above, still
                     manually overridable by tapping a chip ── */}
              <Text style={styles.sectionTitle}>STATUS</Text>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusRow}>
                {(['UPCOMING','ACTIVE','COMPLETED'] as BatchStatus[]).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusChip, formStatus === status && styles.statusChipActive]}
                    onPress={() => setFormStatus(status)}
                  >
                    <Text style={[styles.statusChipText, formStatus === status && styles.statusChipTextActive]}>
                      {status === 'UPCOMING' ? 'Upcoming' : status === 'ACTIVE' ? 'Active' : 'Completed'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.createBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.createBtnText}>{selectedBatch ? 'Save Changes' : 'Create Batch'}</Text>}
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
  toast: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999, borderRadius: 12, padding: 14, elevation: 8 },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFF', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 6 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#E9D5FF', fontWeight: '600', marginTop: 3 },
  addBtn: { backgroundColor: '#FF9500', width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 14, height: 46 },
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
  statsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, paddingVertical: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
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
  daysChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  daysChip: { backgroundColor: '#F3E8FF', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },
  daysChipText: { fontSize: 11, color: '#7B2CBF', fontWeight: '600' },
  batchActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, alignItems: 'center' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E8FF', paddingVertical: 10, borderRadius: 10, gap: 6 },
  editBtnText: { fontSize: 13, fontWeight: 'bold', color: '#7B2CBF' },
  deleteBtn: { width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  viewStudentsBtn: { flex: 1.2, flexDirection: 'row', backgroundColor: '#7B2CBF', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 4 },
  viewStudentsBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  modalHeader: { backgroundColor: '#7B2CBF', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalSubtitle: { fontSize: 12, color: '#E9D5FF', marginTop: 2 },
  modalScroll: { padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', letterSpacing: 0.5, marginTop: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 48, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#FFF', color: '#1F2937' },
  dropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 48, paddingHorizontal: 12, backgroundColor: '#FFF', gap: 8 },
  dropdownText: { flex: 1, fontSize: 14, color: '#1F2937' },
  dropdownPlaceholder: { color: '#9CA3AF' },
  dropdownList: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginTop: 4, maxHeight: 200, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRowWrap: { position: 'relative' },
  dateRow: { flexDirection: 'row' },
  // Floats the calendar right in front of the field it belongs to,
  // instead of it being part of the normal document flow.
  calendarPopover: {
    position: 'absolute',
    top: 80,
    left: 0,
    width: 300,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  calendarPopoverRight: { left: undefined, right: 0 },
  datePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    height: 48, paddingHorizontal: 12, backgroundColor: '#FFF',
  },
  datePickerActive: { borderColor: '#7B2CBF', borderWidth: 1.5 },
  datePickerText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  datePickerPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
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
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 20 },
  pageBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#F3F4F6' },
  pageNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  pageNumActive: { backgroundColor: '#7B2CBF' },
  pageNumText: { fontSize: 13, fontWeight: '700', color: '#7B2CBF' },
  pageNumTextActive: { color: '#FFF' },
});