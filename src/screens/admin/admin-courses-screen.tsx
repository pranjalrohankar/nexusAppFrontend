import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  duration: string;
  studentsCount: number;
  maxCapacity: number;
  startDate: string;
  price: string;
  status: 'Active' | 'Upcoming' | 'Completed';
}

export default function AdminCoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Data Science');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('3 Months');
  const [formStartDate, setFormStartDate] = useState('2026-06-02');
  const [formEndDate, setFormEndDate] = useState('2026-09-02');
  const [formClassTime, setFormClassTime] = useState('8:00 PM - 9:30 PM');
  const [formCapacity, setFormCapacity] = useState('50');
  const [formPrice, setFormPrice] = useState('25000');
  const [formStatus, setFormStatus] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [googleMeetChecked, setGoogleMeetChecked] = useState(true);

  const [courses, setCourses] = useState<Course[]>([
    { id: '1', title: 'Data Science & Machine Learning', category: 'Data Science', instructor: 'Priya Sharma', duration: '3 Months', studentsCount: 45, maxCapacity: 50, startDate: 'Jan 15, 2026', price: '₹25,000', status: 'Active' },
    { id: '2', title: 'Full Stack Web Development', category: 'Web Development', instructor: 'Rajesh Kumar', duration: '3 Months', studentsCount: 38, maxCapacity: 48, startDate: 'Jan 15, 2026', price: '₹20,000', status: 'Active' },
    { id: '3', title: 'UI/UX Design Mastery', category: 'Design', instructor: 'Ravi Verma', duration: '2 Months', studentsCount: 24, maxCapacity: 24, startDate: 'Feb 1, 2026', price: '₹18,000', status: 'Upcoming' },
    { id: '4', title: 'Digital Marketing', category: 'Marketing', instructor: 'Neha Gupta', duration: '2 Months', studentsCount: 15, maxCapacity: 20, startDate: 'Dec 1, 2025', price: '₹15,000', status: 'Completed' }
  ]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch && course.status === activeTab;
  });

  const activeCount = courses.filter(c => c.status === 'Active').length;
  const upcomingCount = courses.filter(c => c.status === 'Upcoming').length;
  const completedCount = courses.filter(c => c.status === 'Completed').length;

  const handleOpenAddModal = () => {
    setSelectedCourse(null);
    setFormTitle('');
    setFormCategory('Data Science');
    setFormDescription('');
    setFormDuration('3 Months');
    setFormStartDate('2026-06-02');
    setFormEndDate('2026-09-02');
    setFormClassTime('8:00 PM - 9:30 PM');
    setFormCapacity('50');
    setFormPrice('25000');
    setFormStatus('Active');
    setGoogleMeetChecked(true);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormTitle(course.title);
    setFormCategory(course.category);
    setFormDescription('Brief description of the course...');
    setFormDuration(course.duration);
    setFormStartDate(course.startDate);
    setFormEndDate('2026-09-15');
    setFormClassTime('6:00 PM - 7:30 PM');
    setFormCapacity(String(course.maxCapacity));
    setFormPrice(course.price.replace(/[^\d]/g, ''));
    setFormStatus(course.status);
    setGoogleMeetChecked(true);
    setIsModalVisible(true);
  };

  const handleSaveCourse = () => {
    if (!formTitle || !formCapacity || !formPrice) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }

    const priceLabel = `₹${Number(formPrice).toLocaleString('en-IN')}`;

    if (selectedCourse) {
      // Edit
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? {
        ...c,
        title: formTitle,
        category: formCategory,
        duration: formDuration,
        maxCapacity: Number(formCapacity),
        price: priceLabel,
        status: formStatus
      } : c));
      Alert.alert('Success', 'Course details updated.');
    } else {
      // Add
      const newCourse: Course = {
        id: String(courses.length + 1),
        title: formTitle,
        category: formCategory,
        instructor: 'Ravi Verma',
        duration: formDuration,
        studentsCount: 0,
        maxCapacity: Number(formCapacity),
        startDate: 'Jun 2, 2026',
        price: priceLabel,
        status: formStatus
      };
      setCourses(prev => [...prev, newCourse]);
      Alert.alert('Success', 'New course template built successfully.');
    }
    setIsModalVisible(false);
  };

  const handleDeleteCourse = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this course template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCourses(prev => prev.filter(c => c.id !== id));
            Alert.alert('Deleted', 'Course template has been removed.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Courses</Text>
        <Text style={styles.headerSubtitle}>{courses.length} total training courses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses by title or instructor..."
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

        {/* SUB-TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Active' && styles.tabItemActive]}
            onPress={() => setActiveTab('Active')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Active' && styles.tabLabelActive]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Upcoming' && styles.tabItemActive]}
            onPress={() => setActiveTab('Upcoming')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Upcoming' && styles.tabLabelActive]}>
              Upcoming ({upcomingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Completed' && styles.tabItemActive]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Completed' && styles.tabLabelActive]}>
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No courses scheduled under this tab.</Text>
            </View>
          ) : (
            filteredCourses.map((item) => {
              const progressPercent = item.maxCapacity > 0 ? (item.studentsCount / item.maxCapacity) * 100 : 0;
              return (
                <View key={item.id} style={styles.courseCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleCol}>
                      <Text style={styles.courseTitle}>{item.title}</Text>
                      <Text style={styles.instructorName}>Instructor: {item.instructor}</Text>
                    </View>
                    <View style={[styles.statusBadge, styles.statusActive]}>
                      <Text style={styles.statusActiveText}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Course specifics metrics row */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={13} color="#6B7280" />
                      <Text style={styles.detailVal}>{item.duration}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="people-outline" size={13} color="#6B7280" />
                      <Text style={styles.detailVal}>{item.studentsCount}/{item.maxCapacity}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                      <Text style={styles.detailVal}>{item.startDate}</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>{item.price}</Text>
                  </View>

                  {/* Actions */}
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

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formCategory}
                  onChangeText={setFormCategory}
                  placeholder="e.g. Web Development"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Course Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline={true}
                  placeholder="Brief description of the course..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Duration & Schedule */}
              <Text style={styles.formSectionTitle}>Duration & Schedule</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Duration</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formDuration}
                  onChangeText={setFormDuration}
                  placeholder="e.g. 3 Months"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Start Date *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formStartDate}
                    onChangeText={setFormStartDate}
                    placeholder="2026-06-02"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formEndDate}
                    onChangeText={setFormEndDate}
                    placeholder="2026-09-02"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Class Timings *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formClassTime}
                  onChangeText={setFormClassTime}
                  placeholder="e.g. 8:00 PM - 9:30 PM"
                  placeholderTextColor="#9CA3AF"
                />
              </View>  

              {/* Enrollment & Pricing */}
              <Text style={styles.formSectionTitle}>Enrollment & Pricing</Text>
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
                <Text style={styles.fieldLabel}>Course Status</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formStatus}
                  onChangeText={(val) => setFormStatus(val as any)}
                  placeholder="Active / Upcoming / Completed"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Meet link generation toggle */}
              <TouchableOpacity
                style={styles.meetCheckboxRow}
                onPress={() => setGoogleMeetChecked(!googleMeetChecked)}
              >
                <Ionicons
                  name={googleMeetChecked ? "checkbox" : "square-outline"}
                  size={20}
                  color="#7B2CBF"
                />
                <Text style={styles.checkboxTextLabel}>
                  Auto-generate Google Meet link for this course.
                </Text>
              </TouchableOpacity>

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
    paddingBottom: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 6,
  },
  addBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#FF7A00',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
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
  // Sub-tabs
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#7B2CBF',
    fontWeight: '700',
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
  statusActiveText: {
    color: '#10B981',
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
  meetCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 4,
  },
  checkboxTextLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
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
});
