import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  duration: string;
  studentsCount: number;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  classTimings: string;
  classDays: string;
  price: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  description?: string;
  syllabusTopics?: string;
  whatYouWillLearn?: string;
  googleMeetLink?: string;
  totalSessions?: number;
}

interface Teacher {
  id: string;
  name: string;
}

export default function AdminCoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Upcoming' | 'Completed'>('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formTotalSessions, setFormTotalSessions] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formClassTime, setFormClassTime] = useState('');
  const [formClassDays, setFormClassDays] = useState<string[]>([]);
  const [formCapacity, setFormCapacity] = useState('50');
  const [formPrice, setFormPrice] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [formSyllabusTopics, setFormSyllabusTopics] = useState('');
  const [formWhatYouWillLearn, setFormWhatYouWillLearn] = useState('');
  const [googleMeetChecked, setGoogleMeetChecked] = useState(false);
  const [formGoogleMeetLink, setFormGoogleMeetLink] = useState('');
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
    }, 3000);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [courseRes, teacherRes] = await Promise.all([
        api.getAllCourses(),
        api.getTeachers()
      ]);
      
      const list = courseRes?.data ?? courseRes?.content ?? courseRes ?? [];
      const teacherList = teacherRes?.success ? teacherRes.data : [];
      
      setTeachers(teacherList.map((t: any) => ({ id: t.teacherId || t.id, name: t.name })));
      
      const mapped = list.map((c: any) => ({
        id: String(c.id),
        title: c.title,
        category: c.category ?? '',
        instructor: c.instructor ?? 'TBD',
        duration: c.duration ?? '',
        studentsCount: c.studentsCount ?? c.enrollmentCount ?? 0,
        maxCapacity: c.maxCapacity ?? 50,
        startDate: c.startDate ?? '',
        endDate: c.endDate ?? '',
        classTimings: c.classTimings ?? '',
        classDays: c.classDays ?? '',
        price: c.price != null ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹0',
        status: c.status === 'ACTIVE' ? 'Active' : c.status === 'INACTIVE' ? 'Completed' : 'Upcoming',
        description: c.description ?? '',
        syllabusTopics: c.syllabusTopics ?? '',
        whatYouWillLearn: c.whatYouWillLearn ?? '',
        googleMeetLink: c.googleMeetLink ?? '',
        totalSessions: c.totalSessions ?? 0,
      }));
      setCourses(mapped.slice().reverse());
    } catch (err) {
      console.log('Failed to fetch courses', err);
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentCount = async (courseTitle: string) => {
    try {
      const res = await api.getEnrollmentCount(courseTitle);
      return res?.count ?? 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && course.status === activeTab;
  });

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  const paginatedCourses = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = courses.filter(c => c.status === 'Active').length;
  const upcomingCount = courses.filter(c => c.status === 'Upcoming').length;
  const completedCount = courses.filter(c => c.status === 'Completed').length;

  const handleOpenAddModal = () => {
    setSelectedCourse(null);
    setFormTitle('');
    setFormCategory('');
    setFormInstructor('');
    setFormDescription('');
    setFormDuration('');
    setFormTotalSessions('');
    setFormStartDate('');
    setFormEndDate('');
    setFormClassTime('');
    setFormClassDays([]);
    setFormCapacity('50');
    setFormPrice('');
    setFormStatus('Upcoming');
    setFormSyllabusTopics('');
    setFormWhatYouWillLearn('');
    setGoogleMeetChecked(false);
    setFormGoogleMeetLink('');
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormTitle(course.title);
    setFormCategory(course.category);
    setFormInstructor(course.instructor);
    setFormDescription(course.description || '');
    setFormDuration(course.duration);
    setFormTotalSessions(String(course.totalSessions || ''));
    setFormStartDate(course.startDate);
    setFormEndDate(course.endDate);
    setFormClassTime(course.classTimings);
    setFormClassDays(course.classDays ? course.classDays.split(', ') : []);
    setFormCapacity(String(course.maxCapacity));
    setFormPrice(course.price.replace(/[^\d]/g, ''));
    setFormStatus(course.status);
    setFormSyllabusTopics(course.syllabusTopics || '');
    setFormWhatYouWillLearn(course.whatYouWillLearn || '');
    setGoogleMeetChecked(!!course.googleMeetLink);
    setFormGoogleMeetLink(course.googleMeetLink || '');
    setIsModalVisible(true);
  };

  const handleSaveCourse = async () => {
    if (!formTitle || !formInstructor || !formCapacity || !formPrice) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const backendStatus =
      formStatus === 'Active' ? 'ACTIVE' :
      formStatus === 'Completed' ? 'INACTIVE' : 'DRAFT';

    const payload = {
      title: formTitle,
      category: formCategory,
      instructor: formInstructor,
      description: formDescription,
      duration: formDuration,
      totalSessions: formTotalSessions ? Number(formTotalSessions) : null,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
      classTimings: formClassTime,
      classDays: formClassDays.join(', '),
      maxCapacity: Number(formCapacity),
      price: Number(formPrice),
      status: backendStatus,
      syllabusTopics: formSyllabusTopics,
      whatYouWillLearn: formWhatYouWillLearn,
      googleMeetLink: formGoogleMeetLink || null,
    };

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
  };

  const handleDeleteCourse = async (id: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this course?')
      : true;
    if (!confirmed) return;
    try {
      await api.deleteCourse(id);
      fetchCourses();
      showToast('Course deleted successfully.');
    } catch (err) {
      showToast('Failed to delete course.', 'error');
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {/* HEADER */}
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
            onChangeText={(v) => { setSearchQuery(v); setPage(1); }}
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
            const count = tab === 'All' ? courses.length : tab === 'Active' ? activeCount : tab === 'Upcoming' ? upcomingCount : completedCount;
            const pillStyle = tab === 'Active' ? styles.filterPillGreen : tab === 'Upcoming' ? styles.filterPillAmber : tab === 'Completed' ? styles.filterPillGray : styles.filterPill;
            return (
              <TouchableOpacity
                key={tab}
                style={[pillStyle, activeTab === tab && styles.filterPillActive]}
                onPress={() => { setActiveTab(tab); setPage(1); }}
              >
                <Text style={[styles.filterPillText, activeTab === tab && styles.filterPillTextActive]}>
                  {tab}{tab !== 'All' ? ` ${count}` : ''}
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
            paginatedCourses.map((item) => {
              return (
                <View key={item.id} style={styles.courseCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleCol}>
                      <Text style={styles.courseTitle}>{item.title}</Text>
                      <Text style={styles.instructorName}>Instructor: {item.instructor}</Text>
                    </View>
                    <View style={[styles.statusBadge,
                      item.status === 'Active' ? styles.statusActive :
                      item.status === 'Upcoming' ? styles.statusUpcoming :
                      styles.statusCompleted
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        item.status === 'Active' ? styles.statusActiveText :
                        item.status === 'Upcoming' ? styles.statusUpcomingText :
                        styles.statusCompletedText
                      ]}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={13} color="#6B7280" />
                      <Text style={styles.detailVal}>{item.duration}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="people-outline" size={13} color="#6B7280" />
                      <Text style={styles.detailVal}>{item.studentsCount}/{item.maxCapacity} enrolled</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                      <Text style={styles.detailVal}>{item.startDate}</Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>{item.price}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEditModal(item)}
                    >
                      <Ionicons name="create-outline" size={14} color="#7B2CBF" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteCardBtn}
                      onPress={() => handleDeleteCourse(item.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {!loading && totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={16} color={page === 1 ? '#D1D5DB' : '#7B2CBF'} />
            </TouchableOpacity>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <TouchableOpacity key={n} style={[styles.pageBtn, page === n && styles.pageBtnActive]} onPress={() => setPage(n)}>
                <Text style={[styles.pageBtnText, page === n && styles.pageBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <Ionicons name="chevron-forward" size={16} color={page === totalPages ? '#D1D5DB' : '#7B2CBF'} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <Animated.View style={[
          styles.toast,
          toast.type === 'error' ? styles.toastError : styles.toastSuccess,
          { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}>
          <Ionicons name={toast.type === 'error' ? 'close-circle' : 'checkmark-circle'} size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* ADD / EDIT COURSE MODAL */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCourse ? 'Edit Course Details' : 'Add New Course'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Basic Info */}
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Course Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Full Stack Web Development"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Instructor *</Text>
                <TouchableOpacity 
                  style={styles.dropdown} 
                  onPress={() => setShowInstructorDropdown(!showInstructorDropdown)}
                >
                  <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                  <Text style={[styles.dropdownText, !formInstructor && styles.dropdownPlaceholder]}>
                    {formInstructor || 'Select Instructor'}
                  </Text>
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
                          <TouchableOpacity 
                            key={t.id} 
                            style={styles.dropdownItem} 
                            onPress={() => { 
                              setFormInstructor(t.name); 
                              setShowInstructorDropdown(false); 
                            }}
                          >
                            <Text>{t.name}</Text>
                            {formInstructor === t.name && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Course Overview *</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline={true}
                  placeholder="Brief overview of the course..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Additional Details */}
              <Text style={styles.formSectionTitle}>Additional Details</Text>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Total Sessions</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formTotalSessions}
                  onChangeText={setFormTotalSessions}
                  keyboardType="number-pad"
                  placeholder="48"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Course Syllabus/Topics</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formSyllabusTopics}
                  onChangeText={setFormSyllabusTopics}
                  multiline={true}
                  placeholder="List main topics covered in the course..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>What you will learn</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formWhatYouWillLearn}
                  onChangeText={setFormWhatYouWillLearn}
                  multiline={true}
                  placeholder="Enter the pointers..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Max Capacity *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formCapacity}
                    onChangeText={setFormCapacity}
                    keyboardType="number-pad"
                    placeholder="50"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Price (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="number-pad"
                    placeholder="25000"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Google Meet Link</Text>
                <View style={styles.meetInputRow}>
                  <Ionicons name="videocam-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.modalInput, { flex: 1, height: 42 }]}
                    value={formGoogleMeetLink}
                    onChangeText={setFormGoogleMeetLink}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                <Text style={styles.checkboxSubtext}>Paste your Google Meet link here. It will be visible to the assigned teacher.</Text>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSaveCourse}
                >
                  <Text style={styles.modalSubmitBtnText}>
                    {selectedCourse ? 'Save Changes' : 'Create Course'}
                  </Text>
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
  // Search bar (now inside header)
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
  // Filter pill tabs
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
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  filterPillAmber: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.12)',
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
    color: '#7B2CBF',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  // Stats card
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
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  // List
  listContainer: {
    gap: 16,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  instructorName: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusUpcoming: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusActiveText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusUpcomingText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusCompletedText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailVal: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    width: 26,
    textAlign: 'right',
  },
  priceRow: {
    marginTop: 12,
  },
  priceVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
    paddingTop: 12,
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    color: '#7B2CBF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginTop: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  meetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 4,
  },
  meetCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingVertical: 4,
  },
  checkboxTextLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  checkboxSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  dayChipActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayChipTextActive: {
    color: '#FFF',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#7B2CBF',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  toast: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  pageBtnDisabled: {
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },
});
