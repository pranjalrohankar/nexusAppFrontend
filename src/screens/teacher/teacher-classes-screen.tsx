import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  attendance: string;
  progress: string;
  progressPercent: number;
}

interface ClassItem {
  id: string;
  title: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  batchName: string;
  schedule: string;
  progressText: string;
  progressPercent: number;
  meetLink: string;
  studentsCount: number;
  duration?: string;
  studentsList: Student[];
}

export default function TeacherClassesScreen() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ACTIVE');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const classesData: ClassItem[] = [
    {
      id: 'c1',
      title: 'Data Science & Machine Learning',
      status: 'ACTIVE',
      batchName: 'Batch A - Evening',
      schedule: 'Mon, Wed, Fri - 8:00 PM',
      progressText: '18/48 Classes',
      progressPercent: (18 / 48) * 100,
      meetLink: 'https://meet.google.com/abc-defg-hij',
      studentsCount: 6,
      studentsList: [
        { id: 's1', name: 'Rahul Singh', email: 'rahul.s@email.com', phone: '+91 9876543210', attendance: '88%', progress: 'Progress: 78%', progressPercent: 78 },
        { id: 's2', name: 'Priya Patel', email: 'priya.p@email.com', phone: '+91 9812345678', attendance: '92%', progress: 'Progress: 85%', progressPercent: 85 },
        { id: 's3', name: 'Arjun Singh', email: 'arjun.s@email.com', phone: '+91 9911223344', attendance: '86%', progress: 'Progress: 80%', progressPercent: 80 },
        { id: 's4', name: 'Sneha Reddy', email: 'sneha.r@email.com', phone: '+91 9544332211', attendance: '94%', progress: 'Progress: 92%', progressPercent: 92 },
        { id: 's5', name: 'Vikram Mehta', email: 'vikram.m@email.com', phone: '+91 9876501234', attendance: '80%', progress: 'Progress: 75%', progressPercent: 75 },
        { id: 's6', name: 'Ananya Sharma', email: 'ananya.s@email.com', phone: '+91 9123456789', attendance: '84%', progress: 'Progress: 81%', progressPercent: 81 },
      ],
    },
    {
      id: 'c2',
      title: 'Full Stack Web Development',
      status: 'ACTIVE',
      batchName: 'Batch B - Morning',
      schedule: 'Tue, Thu, Sat - 10:00 AM',
      progressText: '38/48 Classes',
      progressPercent: (38 / 48) * 100,
      meetLink: 'https://meet.google.com/xyz-pqrs-uvw',
      studentsCount: 4,
      studentsList: [
        { id: 's1', name: 'Rahul Singh', email: 'rahul.s@email.com', phone: '+91 9876543210', attendance: '95%', progress: 'Progress: 90%', progressPercent: 90 },
        { id: 's3', name: 'Arjun Singh', email: 'arjun.s@email.com', phone: '+91 9911223344', attendance: '90%', progress: 'Progress: 88%', progressPercent: 88 },
      ],
    },
    {
      id: 'c3',
      title: 'UI/UX Design Mastery',
      status: 'UPCOMING',
      batchName: 'Batch C - Evening',
      schedule: 'Mon, Thu - 6:00 PM',
      progressText: '0/24 Classes',
      progressPercent: 0,
      meetLink: 'https://meet.google.com/ui-ux-design-sys',
      studentsCount: 32,
      duration: '2 Months',
      studentsList: [],
    },
    {
      id: 'c4',
      title: 'Python Programming',
      status: 'COMPLETED',
      batchName: 'Batch D - Completed',
      schedule: 'Mon, Wed, Fri - 7:00 PM',
      progressText: '24/24 Classes',
      progressPercent: 100,
      meetLink: 'https://meet.google.com/python-batch-d',
      studentsCount: 42,
      duration: '2 Months',
      studentsList: [],
    },
  ];

  const filteredClasses = classesData.filter((c) => c.status === activeTab);

  const getFilteredStudents = (list: Student[]) => {
    return list.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const handleCopyLink = (link: string) => {
    Alert.alert('Link Copied', `Google Meet link copied to clipboard:\n${link}`);
  };

  const handleStartClass = (title: string) => {
    Alert.alert('Class Started', `Launching Google Meet room for: ${title}`);
  };

  const handleSendMessage = (name: string) => {
    Alert.alert('Message Sent', `Mock message successfully sent to ${name}`);
  };

  // DRILLDOWN VIEW FOR STUDENTS
  if (selectedClass) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* DRILLDOWN HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedClass(null)}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
            <Text style={styles.backBtnText}>Classes</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedClass.title}</Text>
          <Text style={styles.headerSubtitle}>{selectedClass.batchName}</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* METRICS ROW */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{selectedClass.studentsCount}</Text>
              <Text style={styles.metricLabel}>Students</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>
                {selectedClass.studentsList.length > 0 ? selectedClass.studentsList.length - 1 : 0}
              </Text>
              <Text style={styles.metricLabel}>Active</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#16A34A' }]}>83%</Text>
              <Text style={styles.metricLabel}>Avg. Attendance</Text>
            </View>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* STUDENTS LIST */}
          <View style={styles.studentList}>
            <Text style={styles.rosterTitle}>Students ({selectedClass.studentsList.length})</Text>
            {getFilteredStudents(selectedClass.studentsList).map((s) => (
              <View key={s.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {s.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.studentMeta}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentEmail}>{s.email}</Text>
                    <Text style={styles.studentPhone}>{s.phone}</Text>
                  </View>
                </View>

                {/* Progress Indicators */}
                <View style={styles.studentStatsRow}>
                  <View style={styles.studentStatPill}>
                    <Text style={styles.studentStatLabel}>Attendance</Text>
                    <Text style={[styles.studentStatVal, { color: '#16A34A' }]}>{s.attendance}</Text>
                  </View>
                  <View style={styles.studentStatPill}>
                    <Text style={styles.studentStatLabel}>Progress</Text>
                    <Text style={[styles.studentStatVal, { color: '#7B2CBF' }]}>{s.progressPercent}%</Text>
                  </View>
                </View>

                {/* Message trigger */}
                <TouchableOpacity style={styles.messageBtn} onPress={() => handleSendMessage(s.name)}>
                  <Ionicons name="mail-outline" size={14} color="#7B2CBF" />
                  <Text style={styles.messageBtnText}>Send Message</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* MAIN CLASSES HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Classes</Text>
        <Text style={styles.headerSubtitle}>Manage your courses and Google Meet links.</Text>
      </View>

      {/* SUB-TABS SELECTOR */}
      <View style={styles.subTabContainer}>
        {(['ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map((tab) => {
          const count = classesData.filter((c) => c.status === tab).length;
          const label = tab === 'ACTIVE' ? `Active (${count})` : tab === 'UPCOMING' ? `Upcoming (${count})` : `Completed (${count})`;
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.subTabBtn, isActive && styles.subTabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CLASSES LIST */}
        <View style={styles.classList}>
          {filteredClasses.map((item) => (
            <View key={item.id} style={styles.classCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.classCardTitle}>{item.title}</Text>
                  <Text style={styles.classCardBatch}>{item.batchName}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.badgeActive : item.status === 'UPCOMING' ? styles.badgeUpcoming : styles.badgeCompleted]}>
                  <Text style={[styles.statusBadgeText, item.status === 'ACTIVE' ? styles.badgeTextActive : item.status === 'UPCOMING' ? styles.badgeTextUpcoming : styles.badgeTextCompleted]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Course Meta Info */}
              <View style={styles.metaInfoRow}>
                <View style={styles.metaInfoItem}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={styles.metaInfoText}>{item.schedule}</Text>
                </View>
                {item.duration && (
                  <View style={styles.metaInfoItem}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaInfoText}>{item.duration}</Text>
                  </View>
                )}
              </View>

              {/* Progress details */}
              <View style={styles.progressRow}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressVal}>{item.progressText}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${item.progressPercent}%` }]} />
                </View>
              </View>

              {/* Google Meet Link block */}
              {item.status !== 'COMPLETED' && (
                <View style={styles.meetBox}>
                  <Text style={styles.meetLabel}>Google Meet Link</Text>
                  <View style={styles.meetLinkWrapper}>
                    <Text style={styles.meetLink} numberOfLines={1}>{item.meetLink}</Text>
                    <TouchableOpacity onPress={() => handleCopyLink(item.meetLink)}>
                      <Ionicons name="copy-outline" size={14} color="#7B2CBF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.cardActionBtnRow}>
                <TouchableOpacity
                  style={styles.cardViewStudentsBtn}
                  onPress={() => setSelectedClass(item)}
                >
                  <Text style={styles.cardViewStudentsText}>View Students</Text>
                </TouchableOpacity>

                {item.status === 'ACTIVE' && (
                  <TouchableOpacity
                    style={styles.cardStartBtn}
                    onPress={() => handleStartClass(item.title)}
                  >
                    <Text style={styles.cardStartText}>Start Class</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  subTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  subTabBtnActive: {
    backgroundColor: '#7B2CBF',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  classList: {
    gap: 16,
  },
  // Class card styles
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  classCardBatch: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeTextActive: {
    color: '#10B981',
  },
  badgeUpcoming: {
    backgroundColor: '#FFF7ED',
  },
  badgeTextUpcoming: {
    color: '#EA580C',
  },
  badgeCompleted: {
    backgroundColor: '#F3F4F6',
  },
  badgeTextCompleted: {
    color: '#6B7280',
  },
  metaInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaInfoText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  // Progress bar
  progressRow: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7B2CBF',
    borderRadius: 3,
  },
  // Meet Box
  meetBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  meetLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  meetLinkWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  meetLink: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '500',
    flex: 0.9,
  },
  // Card action buttons
  cardActionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardViewStudentsBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardViewStudentsText: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardStartBtn: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // DRILLDOWN STYLES
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 13,
  },
  studentList: {
    gap: 12,
  },
  rosterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    color: '#7B2CBF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  studentMeta: {
    flex: 1,
    paddingLeft: 12,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  studentEmail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  studentPhone: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  studentStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  studentStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  studentStatVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 8,
    height: 34,
    marginTop: 12,
  },
  messageBtnText: {
    color: '#7B2CBF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
