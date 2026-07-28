import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { parseSyllabus, serializeSyllabus } from '../../utils/syllabus-parser';

import { Course, Teacher, CourseFormData, DEFAULT_FORM_DATA } from './courses-components/types';
import { CourseCardItem } from './courses-components/CourseCardItem';
import { CourseModal } from './courses-components/CourseModal';

const PAGE_SIZE = 5;

export default function AdminCoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Upcoming' | 'Completed'>('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CourseFormData>(DEFAULT_FORM_DATA);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, type });
      toastAnim.setValue(0);
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(
          () => setToast(null)
        );
      }, 3000);
    },
    [toastAnim]
  );

  const updateFormField = useCallback(<K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, teacherRes, batchRes] = await Promise.all([
        api.getAllCourses(),
        api.getTeachers(),
        api.getBatches(),
      ]);

      const list = courseRes?.data ?? courseRes?.content ?? courseRes ?? [];
      const teacherList = teacherRes?.success ? teacherRes.data : [];
      const allBatches: any[] = Array.isArray(batchRes) ? batchRes : [];

      setTeachers(teacherList.map((t: any) => ({ id: t.teacherId || t.id, name: t.name })));

      const batchStatusLabel = (s: string): 'Active' | 'Upcoming' | 'Completed' =>
        s === 'ACTIVE' ? 'Active' : s === 'COMPLETED' ? 'Completed' : 'Upcoming';

      const mapped = list.map((c: any) => {
        const linked = allBatches.filter(
          (b: any) => (b.selectCourse ?? '').toLowerCase() === (c.title ?? '').toLowerCase()
        );
        const batch =
          linked.find((b: any) => b.status === 'ACTIVE') ??
          linked.find((b: any) => b.status === 'UPCOMING') ??
          linked[0] ??
          null;

        const status: 'Active' | 'Upcoming' | 'Completed' = batch
          ? batchStatusLabel(batch.status)
          : c.status === 'ACTIVE'
          ? 'Active'
          : c.status === 'INACTIVE'
          ? 'Completed'
          : 'Upcoming';

        return {
          id: String(c.id),
          title: c.title,
          category: c.category ?? '',
          instructor: c.instructor ?? 'TBD',
          duration: batch?.duration || c.duration || '',
          studentsCount: c.studentsCount ?? c.enrollmentCount ?? 0,
          maxCapacity: c.maxCapacity ?? 50,
          startDate: batch?.startDate || c.startDate || '',
          endDate: batch?.endDate || c.endDate || '',
          classTimings: batch?.classTimings || batch?.courseTimings || c.classTimings || '',
          classDays: c.classDays ?? '',
          price: c.price != null ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹0',
          status,
          description: c.description ?? '',
          syllabusTopics: c.syllabusTopics ?? '',
          whatYouWillLearn: c.whatYouWillLearn ?? '',
          googleMeetLink: c.googleMeetLink ?? '',
          totalSessions: c.totalSessions ?? 0,
        };
      });
      setCourses(mapped.sort((a: any, b: any) => Number(b.id) - Number(a.id)));
    } catch (err) {
      console.log('Failed to fetch courses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // ── Memoized Filtering & Pagination ──
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return courses.filter((course) => {
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q);
      return activeTab === 'All' ? matchesSearch : matchesSearch && course.status === activeTab;
    });
  }, [courses, searchQuery, activeTab]);

  const totalPages = useMemo(
    () => Math.ceil(filteredCourses.length / PAGE_SIZE) || 1,
    [filteredCourses.length]
  );

  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredCourses, page]);

  const { activeCount, upcomingCount, completedCount } = useMemo(() => {
    let active = 0,
      upcoming = 0,
      completed = 0;
    courses.forEach((c) => {
      if (c.status === 'Active') active++;
      else if (c.status === 'Upcoming') upcoming++;
      else if (c.status === 'Completed') completed++;
    });
    return { activeCount: active, upcomingCount: upcoming, completedCount: completed };
  }, [courses]);

  // ── Handlers ──
  const handleOpenAddModal = useCallback(() => {
    setSelectedCourse(null);
    setFormData(DEFAULT_FORM_DATA);
    setShowInstructorDropdown(false);
    setIsModalVisible(true);
  }, []);

  const handleOpenEditModal = useCallback((course: Course) => {
    setSelectedCourse(course);
    const toStr = (v: any) => {
      if (!v) return '';
      if (Array.isArray(v))
        return `${v[0]}-${String(v[1]).padStart(2, '0')}-${String(v[2]).padStart(2, '0')}`;
      return String(v);
    };

    const parsed = parseSyllabus(course.syllabusTopics);
    setFormData({
      title: course.title,
      category: course.category,
      instructor: course.instructor,
      description: course.description || '',
      duration: course.duration,
      totalSessions: course.totalSessions ? String(course.totalSessions) : '',
      startDate: toStr(course.startDate),
      endDate: toStr(course.endDate),
      classTime: course.classTimings || '',
      classDays: course.classDays ? course.classDays.split(', ').filter(Boolean) : [],
      capacity: String(course.maxCapacity),
      price: course.price.replace(/[^\d]/g, ''),
      status: course.status,
      syllabusTopics: course.syllabusTopics || '',
      syllabusModules: parsed.length > 0 ? parsed : [{ title: 'Module 1', topics: [''] }],
      syllabusMode: 'builder',
      whatYouWillLearn: course.whatYouWillLearn || '',
      googleMeetLink: course.googleMeetLink || '',
    });
    setShowInstructorDropdown(false);
    setIsModalVisible(true);
  }, []);

  const handleSaveCourse = useCallback(async () => {
    if (!formData.title || !formData.instructor || !formData.capacity || !formData.price) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const backendStatus =
      formData.status === 'Active'
        ? 'ACTIVE'
        : formData.status === 'Completed'
        ? 'INACTIVE'
        : 'DRAFT';

    const finalSyllabus =
      formData.syllabusMode === 'builder'
        ? serializeSyllabus(formData.syllabusModules)
        : formData.syllabusTopics;

    const payload: any = {
      title: formData.title,
      category: formData.category || null,
      instructor: formData.instructor,
      description: formData.description || null,
      duration: formData.duration || null,
      totalSessions: formData.totalSessions ? Number(formData.totalSessions) : null,
      classTimings: formData.classTime || null,
      classDays: formData.classDays.length > 0 ? formData.classDays.join(', ') : null,
      maxCapacity: Number(formData.capacity),
      price: Number(formData.price),
      status: backendStatus,
      syllabusTopics: finalSyllabus || null,
      whatYouWillLearn: formData.whatYouWillLearn || null,
      googleMeetLink: formData.googleMeetLink || null,
    };

    if (formData.startDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.startDate)) {
      payload.startDate = formData.startDate;
    }
    if (formData.endDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.endDate)) {
      payload.endDate = formData.endDate;
    }

    try {
      if (selectedCourse) {
        await api.updateCourse(selectedCourse.id, payload);
        setIsModalVisible(false);
        showToast('Course updated successfully.');
      } else {
        await api.createCourse(payload);
        setIsModalVisible(false);
        showToast('New course created successfully.');
      }
      fetchCourses();
    } catch (err: any) {
      showToast(err?.message ?? 'Failed to save course.', 'error');
      console.error('handleSaveCourse error:', err);
    }
  }, [formData, selectedCourse, fetchCourses, showToast]);

  const handleDeleteCourse = useCallback(
    async (id: string) => {
      const confirmed =
        Platform.OS === 'web' ? window.confirm('Are you sure you want to delete this course?') : true;
      if (!confirmed) return;
      try {
        await api.deleteCourse(id);
        fetchCourses();
        showToast('Course deleted successfully.');
      } catch (err) {
        showToast('Failed to delete course.', 'error');
        console.error(err);
      }
    },
    [fetchCourses, showToast]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(9,2,0,0.14)',
            'rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)',
            'rgba(118,62,11,0.573)',
            'rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)',
            '#FB8B24',
            'rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)',
            'rgba(118,62,11,0.573)',
            'rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)',
            'rgba(9,2,0,0.14)',
            'rgba(0,0,0,0)',
          ]}
          locations={[
            0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857,
            0.8571, 0.9286, 1,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Manage Courses</Text>
            <Text style={styles.headerSubtitle}>{courses.length} total courses</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search bar inside header */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, instructors..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* FILTER PILL TABS */}
        <View style={styles.filterTabsRow}>
          {(['All', 'Active', 'Upcoming', 'Completed'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? courses.length
                : tab === 'Active'
                ? activeCount
                : tab === 'Upcoming'
                ? upcomingCount
                : completedCount;
            const pillStyle =
              tab === 'Active'
                ? styles.filterPillGreen
                : tab === 'Upcoming'
                ? styles.filterPillAmber
                : tab === 'Completed'
                ? styles.filterPillGray
                : styles.filterPill;
            return (
              <TouchableOpacity
                key={tab}
                style={[pillStyle, activeTab === tab && styles.filterPillActive]}
                onPress={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
              >
                <Text style={[styles.filterPillText, activeTab === tab && styles.filterPillTextActive]}>
                  {tab}
                  {tab !== 'All' ? ` ${count}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STATS ROW */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#6B7280' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color="#7B2CBF" />
              <Text style={styles.emptyText}>Loading courses...</Text>
            </View>
          ) : filteredCourses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No courses scheduled under this tab.</Text>
            </View>
          ) : (
            paginatedCourses.map((item) => (
              <CourseCardItem
                key={item.id}
                item={item}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteCourse}
              />
            ))
          )}
        </View>

        {!loading && totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={16} color={page === 1 ? '#D1D5DB' : '#7B2CBF'} />
            </TouchableOpacity>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.pageBtn, page === n && styles.pageBtnActive]}
                onPress={() => setPage(n)}
              >
                <Text style={[styles.pageBtnText, page === n && styles.pageBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={page === totalPages ? '#D1D5DB' : '#7B2CBF'}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'error' ? styles.toastError : styles.toastSuccess,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={toast.type === 'error' ? 'close-circle' : 'checkmark-circle'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ADD / EDIT COURSE MODAL */}
      <CourseModal
        isVisible={isModalVisible}
        selectedCourse={selectedCourse}
        teachers={teachers}
        formData={formData}
        showInstructorDropdown={showInstructorDropdown}
        onClose={() => setIsModalVisible(false)}
        onUpdateField={updateFormField}
        onToggleDropdown={() => setShowInstructorDropdown((prev) => !prev)}
        onSubmit={handleSaveCourse}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
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
  headerTopRow: {
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
    color: '#FFFFFF',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    height: '100%',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(123,44,191,0.10)',
  },
  filterPillGreen: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.10)',
  },
  filterPillAmber: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  filterPillGray: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(107,114,128,0.10)',
  },
  filterPillActive: {
    backgroundColor: '#7B2CBF',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  listContainer: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageBtnActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 80,
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
