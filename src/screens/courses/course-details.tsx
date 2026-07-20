import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  title: string;
  subtitle: string;
  rating: string;
  students: string;
  duration: string;
  classesCount: string;
  level: string;
  skills: string[];
  teacher: TeacherData;
  syllabus: SyllabusItem[];
}

interface CourseDetailsProps {
  course: CourseData;
  onBack: () => void;
}

type TabType = 'Overview' | 'Syllabus' | 'Teacher';

export default function CourseDetails({ course, onBack }: CourseDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Details</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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

        {activeTab === 'Syllabus' && (
          <View style={styles.syllabusContainer}>
            {course.syllabus && course.syllabus.map((item, index) => (
              <View key={index} style={styles.syllabusCard}>
                <View style={styles.syllabusCardLeft}>
                  <Text style={styles.syllabusCardTitle}>{item.title}</Text>
                  <View style={styles.syllabusCardInfoRow}>
                    <View style={styles.syllabusInfoItem}>
                      <Ionicons name="book-outline" size={14} color="#6B7280" />
                      <Text style={styles.syllabusInfoText}>{item.lessons} lessons</Text>
                    </View>
                    <View style={styles.syllabusInfoItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.syllabusInfoText}>{item.weeks} weeks</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.syllabusCardRight}>
                  <View style={styles.moduleBadge}>
                    <Text style={styles.moduleBadgeText}>{item.moduleNumber}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

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
  // Syllabus Section
  syllabusContainer: {
    gap: 12,
  },
  syllabusCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  syllabusCardLeft: {
    flex: 1,
    paddingRight: 16,
  },
  syllabusCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  syllabusCardInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  syllabusInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syllabusInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  syllabusCardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  moduleBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2CBF',
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
});
