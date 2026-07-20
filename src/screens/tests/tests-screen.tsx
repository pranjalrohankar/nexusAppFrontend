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
import { api, getApiBaseUrl, loadToken } from '@/services/api';

type SubTabType = 'MCQ' | 'StudyMaterial';

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
  fileType: string;
  fileName: string;
  fileUrl: string;
  uploadedByEmail: string;
  uploadedAt: string;
}

const API_BASE = getApiBaseUrl().replace('/api', '');

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

  // Real data
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allMaterials, setAllMaterials] = useState<RealMaterial[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    await loadToken();
    setEnrollmentsLoading(true);
    setMaterialsLoading(true);
    try {
      const enrData = await api.getStudentEnrollments();
      setEnrollments(Array.isArray(enrData) ? enrData : []);
    } catch (e) {
      console.warn('Enrollments fetch failed', e);
    } finally {
      setEnrollmentsLoading(false);
    }
    try {
      const matData = await api.getStudentMaterials();
      setAllMaterials(Array.isArray(matData) ? matData : []);
    } catch (e) {
      console.warn('Materials fetch failed', e);
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (activeTest !== null) {
    return <ActiveTestScreen testInfo={activeTest} onClose={() => setActiveTest(null)} />;
  }

  // Helper: icon config per file type
  const getFileIcon = (fileType: string) => {
    switch ((fileType || '').toUpperCase()) {
      case 'PDF':    return { icon: 'document-text-outline', bg: '#FEE2E2', color: '#EF4444' };
      case 'PPT':    return { icon: 'easel-outline',          bg: '#FFF7ED', color: '#F97316' };
      case 'DOC':    return { icon: 'document-outline',       bg: '#E0F2FE', color: '#0284C7' };
      case 'VIDEO':  return { icon: 'videocam-outline',       bg: '#FAF0FD', color: '#7B2CBF' };
      case 'IMAGE':  return { icon: 'image-outline',          bg: '#F0FDF4', color: '#16A34A' };
      case 'ZIP':    return { icon: 'archive-outline',        bg: '#FEF3C7', color: '#D97706' };
      default:       return { icon: 'document-outline',       bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const isImage = (fileType: string, fileName: string) => {
    if ((fileType || '').toUpperCase() === 'IMAGE') return true;
    const ext = (fileName || '').split('.').pop()?.toLowerCase() ?? '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  };

  const handleOpenMaterial = async (item: RealMaterial) => {
    try {
      const url = item.fileUrl
        ? item.fileUrl.startsWith('http') ? item.fileUrl : `${API_BASE}${item.fileUrl}`
        : null;
      if (!url) { Alert.alert('Unavailable', 'No file available.'); return; }
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = url; a.download = item.fileName || 'file';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        return;
      }
      await Linking.openURL(url);
    } catch { Alert.alert('Error', 'Could not open file.'); }
  };

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

  // Materials for the selected course, filtered by search.
  // Uses partial matching so "Java" matches "Java Full Stack Development" and vice versa.
  const currentMaterialsList = selectedCourseForMaterials
    ? allMaterials.filter(m => {
        const matCourse = (m.course ?? '').toLowerCase().trim();
        const selCourse = selectedCourseForMaterials.toLowerCase().trim();
        // match if either string contains the other
        const courseMatch = matCourse === selCourse
          || matCourse.includes(selCourse)
          || selCourse.includes(matCourse);
        const q = materialSearchQuery.toLowerCase();
        if (!q) return courseMatch;
        return courseMatch && (
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.batch?.toLowerCase().includes(q)
        );
      })
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
            // Course List — from real enrollments
            <View style={styles.listContainer}>
              {enrollmentsLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#7B2CBF" />
                  <Text style={styles.noDataText}>Loading your courses...</Text>
                </View>
              ) : enrollments.length === 0 ? (
                <Text style={styles.noDataText}>You are not enrolled in any courses yet.</Text>
              ) : (
                enrollments.map((enr) => (
                  <TouchableOpacity
                    key={enr.id}
                    style={styles.courseCard}
                    onPress={() => setSelectedCourseForMaterials(enr.courseTitle)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{enr.courseTitle}</Text>
                      {enr.enrollmentDate ? (
                        <View style={styles.courseScheduleRow}>
                          <Ionicons name="calendar-outline" size={14} color="#E9D5FF" />
                          <Text style={styles.courseScheduleText}>Enrolled: {enr.enrollmentDate}</Text>
                        </View>
                      ) : null}
                      {/* <Text style={styles.courseInstructorLabel}>
                        Status: <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{enr.paymentStatus || '—'}</Text>
                      </Text> */}
                    </View>
                    <View style={styles.courseArrowBtn}>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            // Material list for selected course
            <View style={styles.listContainer}>
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

              {materialsLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#7B2CBF" />
                  <Text style={styles.noDataText}>Loading materials...</Text>
                </View>
              ) : currentMaterialsList.length === 0 ? (
                <Text style={styles.noDataText}>
                  {materialSearchQuery ? 'No materials match your search.' : 'No study materials uploaded for this course yet.'}
                </Text>
              ) : (
                currentMaterialsList.map((material) => {
                  const fi = getFileIcon(material.fileType);
                  const img = isImage(material.fileType, material.fileName);
                  const imgUrl = material.fileUrl
                    ? material.fileUrl.startsWith('http') ? material.fileUrl : `${API_BASE}${material.fileUrl}`
                    : null;
                  return (
                    <View key={material.id} style={styles.materialCard}>
                      {/* Image preview for IMAGE files */}
                      {img && imgUrl ? (
                        <Image
                          source={{ uri: imgUrl }}
                          style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 14 }}
                          resizeMode="cover"
                        />
                      ) : null}

                      {/* Header Row */}
                      <View style={styles.materialHeader}>
                        <View style={[styles.materialIconContainer, { backgroundColor: fi.bg }]}>
                          <Ionicons name={fi.icon as any} size={24} color={fi.color} />
                        </View>
                        <View style={styles.materialTitleWrapper}>
                          <Text style={styles.materialTitle}>{material.title}</Text>
                          {material.description ? (
                            <Text style={styles.materialAuthor} numberOfLines={2}>{material.description}</Text>
                          ) : null}
                          <View style={styles.materialTagRow}>
                            <Ionicons name="folder-outline" size={12} color="#7B2CBF" />
                            <Text style={styles.materialTagText}>{material.batch || material.course}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Metadata Row */}
                      <View style={styles.materialMetaRow}>
                        {material.uploadedByEmail ? (
                          <Text style={styles.materialMetaText}>{material.uploadedByEmail}</Text>
                        ) : null}
                        {material.uploadedByEmail && material.uploadedAt ? (
                          <Text style={styles.materialMetaText}>|</Text>
                        ) : null}
                        {material.uploadedAt ? (
                          <>
                            <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.materialMetaText}>
                              {new Date(material.uploadedAt).toLocaleDateString()}
                            </Text>
                          </>
                        ) : null}
                        <Text style={styles.materialMetaText}>|</Text>
                        <Ionicons name="document-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.materialMetaText}>{material.fileType?.toUpperCase() || 'FILE'}</Text>
                      </View>

                      {/* Open / Download Button */}
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => handleOpenMaterial(material)}
                      >
                        <Ionicons name={img ? 'eye-outline' : 'cloud-download-outline'} size={18} color="#FFFFFF" />
                        <Text style={styles.downloadButtonText}>{img ? 'View Image' : 'Open / Download'}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
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
