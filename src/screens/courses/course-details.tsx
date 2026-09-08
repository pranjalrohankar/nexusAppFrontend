import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseSyllabus } from '../../utils/syllabus-parser';
import { getCompletedTopicsForCourse, parseTopicsData, isTopicCovered } from '../../utils/syllabus-progress-store';
import { coursesData } from '../home/home-screen';

export interface SyllabusItem {
  moduleNumber: string;
  title: string;
  lessons: string;
  weeks: string;
}

export interface TeacherData {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  emoji: string;
  experience: string;
  expertise: string[];
  studentsCount?: string;
}

export interface CourseData {
  id?: number | string;
  batchId?: number | string;
  title: string;
  subtitle: string;
  rating: string;
  students: string;
  duration: string;
  classesCount: string;
  level: string;
  skills: string[];
  teacher: TeacherData;
  syllabus?: SyllabusItem[] | any;
  syllabusTopics?: string;
  coveredTopics?: string | string[];
}

interface CourseDetailsProps {
  course: CourseData;
  onBack: () => void;
}

type TabType = 'Overview' | 'Syllabus' | 'Teacher';

function SyllabusTabContent({ course }: { course: CourseData }) {
  const fallbackSyllabus = (coursesData as any)?.[course.title]?.syllabusTopics || (coursesData as any)?.[course.title]?.syllabus;
  const parsedModules = parseSyllabus(course.syllabusTopics || course.syllabus || fallbackSyllabus);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [completedTopics, setCompletedTopics] = useState<string[]>(() => parseTopicsData(course.coveredTopics));

  useEffect(() => {
    let isMounted = true;
    if (course.title || (course as any).id) {
      getCompletedTopicsForCourse(course.title, course.teacher?.name, (course as any).id || (course as any).batchId)
        .then((res) => {
          if (isMounted && res && res.length > 0) {
            setCompletedTopics(res);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [course.title, course.teacher?.name, (course as any).id, (course as any).batchId]);

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (!parsedModules || parsedModules.length === 0) {
    return (
      <View style={styles.emptySyllabusCard}>
        <Ionicons name="book-outline" size={36} color="#9CA3AF" />
        <Text style={styles.emptySyllabusText}>No syllabus topics available for this course yet.</Text>
      </View>
    );
  }

  // Progress metrics calculation
  let allTopics: string[] = [];
  parsedModules.forEach(m => {
    if (m.topics && m.topics.length > 0) {
      allTopics.push(...m.topics);
    }
  });
  const totalTopics = allTopics.length;
  const doneCount = allTopics.filter(t => isTopicCovered(t, completedTopics)).length;
  const progressPct = totalTopics > 0 ? Math.round((doneCount / totalTopics) * 100) : 0;

  return (
    <View style={styles.syllabusContainer}>
      {/* Syllabus Header */}
      <View style={styles.syllabusHeaderBlock}>
        <Text style={styles.syllabusMainTitle}>{course.title} Course Syllabus</Text>
        <View style={styles.badgeRow}>
          <View style={styles.orangePulseDot} />
          <Text style={styles.badgeText}>Live Interactive Course</Text>
        </View>
      </View>

      {/* Progress Bar Card */}
      <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>Course Progress</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#7B2CBF' }}>
            {doneCount} / {totalTopics} Covered ({progressPct}%)
          </Text>
        </View>
        <View style={{ height: 10, backgroundColor: '#F3E8FF', borderRadius: 5, overflow: 'hidden' }}>
          <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#10B981', borderRadius: 5 }} />
        </View>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
          {progressPct === 100 ? '🎉 All topics covered by teacher!' : `${totalTopics - doneCount} remaining topics to be covered by instructor.`}
        </Text>
      </View>

      {/* Module Nav Summary */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moduleNavScroll}
      >
        {parsedModules.map((mod, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.moduleNavPill,
              expandedModules[idx] && styles.moduleNavPillActive,
            ]}
            onPress={() => toggleModule(idx)}
          >
            <Text
              style={[
                styles.moduleNavPillText,
                expandedModules[idx] && styles.moduleNavPillTextActive,
              ]}
              numberOfLines={1}
            >
              Module {idx + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Accordion Modules List */}
      <View style={styles.accordionList}>
        {parsedModules.map((mod, idx) => {
          const isExpanded = !!expandedModules[idx];
          return (
            <View key={idx} style={styles.accordionCard}>
              {/* Accordion Header */}
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => toggleModule(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.accordionHeaderLeft}>
                  <View style={styles.orangeDot} />
                  <Text style={styles.accordionTitle}>
                    {mod.title.startsWith('Module') ? mod.title : `Module ${idx + 1} – ${mod.title}`}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#FF6A00"
                />
              </TouchableOpacity>

              {/* Accordion Body */}
              {isExpanded && (
                <View style={styles.accordionBody}>
                  {mod.topics && mod.topics.length > 0 ? (
                    mod.topics.map((topic, tIdx) => {
                      const isCovered = isTopicCovered(topic, completedTopics);
                      return (
                        <View key={tIdx} style={[styles.topicRow, { alignItems: 'center', paddingVertical: 6 }]}>
                          <Ionicons
                            name={isCovered ? "checkmark-circle" : "ellipse-outline"}
                            size={18}
                            color={isCovered ? "#10B981" : "#9CA3AF"}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.topicText, { flex: 1, color: isCovered ? '#059669' : '#374151', fontWeight: isCovered ? '600' : '400' }]}>
                            {topic}
                          </Text>
                          {isCovered ? (
                            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>Covered</Text>
                            </View>
                          ) : (
                            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '500', color: '#9CA3AF' }}>Pending</Text>
                            </View>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.topicTextMuted}>
                      Comprehensive topics and practical exercises covered in this module.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function CourseDetails({ course, onBack }: CourseDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View style={[styles.headerInner, { width: '100%', maxWidth: isDesktop ? 900 : undefined, alignSelf: 'center' }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Details</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { width: '100%', maxWidth: isDesktop ? 900 : undefined, alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. COURSE HERO CARD */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{course.title}</Text>
          <Text style={styles.heroSubtitle}>{course.subtitle}</Text>
          
          <View style={styles.heroInfoRow}>
            <View style={styles.heroInfoItem}>
              <Ionicons name="star" size={16} color="#FFB703" />
              <Text style={styles.heroInfoText}>{course.rating}</Text>
            </View>
            <View style={styles.heroInfoItem}>
              <Ionicons name="people" size={16} color="#E9D5FF" />
              <Text style={styles.heroInfoText}>{course.students}</Text>
            </View>
            <View style={styles.heroInfoItem}>
              <Ionicons name="time" size={16} color="#E9D5FF" />
              <Text style={styles.heroInfoText}>{course.duration}</Text>
            </View>
          </View>
        </View>

        {/* 3. TABS ROW */}
        <View style={styles.tabsContainer}>
          {(['Overview', 'Syllabus', 'Teacher'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. DYNAMIC TAB CONTENT */}
        {activeTab === 'Overview' && (
          <View>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              {/* Classes Box */}
              <View style={styles.statBox}>
                <View style={styles.iconContainerPurple}>
                  <Ionicons name="book" size={20} color="#7B2CBF" />
                </View>
                <Text style={styles.statValue}>{course.classesCount}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>

              {/* Duration Box */}
              <View style={styles.statBox}>
                <View style={styles.iconContainerOrange}>
                  <Ionicons name="time" size={20} color="#FFB703" />
                </View>
                <Text style={styles.statValue}>{course.duration}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              {/* Level Box */}
              <View style={styles.statBox}>
                <View style={styles.iconContainerPurple}>
                  <Ionicons name="ribbon" size={20} color="#7B2CBF" />
                </View>
                <Text style={styles.statValue}>{course.level}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>

            {/* What You'll Learn Box */}
            <View style={styles.contentCard}>
              <Text style={styles.contentCardTitle}>{"What You'll Learn"}</Text>
              <View style={styles.skillsList}>
                {course.skills.map((skill, index) => (
                  <View key={index} style={styles.skillItem}>
                    <View style={styles.checkmarkCircle}>
                      <Ionicons name="checkmark" size={12} color="#FFB703" />
                    </View>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Syllabus' && <SyllabusTabContent course={course} />}

        {activeTab === 'Teacher' && (
          <View style={styles.teacherCard}>
            {/* Header info */}
            <View style={styles.teacherHeaderRow}>
              <View style={styles.teacherSquircle}>
                <Text style={styles.teacherEmoji}>👨‍💻</Text>
              </View>
              <View style={styles.teacherHeaderDetails}>
                <Text style={styles.teacherNameText}>{course.teacher.name}</Text>
                <Text style={styles.teacherRoleText}>{course.teacher.role}</Text>
                <View style={styles.teacherRatingRow}>
                  <Ionicons name="star" size={16} color="#FFB703" />
                  <Text style={styles.teacherRatingVal}>{course.rating}</Text>
                  <Ionicons name="people" size={16} color="#6B7280" style={styles.marginLeft12} />
                  <Text style={styles.teacherStudentsVal}>{course.teacher.studentsCount || '15,000+'}</Text>
                </View>
              </View>
            </View>

            {/* Experience */}
            <View style={styles.teacherSection}>
              <Text style={styles.teacherSectionTitleText}>Experience</Text>
              <Text style={styles.teacherSectionBodyText}>{course.teacher.experience}</Text>
            </View>

            {/* Expertise */}
            <View style={styles.teacherSection}>
              <Text style={styles.teacherSectionTitleText}>Expertise</Text>
              <View style={styles.expertiseBadgesRow}>
                {course.teacher.expertise && course.teacher.expertise.map((skill, index) => (
                  <View key={index} style={styles.expertiseBadge}>
                    <Text style={styles.expertiseBadgeText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  // Hero Card
  heroCard: {
    backgroundColor: '#7B2CBF', // Purple base color
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 20,
    lineHeight: 20,
  },
  heroInfoRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  heroInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroInfoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  // Tab switcher
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#7B2CBF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#7B2CBF',
  },
  // Stats grid
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainerPurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainerOrange: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Content Card (What You'll Learn / Syllabus)
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  contentCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  skillsList: {
    gap: 16,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFB703',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },
  skillText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  // Instructor & Teacher Card Styles
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  teacherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  teacherSquircle: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#FAF0FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  teacherEmoji: {
    fontSize: 42,
  },
  teacherHeaderDetails: {
    flex: 1,
    paddingLeft: 16,
  },
  teacherNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  teacherRoleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 6,
  },
  teacherRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherRatingVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  marginLeft12: {
    marginLeft: 12,
  },
  teacherStudentsVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  teacherSection: {
    marginTop: 20,
  },
  teacherSectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  teacherSectionBodyText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  expertiseBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseBadge: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  expertiseBadgeText: {
    color: '#7B2CBF',
    fontSize: 13,
    fontWeight: '600',
  },
  // Syllabus Accordion & Module Styles
  syllabusContainer: {
    marginBottom: 24,
  },
  emptySyllabusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptySyllabusText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  syllabusHeaderBlock: {
    marginBottom: 16,
  },
  syllabusMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orangePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6A00',
    marginRight: 6,
  },
  badgeText: {
    color: '#FF6A00',
    fontWeight: '700',
    fontSize: 12,
  },
  moduleNavScroll: {
    paddingBottom: 12,
    gap: 8,
  },
  moduleNavPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  moduleNavPillActive: {
    backgroundColor: '#FF6A00',
    borderColor: '#FF6A00',
  },
  moduleNavPillText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '600',
  },
  moduleNavPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  accordionList: {
    gap: 12,
    marginTop: 8,
  },
  accordionCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6A00',
    marginRight: 10,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  accordionBody: {
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicNumber: {
    color: '#FF6A00',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 8,
    marginTop: 1,
  },
  topicText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
  },
  topicTextMuted: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
