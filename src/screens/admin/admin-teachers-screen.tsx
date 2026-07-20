import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { adminDataCache } from '../../components/layout/app-tabs';

interface Teacher {
  id: string;
  name: string;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  email: string;
  phone: string;
  rating: number;
  coursesCount: number;
  studentsCount: number;
  assignedCourseIds: number[];
}

interface Course {
  id: number;
  title: string;
}

const mapTeachers = (data: any[]): Teacher[] =>
  data.map((t: any) => ({
    id: String(t.teacherId ?? t.id ?? ''),
    name: t.name || '',
    joinedDate: t.joinDate || '',
    status: (t.status === 'Active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    email: t.email || '',
    phone: t.phone || '',
    rating: t.rating ?? 5.0,
    coursesCount: t.coursesCount ?? 0,
    studentsCount: t.studentsCount ?? 0,
    assignedCourseIds: Array.isArray(t.assignedCourses)
      ? t.assignedCourses.map((c: any) => c.courseId)
      : [],
  })).filter((t: Teacher) => t.id && t.id !== 'undefined');

export default function AdminTeachersScreen({ onRegisterAdd, onCountChange }: { onRegisterAdd?: (fn: () => void) => void; onCountChange?: (count: number) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

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
  const [formQual, setFormQual] = useState('M.Tech in CS');
  const [formExp, setFormExp] = useState('5');
  const [formSpecialization, setFormSpecialization] = useState('Data Science, Web Dev');
  const [formJoinDate, setFormJoinDate] = useState('2026-06-02');
  const [formEmploymentType, setFormEmploymentType] = useState('Full Time');
  const [formPassword, setFormPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const cached = adminDataCache.teachers;
    return cached.length > 0 ? mapTeachers(cached).slice().reverse() : [];
  });
  const [courses, setCourses] = useState<Course[]>(adminDataCache.courses as Course[]);
  // Start loading=true always so we always fetch fresh data on mount
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => setToast(null));
  }, [toastOpacity]);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTeachers();
      console.log('[fetchTeachers] raw response:', JSON.stringify(res));
      const raw: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      console.log('[fetchTeachers] mapped raw count:', raw.length, 'first item:', raw[0]);
      adminDataCache.teachers = raw;
      const list = mapTeachers(raw).slice().reverse();
      console.log('[fetchTeachers] final list count:', list.length);
      setTeachers(list);
      if (onCountChange) onCountChange(list.length);
      setTotalStudents(res?.totalStudents ?? 0);
    } catch (e) {
      console.error('[fetchTeachers] error:', e);
      showToast('Failed to load teachers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onCountChange, showToast]);

  const fetchCourses = useCallback(async () => {
    if (adminDataCache.courses.length > 0) {
      setCourses(adminDataCache.courses as Course[]);
      return;
    }
    try {
      const res = await api.getAllCourses();
      if (res.success && Array.isArray(res.data)) {
        adminDataCache.courses = res.data;
        setCourses(res.data.map((c: any) => ({ id: c.id, title: c.title })));
      }
    } catch { }
  }, []);

  const handleOpenAddModal = useCallback(async () => {
    setSelectedTeacher(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormDob('');
    setFormStreet('');
    setFormCity('Bangalore');
    setFormState('Karnataka');
    setFormPinCode('560001');
    setFormQual('M.Tech CS');
    setFormExp('5');
    setFormSpecialization('Data Science');
    setFormJoinDate('2026-06-02');
    setFormEmploymentType('Full Time');
    setFormPassword('');
    setSelectedCourseIds([]);
    if (adminDataCache.courses.length === 0) await fetchCourses();
    else setCourses(adminDataCache.courses as Course[]);
    setIsModalVisible(true);
  }, [fetchCourses]);

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, [fetchTeachers, fetchCourses]);

  // Register the add modal opener with the parent — re-register whenever it changes
  useEffect(() => {
    if (onRegisterAdd) onRegisterAdd(handleOpenAddModal);
  }, [onRegisterAdd, handleOpenAddModal]);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && teacher.status === activeTab;
  });

  const totalPages = Math.ceil(filteredTeachers.length / PAGE_SIZE);
  const paginatedTeachers = filteredTeachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = teachers.filter(t => t.status === 'Active').length;

  const handleOpenEditModal = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    const names = teacher.name.split(' ');
    setFormFirstName(names[0] || '');
    setFormLastName(names.slice(1).join(' ') || '');
    setFormEmail(teacher.email);
    setFormPhone(teacher.phone);
    setFormDob('');
    setFormStreet('');
    setFormCity('');
    setFormState('');
    setFormPinCode('');
    setFormQual('');
    setFormExp('');
    setFormSpecialization('');
    setFormJoinDate(teacher.joinedDate);
    setFormEmploymentType('');
    setFormPassword('');
    setSelectedCourseIds(teacher.assignedCourseIds || []);
    if (courses.length === 0) await fetchCourses();
    setIsModalVisible(true);
  };

  const handleSaveTeacher = async () => {
    if (!formFirstName || !formLastName || !formEmail || !formPhone || (!selectedTeacher && !formPassword)) {
      showToast('Please fill out all required fields including password.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (selectedTeacher && selectedTeacher.id && selectedTeacher.id !== 'undefined') {
        // ── EDIT existing teacher ────────────────────────────────────────────
        const res = await api.updateTeacher(selectedTeacher.id, {
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          dob: formDob,
          street: formStreet,
          city: formCity,
          state: formState,
          pinCode: formPinCode,
          qualification: formQual,
          experience: formExp,
          specialization: formSpecialization,
          joinDate: formJoinDate,
          employmentType: formEmploymentType,
          courseIds: selectedCourseIds,
        });
        if (res.success) {
          await fetchTeachers();
          setIsModalVisible(false);
          showToast('Teacher details saved successfully.', 'success');
        } else {
          showToast(res.message || 'Failed to update teacher.', 'error');
        }
      } else {
        // ── CREATE new teacher ───────────────────────────────────────────────
        // Step 1: Create the teacher account WITHOUT courseIds.
        // Passing courseIds here hits the student-enrollment logic on the
        // backend and returns 400 "Student is already enrolled in this course."
        const res = await api.createUser({
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          phone: formPhone.trim(),
          dob: formDob,
          street: formStreet,
          city: formCity,
          state: formState,
          pinCode: formPinCode,
          qualification: formQual,
          experience: formExp,
          specialization: formSpecialization,
          joinDate: formJoinDate,
          employmentType: formEmploymentType,
          role: 'TEACHER',
          // ✅ courseIds intentionally omitted — assigned separately below
        });

        console.log('[createTeacher] API response:', JSON.stringify(res));

        if (res.success) {
          // Step 2: Assign courses via the teacher-specific endpoint so the
          // backend uses course-assignment logic, not student-enrollment logic.
          // createUser returns data = plain userId (a number), not an object
          const newTeacherId = typeof res.data === 'object'
            ? (res.data?.teacherId ?? res.data?.id ?? res.data?.userId)
            : res.data; // plain number — this is the user id, need teacher id below
          if (selectedCourseIds.length > 0 && newTeacherId) {
            await Promise.all(
              selectedCourseIds.map(courseId =>
                api.assignCourse(newTeacherId, courseId).catch((err: any) => {
                  // Log but don't block — teacher is created; courses can be
                  // assigned later via the Edit modal.
                  console.warn(`assignCourse(${newTeacherId}, ${courseId}) failed:`, err);
                })
              )
            );
          }

          await fetchTeachers();
          setPage(1); // reset to page 1 so the new teacher is visible

          // Invalidate the dashboard cache so it re-fetches with the updated
          // teacher count the next time the dashboard tab is visited.
          if (adminDataCache.dashboard) {
            adminDataCache.dashboard = {
              ...adminDataCache.dashboard,
              totalTeachers: (adminDataCache.dashboard.totalTeachers ?? 0) + 1,
            };
          }

          setIsModalVisible(false);
          showToast('Teacher registered! Credentials sent to ' + formEmail, 'success');
        } else {
          showToast(res.message || 'Failed to register teacher.', 'error');
        }
      }
    } catch (err: any) {
      // Surface the actual server message instead of a generic string so it's
      // easier to diagnose future validation errors.
      const msg = err?.message?.includes('HTTP')
        ? err.message.split(': ').slice(1).join(': ')
        : 'Could not connect to server.';
      showToast(msg || 'Could not connect to server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await api.deleteTeacher(id);
      if (res.success) {
        setTeachers(prev => prev.filter(t => t.id !== id));
        // Keep dashboard cache in sync so the count drops immediately
        if (adminDataCache.dashboard) {
          adminDataCache.dashboard = {
            ...adminDataCache.dashboard,
            totalTeachers: Math.max(0, (adminDataCache.dashboard.totalTeachers ?? 1) - 1),
          };
        }
        showToast('Instructor removed successfully.', 'success');
      } else {
        showToast((res as any)?.message || 'Failed to delete teacher.', 'error');
      }
    } catch {
      showToast('Could not connect to server.', 'error');
    }
  };

  return (
    <View style={styles.safeArea}>
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'close-circle'} size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
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
            placeholder="Search teachers by name or specialization..."
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
            <Text style={[styles.filterPillText, activeTab === 'All' && styles.filterPillTextActive]}>All</Text>
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
              Inactive {teachers.filter(t => t.status === 'Inactive').length}
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#7B2CBF' }]}>{teachers.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {/* TEACHERS LIST */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color="#7B2CBF" />
              <Text style={styles.emptyText}>Loading teachers...</Text>
            </View>
          ) : filteredTeachers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No teachers matched the filters.</Text>
            </View>
          ) : (
            paginatedTeachers.map((item) => (
              <View key={item.id} style={styles.teacherCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.teacherName}>{item.name}</Text>
                    <Text style={styles.joinedText}>Joined {item.joinedDate}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFB703" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>

                <View style={styles.infoBlock}>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoValue}>{item.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={13} color="#6B7280" />
                    <Text style={styles.infoValue}>{item.phone}</Text>
                  </View>
                  <View style={styles.statsDetailsRow}>
                    <View style={styles.miniStatCard}>
                      <Ionicons name="book-outline" size={14} color="#7B2CBF" style={{ marginBottom: 2 }} />
                      <Text style={styles.miniStatVal}>{item.coursesCount}</Text>
                      <Text style={styles.miniStatLabel}>Courses</Text>
                    </View>
                    <View style={styles.miniStatCard}>
                      <Ionicons name="people-outline" size={14} color="#10B981" style={{ marginBottom: 2 }} />
                      <Text style={styles.miniStatVal}>{item.studentsCount}</Text>
                      <Text style={styles.miniStatLabel}>Students</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEditModal(item)}>
                    <Ionicons name="create-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteCardBtn} onPress={() => handleDeleteTeacher(item.id)}>
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

      {/* ADD / EDIT TEACHER MODAL */}
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
                {selectedTeacher ? 'Edit Teacher Details' : 'Add New Teacher'}
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
                <TextInput style={styles.modalInput} value={formFirstName} onChangeText={setFormFirstName} placeholder="e.g. Priya" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Last Name *</Text>
                <TextInput style={styles.modalInput} value={formLastName} onChangeText={setFormLastName} placeholder="e.g. Sharma" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput style={styles.modalInput} value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" placeholder="e.g. priya.sharma@nexus.co" placeholderTextColor="#9CA3AF" />
              </View>
              {!selectedTeacher && (
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
                <TextInput style={styles.modalInput} value={formPhone} onChangeText={setFormPhone} keyboardType="phone-pad" placeholder="e.g. +91 98765 43210" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <TextInput style={styles.modalInput} value={formDob} onChangeText={setFormDob} placeholder="e.g. 1990-03-24" placeholderTextColor="#9CA3AF" />
              </View>

              {/* Address */}
              <Text style={styles.formSectionTitle}>Address Information</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput style={styles.modalInput} value={formStreet} onChangeText={setFormStreet} placeholder="Street" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput style={styles.modalInput} value={formCity} onChangeText={setFormCity} placeholder="Bangalore" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput style={styles.modalInput} value={formState} onChangeText={setFormState} placeholder="Karnataka" placeholderTextColor="#9CA3AF" />
                </View>
              </View>

              {/* Professional */}
              <Text style={styles.formSectionTitle}>Professional Details</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Qualification *</Text>
                <TextInput style={styles.modalInput} value={formQual} onChangeText={setFormQual} placeholder="e.g. Ph.D. in Computer Science" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Experience (Years) *</Text>
                <TextInput style={styles.modalInput} value={formExp} onChangeText={setFormExp} keyboardType="number-pad" placeholder="e.g. 5" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Specialization *</Text>
                <TextInput style={styles.modalInput} value={formSpecialization} onChangeText={setFormSpecialization} placeholder="e.g. Machine Learning, NLP" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Joining Date</Text>
                  <TextInput style={styles.modalInput} value={formJoinDate} onChangeText={setFormJoinDate} placeholder="2026-06-02" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Employment Type</Text>
                  <TextInput style={styles.modalInput} value={formEmploymentType} onChangeText={setFormEmploymentType} placeholder="Full Time" placeholderTextColor="#9CA3AF" />
                </View>
              </View>

              {/* Assign Courses */}
              <Text style={styles.formSectionTitle}>Assign Courses</Text>
              <View style={styles.checkboxContainer}>
                {courses.length === 0 ? (
                  <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No courses available</Text>
                ) : courses.map(course => {
                  const checked = selectedCourseIds.includes(course.id);
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={styles.checkboxRow}
                      onPress={() =>
                        setSelectedCourseIds(prev =>
                          checked ? prev.filter(id => id !== course.id) : [...prev, course.id]
                        )
                      }
                    >
                      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color="#7B2CBF" />
                      <Text style={styles.checkboxLabel}>{course.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveTeacher} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.modalSubmitBtnText}>{selectedTeacher ? 'Save Changes' : 'Add Teacher'}</Text>}
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
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  filterTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(123,44,191,0.10)' },
  filterPillActive: { backgroundColor: '#7B2CBF' },
  filterPillActive2: { backgroundColor: 'rgba(16,185,129,0.12)' },
  filterPillInactive2: { backgroundColor: 'rgba(107,114,128,0.10)' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#7B2CBF' },
  filterPillTextActive: { color: '#FFFFFF' },
  statsCard: {
    backgroundColor: '#EFF6FF', borderRadius: 16, marginBottom: 16,
    paddingVertical: 16, paddingHorizontal: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-around',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#7B2CBF' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  bottomSpacer: { height: 100 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16,
    paddingHorizontal: 12, height: 46, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937', height: '100%' },
  listContainer: { gap: 16 },
  teacherCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E0F2FE', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#0369A1', fontSize: 18, fontWeight: 'bold' },
  metaCol: { flex: 1 },
  teacherName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  joinedText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5',
    borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, gap: 4,
  },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: '#EA580C' },
  infoBlock: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 12, paddingTop: 12, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoValue: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  statsDetailsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  miniStatCard: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
    alignItems: 'center', flex: 1,
  },
  miniStatVal: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  miniStatLabel: { fontSize: 9, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  cardActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    marginTop: 12, paddingTop: 12, gap: 12,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3E8FF', paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 8, gap: 4,
  },
  editBtnText: { color: '#7B2CBF', fontSize: 11, fontWeight: 'bold' },
  deleteCardBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEE2E2', paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 8, gap: 4,
  },
  deleteBtnText: { color: '#EF4444', fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '90%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  modalScroll: { padding: 20, paddingBottom: 40 },
  formSectionTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#7B2CBF',
    marginTop: 16, marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 6,
  },
  formGroup: { marginBottom: 14 },
  formRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  modalInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    height: 42, paddingHorizontal: 12, fontSize: 13,
    color: '#1F2937', backgroundColor: '#F9FAFB',
  },
  checkboxContainer: {
    gap: 12, marginBottom: 14, backgroundColor: '#F9FAFB',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkboxLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelBtn: {
    flex: 1, backgroundColor: '#F3F4F6', height: 46,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  modalCancelBtnText: { color: '#4B5563', fontWeight: 'bold', fontSize: 13 },
  modalSubmitBtn: {
    flex: 2, backgroundColor: '#7B2CBF', height: 46,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  modalSubmitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  emptyCard: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 40,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 12, textAlign: 'center' },
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 },
  pageBtn: {
    width: 34, height: 34, borderRadius: 8, borderWidth: 1,
    borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  pageBtnActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  pageBtnDisabled: { borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  pageBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pageBtnTextActive: { color: '#FFFFFF' },
});