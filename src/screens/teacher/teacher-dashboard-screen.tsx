import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

interface Submission {
  id: string;
  studentName: string;
  testTitle: string;
  score: string;
  submittedAt: string;
  answers: Record<string, string>;
}

interface TeacherDashboardScreenProps {
  onViewSchedule?: () => void;
  userName?: string;
}

export default function TeacherDashboardScreen({ onViewSchedule, userName = '' }: TeacherDashboardScreenProps) {
  const [isLive, setIsLive] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  useEffect(() => {
    api.getTeacherProfile()
      .then((res: any) => setTeacherProfile(res?.data ?? null))
      .catch(() => {});
  }, []);

  // Derive display name: API profile name > prop name > fallback
  const displayName = teacherProfile?.name || userName || 'Teacher';

  // Build initials from display name (e.g. "Priya Sharma" → "PS")
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((word: string) => word.charAt(0).toUpperCase())
    .join('');

  const stats = [
    { label: 'Total Students', val: '156', icon: 'people-outline', color: '#7B2CBF', bg: '#F3E8FF' },
    { label: 'Active Courses', val: '3', icon: 'book-outline', color: '#16A34A', bg: '#DCFCE7' },
    { label: 'Classes This Week', val: '8', icon: 'calendar-outline', color: '#EA580C', bg: '#FFF7ED' },
    { label: 'Compliments', val: '24', icon: 'ribbon-outline', color: '#2563EB', bg: '#DBEAFE' },
  ];

  const gradingQueue: Submission[] = [
    {
      id: 'sub-1',
      studentName: 'Rahul Singh',
      testTitle: 'JavaScript ES6+ Assessment',
      score: '24/30 (80%)',
      submittedAt: '10 mins ago',
      answers: { 'Q1': 'A', 'Q2': 'C', 'Q3': 'B', 'Q4': 'D', 'Q5': 'A' }
    },
    {
      id: 'sub-2',
      studentName: 'Anjali Sharma',
      testTitle: 'React Advanced Patterns Test',
      score: '32/40 (80%)',
      submittedAt: '45 mins ago',
      answers: { 'Q1': 'C', 'Q2': 'C', 'Q3': 'A', 'Q4': 'B', 'Q5': 'D' }
    },
  ];

  const handleStartClass = () => {
    setIsLive(!isLive);
    if (!isLive) {
      Alert.alert('Live Stream Started', 'You are now broadcasting live to Data Science & ML (Batch A).');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.headerTitle}>{displayName.split(' ')[0]}!</Text>
          </View>
          <View style={styles.headerIcons}>
            {isLive && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>LIVE</Text>
              </View>
            )}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{"Here's your teaching schedule for today"}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS ROW */}
        <View style={styles.statsGrid}>
          {stats.map((s, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <View style={styles.statCardHeader}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.val}</Text>
              </View>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, isLive ? styles.btnLiveNow : styles.btnStartClass]}
            onPress={handleStartClass}
          >
            <Ionicons name={isLive ? "stop-circle-outline" : "play-circle-outline"} size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>{isLive ? 'Stop Broadcast' : 'Start Class'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnViewSchedule]}
            onPress={onViewSchedule}
          >
            <Ionicons name="calendar-outline" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>View Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* TODAY'S SCHEDULE */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{"📅 Today's Schedule"}</Text>
          <Text style={styles.dateText}>Monday, May 24, 2026</Text>
        </View>

        <View style={styles.classCard}>
          <View style={styles.classCardHeader}>
            <View>
              <Text style={styles.classTitle}>Data Science & ML</Text>
              <Text style={styles.classBatch}>Batch A - Evening</Text>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          </View>
          <View style={styles.classMetaRow}>
            <View style={styles.classMetaItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.classMetaText}>8:00 PM - 9:30 PM</Text>
            </View>
            <View style={styles.classMetaItem}>
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text style={styles.classMetaText}>28 Students</Text>
            </View>
          </View>
        </View>

        {/* RECENT SUBMISSIONS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>✍️ Recent Submissions</Text>
          <Text style={styles.dateText}>Needs Review</Text>
        </View>

        <View style={styles.submissionList}>
          {gradingQueue.map((item) => (
            <View key={item.id} style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <View>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.testTitle}>{item.testTitle}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.reviewBtn}
                  onPress={() => setSelectedSubmission(item)}
                >
                  <Text style={styles.reviewBtnText}>Review</Text>
                  <Ionicons name="chevron-forward" size={14} color="#7B2CBF" />
                </TouchableOpacity>
              </View>
              <View style={styles.subFooter}>
                <Text style={styles.subScore}>Score: {item.score}</Text>
                <Text style={styles.subTime}>{item.submittedAt}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={selectedSubmission !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSubmission(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Review Submission</Text>
              <TouchableOpacity onPress={() => setSelectedSubmission(null)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {selectedSubmission && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewStudentName}>{selectedSubmission.studentName}</Text>
                  <Text style={styles.reviewTestTitle}>{selectedSubmission.testTitle}</Text>
                  <Text style={styles.reviewScoreVal}>Score Received: {selectedSubmission.score}</Text>
                </View>

                <Text style={styles.sectionHeading}>Answers Summary</Text>
                {Object.entries(selectedSubmission.answers).map(([q, ans]) => (
                  <View key={q} style={styles.ansSummaryRow}>
                    <Text style={styles.ansQText}>{q}:</Text>
                    <Text style={styles.ansValText}>Option {ans}</Text>
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                  </View>
                ))}

                <TouchableOpacity 
                  style={styles.submitFeedbackBtn} 
                  onPress={() => {
                    Alert.alert('Success', 'Feedback submitted.');
                    setSelectedSubmission(null);
                  }}
                >
                  <Text style={styles.submitFeedbackBtnText}>Complete Review</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
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
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  // Stats row
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Section headers
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  btnStartClass: {
    backgroundColor: '#7B2CBF',
  },
  btnLiveNow: {
    backgroundColor: '#EF4444',
  },
  btnViewSchedule: {
    backgroundColor: '#EA580C',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Class card today
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  classBatch: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  todayBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  classMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  classMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classMetaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  // Recent Submissions
  submissionList: {
    gap: 12,
  },
  subCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  testTitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewBtnText: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 10,
  },
  subScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
  subTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  // Modal layout
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    marginBottom: 20,
  },
  reviewHeader: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewStudentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reviewTestTitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  reviewScoreVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  ansSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  ansQText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
    width: 32,
  },
  ansValText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  checkIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitFeedbackBtn: {
    backgroundColor: '#7B2CBF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  submitFeedbackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
