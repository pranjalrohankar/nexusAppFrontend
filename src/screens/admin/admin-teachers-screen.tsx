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
}

export default function AdminTeachersScreen() {
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
  const [assignedCourses, setAssignedCourses] = useState({
    ds: true,
    fs: false,
    uiux: false,
    digital: false,
    python: false,
    cloud: false
  });

  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: '1', name: 'Priya Sharma', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'priya.sharma@nexus.co', phone: '+91 98765 43210', rating: 4.9, coursesCount: 3, studentsCount: 156 },
    { id: '2', name: 'Rajesh Kumar', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'rajesh.kumar@nexus.co', phone: '+91 98765 43210', rating: 4.7, coursesCount: 2, studentsCount: 85 },
    { id: '3', name: 'Ravi Verma', joinedDate: 'Jan 1, 2026', status: 'Active', email: 'ravi.verma@nexus.co', phone: '+91 98765 43210', rating: 4.8, coursesCount: 4, studentsCount: 210 },
    { id: '4', name: 'Neha Gupta', joinedDate: 'Dec 1, 2025', status: 'Active', email: 'neha.gupta@nexus.co', phone: '+91 98765 43210', rating: 4.6, coursesCount: 1, studentsCount: 45 }
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

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'All') return matchesSearch;
    return matchesSearch && teacher.status === activeTab;
  });

  const activeCount = teachers.filter(t => t.status === 'Active').length;
  const inactiveCount = teachers.filter(t => t.status === 'Inactive').length;
  const totalStudentsTaught = teachers.reduce((acc, curr) => acc + curr.studentsCount, 0);

  const handleOpenAddModal = () => {
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
    setAssignedCourses({ ds: true, fs: false, uiux: false, digital: false, python: false, cloud: false });
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    const names = teacher.name.split(' ');
    setFormFirstName(names[0] || '');
    setFormLastName(names[1] || '');
    setFormEmail(teacher.email);
    setFormPhone(teacher.phone);
    setFormDob('1990-03-24');
    setFormStreet('456 Royal Residency');
    setFormCity('Bangalore');
    setFormState('Karnataka');
    setFormPinCode('560001');
    setFormQual('Ph.D. in Computer Science');
    setFormExp('8');
    setFormSpecialization('Machine Learning');
    setFormJoinDate(teacher.joinedDate);
    setFormEmploymentType('Full Time');
    setAssignedCourses({ ds: true, fs: true, uiux: false, digital: false, python: false, cloud: false });
    setIsModalVisible(true);
  };

  const handleSaveTeacher = async () => {
    if (!formFirstName || !formLastName || !formEmail || !formPhone || (!selectedTeacher && !formPassword)) {
      showToast('Please fill out all required fields including password.', 'error');
      return;
    }

    const fullName = `${formFirstName} ${formLastName}`;

    if (selectedTeacher) {
      setTeachers(prev => prev.map(t => t.id === selectedTeacher.id ? {
        ...t, name: fullName, email: formEmail, phone: formPhone
      } : t));
      showToast('Teacher details saved successfully.', 'success');
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
          qualification: formQual,
          experience: formExp,
          specialization: formSpecialization,
          joinDate: formJoinDate,
          employmentType: formEmploymentType,
          role: 'TEACHER',
        });
        if (res.success) {
          const newTeacher: Teacher = {
            id: String(res.data),
            name: fullName,
            joinedDate: 'Jun 2, 2026',
            status: 'Active',
            email: formEmail,
            phone: formPhone,
            rating: 5.0,
            coursesCount: Object.values(assignedCourses).filter(Boolean).length,
            studentsCount: 0
          };
          setTeachers(prev => [...prev, newTeacher]);
          setIsModalVisible(false);
          showToast('Teacher registered! Credentials sent to ' + formEmail, 'success');
        } else {
          showToast(res.message || 'Failed to register teacher.', 'error');
        }
      } catch {
        showToast('Could not connect to server.', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    showToast('Instructor removed successfully.', 'success');
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
        <Text style={styles.headerTitle}>Manage Teachers</Text>
        <Text style={styles.headerSubtitle}>{teachers.length} total instructors registered</Text>
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
            placeholder="Search teachers by name or specialization..."
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

        {/* SUB-TABS AND STATISTICS METRIC */}
        <View style={styles.headerMetricsRow}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'All' && styles.tabItemActive]}
              onPress={() => setActiveTab('All')}
            >
              <Text style={[styles.tabLabel, activeTab === 'All' && styles.tabLabelActive]}>
                All ({teachers.length})
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
          </View>
          <View style={styles.statBadgeCard}>
            <Text style={styles.statBadgeVal}>{totalStudentsTaught}</Text>
            <Text style={styles.statBadgeLabel}>Students</Text>
          </View>
        </View>

        {/* TEACHERS LIST */}
        <View style={styles.listContainer}>
          {filteredTeachers.map((item) => (
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

              {/* Quick Info Grid */}
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
                    <Text style={styles.miniStatVal}>{item.coursesCount}</Text>
                    <Text style={styles.miniStatLabel}>Courses</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatVal}>{item.studentsCount}</Text>
                    <Text style={styles.miniStatLabel}>Students</Text>
                  </View>
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
                  onPress={() => handleDeleteTeacher(item.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

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
                <TextInput
                  style={styles.modalInput}
                  value={formFirstName}
                  onChangeText={setFormFirstName}
                  placeholder="e.g. Priya"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Last Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formLastName}
                  onChangeText={setFormLastName}
                  placeholder="e.g. Sharma"
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
                  placeholder="e.g. priya.sharma@nexus.co"
                  placeholderTextColor="#9CA3AF"
                />
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
                  placeholder="e.g. 1990-03-24"
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
                  placeholder="Street"
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
                    placeholder="Bangalore"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formState}
                    onChangeText={setFormState}
                    placeholder="Karnataka"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Professional Details */}
              <Text style={styles.formSectionTitle}>Professional Details</Text>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Qualification *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formQual}
                  onChangeText={setFormQual}
                  placeholder="e.g. Ph.D. in Computer Science"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Experience (Years) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formExp}
                  onChangeText={setFormExp}
                  keyboardType="number-pad"
                  placeholder="e.g. 5"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Specialization *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formSpecialization}
                  onChangeText={setFormSpecialization}
                  placeholder="e.g. Machine Learning, NLP"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Joining Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formJoinDate}
                    onChangeText={setFormJoinDate}
                    placeholder="2026-06-02"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Employment Type</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={formEmploymentType}
                    onChangeText={setFormEmploymentType}
                    placeholder="Full Time"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Assigned Courses Checkboxes */}
              <Text style={styles.formSectionTitle}>Assign Courses</Text>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAssignedCourses(p => ({ ...p, ds: !p.ds }))}
                >
                  <Ionicons
                    name={assignedCourses.ds ? "checkbox" : "square-outline"}
                    size={20}
                    color="#7B2CBF"
                  />
                  <Text style={styles.checkboxLabel}>Data Science & Machine Learning</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAssignedCourses(p => ({ ...p, fs: !p.fs }))}
                >
                  <Ionicons
                    name={assignedCourses.fs ? "checkbox" : "square-outline"}
                    size={20}
                    color="#7B2CBF"
                  />
                  <Text style={styles.checkboxLabel}>Full Stack Web Development</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAssignedCourses(p => ({ ...p, uiux: !p.uiux }))}
                >
                  <Ionicons
                    name={assignedCourses.uiux ? "checkbox" : "square-outline"}
                    size={20}
                    color="#7B2CBF"
                  />
                  <Text style={styles.checkboxLabel}>UI/UX Design Mastery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAssignedCourses(p => ({ ...p, digital: !p.digital }))}
                >
                  <Ionicons
                    name={assignedCourses.digital ? "checkbox" : "square-outline"}
                    size={20}
                    color="#7B2CBF"
                  />
                  <Text style={styles.checkboxLabel}>Digital Marketing</Text>
                </TouchableOpacity>
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
                  onPress={handleSaveTeacher}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.modalSubmitBtnText}>
                        {selectedTeacher ? 'Save Changes' : 'Add Teacher'}
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
  // Sub-tabs & metrics row
  headerMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 12,
    flex: 2,
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
  statBadgeCard: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E8DFFA',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  statBadgeLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  // List
  listContainer: {
    gap: 16,
  },
  teacherCard: {
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
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0369A1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metaCol: {
    flex: 1,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  joinedText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EA580C',
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
  statsDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  miniStatCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  miniStatVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  miniStatLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
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
  checkboxContainer: {
    gap: 12,
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 13,
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
