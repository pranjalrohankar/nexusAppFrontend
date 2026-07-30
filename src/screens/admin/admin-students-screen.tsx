import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminDataCache } from '../../services/admin-data-cache';
import { api } from '../../services/api';

interface Enrollment {
  courseTitle: string;
  enrollmentDate: string;
  paymentStatus: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  onlineStatus?: 'online' | 'offline' | 'always_online';
  coursesCount: number;
  createdAt: string;
  enrollments: Enrollment[];
  dob?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  course?: string;
  enrollmentDate?: string;
  paymentStatus?: string;
}

interface Course {
  id: number;
  title: string;
  status: string;
}

export default function AdminStudentsScreen({ onRegisterAdd, onCountChange }: { onRegisterAdd?: (fn: () => void) => void; onCountChange?: (count: number) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form Fields
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPinCode, setFormPinCode] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formCourse, setFormCourse] = useState<string[]>([]);
  const [formBatchName, setFormBatchName] = useState('');
  const [formEnrollmentDate, setFormEnrollmentDate] = useState('2026-06-02');
  const [formPaymentStatus, setFormPaymentStatus] = useState('Paid');
  // Edit mode — new course to add
  const [newCourse, setNewCourse] = useState('');
  const [newBatchName, setNewBatchName] = useState('');
  const [newEnrollmentDate, setNewEnrollmentDate] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('Pending');
  const [showNewBatchDropdown, setShowNewBatchDropdown] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);

  const [students, setStudents] = useState<Student[]>(() => {
    const cached = adminDataCache.students;
    return cached.length > 0 ? cached.slice().sort((a: any, b: any) => b.id - a.id) : [];
  });
  const [courses, setCourses] = useState<Course[]>(adminDataCache.courses as Course[]);
  const [batches, setBatches] = useState<{ id: number; batchName: string; selectCourse: string }[]>([]);
  const [loading, setLoading] = useState(adminDataCache.students.length === 0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);

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

  const loadStudents = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.getStudents();
      if (res.success) {
        const list = res.data.slice().sort((a: Student, b: Student) => b.id - a.id);
        adminDataCache.students = res.data;
        setStudents(list);
        if (onCountChange) onCountChange(list.length);
      }
    } catch (err) {
      // Silent error during background poll
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [onCountChange]);

  const loadCourses = useCallback(async () => {
    if (adminDataCache.courses.length > 0) {
      setCourses(adminDataCache.courses as Course[]);
      return;
    }
    try {
      const res = await api.getActiveCourses();
      if (res.success) {
        adminDataCache.courses = res.data;
        setCourses(res.data);
      }
    } catch (err) { }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const data = await api.getBatches();
      const list = Array.isArray(data) ? data : [];
      setBatches(list.map((b: any) => ({
        id: b.id,
        batchName: b.batchName,
        selectCourse: b.selectCourse,
      })));
    } catch (err) { }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStudents(true);
      loadCourses();
      loadBatches();
      const interval = setInterval(() => loadStudents(false), 3000);
      return () => clearInterval(interval);
    }, [loadStudents, loadCourses, loadBatches])
  );

  const handleOpenAddModal = useCallback(() => {
    setSelectedStudent(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormDob('');
    setFormStreet('');
    setFormCity('Bangalore');
    setFormState('Karnataka');
    setFormPinCode('560001');
    setFormGuardianName('');
    setFormGuardianPhone('');
    setFormCourse([]);
    setFormBatchName('');
    setFormEnrollmentDate(new Date().toISOString().split('T')[0]);
    setFormPaymentStatus('Pending');
    setFormPassword('');
    setNewCourse('');
    setNewBatchName('');
    setNewEnrollmentDate(new Date().toISOString().split('T')[0]);
    setNewPaymentStatus('Pending');
    setShowCourseDropdown(false);
    setShowBatchDropdown(false);
    setShowNewBatchDropdown(false);
    setIsModalVisible(true);
  }, []);

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
    const isActive = student.onlineStatus === 'online' || student.onlineStatus === 'always_online';
    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'Active') return matchesSearch && isActive;
    if (activeTab === 'Inactive') return matchesSearch && !isActive;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = students.filter(s => s.onlineStatus === 'online' || s.onlineStatus === 'always_online').length;
  const inactiveCount = students.filter(s => s.onlineStatus !== 'online' && s.onlineStatus !== 'always_online').length;

  useEffect(() => {
    if (onRegisterAdd) onRegisterAdd(handleOpenAddModal);
  }, [onRegisterAdd, handleOpenAddModal]);

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    const names = student.name.split(' ');
    setFormFirstName(names[0] || '');
    setFormLastName(names.slice(1).join(' ') || '');
    setFormEmail(student.email);
    setFormPhone(student.phone || '');
    setFormDob(student.dob || '');
    setFormStreet(student.street || '');
    setFormCity(student.city || 'Bangalore');
    setFormState(student.state || 'Karnataka');
    setFormPinCode(student.pinCode || '560001');
    setFormGuardianName(student.guardianName || '');
    setFormGuardianPhone(student.guardianPhone || '');
    setFormEnrollmentDate(student.enrollmentDate || '');
    setFormPaymentStatus(student.paymentStatus || 'Pending');
    // Reset add-new-course fields
    setNewCourse('');
    setNewBatchName('');
    setNewEnrollmentDate(new Date().toISOString().split('T')[0]);
    setNewPaymentStatus('Pending');
    setShowNewBatchDropdown(false);
    setIsModalVisible(true);
  };

  const handleSaveStudent = async () => {
    if (!formFirstName || !formLastName || !formEmail || !formPhone || (!selectedStudent && !newCourse)) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (selectedStudent) {
      setSaving(true);
      try {
        // 1. Update personal info
        const res = await api.updateStudent(selectedStudent.id, {
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          dob: formDob,
          street: formStreet,
          city: formCity,
          state: formState,
          pinCode: formPinCode,
          guardianName: formGuardianName,
          guardianPhone: formGuardianPhone,
          enrollmentDate: formEnrollmentDate,
          paymentStatus: formPaymentStatus,
        });
        if (!res?.success) {
          showToast(res?.message || 'Failed to update', 'error');
          return;
        }
        // 2. Enroll in new course if selected
        if (newCourse) {
          const enrollRes = await api.enrollStudent(selectedStudent.id, {
            courseTitle: newCourse,
            batchName: newBatchName,
            enrollmentDate: newEnrollmentDate,
            paymentStatus: newPaymentStatus,
          });
          if (!enrollRes?.success) {
            showToast(enrollRes?.message || 'Failed to add new course', 'error');
            return;
          }
          showToast('Student updated & enrolled in ' + newCourse, 'success');
        } else {
          showToast('Student updated successfully', 'success');
        }
        setIsModalVisible(false);
        // Optimistically update the card in local state immediately
        const updatedName = `${formFirstName} ${formLastName}`.trim();
        setStudents(prev => prev.map(s => {
          if (s.id !== selectedStudent.id) return s;
          const updatedEnrollments = newCourse
            ? [...(s.enrollments || []), { courseTitle: newCourse, enrollmentDate: newEnrollmentDate, paymentStatus: newPaymentStatus }]
            : s.enrollments;
          return {
            ...s,
            name: updatedName,
            email: formEmail,
            phone: formPhone,
            dob: formDob,
            street: formStreet,
            city: formCity,
            state: formState,
            pinCode: formPinCode,
            guardianName: formGuardianName,
            guardianPhone: formGuardianPhone,
            enrollments: updatedEnrollments,
            coursesCount: updatedEnrollments?.length ?? s.coursesCount,
          };
        }));
        // Also refresh from server in background to stay in sync
        loadStudents(false);
      } catch (err: any) {
        showToast(err.message || 'Cannot connect to server', 'error');
      } finally {
        setSaving(false);
      }
    } else {
      // Adding new student or enrolling existing student to new course
      if (!formPassword) {
        showToast('Password is required for new enrollment', 'error');
        return;
      }

      setSaving(true);
      try {
        // Backend will check if user exists and either:
        // 1. Create new user + student + enrollment (new student)
        // 2. Add new enrollment to existing student (re-enrollment)
        const res = await api.createUser({
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          password: formPassword,
          phone: formPhone,
          dob: formDob,
          street: formStreet,
          city: formCity,
          state: formState,
          pinCode: formPinCode,
          guardianName: formGuardianName,
          guardianPhone: formGuardianPhone,
          course: newCourse,
          enrollmentDate: newEnrollmentDate,
          paymentStatus: newPaymentStatus,
          batchName: newBatchName,
          role: 'STUDENT',
        });
        if (res.success) {
          setIsModalVisible(false);
          showToast(res.message || 'Student enrolled successfully!', 'success');
          loadStudents();
        } else {
          showToast(res.message || 'Failed to enroll student.', 'error');
        }
      } catch (err: any) {
        showToast('Cannot reach server. Make sure backend is running.', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteStudent = async (id: number) => {
    // amazonq-ignore-next-line
    console.log('Deleting student with ID:', id);
    try {
      const res = await api.deleteStudent(id);
      // amazonq-ignore-next-line
      console.log('Delete response:', res);
      if (res && res.success) {
        showToast('Student deleted successfully', 'success');
        loadStudents();
      } else {
        showToast((res as any)?.message || 'Failed to delete', 'error');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(err.message || 'Cannot connect to server', 'error');
    }
  };

  const coursesCount = courses.length;
  return (
    <View style={styles.safeArea}>
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
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
            placeholder="Search students by name or email..."
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

        {/* FILTER PILL TABS */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'All' && styles.filterPillActive]}
            onPress={() => { setActiveTab('All'); setPage(1); }}
          >
            <Text style={[styles.filterPillText, activeTab === 'All' && styles.filterPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, styles.filterPillActive2, activeTab === 'Active' && styles.filterPillActive]}
            onPress={() => { setActiveTab('Active'); setPage(1); }}
          >
            <Text style={[styles.filterPillText, activeTab === 'Active' && styles.filterPillTextActive]}>
              Active {activeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, styles.filterPillInactive2, activeTab === 'Inactive' && styles.filterPillActive]}
            onPress={() => { setActiveTab('Inactive'); setPage(1); }}
          >
            <Text style={[styles.filterPillText, activeTab === 'Inactive' && styles.filterPillTextActive]}>
              Inactive {inactiveCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#7B2CBF' }]}>{students.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>{coursesCount}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color="#7B2CBF" />
              <Text style={styles.emptyText}>Loading students...</Text>
            </View>
          ) : filteredStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No students matched the filters.</Text>
            </View>
          ) : (
            paginatedStudents.map((item) => (
              <View key={item.id} style={styles.studentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarWrapper}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{item.name[0]}</Text>
                    </View>
                    {item.onlineStatus !== undefined && (
                      <View style={[
                        styles.onlineDot,
                        item.onlineStatus === 'online' || item.onlineStatus === 'always_online'
                          ? styles.onlineDotGreen
                          : styles.onlineDotGray
                      ]} />
                    )}
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.joinedText}>Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {(() => {
                    const isLogged = item.onlineStatus === 'online' || item.onlineStatus === 'always_online';
                    return (
                      <View style={[styles.statusBadge, isLogged ? styles.statusActive : styles.statusInactive]}>
                        <Text style={[styles.statusText, isLogged ? styles.statusActiveText : styles.statusInactiveText]}>
                          {isLogged ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                {/* Info block */}
                <View style={styles.infoBlock}>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoValue}>{item.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoValue}>{item.phone}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="book-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoValue}>{item.coursesCount} Enrolled Course{item.coursesCount !== 1 ? 's' : ''}</Text>
                  </View>
                  {item.enrollments && item.enrollments.length > 0 && (
                    <View style={styles.enrollmentsContainer}>
                      {item.enrollments.map((enrollment, idx) => (
                        <View key={idx} style={styles.enrollmentTag}>
                          <Text style={styles.enrollmentTagText}>{enrollment.courseTitle}</Text>
                          <Text style={styles.enrollmentTagStatus}>({enrollment.paymentStatus})</Text>
                        </View>
                      ))}
                    </View>
                  )}
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
                    onPress={() => handleDeleteStudent(item.id)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
                {selectedStudent ? 'Edit Student Details' : 'Add New Student'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Personal Information */}
              <Text style={styles.formSectionTitle}>Personal Information</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formFirstName}
                  onChangeText={setFormFirstName}
                  placeholder="e.g. Rahul"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Last Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formLastName}
                  onChangeText={setFormLastName}
                  placeholder="e.g. Kumar"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  placeholder="e.g. rahul.kumar@email.com"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {!selectedStudent && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Password *</Text>
                  <View style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }]}>
                    <TextInput
                      style={{ flex: 1, fontSize: 13, color: '#1F2937', height: 42 }}
                      value={formPassword}
                      onChangeText={setFormPassword}
                      placeholder="Set login password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!formShowPassword}
                    />
                    <TouchableOpacity onPress={() => setFormShowPassword(!formShowPassword)}>
                      <Ionicons name={formShowPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formDob}
                  onChangeText={setFormDob}
                  placeholder="e.g. 1998-05-15"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Address Information */}
              <Text style={styles.formSectionTitle}>Address Information</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formStreet}
                  onChangeText={setFormStreet}
                  placeholder="e.g. 123 Green Avenue"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formCity}
                    onChangeText={setFormCity}
                    placeholder="e.g. Bangalore"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formState}
                    onChangeText={setFormState}
                    placeholder="e.g. Karnataka"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Pin Code</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formPinCode}
                  onChangeText={setFormPinCode}
                  keyboardType="number-pad"
                  placeholder="e.g. 560001"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Guardian Info */}
              <Text style={styles.formSectionTitle}>Guardian/Emergency Contact</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Guardian Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formGuardianName}
                  onChangeText={setFormGuardianName}
                  placeholder="e.g. Mr. Kumar"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Guardian Phone</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formGuardianPhone}
                  onChangeText={setFormGuardianPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. +91 98765 43211"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Enrollment Details */}
              <Text style={styles.formSectionTitle}>Enrollment Details</Text>

              {/* In edit mode: show existing enrollments as read-only */}
              {selectedStudent && selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Current Enrollments</Text>
                  <View style={styles.existingEnrollmentsBox}>
                    {selectedStudent.enrollments.map((enr, idx) => (
                      <View key={idx} style={styles.existingEnrollmentRow}>
                        <Ionicons name="book-outline" size={13} color="#7B2CBF" />
                        <Text style={styles.existingEnrollmentText}>{enr.courseTitle}</Text>
                        <View style={[
                          styles.existingEnrollmentBadge,
                          enr.paymentStatus === 'Paid' ? styles.badgePaid :
                            enr.paymentStatus === 'Pending' ? styles.badgePending : styles.badgeFailed
                        ]}>
                          <Text style={styles.existingEnrollmentBadgeText}>{enr.paymentStatus}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Add new course — shown in both add and edit mode */}
              <View style={[styles.formGroup, { zIndex: 1000 }]}>
                <Text style={styles.fieldLabel}>{selectedStudent ? 'Add New Course' : 'Course *'}</Text>
                <View style={styles.checkboxGroup}>
                  <Text style={[styles.dropdownText, !newCourse && styles.dropdownPlaceholder]}>
                    {newCourse || 'Select a course'}
                  </Text>
                  <View style={styles.checkboxList}>
                    {courses.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>No courses available</Text>
                      </View>
                    ) : (
                      courses
                        .filter(c => !selectedStudent || !selectedStudent.enrollments?.some(e => e.courseTitle === c.title))
                        .map((course) => (
                          <TouchableOpacity
                            key={course.id}
                            style={styles.checkboxRow}
                            onPress={() => {
                              const picked = newCourse === course.title ? '' : course.title;
                              setNewCourse(picked);
                              setNewBatchName(''); // auto-clear batch when course changes
                              setShowNewBatchDropdown(false);
                            }}
                          >
                            <Ionicons
                              name={newCourse === course.title ? 'radio-button-on' : 'radio-button-off'}
                              size={18}
                              color={newCourse === course.title ? '#7B2CBF' : '#9CA3AF'}
                            />
                            <Text style={[styles.dropdownItemText, newCourse === course.title && styles.dropdownItemTextActive]}>
                              {course.title}
                            </Text>
                          </TouchableOpacity>
                        ))
                    )}
                  </View>
                </View>
              </View>

              {/* Batch — auto-filtered by selected course */}
              <View style={[styles.formGroup, { zIndex: 900 }]}>
                <Text style={styles.fieldLabel}>Batch {newCourse ? '(auto-filtered)' : ''}</Text>
                <TouchableOpacity
                  style={styles.modalInputDropdown}
                  onPress={() => newCourse && setShowNewBatchDropdown(!showNewBatchDropdown)}
                >
                  <Text style={[styles.dropdownText, !newBatchName && styles.dropdownPlaceholder]}>
                    {newBatchName || (newCourse ? 'Select a batch (optional)' : 'Select a course first')}
                  </Text>
                  <Ionicons name={showNewBatchDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                </TouchableOpacity>
                {showNewBatchDropdown && newCourse && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setNewBatchName(''); setShowNewBatchDropdown(false); }}
                      >
                        <Text style={styles.dropdownItemText}>— No batch —</Text>
                        {!newBatchName && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                      </TouchableOpacity>
                      {batches
                        .filter(b => (b.selectCourse || '').toLowerCase().includes(newCourse.toLowerCase()) || newCourse.toLowerCase().includes((b.selectCourse || '').toLowerCase()))
                        .map(b => (
                          <TouchableOpacity
                            key={b.id}
                            style={styles.dropdownItem}
                            onPress={() => { setNewBatchName(b.batchName); setShowNewBatchDropdown(false); }}
                          >
                            <Text style={styles.dropdownItemText}>{b.batchName}</Text>
                            {newBatchName === b.batchName && <Ionicons name="checkmark" size={18} color="#7B2CBF" />}
                          </TouchableOpacity>
                        ))}
                      {batches.filter(b => (b.selectCourse || '').toLowerCase().includes(newCourse.toLowerCase()) || newCourse.toLowerCase().includes((b.selectCourse || '').toLowerCase())).length === 0 && (
                        <View style={styles.dropdownItem}>
                          <Text style={[styles.dropdownItemText, { color: '#9CA3AF' }]}>No batches for this course</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Enrollment Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newEnrollmentDate}
                    onChangeText={setNewEnrollmentDate}
                    placeholder="e.g. 2026-06-02"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Payment Status *</Text>
                <View style={styles.paymentStatusRow}>
                  {(['Paid', 'Pending', 'Failed'] as const).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.paymentChip,
                        newPaymentStatus === status && (
                          status === 'Paid' ? styles.paymentChipPaid :
                            status === 'Pending' ? styles.paymentChipPending :
                              styles.paymentChipFailed
                        ),
                      ]}
                      onPress={() => setNewPaymentStatus(status)}
                    >
                      <Ionicons
                        name={
                          status === 'Paid' ? 'checkmark-circle-outline' :
                            status === 'Pending' ? 'time-outline' :
                              'close-circle-outline'
                        }
                        size={15}
                        color={
                          newPaymentStatus === status ? '#FFF'
                            : status === 'Paid' ? '#10B981'
                              : status === 'Pending' ? '#F59E0B'
                                : '#EF4444'
                        }
                      />
                      <Text style={[
                        styles.paymentChipText,
                        newPaymentStatus === status
                          ? styles.paymentChipTextActive
                          : status === 'Paid' ? { color: '#10B981' }
                            : status === 'Pending' ? { color: '#F59E0B' }
                              : { color: '#EF4444' },
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                  onPress={handleSaveStudent}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.modalSubmitBtnText}>
                      {selectedStudent ? 'Save Changes' : 'Add Student'}
                    </Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  existingEnrollmentsBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
    gap: 8,
  },
  existingEnrollmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  existingEnrollmentText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  existingEnrollmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePaid: { backgroundColor: '#ECFDF5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeFailed: { backgroundColor: '#FEE2E2' },
  existingEnrollmentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
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
  filterPillActive: {
    backgroundColor: '#7B2CBF',
  },
  filterPillActive2: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  filterPillInactive2: {
    backgroundColor: 'rgba(107,114,128,0.10)',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
    color: '#7B2CBF',
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    position: 'relative',
  },

  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  countLeft: {
    flex: 1,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  countNumber: {
    fontSize: 42,           // Big attractive number
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 42,
    marginBottom: -4,
  },

  countLabel: {
    fontSize: 15,
    color: '#E0CFFF',       // Light purple for elegance
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#E9D5FF',
  },
  addBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#FF9500',   // Vibrant orange
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
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
  enrollmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  enrollmentTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrollmentTagText: {
    fontSize: 10,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  enrollmentTagStatus: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  checkboxGroup: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
  },
  checkboxList: {
    marginTop: 8,
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dropdownItemTextActive: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  dropdownList: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  studentCard: {
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
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineDotGreen: {
    backgroundColor: '#10B981',
  },
  onlineDotGray: {
    backgroundColor: '#9CA3AF',
  },
  avatarText: {
    color: '#7B2CBF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metaCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  joinedText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusActiveText: {
    color: '#10B981',
  },
  statusInactiveText: {
    color: '#EF4444',
  },
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
    paddingTop: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
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
  modalInputDropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  paymentChipPaid: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  paymentChipPending: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  paymentChipFailed: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paymentChipTextActive: {
    color: '#FFFFFF',
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
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
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
