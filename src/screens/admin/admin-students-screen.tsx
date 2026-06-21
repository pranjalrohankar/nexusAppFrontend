import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  email: string;
  phone: string;
  coursesCount: number;
}

export default function AdminStudentsScreen() {
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
  const [formCourse, setFormCourse] = useState('Data Science & Machine Learning');
  const [formEnrollmentDate, setFormEnrollmentDate] = useState('2026-06-02');
  const [formPaymentStatus, setFormPaymentStatus] = useState('Paid');
  const [formPassword, setFormPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);

  const [students, setStudents] = useState<Student[]>([
    { id: '1', firstName: 'Rahul', lastName: 'Kumar', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'rahul.kumar@email.com', phone: '+91 98765 43210', coursesCount: 2 },
    { id: '2', firstName: 'Priya', lastName: 'Patel', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'priya.patel@email.com', phone: '+91 98765 43210', coursesCount: 2 },
    { id: '3', firstName: 'Arjun', lastName: 'Singh', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'arjun.singh@email.com', phone: '+91 98765 43210', coursesCount: 3 },
    { id: '4', firstName: 'Sneha', lastName: 'Reddy', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'sneha.reddy@email.com', phone: '+91 98765 43210', coursesCount: 1 }
  ]);

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

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || student.email.toLowerCase().includes(query);
    
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && student.status === activeTab;
  });

  const activeCount = students.filter(s => s.status === 'Active').length;
  const inactiveCount = students.filter(s => s.status === 'Inactive').length;

  const handleOpenAddModal = () => {
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
    setFormCourse('Data Science & Machine Learning');
    setFormEnrollmentDate('2026-06-02');
    setFormPaymentStatus('Paid');
    setFormPassword('');
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormFirstName(student.firstName);
    setFormLastName(student.lastName);
    setFormEmail(student.email);
    setFormPhone(student.phone);
    setFormDob('1998-05-15');
    setFormStreet('123 Green Avenue');
    setFormCity('Bangalore');
    setFormState('Karnataka');
    setFormPinCode('560001');
    setFormGuardianName('Mr. Kumar');
    setFormGuardianPhone('+91 98765 43211');
    setFormCourse(student.coursesCount === 2 ? 'Full Stack Web Development' : 'Data Science & Machine Learning');
    setFormEnrollmentDate(student.joinedDate);
    setFormPaymentStatus('Paid');
    setIsModalVisible(true);
  };

  const handleSaveStudent = async () => {
    if (!formFirstName || !formLastName || !formEmail || !formPhone || (!selectedStudent && !formPassword)) {
      showToast('Please fill out all required fields including password.', 'error');
      return;
    }

    if (selectedStudent) {
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? {
        ...s,
        firstName: formFirstName,
        lastName: formLastName,
        email: formEmail,
        phone: formPhone
      } : s));
      showToast('Student information updated successfully.', 'success');
      setIsModalVisible(false);
    } else {
      setSaving(true);
      try {
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
          course: formCourse,
          enrollmentDate: formEnrollmentDate,
          paymentStatus: formPaymentStatus,
          role: 'STUDENT',
        });
        if (res.success) {
          const newStudent: Student = {
            id: String(res.data),
            firstName: formFirstName,
            lastName: formLastName,
            joinedDate: 'Jun 2, 2026',
            status: 'Active',
            email: formEmail,
            phone: formPhone,
            coursesCount: 1
          };
          setStudents(prev => [...prev, newStudent]);
          setIsModalVisible(false);
          showToast('Student registered! Credentials sent to ' + formEmail, 'success');
        } else {
          showToast(res.message || 'Failed to register student.', 'error');
        }
      } catch (err: any) {
        showToast('Cannot reach server. Make sure backend is running.', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast('Student has been removed.', 'success');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Students</Text>
        <Text style={styles.headerSubtitle}>{students.length} total students registered</Text>
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
            placeholder="Search students by name or email..."
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

        {/* SUB-TABS COUNTERS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'All' && styles.tabItemActive]}
            onPress={() => setActiveTab('All')}
          >
            <Text style={[styles.tabLabel, activeTab === 'All' && styles.tabLabelActive]}>
              All ({students.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Active' && styles.tabItemActive]}
            onPress={() => setActiveTab('Active')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Active' && styles.tabLabelActive]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'Inactive' && styles.tabItemActive]}
            onPress={() => setActiveTab('Inactive')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Inactive' && styles.tabLabelActive]}>
              Inactive ({inactiveCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No students matched the filters.</Text>
            </View>
          ) : (
            filteredStudents.map((item) => (
              <View key={item.id} style={styles.studentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item.firstName[0]}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.joinedText}>Joined {item.joinedDate}</Text>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, item.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText]}>
                      {item.status}
                    </Text>
                  </View>
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
                    <Text style={styles.infoValue}>{item.coursesCount} Enrolled Courses</Text>
                  </View>
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

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ADD / EDIT MODAL */}
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
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Course</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formCourse}
                  onChangeText={setFormCourse}
                  placeholder="Course Name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formEnrollmentDate}
                    onChangeText={setFormEnrollmentDate}
                    placeholder="e.g. 2026-06-02"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Payment Status</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formPaymentStatus}
                    onChangeText={setFormPaymentStatus}
                    placeholder="e.g. Paid"
                    placeholderTextColor="#9CA3AF"
                  />
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
});
