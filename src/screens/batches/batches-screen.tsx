import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GenBatchDetails from './gen-batch-details';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SubTabType = 'Ongoing' | 'Upcoming';

export default function BatchesScreen() {
  const [activeTab, setActiveTab] = useState<SubTabType>('Ongoing');
  const [selectedGenBatch, setSelectedGenBatch] = useState<string | null>(null);

  // Ongoing batches data as state
  const [ongoingBatches, setOngoingBatches] = useState([
    {
      id: '1',
      title: 'Data Science & Machine Learning',
      duration: '5 Months',
      isLive: true,
      student: { name: 'Priya Patel', emoji: '👨‍💻' }, // Squircle emoji avatar
      teacher: { name: 'Dr. Priya Sharma', emoji: '👨‍💻' }, // Hardcoded developer avatar emoji
      progress: '8/50',
      progressPercent: 16,
      topics: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow'],
    },
    {
      id: '2',
      title: 'Full Stack Web Development',
      duration: '6 Months',
      isLive: false,
      student: { name: 'Rahul Sharma', emoji: '👤' },
      teacher: { name: 'Rajesh Kumar', emoji: '👨‍💻' },
      progress: '12/45',
      progressPercent: 26,
      topics: ['React.js', 'Node.js', 'MongoDB', 'REST APIs', 'Deployment'],
      nextClass: 'Today at 7:00 PM',
    },
    {
      id: '5',
      title: 'Java Full Stack Development',
      duration: '5 Months',
      isLive: false,
      student: { name: 'Kunal Sen', emoji: '👤' },
      teacher: { name: 'Amit Patel', emoji: '👨‍💻' },
      progress: '22/52',
      progressPercent: 42,
      topics: ['Java Core', 'Spring Boot', 'Hibernate', 'REST APIs', 'React Integration'],
      nextClass: 'Tomorrow at 8:00 PM',
    },
    {
      id: '6',
      title: 'Node js for AI & Web Integration',
      duration: '3 Months',
      isLive: false,
      student: { name: 'Asha Rao', emoji: '👩‍💻' },
      teacher: { name: 'Sanjay Mehta', emoji: '👨‍💻' },
      progress: '18/30',
      progressPercent: 60,
      topics: ['Node.js Core', 'Express APIs', 'Gemini SDK', 'Vector Databases', 'WebSockets'],
      nextClass: 'Thursday at 6:30 PM',
    },
  ]);

  // Gen Batches data
  const genBatches = [
    {
      id: 'gb1',
      title: 'Gen Batch 2025-A',
      status: 'upcoming',
      dateRange: 'Jan 10, 2025 - Jan 25, 2025',
      coursesCount: 12,
    },
    {
      id: 'gb2',
      title: 'Gen Batch 2025-B',
      status: 'upcoming',
      dateRange: 'Feb 01, 2025 - Feb 15, 2025',
      coursesCount: 8,
    }
  ];

  const handleEnrollSuccess = (batch: any) => {
    // Avoid double enrollment for same title
    if (ongoingBatches.some(b => b.title === batch.title)) {
      setSelectedGenBatch(null);
      setActiveTab('Ongoing');
      return;
    }

    const topicsMap: Record<string, string[]> = {
      'b1': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow'],
      'b2': ['React.js', 'Node.js', 'MongoDB', 'REST APIs', 'Deployment'],
      'b3': ['Figma', 'Wireframing', 'UX Research', 'Design Systems', 'Prototyping'],
      'b4': ['SEO', 'Google Ads', 'Social Media', 'Email Marketing', 'Analytics']
    };

    const newOngoing = {
      id: String(Date.now()),
      title: batch.title,
      duration: batch.duration,
      isLive: false,
      student: { name: 'Priya Patel', emoji: '👩‍💻' },
      teacher: { name: batch.instructor, emoji: '👨‍💻' },
      progress: '0/40',
      progressPercent: 0,
      topics: topicsMap[batch.id] || ['Core Concepts', 'Projects', 'Assessment'],
      nextClass: 'Starting soon - ' + batch.startDate,
    };

    setOngoingBatches(prev => [newOngoing, ...prev]);
    setSelectedGenBatch(null);
    setActiveTab('Ongoing');
  };

  if (selectedGenBatch) {
    return (
      <GenBatchDetails 
        onBack={() => setSelectedGenBatch(null)} 
        onEnrollSuccess={handleEnrollSuccess}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: Platform.OS === 'web' ? 800 : undefined, alignSelf: 'center' }}>
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
                <View style={styles.badgeDot} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerTitle}>Batches</Text>
          <Text style={styles.headerSubtitle}>Manage your learning batches</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. STATS ROW */}
        <View style={styles.statsRow}>
          {/* Card 1: Ongoing */}
          <View style={styles.statCard}>
            <Ionicons name="videocam-outline" size={24} color="#7B2CBF" style={styles.statIcon} />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Ongoing</Text>
          </View>
          {/* Card 2: Completed */}
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#FFB703" style={styles.statIcon} />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          {/* Card 3: Live Now */}
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#7B2CBF" style={styles.statIcon} />
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Live Now</Text>
          </View>
        </View>

        {/* 3. SUB-TAB SELECTOR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Ongoing' && styles.activeTabButton]}
            onPress={() => setActiveTab('Ongoing')}
          >
            <View style={styles.tabButtonContent}>
              <Ionicons
                name="videocam-outline"
                size={18}
                color={activeTab === 'Ongoing' ? '#FFF' : '#6B7280'}
              />
              <Text style={[styles.tabButtonText, activeTab === 'Ongoing' && styles.activeTabButtonText]}>
                Ongoing
              </Text>
              {activeTab === 'Ongoing' && <View style={styles.tabIndicatorDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Upcoming' && styles.activeTabButton]}
            onPress={() => setActiveTab('Upcoming')}
          >
            <View style={styles.tabButtonContent}>
              <Ionicons
                name="book-outline"
                size={18}
                color={activeTab === 'Upcoming' ? '#FFF' : '#6B7280'}
              />
              <Text style={[styles.tabButtonText, activeTab === 'Upcoming' && styles.activeTabButtonText]}>
                Upcoming
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. BATCH CARDS LIST */}
        {activeTab === 'Ongoing' ? (
          <View style={styles.listContainer}>
            {ongoingBatches.map((batch) => (
              <View key={batch.id} style={styles.batchCard}>
                {/* Card Header (Purple Area) */}
                <View style={styles.batchCardHeader}>
                  <View style={styles.batchHeaderLeft}>
                    <Text style={styles.batchTitle}>{batch.title}</Text>
                    <View style={styles.batchDurationRow}>
                      <Ionicons name="calendar-outline" size={14} color="#E9D5FF" />
                      <Text style={styles.batchDurationText}>{batch.duration}</Text>
                    </View>
                  </View>
                  {batch.isLive && (
                    <View style={styles.liveNowBadge}>
                      <Text style={styles.liveNowBadgeText}>● LIVE NOW</Text>
                    </View>
                  )}
                </View>

                {/* Card Body (White Area) */}
                <View style={styles.batchCardBody}>
                  {/* Student & Teacher profiles */}
                  <View style={styles.profilesRow}>
                    {/* Student */}
                    <View style={styles.profileCol}>
                      <View style={styles.avatarSquircleStudent}>
                        <Text style={styles.avatarEmoji}>{batch.student.emoji}</Text>
                      </View>
                      <View style={styles.profileTextWrapper}>
                        <Text style={styles.profileLabel}>Student</Text>
                        <Text style={styles.profileName}>{batch.student.name}</Text>
                      </View>
                    </View>
                    {/* Teacher */}
                    <View style={styles.profileCol}>
                      <View style={styles.avatarSquircleTeacher}>
                        <Text style={styles.avatarEmoji}>👨‍💻</Text>
                      </View>
                      <View style={styles.profileTextWrapper}>
                        <Text style={styles.profileLabel}>Teacher</Text>
                        <Text style={styles.profileName}>{batch.teacher.name}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress section */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeaderRow}>
                      <View style={styles.progressIconTitle}>
                        <Ionicons name="book-outline" size={16} color="#7B2CBF" />
                        <Text style={styles.progressTitle}>Classes Progress</Text>
                      </View>
                      <Text style={styles.progressValText}>{batch.progress}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${batch.progressPercent}%` }]} />
                    </View>
                  </View>

                  {/* Topics Covered */}
                  <View style={styles.topicsSection}>
                    <Text style={styles.topicsSectionTitle}>Topics Covered</Text>
                    <View style={styles.topicsRow}>
                      {batch.topics.map((topic, i) => (
                        <View key={i} style={styles.topicBadge}>
                          <Text style={styles.topicBadgeText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Footer Actions */}
                  {batch.isLive ? (
                    <TouchableOpacity style={styles.joinLiveButton}>
                      <Ionicons name="play-circle-outline" size={20} color="#FFF" />
                      <Text style={styles.joinLiveButtonText}>Join Live Class Now</Text>
                      <Ionicons name="open-outline" size={16} color="#FFF" style={styles.externalIcon} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.footerRow}>
                      <View style={styles.nextClassWrapper}>
                        <Text style={styles.nextClassLabel}>Next Class</Text>
                        <Text style={styles.nextClassTime}>{batch.nextClass}</Text>
                      </View>
                      <TouchableOpacity style={styles.joinStandardButton}>
                        <Ionicons name="videocam" size={16} color="#FFF" style={styles.buttonIcon} />
                        <Text style={styles.joinStandardButtonText}>Join Class</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {/* Gen Batches Header */}
            <View style={styles.genBatchesHeader}>
              <Text style={styles.genBatchesTitle}>Gen Batches</Text>
              <Text style={styles.genBatchesSubtitle}>View all available batches and their courses</Text>
            </View>

            {genBatches.map((batch) => (
              <TouchableOpacity 
                key={batch.id} 
                style={styles.genBatchCard}
                onPress={() => setSelectedGenBatch(batch.id)}
                activeOpacity={0.8}
              >
                <View style={styles.genBatchCardTop}>
                  <Text style={styles.genBatchCardTitle}>{batch.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
                <View style={styles.genBatchBadge}>
                  <Text style={styles.genBatchBadgeText}>{batch.status}</Text>
                </View>
                
                <View style={styles.genBatchInfoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.genBatchInfoText}>{batch.dateRange}</Text>
                </View>
                <View style={styles.genBatchInfoRow}>
                  <Ionicons name="book-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.genBatchInfoText}>{batch.coursesCount} Courses</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: '#FFB703', // Orange/gold indicator dot
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
  },
  bottomSpacer: {
    height: 100,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  // Tab selector
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
  tabIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 2,
  },
  // Batch Cards
  listContainer: {
    gap: 16,
  },
  batchCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  batchCardHeader: {
    backgroundColor: '#7B2CBF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  batchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  batchDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  batchDurationText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '500',
  },
  liveNowBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  liveNowBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  upcomingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  upcomingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  batchCardBody: {
    padding: 20,
  },
  profilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 0.48,
  },
  avatarSquircleStudent: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFE4E6', // Light pink/red background for student
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSquircleTeacher: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FAF0FD', // Light purple background for teacher
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  profileTextWrapper: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  profileName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  // Progress Bar
  progressContainer: {
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  progressValText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7B2CBF',
    borderRadius: 4,
  },
  // Topics list
  topicsSection: {
    marginBottom: 20,
  },
  topicsSectionTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 8,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  topicBadgeText: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  // Join button & footer
  joinLiveButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  joinLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  externalIcon: {
    marginLeft: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  nextClassWrapper: {
    flex: 1,
  },
  nextClassLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  nextClassTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  joinStandardButton: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
  },
  joinStandardButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginTop: 0,
  },
  reminderButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#7B2CBF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  reminderButtonText: {
    color: '#7B2CBF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Gen Batches
  genBatchesHeader: {
    backgroundColor: '#7B2CBF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: -16,
    marginBottom: 8,
  },
  genBatchesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  genBatchesSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
  },
  genBatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  genBatchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  genBatchCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  genBatchBadge: {
    backgroundColor: '#E0F2FE', // Light blue
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  genBatchBadgeText: {
    color: '#0284C7', // Blue text
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'lowercase',
  },
  genBatchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  genBatchInfoText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
});
