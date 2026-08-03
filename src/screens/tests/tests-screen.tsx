import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActiveTestScreen from './active-test-screen';
import CourseTopicsScreen from './Course-topics-screen';
import { api, getApiBaseUrl, loadToken } from '@/services/api';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseMcqsFromText } from '@/utils/pdf-mcq-parser';

type SubTabType = 'MCQ' | 'StudyMaterial';

const PUBLISHED_TESTS_KEY = 'NEXUS_PUBLISHED_TESTS';
const TEST_SUBMISSIONS_KEY = 'NEXUS_TEST_SUBMISSIONS';

interface Enrollment {
  id: number;
  courseTitle: string;
  enrollmentDate: string;
  paymentStatus: string;
}

interface RealMaterial {
  id: number;
  title: string;
  description: string;
  course: string;
  batch: string;
  topic: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  uploadedByEmail: string;
  uploadedAt: string;
}

const API_BASE = getApiBaseUrl().replace('/api', '');

export default function TestsScreen() {
  const [activeTest, setActiveTest] = useState<any>(null);

  // Real data
  const [publishedTests, setPublishedTests] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    await loadToken();
    try {
      const storedTests = await AsyncStorage.getItem(PUBLISHED_TESTS_KEY);
      if (storedTests) {
        const parsed = JSON.parse(storedTests);
        if (Array.isArray(parsed)) setPublishedTests(parsed);
      }
      const storedSubs = await AsyncStorage.getItem(TEST_SUBMISSIONS_KEY);
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs);
        if (Array.isArray(parsed)) setUserSubmissions(parsed);
      }
    } catch (_) {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (activeTest !== null) {
    return <ActiveTestScreen testInfo={activeTest} onClose={() => { setActiveTest(null); fetchData(); }} />;
  }

  // MCQ Tests data
  const mcqTests = [
    {
      id: '1',
      title: 'JavaScript ES6+ Assessment',
      category: 'Full Stack Development',
      badge: 'Intermediate',
      badgeColor: '#D97706',
      badgeBg: '#FEF3C7',
      icon: 'laptop-outline',
      iconBg: '#7B2CBF',
      questions: '30',
      duration: '35 mins',
      passScore: '70%',
      attempts: '3',
    },
    {
      id: '2',
      title: 'React Advanced Patterns Test',
      category: 'Full Stack Development',
      badge: 'Advanced',
      badgeColor: '#DC2626',
      badgeBg: '#FEE2E2',
      icon: 'logo-react',
      iconBg: '#EA580C',
      questions: '40',
      duration: '45 mins',
      passScore: '75%',
      attempts: '1',
    },
    {
      id: '3',
      title: 'UI/UX Design Fundamentals',
      category: 'UI/UX Design',
      badge: 'Beginner',
      badgeColor: '#16A34A',
      badgeBg: '#DCFCE7',
      icon: 'color-palette-outline',
      iconBg: '#7B2CBF',
      questions: '25',
      duration: '30 mins',
      passScore: '70%',
      attempts: '2',
    },
    {
      id: '4',
      title: 'Wireframing & Prototyping Quiz',
      category: 'UI/UX Design',
      badge: 'Intermediate',
      badgeColor: '#D97706',
      badgeBg: '#FEF3C7',
      icon: 'ruler-outline',
      iconBg: '#EA580C',
      questions: '20',
      duration: '25 mins',
      passScore: '65%',
      attempts: '0',
    },
    {
      id: '5',
      title: 'Data Science Foundations',
      category: 'Data Science & Machine Learning',
      badge: 'Intermediate',
      badgeColor: '#D97706',
      badgeBg: '#FEF3C7',
      icon: 'server-outline',
      iconBg: '#7B2CBF',
      questions: '25',
      duration: '30 mins',
      passScore: '70%',
      attempts: '1',
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View style={{ width: '100%', paddingHorizontal: 4 }}>
          <View style={styles.headerTopRow}>
            <Text style={styles.logoText}>
              NE<Text style={styles.logoTextGold}>X</Text>US
            </Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="book-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerTitle}>Tests & Assessments</Text>
          <Text style={styles.headerSubtitle}>
            Test your knowledge and track your progress
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. TESTS CONTENT VIEW */}
        <View style={styles.listContainer}>
            {(() => {
              const allTestList = [
                ...publishedTests.map(pt => ({
                  id: pt.id,
                  title: pt.title,
                  category: pt.category,
                  badge: pt.testType === 'PDF' ? 'PDF Exam' : 'Active',
                  badgeColor: pt.testType === 'PDF' ? '#DC2626' : '#7B2CBF',
                  badgeBg: pt.testType === 'PDF' ? '#FEE2E2' : '#FAF0FD',
                  icon: pt.testType === 'PDF' ? 'document-text-outline' : 'clipboard-outline',
                  iconBg: pt.testType === 'PDF' ? '#EF4444' : '#7B2CBF',
                  questionsCountLabel: String(pt.questionsCount || 'PDF Exam'),
                  duration: pt.duration || '45 mins',
                  passScore: pt.passScore || '75%',
                  attempts: '1',
                  testType: pt.testType || 'PDF',
                  pdfFileUri: pt.pdfFileUri,
                  pdfFileName: pt.pdfFileName,
                  pdfInstructions: pt.pdfInstructions,
                  totalMarks: pt.totalMarks || 100,
                  questions: (pt.questions && Array.isArray(pt.questions) && pt.questions.length > 0)
                    ? pt.questions
                    : parseMcqsFromText('', pt.pdfFileName || pt.title),
                })),
                ...mcqTests
                  .filter(m => !publishedTests.some(p => p.id === m.id))
                  .map(m => ({ ...m, questions: parseMcqsFromText('', m.title) })),
              ];

              return allTestList.map((test) => {
                const sub = userSubmissions.find(s => s.testId === test.id || s.testTitle === test.title);
                return (
                  <View 
                    key={test.id} 
                    style={[
                      styles.testCard,
                      (test as any).testType === 'PDF' && { borderWidth: 2, borderColor: '#EF4444' }
                    ]}
                  >
                    {/* Header Section */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardHeaderIconContainer, { backgroundColor: test.iconBg }]}>
                        <Ionicons name={test.icon as any} size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.cardHeaderTitleWrapper}>
                        <Text style={styles.cardHeaderTitle}>{test.title}</Text>
                        <Text style={styles.cardHeaderCategory}>{test.category}</Text>
                      </View>
                      <View style={[styles.levelBadge, { backgroundColor: test.badgeBg, borderColor: test.badgeColor }]}>
                        <Text style={[styles.levelBadgeText, { color: test.badgeColor }]}>{test.badge}</Text>
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statBadgePurple}>
                        <Ionicons name="document-text-outline" size={13} color="#7B2CBF" />
                        <Text style={styles.statLabelText}>Type</Text>
                        <Text style={styles.statValText}>
                          {typeof (test as any).questionsCountLabel === 'string' && (test as any).questionsCountLabel
                            ? (test as any).questionsCountLabel
                            : typeof test.questions === 'string' || typeof test.questions === 'number'
                            ? String(test.questions)
                            : Array.isArray(test.questions)
                            ? `${test.questions.length} MCQs`
                            : '20 MCQs'}
                        </Text>
                      </View>
                      <View style={styles.statBadgeOrange}>
                        <Ionicons name="time-outline" size={13} color="#EA580C" />
                        <Text style={styles.statLabelText}>Duration</Text>
                        <Text style={styles.statValText}>{test.duration}</Text>
                      </View>
                      <View style={styles.statBadgeGreen}>
                        <Ionicons name="ribbon-outline" size={13} color="#16A34A" />
                        <Text style={styles.statLabelText}>Total Marks</Text>
                        <Text style={styles.statValText}>{(test as any).totalMarks || 100}</Text>
                      </View>
                    </View>

                    {/* Submission / Grade Status Banner */}
                    {sub ? (
                      (() => {
                        const marksVal = typeof sub.obtainedMarks === 'number' ? sub.obtainedMarks : parseInt(String(sub.obtainedMarks || 0), 10) || 0;
                        const totalVal = typeof sub.totalMarks === 'number' ? sub.totalMarks : parseInt(String(sub.totalMarks || 100), 10) || 100;
                        const feedbackVal = typeof sub.feedback === 'string' ? sub.feedback : '';
                        const isGraded = sub.status === 'GRADED';

                        return (
                          <View style={[
                            { borderRadius: 12, padding: 12, marginVertical: 10, borderWidth: 1 },
                            isGraded ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' } : { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }
                          ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons
                                name={isGraded ? "checkmark-circle" : "time-outline"}
                                size={18}
                                color={isGraded ? "#15803D" : "#B45309"}
                              />
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: isGraded ? "#15803D" : "#B45309" }}>
                                {isGraded
                                  ? `Score: ${marksVal} / ${totalVal} Marks (${Math.round((marksVal / totalVal) * 100)}%)`
                                  : 'Test Submitted - Pending Evaluation'}
                              </Text>
                            </View>
                            {feedbackVal ? (
                              <Text style={{ fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>
                                Teacher Feedback: "{feedbackVal}"
                              </Text>
                            ) : null}
                          </View>
                        );
                      })()
                    ) : null}

                    {/* Start Test Button */}
                    <TouchableOpacity 
                      style={[styles.startTestButton, sub && { backgroundColor: '#4B5563' }]}
                      onPress={() => setActiveTest(test)}
                    >
                      <Ionicons name="play" size={14} color="#FFFFFF" style={styles.playIcon} />
                      <Text style={styles.startTestButtonText}>{sub ? 'Retake Test' : 'Start Test'}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              });
            })()}
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    height: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoTextGold: {
    color: '#FFB703',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB703',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 80,
  },
  // Tab Selector
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#7B2CBF',
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  // Course Cards
  listContainer: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#7B2CBF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  courseInfo: {
    flex: 1,
    paddingRight: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  courseScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  courseScheduleText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '500',
  },
  courseInstructorLabel: {
    color: '#E9D5FF',
    fontSize: 12,
  },
  courseArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Detail views header
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 40,
    fontWeight: '500',
  },
  // MCQ test cards styles
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitleWrapper: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardHeaderCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  levelBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBadgePurple: {
    flex: 0.31,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statBadgeOrange: {
    flex: 0.31,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statBadgeGreen: {
    flex: 0.31,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statLabelText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  statValText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  attemptsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  attemptsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attemptsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  attemptsValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  startTestButton: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  playIcon: {
    marginRight: 2,
  },
  startTestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Search bar styles
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  // Study material details styles
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  materialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialTitleWrapper: {
    flex: 1,
    paddingLeft: 12,
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 20,
  },
  materialAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  materialTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  materialTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  materialMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 4,
  },
  materialMetaText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
