import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Modal, ActivityIndicator, Animated, StatusBar, useWindowDimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { adminDataCache } from '../../services/admin-data-cache';
import BatchStudentsScreen from './batch-students-screen';
import { parseSyllabus } from '../../utils/syllabus-parser';
import { parseTopicsData, isTopicCovered } from '../../utils/syllabus-progress-store';
import { coursesData } from '../home/home-screen';

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
  coveredTopics?: string;
}

interface Course {
  id: number;
  title: string;
  classTimings?: string;
  googleMeetLink?: string;
  syllabusTopics?: string;
  coveredTopics?: string;
}

interface Teacher {
  id: string;
  name: string;
}

export default function AdminBatchesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [syllabusViewingBatch, setSyllabusViewingBatch] = useState<Batch | null>(null);

  const [formBatchName, setFormBatchName] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formClassTime, setFormClassTime] = useState('');
  const [formGoogleMeetLink, setFormGoogleMeetLink] = useState('');
  const [formStatus, setFormStatus] = useState<BatchStatus>('UPCOMING');
  const [formClassDays, setFormClassDays] = useState<ClassDay[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [activeCalendarField, setActiveCalendarField] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: (Platform.OS as string) !== 'web' }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: (Platform.OS as string) !== 'web' }),
    ]).start(() => setToast(null));
  };

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [batchRes, courseRes, teacherRes] = await Promise.all([
        api.getBatches(),
        api.getAllCourses(),
        api.getTeachers(),
      ]);
      const rawBatches: Batch[] = Array.isArray(batchRes)
        ? batchRes
        : Array.isArray(batchRes?.data)
        ? batchRes.data
        : [];
      setCourses(courseRes?.success && Array.isArray(courseRes?.data) ? courseRes.data : Array.isArray(courseRes) ? courseRes : []);
      setTeachers(teacherRes?.success && Array.isArray(teacherRes?.data) ? teacherRes.data.map((t: any) => ({ id: t.teacherId || t.id, name: t.name })) : []);
      setBatches(rawBatches);
    } catch (err) {
      if (showSpinner) showToast('Failed to load data', 'error');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
      const interval = setInterval(() => {
        loadData(false);
      }, 3000);
      return () => clearInterval(interval);
    }, [loadData])
  );

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const filteredBatches = [...batches]
    .sort((a, b) => b.id - a.id)
    .filter(b => {
      const matchSearch =
        b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.selectCourse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterTab === 'All') return matchSearch;
      return matchSearch && b.status.toUpperCase() === filterTab.toUpperCase();
    });

  const totalPages = Math.ceil(filteredBatches.length / PAGE_SIZE) || 1;
  const pagedBatches = filteredBatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filter/search changes
  React.useEffect(() => { setCurrentPage(1); }, [filterTab, searchQuery]);

  const activeCount = batches.filter(b => b.status === 'ACTIVE').length;
  const upcomingCount = batches.filter(b => b.status === 'UPCOMING').length;
  const completedCount = batches.filter(b => b.status === 'COMPLETED').length;

  const handleOpenAddModal = () => {
    setSelectedBatch(null);
    setFormBatchName('');
    setFormCourse('');
    setFormInstructor('');
    setFormDuration('');
    setFormStartDate('');
    setFormEndDate('');
    setFormClassTime('');
    setFormGoogleMeetLink('');
    setFormStatus('UPCOMING');
    setFormClassDays([]);
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
    setFormGoogleMeetLink(batch.googleMeetLink || batch.meetLink || '');
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
        duration: formDuration,
        startDate: formStartDate,
        endDate: formEndDate,
        classDays: formClassDays,
        classTimings: formClassTime,
        courseTimings: formClassTime,
        googleMeetLink: formGoogleMeetLink,
        meetLink: formGoogleMeetLink,
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
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: isDesktop ? 1200 : undefined, alignSelf: 'center' }}>
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
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { width: '100%', maxWidth: isDesktop ? 1200 : undefined, alignSelf: 'center' }]} showsVerticalScrollIndicator={false}>
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
          <>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 16 }}>
          {pagedBatches.map((batch) => {
            const batchCourseNorm = (batch.selectCourse || '').trim().toLowerCase();
            const selectedCourse = courses.find(c => {
              if (!c.title) return false;
              const ct = c.title.trim().toLowerCase();
              return ct === batchCourseNorm || (batchCourseNorm && (ct.includes(batchCourseNorm) || batchCourseNorm.includes(ct)));
            });
            const syllabusRaw = (selectedCourse as any)?.syllabusTopics ||
              (selectedCourse as any)?.syllabus ||
              (selectedCourse as any)?.whatYouWillLearn ||
              (coursesData as any)?.[batch.selectCourse]?.syllabusTopics ||
              (coursesData as any)?.[batch.selectCourse]?.syllabus ||
              Object.values(coursesData).find(cd => cd.title?.trim().toLowerCase() === batchCourseNorm)?.syllabusTopics ||
              Object.values(coursesData).find(cd => batchCourseNorm && (cd.title?.toLowerCase().includes(batchCourseNorm) || batchCourseNorm.includes(cd.title?.toLowerCase())))?.syllabusTopics;
            const parsedModules = parseSyllabus(syllabusRaw);
            let allBatchTopics: string[] = [];
            parsedModules.forEach(m => {
              if (m.topics && m.topics.length > 0) allBatchTopics.push(...m.topics);
            });
            const totalSyllabusTopics = allBatchTopics.length;
            const coveredList = parseTopicsData(batch.coveredTopics || (selectedCourse as any)?.coveredTopics || (batch as any).completedTopics);
            const coveredSyllabusCount = allBatchTopics.filter(t => isTopicCovered(t, coveredList)).length;
            const syllabusPercent = totalSyllabusTopics > 0 ? Math.round((coveredSyllabusCount / totalSyllabusTopics) * 100) : 0;

            return (
              <View key={batch.id} style={[styles.batchCard, { width: isDesktop ? '48.8%' : '100%' }]}>
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
                        {batch.classDays.map(day => (
                          <View key={day} style={styles.daysChip}>
                            <Text style={styles.daysChipText}>{day.substring(0, 3)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {/* Right column */}
                  <View style={styles.infoColumn}>
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>
                        {batch.classTimings || batch.courseTimings || selectedCourse?.classTimings || '—'}
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

                {/* Syllabus Progress Bar */}
                {totalSyllabusTopics > 0 && (
                  <View style={styles.batchSyllabusBox}>
                    <View style={styles.batchSyllabusHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="school-outline" size={14} color="#7B2CBF" />
                        <Text style={styles.batchSyllabusTitle}>Syllabus Progress</Text>
                      </View>
                      <Text style={[styles.batchSyllabusVal, { color: syllabusPercent === 100 ? '#059669' : '#7B2CBF' }]}>
                        {coveredSyllabusCount} / {totalSyllabusTopics} Topics ({syllabusPercent}%)
                      </Text>
                    </View>
                    <View style={styles.batchProgressTrack}>
                      <View
                        style={[
                          styles.batchProgressFill,
                          {
                            width: `${syllabusPercent}%`,
                            backgroundColor: syllabusPercent === 100 ? '#10B981' : '#7B2CBF',
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Google Meet Link Box */}
                <View style={styles.meetBoxContainer}>
                  <Ionicons name="videocam-outline" size={16} color="#7B2CBF" />
                  <TouchableOpacity
                    style={{ flex: 1, marginHorizontal: 8 }}
                    onPress={() => {
                      const url = batch.googleMeetLink || batch.meetLink || 'https://meet.google.com/miq-hydh-kkf';
                      Linking.openURL(url).catch(() => {});
                    }}
                  >
                    <Text style={styles.meetUrlText} numberOfLines={1}>
                      {batch.googleMeetLink || batch.meetLink || 'https://meet.google.com/miq-hydh-kkf'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.meetEditBtn}
                    onPress={() => handleOpenEditModal(batch)}
                  >
                    <Ionicons name="create-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.meetEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.batchActions}>
                  <TouchableOpacity style={styles.syllabusBtn} onPress={() => setSyllabusViewingBatch(batch)}>
                    <Ionicons name="book-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.syllabusBtnText}>Syllabus</Text>
                  </TouchableOpacity>
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
          </View>

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#D1D5DB' : '#7B2CBF'} />
              </TouchableOpacity>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#D1D5DB' : '#7B2CBF'} />
              </TouchableOpacity>
            </View>
          )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: '100%', maxWidth: 700, alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: isDesktop ? 24 : 0, borderBottomRightRadius: isDesktop ? 24 : 0 }]}>
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

              <Text style={styles.sectionTitle}>DURATION & SCHEDULE</Text>

              <Text style={styles.fieldLabel}>Duration *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3 Months"
                value={formDuration}
                onChangeText={setFormDuration}
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start Date *</Text>
                  <TouchableOpacity
                    style={styles.datePickerInputBox}
                    onPress={() => setActiveCalendarField('start')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar" size={18} color="#7B2CBF" style={{ marginRight: 8 }} />
                    <Text style={[styles.dateInputText, !formStartDate && styles.dateInputPlaceholder]}>
                      {formStartDate || 'Select Date'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerInputBox}
                    onPress={() => setActiveCalendarField('end')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar" size={18} color="#7B2CBF" style={{ marginRight: 8 }} />
                    <Text style={[styles.dateInputText, !formEndDate && styles.dateInputPlaceholder]}>
                      {formEndDate || 'Select Date'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
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

              <Text style={styles.fieldLabel}>Class Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8:00 PM - 10:00 PM"
                value={formClassTime}
                onChangeText={setFormClassTime}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.fieldLabel}>Google Meet Link</Text>
              <TextInput
                style={styles.input}
                placeholder="https://meet.google.com/..."
                value={formGoogleMeetLink}
                onChangeText={setFormGoogleMeetLink}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />

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

      {/* Syllabus Progress Modal */}
      <Modal
        visible={!!syllabusViewingBatch}
        animationType="slide"
        transparent
        onRequestClose={() => setSyllabusViewingBatch(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: '100%', maxWidth: 700, alignSelf: 'center', maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: isDesktop ? 24 : 0, borderBottomRightRadius: isDesktop ? 24 : 0 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSyllabusViewingBatch(null)}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {syllabusViewingBatch?.batchName || 'Batch Syllabus'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {syllabusViewingBatch?.selectCourse} • {syllabusViewingBatch?.instructor}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSyllabusViewingBatch(null)}>
                <Ionicons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {(() => {
                if (!syllabusViewingBatch) return null;
                const batchCourseNorm = (syllabusViewingBatch.selectCourse || '').trim().toLowerCase();
                const selectedCourse = courses.find(c => {
                  if (!c.title) return false;
                  const ct = c.title.trim().toLowerCase();
                  return ct === batchCourseNorm || (batchCourseNorm && (ct.includes(batchCourseNorm) || batchCourseNorm.includes(ct)));
                });
                const syllabusRaw = (selectedCourse as any)?.syllabusTopics ||
                  (selectedCourse as any)?.syllabus ||
                  (selectedCourse as any)?.whatYouWillLearn ||
                  (coursesData as any)?.[syllabusViewingBatch.selectCourse]?.syllabusTopics ||
                  (coursesData as any)?.[syllabusViewingBatch.selectCourse]?.syllabus ||
                  Object.values(coursesData).find(cd => cd.title?.trim().toLowerCase() === batchCourseNorm)?.syllabusTopics ||
                  Object.values(coursesData).find(cd => batchCourseNorm && (cd.title?.toLowerCase().includes(batchCourseNorm) || batchCourseNorm.includes(cd.title?.toLowerCase())))?.syllabusTopics;
                const parsedModules = parseSyllabus(syllabusRaw);
                let allBatchTopics: string[] = [];
                parsedModules.forEach(m => {
                  if (m.topics && m.topics.length > 0) allBatchTopics.push(...m.topics);
                });
                const totalSyllabusTopics = allBatchTopics.length;
                const coveredList = parseTopicsData(syllabusViewingBatch.coveredTopics || (selectedCourse as any)?.coveredTopics || (syllabusViewingBatch as any).completedTopics);
                const coveredSyllabusCount = allBatchTopics.filter(t => isTopicCovered(t, coveredList)).length;
                const syllabusPercent = totalSyllabusTopics > 0 ? Math.round((coveredSyllabusCount / totalSyllabusTopics) * 100) : 0;

                if (parsedModules.length === 0) {
                  return (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                      <Ionicons name="book-outline" size={40} color="#9CA3AF" />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 12 }}>No Syllabus Topics Configured</Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                        You can configure syllabus modules and topics in the Course Editor.
                      </Text>
                    </View>
                  );
                }

                return (
                  <View style={{ paddingBottom: 24 }}>
                    {/* Summary Progress Card */}
                    <View style={{ backgroundColor: '#F3E8FF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E9D5FF' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="school" size={18} color="#7B2CBF" />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>Course Syllabus Status</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: syllabusPercent === 100 ? '#059669' : '#7B2CBF' }}>
                          {coveredSyllabusCount} / {totalSyllabusTopics} Topics ({syllabusPercent}%)
                        </Text>
                      </View>
                      <View style={{ height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                        <View style={{ width: `${syllabusPercent}%`, height: '100%', backgroundColor: syllabusPercent === 100 ? '#10B981' : '#7B2CBF', borderRadius: 5 }} />
                      </View>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                        {syllabusPercent === 100 ? '🎉 All topics have been covered by the teacher.' : `${totalSyllabusTopics - coveredSyllabusCount} topics remaining to be covered.`}
                      </Text>
                    </View>

                    {/* Modules Checklist */}
                    {parsedModules.map((mod, mIdx) => (
                      <View key={mIdx} style={{ backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 10 }}>
                          Module {mIdx + 1}: {mod.title}
                        </Text>
                        <View style={{ gap: 8 }}>
                          {mod.topics.map((topic, tIdx) => {
                            const isCovered = isTopicCovered(topic, coveredList);
                            return (
                              <View key={tIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                                <Ionicons
                                  name={isCovered ? "checkmark-circle" : "ellipse-outline"}
                                  size={18}
                                  color={isCovered ? "#10B981" : "#9CA3AF"}
                                />
                                <Text style={{ flex: 1, fontSize: 13, color: isCovered ? '#059669' : '#374151', fontWeight: isCovered ? '600' : '400' }}>
                                  {topic}
                                </Text>
                                <View style={{ backgroundColor: isCovered ? '#D1FAE5' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: isCovered ? '#059669' : '#9CA3AF' }}>
                                    {isCovered ? 'COVERED' : 'PENDING'}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Date Picker Modal */}
      <CalendarModal
        visible={activeCalendarField !== null}
        title={activeCalendarField === 'start' ? 'Select Start Date' : 'Select End Date'}
        initialDate={activeCalendarField === 'start' ? formStartDate : formEndDate}
        onClose={() => setActiveCalendarField(null)}
        onSelectDate={(dateStr) => {
          if (activeCalendarField === 'start') setFormStartDate(dateStr);
          else if (activeCalendarField === 'end') setFormEndDate(dateStr);
        }}
      />
    </SafeAreaView>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function CalendarModal({
  visible,
  title,
  initialDate,
  onClose,
  onSelectDate,
}: {
  visible: boolean;
  title: string;
  initialDate?: string;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}) {
  const [navDate, setNavDate] = useState(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m] = initialDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m] = initialDate.split('-').map(Number);
      setNavDate(new Date(y, m - 1, 1));
    } else {
      setNavDate(new Date());
    }
    setShowYearPicker(false);
  }, [initialDate, visible]);

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const handlePrevMonth = () => setNavDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setNavDate(new Date(year, month + 1, 1));

  const handlePickDay = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelectDate(`${year}-${mm}-${dd}`);
    onClose();
  };

  const handlePickYear = (selectedYear: number) => {
    setNavDate(new Date(selectedYear, month, 1));
    setShowYearPicker(false);
  };

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  const yearsList = Array.from({ length: 16 }, (_, i) => 2020 + i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={calStyles.overlay}>
        <View style={calStyles.box}>
          <View style={calStyles.header}>
            <Text style={calStyles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation Header */}
          <View style={calStyles.monthRow}>
            <TouchableOpacity style={calStyles.navBtn} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={18} color="#7B2CBF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => setShowYearPicker(p => !p)}
            >
              <Text style={calStyles.monthTitle}>{MONTH_NAMES[month]}</Text>
              <View style={calStyles.yearChip}>
                <Text style={calStyles.yearChipText}>{year}</Text>
                <Ionicons name={showYearPicker ? "chevron-up" : "chevron-down"} size={12} color="#7B2CBF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={calStyles.navBtn} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={18} color="#7B2CBF" />
            </TouchableOpacity>
          </View>

          {/* Year Picker Grid View */}
          {showYearPicker ? (
            <View style={{ height: 240 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textAlign: 'center' }}>
                SELECT YEAR
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={calStyles.yearsGrid}>
                  {yearsList.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        calStyles.yearCell,
                        y === year && calStyles.selectedYearCell,
                      ]}
                      onPress={() => handlePickYear(y)}
                    >
                      <Text style={[calStyles.yearText, y === year && calStyles.selectedYearText]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Weekday Labels */}
              <View style={calStyles.weekHeader}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
                  <Text key={w} style={calStyles.weekLabel}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={calStyles.daysGrid}>
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <View key={idx} style={calStyles.emptyCell} />;
                  }
                  const formattedSelected = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = initialDate === formattedSelected;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = todayStr === formattedSelected;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        calStyles.dayCell,
                        isToday && calStyles.todayCell,
                        isSelected && calStyles.selectedCell,
                      ]}
                      onPress={() => handlePickDay(day)}
                    >
                      <Text
                        style={[
                          calStyles.dayText,
                          isToday && calStyles.todayText,
                          isSelected && calStyles.selectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <View style={calStyles.footer}>
            <TouchableOpacity
              style={calStyles.todayBtn}
              onPress={() => {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                onSelectDate(`${y}-${m}-${d}`);
                onClose();
              }}
            >
              <Text style={calStyles.todayBtnText}>Select Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={calStyles.cancelBtn} onPress={onClose}>
              <Text style={calStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    fontWeight: '700',
    color: '#FFF',
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
  daysChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  daysChip: { backgroundColor: '#F3E8FF', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },
  daysChipText: { fontSize: 11, color: '#7B2CBF', fontWeight: '600' },
  batchDays: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, marginBottom: 12 },
  batchDaysText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },
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
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 48, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#FFF' },
  dropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 48, paddingHorizontal: 12, backgroundColor: '#FFF', gap: 8 },
  dropdownText: { flex: 1, fontSize: 14, color: '#1F2937' },
  dropdownPlaceholder: { color: '#9CA3AF' },
  dropdownList: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginTop: 4, maxHeight: 200, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row' },
  datePickerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  dateInputText: { fontSize: 14, color: '#1F2937' },
  dateInputPlaceholder: { color: '#9CA3AF' },
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
  meetBoxContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#DDD6FE',
    marginTop: 12, marginBottom: 4,
  },
  meetUrlText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },
  meetEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE',
  },
  meetEditBtnText: { fontSize: 11, fontWeight: '600', color: '#7B2CBF' },
  batchSyllabusBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  batchSyllabusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  batchSyllabusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  batchSyllabusVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  batchProgressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  batchProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  syllabusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(123,44,191,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syllabusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
  },
});

const calStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  box: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 15, fontWeight: '700', color: '#7B2CBF' },
  yearChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  yearChipText: { fontSize: 13, fontWeight: '700', color: '#7B2CBF' },
  yearsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingVertical: 4 },
  yearCell: { width: '22%', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', alignItems: 'center' },
  selectedYearCell: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  yearText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  selectedYearText: { color: '#FFFFFF', fontWeight: '700' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekLabel: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#6B7280' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  emptyCell: { width: 40, height: 40, margin: 2 },
  dayCell: { width: 40, height: 40, margin: 2, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  todayCell: { borderWidth: 1.5, borderColor: '#7B2CBF', backgroundColor: '#F3E8FF' },
  selectedCell: { backgroundColor: '#7B2CBF' },
  dayText: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  todayText: { color: '#7B2CBF', fontWeight: '700' },
  selectedText: { color: '#FFFFFF', fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 14 },
  todayBtn: { flex: 1, backgroundColor: 'rgba(123,44,191,0.1)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  todayBtnText: { fontSize: 13, fontWeight: '700', color: '#7B2CBF' },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
});
