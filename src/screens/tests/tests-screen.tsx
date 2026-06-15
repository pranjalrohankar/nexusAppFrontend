import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActiveTestScreen from './active-test-screen';

type SubTabType = 'MCQ' | 'StudyMaterial';

export default function TestsScreen() {
  const [activeTab, setActiveTab] = useState<SubTabType>('MCQ');
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState<string | null>(null);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [activeTest, setActiveTest] = useState<{
    title: string;
    questions: string;
    duration: string;
    passScore: string;
  } | null>(null);

  if (activeTest !== null) {
    return <ActiveTestScreen testInfo={activeTest} onClose={() => setActiveTest(null)} />;
  }

  // Course List data
  const coursesList = [
    {
      id: 'c1',
      title: 'Full Stack Web Development',
      schedule: 'Mon, Wed, Fri - 7:00 PM',
      instructor: 'Rajesh Kumar',
    },
    {
      id: 'c2',
      title: 'UI/UX Design Mastery',
      schedule: 'Mon, Wed, Fri - 7:00 PM',
      instructor: 'Amit Patel',
    },
    {
      id: 'c3',
      title: 'Data Science & Machine Learning',
      schedule: 'Mon, Wed, Fri - 8:00 PM',
      instructor: 'Priya Sharma',
    }
  ];

  // MCQ Tests data
  const mcqTests = [
    {
      id: '1',
      title: 'JavaScript ES6+ Assessment',
      category: 'Full Stack Development',
      badge: 'Intermediate',
      badgeColor: '#D97706', // Yellow/brown
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
      badgeColor: '#DC2626', // Red
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
      badgeColor: '#16A34A', // Green
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
      badgeColor: '#D97706', // Yellow
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

  interface StudyMaterialItem {
    id: string;
    title: string;
    author: string;
    category: string;
    date: string;
    type: string;
    downloads: string;
    size: string;
    icon: string;
    iconBg: string;
    iconColor: string;
  }

  // Study Materials Data
  const studyMaterialsData: Record<string, StudyMaterialItem[]> = {
    'Full Stack Web Development': [
      {
        id: 'm1',
        title: 'React Hooks Complete Guide',
        author: 'Prof. Sarah Johnson',
        category: 'Advanced Web Technologies',
        date: 'Nov 20, 2024',
        type: 'PDF',
        downloads: '156',
        size: '4.2 MB',
        icon: 'document-text-outline',
        iconBg: '#FEE2E2',
        iconColor: '#EF4444',
      },
      {
        id: 'm2',
        title: 'Redux State Management Slides',
        author: 'Prof. Sarah Johnson',
        category: 'Advanced Web Technologies',
        date: 'Nov 18, 2024',
        type: 'PPT',
        downloads: '142',
        size: '8.5 MB',
        icon: 'easel-outline',
        iconBg: '#FFF7ED',
        iconColor: '#F97316',
      },
      {
        id: 'm3',
        title: 'API Design Best Practices',
        author: 'Dr. James Wilson',
        category: 'Node.js Backend Development',
        date: 'Nov 15, 2024',
        type: 'DOC',
        downloads: '173',
        size: '2.1 MB',
        icon: 'document-outline',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
      },
      {
        id: 'm4',
        title: 'CSS Animation Examples',
        author: 'Prof. Emily Davis',
        category: 'React & Modern Frontend',
        date: 'Nov 12, 2024',
        type: 'ZIP',
        downloads: '167',
        size: '15.3 MB',
        icon: 'archive-outline',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
      },
    ],
    'UI/UX Design Mastery': [
      {
        id: 'm5',
        title: 'Figma Design Systems Guide',
        author: 'Amit Patel',
        category: 'UI/UX Design Mastery',
        date: 'Nov 22, 2024',
        type: 'PDF',
        downloads: '210',
        size: '12.4 MB',
        icon: 'color-palette-outline',
        iconBg: '#FAF0FD',
        iconColor: '#7B2CBF',
      },
      {
        id: 'm6',
        title: 'User Persona Templates',
        author: 'Amit Patel',
        category: 'UX Research & Design',
        date: 'Nov 19, 2024',
        type: 'ZIP',
        downloads: '95',
        size: '6.2 MB',
        icon: 'archive-outline',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
      }
    ],
    'Data Science & Machine Learning': [
      {
        id: 'm7',
        title: 'Neural Networks Workbook',
        author: 'Dr. Michael Chen',
        category: 'Machine Learning Basics',
        date: 'Nov 17, 2024',
        type: 'PDF',
        downloads: '198',
        size: '6.8 MB',
        icon: 'analytics-outline',
        iconBg: '#FEE2E2',
        iconColor: '#EF4444',
      },
      {
        id: 'm8',
        title: 'Docker Setup Tutorial Video',
        author: 'Prof. Lisa Anderson',
        category: 'DevOps & CI/CD',
        date: 'Nov 13, 2024',
        type: 'VIDEO',
        downloads: '89',
        size: '125 MB',
        icon: 'videocam-outline',
        iconBg: '#FAF0FD',
        iconColor: '#7B2CBF',
      },
      {
        id: 'm9',
        title: 'GraphQL Schema Design',
        author: 'Dr. Robert Taylor',
        category: 'API Design & Development',
        date: 'Nov 10, 2024',
        type: 'PDF',
        downloads: '124',
        size: '5.0 MB',
        icon: 'document-text-outline',
        iconBg: '#FEE2E2',
        iconColor: '#EF4444',
      }
    ]
  };

  const handleDownload = (title: string, size: string) => {
    Alert.alert(
      'Download Started',
      `Downloading "${title}" (${size})...`,
      [{ text: 'OK' }]
    );
  };

  const currentMaterialsList = selectedCourseForMaterials
    ? (studyMaterialsData[selectedCourseForMaterials] || []).filter(m => 
        m.title.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
        m.author.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(materialSearchQuery.toLowerCase())
      )
    : [];

  const handleBackAction = () => {
    if (activeTab === 'StudyMaterial') {
      setSelectedCourseForMaterials(null);
      setMaterialSearchQuery('');
    }
  };

  const isDetailActive = activeTab === 'StudyMaterial' && selectedCourseForMaterials !== null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: Platform.OS === 'web' ? 800 : undefined, alignSelf: 'center' }}>
          <View style={styles.headerTopRow}>
            {isDetailActive ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBackAction}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.logoText}>
                NE<Text style={styles.logoTextGold}>X</Text>US
              </Text>
            )}
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="book-outline" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#FFF" />
                <View style={styles.badgeDot} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerTitle}>
            {activeTab === 'MCQ' ? 'Tests & Assessments' : 'Study Materials'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'MCQ' 
              ? 'Test your knowledge and track your progress' 
              : 'Access notes, slides, and resources'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SUB-TAB SELECTOR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'MCQ' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('MCQ');
            }}
          >
            <View style={styles.tabButtonContent}>
              <Text style={[styles.tabButtonText, activeTab === 'MCQ' && styles.activeTabButtonText]}>
                MCQ Test
              </Text>
              <View style={styles.redDot} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'StudyMaterial' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('StudyMaterial');
              setSelectedCourseForMaterials(null);
              setMaterialSearchQuery('');
            }}
          >
            <View style={styles.tabButtonContent}>
              <Ionicons
                name="book-outline"
                size={16}
                color={activeTab === 'StudyMaterial' ? '#FFF' : '#6B7280'}
              />
              <Text style={[styles.tabButtonText, activeTab === 'StudyMaterial' && styles.activeTabButtonText]}>
                Study Material
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. DYNAMIC CONTENT VIEW */}
        {activeTab === 'MCQ' ? (
          // MCQ TEST FLOW
          <View style={styles.listContainer}>
            {mcqTests.map((test) => (
              <View 
                key={test.id} 
                style={[
                  styles.testCard,
                  test.id === '3' && { borderWidth: 2, borderColor: '#7B2CBF', shadowColor: '#7B2CBF', shadowOpacity: 0.1 }
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
                    <Text style={styles.statLabelText}>Questions</Text>
                    <Text style={styles.statValText}>{test.questions}</Text>
                  </View>
                  <View style={styles.statBadgeOrange}>
                    <Ionicons name="time-outline" size={13} color="#EA580C" />
                    <Text style={styles.statLabelText}>Duration</Text>
                    <Text style={styles.statValText}>{test.duration}</Text>
                  </View>
                  <View style={styles.statBadgeGreen}>
                    <Ionicons name="ribbon-outline" size={13} color="#16A34A" />
                    <Text style={styles.statLabelText}>Pass Score</Text>
                    <Text style={styles.statValText}>{test.passScore}</Text>
                  </View>
                </View>

                {/* Attempts bar */}
                <View style={styles.attemptsBar}>
                  <View style={styles.attemptsLeft}>
                    <Ionicons name="stats-chart" size={14} color="#7B2CBF" />
                    <Text style={styles.attemptsLabel}>Previous Attempts:</Text>
                  </View>
                  <Text style={styles.attemptsValue}>{test.attempts}</Text>
                </View>

                {/* Start Test Button */}
                <TouchableOpacity 
                  style={styles.startTestButton}
                  onPress={() => setActiveTest(test)}
                >
                  <Ionicons name="play" size={14} color="#FFFFFF" style={styles.playIcon} />
                  <Text style={styles.startTestButtonText}>Start Test</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          // STUDY MATERIAL FLOW
          selectedCourseForMaterials === null ? (
            // Course List under Study Materials
            <View style={styles.listContainer}>
              {coursesList.map((course) => (
                <TouchableOpacity 
                  key={course.id} 
                  style={styles.courseCard}
                  onPress={() => setSelectedCourseForMaterials(course.title)}
                  activeOpacity={0.9}
                >
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <View style={styles.courseScheduleRow}>
                      <Ionicons name="time-outline" size={14} color="#E9D5FF" />
                      <Text style={styles.courseScheduleText}>{course.schedule}</Text>
                    </View>
                    <Text style={styles.courseInstructorLabel}>
                      Instructor: <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{course.instructor}</Text>
                    </Text>
                  </View>
                  <View style={styles.courseArrowBtn}>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Material Details List for selected course
            <View style={styles.listContainer}>
              {/* Search Wrapper */}
              <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search materials..."
                  placeholderTextColor="#9CA3AF"
                  value={materialSearchQuery}
                  onChangeText={setMaterialSearchQuery}
                />
              </View>

              {currentMaterialsList.length > 0 ? (
                currentMaterialsList.map((material) => (
                  <View key={material.id} style={styles.materialCard}>
                    {/* Header Row */}
                    <View style={styles.materialHeader}>
                      <View style={[styles.materialIconContainer, { backgroundColor: material.iconBg }]}>
                        <Ionicons name={material.icon as any} size={24} color={material.iconColor} />
                      </View>
                      <View style={styles.materialTitleWrapper}>
                        <Text style={styles.materialTitle}>{material.title}</Text>
                        <Text style={styles.materialAuthor}>{material.author}</Text>
                        <View style={styles.materialTagRow}>
                          <Ionicons name="book-outline" size={12} color="#7B2CBF" />
                          <Text style={styles.materialTagText}>{material.category}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Metadata Row */}
                    <View style={styles.materialMetaRow}>
                      <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.materialMetaText}>{material.date}</Text>
                      <Text style={styles.materialMetaText}>|</Text>
                      <Ionicons name="document-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.materialMetaText}>{material.type}</Text>
                      <Text style={styles.materialMetaText}>|</Text>
                      <Ionicons name="download-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.materialMetaText}>{material.downloads} downloads</Text>
                    </View>

                    {/* Download Button */}
                    <TouchableOpacity 
                      style={styles.downloadButton}
                      onPress={() => handleDownload(material.title, material.size)}
                    >
                      <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.downloadButtonText}>Download ({material.size})</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No study materials found.</Text>
              )}
            </View>
          )
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
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
    paddingBottom: 100, // Ensure content doesn't cover tab bar
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
