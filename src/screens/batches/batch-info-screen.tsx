import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Batch {
  id: string;
  title: string;
  subtitle: string;
  badges: { text: string; type: string; bg: string; color: string }[];
  startDate: string;
  duration: string;
  instructor: string;
  schedule: string;
}

interface BatchInfoScreenProps {
  onBack: () => void;
  onEnrollSuccess?: (batch: Batch) => void;
  batch?: Batch;
}

export default function BatchInfoScreen({ onBack, onEnrollSuccess, batch }: BatchInfoScreenProps) {
  const defaultData = {
    title: 'Data Science & Machine Learning',
    subtitle: 'Batch A - Evening',
    startDate: 'June 15, 2026',
    duration: '3 Months',
    classDays: ['Monday', 'Wednesday', 'Friday'],
    classTiming: '8:00 PM - 10:00 PM',
    mode: 'Live Online Classes (Google Meet)',
    instructor: {
      name: 'Priya Sharma',
      title: 'M.Tech, Ph.D.',
      initials: 'PS',
      rating: '4.9',
    },
    syllabus: [
      'Introduction to Data Science',
      'Python for Data Analysis',
      'Statistics & Probability',
      'Machine Learning Fundamentals',
      'Deep Learning & Neural Networks',
      'Real-world Projects',
    ],
    whatYouGet: [
      'Live Interactive Classes',
      'Recorded Sessions Access',
      'Lifetime Course Material',
      'Doubt Clearing Sessions',
      'Industry Projects',
      'Placement Assistance',
    ],
    fees: '₹25,000',
    installment: 'Installment Plan Available: ₹8,500 × 3 months',
  };

  const getBatchData = () => {
    if (!batch) return defaultData;

    const defaultSyllabus = [
      'Introduction & Getting Started',
      'Core Principles and Fundamentals',
      'Intermediate Concepts & Tools',
      'Advanced Techniques & Architecture',
      'Real-world Industry Projects',
      'Final Evaluation & Capstone Project'
    ];

    const syllabusMap: Record<string, string[]> = {
      'b1': [
        'Introduction to Data Science',
        'Python for Data Analysis',
        'Statistics & Probability',
        'Machine Learning Fundamentals',
        'Deep Learning & Neural Networks',
        'Real-world Projects',
      ],
      'b2': [
        'HTML5, CSS3 & Responsive Design',
        'Modern JavaScript (ES6+)',
        'React.js Frontend Framework',
        'Node.js & Express.js Backend',
        'MongoDB & Database Design',
        'REST API Integration & Deployment',
      ],
      'b3': [
        'Introduction to UX Research',
        'Information Architecture & Wireframing',
        'Figma Tools & Design Systems',
        'UI Design Principles & Typography',
        'Prototyping & Usability Testing',
        'Portfolio Development',
      ],
      'b4': [
        'Introduction to Digital Marketing',
        'Search Engine Optimization (SEO)',
        'Social Media Marketing (SMM)',
        'Google Ads & Paid Search',
        'Email & Content Marketing',
        'Web Analytics & Reporting',
      ]
    };

    const feesMap: Record<string, { total: string; installment: string }> = {
      'b1': { total: '₹25,000', installment: 'Installment Plan Available: ₹8,500 × 3 months' },
      'b2': { total: '₹30,000', installment: 'Installment Plan Available: ₹10,000 × 3 months' },
      'b3': { total: '₹20,000', installment: 'Installment Plan Available: ₹7,000 × 3 months' },
      'b4': { total: '₹18,000', installment: 'Installment Plan Available: ₹6,000 × 3 months' },
    };

    const instructorTitleMap: Record<string, string> = {
      'b1': 'M.Tech, Ph.D.',
      'b2': 'Senior Full Stack Developer',
      'b3': 'Lead Product Designer',
      'b4': 'Growth Marketing Lead'
    };

    const schedule = batch.schedule || 'Mon, Wed, Fri - 6:00 PM';
    let classDays = ['Monday', 'Wednesday', 'Friday'];
    let classTiming = '6:00 PM';

    if (schedule.includes(' - ')) {
      const parts = schedule.split(' - ');
      classTiming = parts[1];
      const dayAbbrs = parts[0].split(', ');
      classDays = dayAbbrs.map((abbr: string) => {
        const mapping: Record<string, string> = {
          'Mon': 'Monday',
          'Tue': 'Tuesday',
          'Wed': 'Wednesday',
          'Thu': 'Thursday',
          'Fri': 'Friday',
          'Sat': 'Saturday',
          'Sun': 'Sunday'
        };
        return mapping[abbr] || abbr;
      });
    }

    const feesInfo = feesMap[batch.id] || { total: '₹25,000', installment: 'Installment Plan Available: ₹8,500 × 3 months' };

    return {
      title: batch.title,
      subtitle: batch.subtitle,
      startDate: batch.startDate,
      duration: batch.duration,
      classDays,
      classTiming,
      mode: 'Live Online Classes (Google Meet)',
      instructor: {
        name: batch.instructor,
        title: instructorTitleMap[batch.id] || 'Expert Instructor',
        initials: batch.instructor.split(' ').map((n: string) => n[0]).join(''),
        rating: '4.9',
      },
      syllabus: syllabusMap[batch.id] || defaultSyllabus,
      whatYouGet: [
        'Live Interactive Classes',
        'Recorded Sessions Access',
        'Lifetime Course Material',
        'Doubt Clearing Sessions',
        'Industry Projects',
        'Placement Assistance',
      ],
      fees: feesInfo.total,
      installment: feesInfo.installment,
    };
  };

  const data = getBatchData();

  const handleEnroll = () => {
    Alert.alert(
      'Confirm Enrollment',
      `Are you sure you want to enroll in ${data.title} (${data.subtitle})?\n\nCourse Fee: ${data.fees}\n${data.installment}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert(
              'Enrollment Successful',
              `Congratulations! You have successfully enrolled in ${data.title}.\n\nClasses start on ${data.startDate}.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onEnrollSuccess && batch) {
                      onEnrollSuccess(batch);
                    } else {
                      onBack();
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          <View style={{ width: '100%', maxWidth: Platform.OS === 'web' ? 800 : undefined, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>{data.title}</Text>
              <Text style={styles.headerSubtitle}>{data.subtitle}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.bodyBackground}>
          {/* TOP STATS CARD (Overlapping) */}
          <View style={styles.topStatsCard}>
            <View style={styles.topStatCol}>
              <View style={styles.iconBoxPurple}>
                <Ionicons name="calendar" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.topStatLabel}>Start Date</Text>
                <Text style={styles.topStatValue}>{data.startDate}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.topStatCol}>
              <View style={styles.iconBoxOrange}>
                <Ionicons name="time" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.topStatLabel}>Duration</Text>
                <Text style={styles.topStatValue}>{data.duration}</Text>
              </View>
            </View>
          </View>

          {/* SCHEDULE DETAILS */}
          <Text style={styles.sectionTitle}>Schedule Details</Text>
          <View style={styles.card}>
            <View style={styles.scheduleRow}>
              <Ionicons name="calendar-outline" size={20} color="#9333EA" />
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Class Days</Text>
                <View style={styles.badgesRow}>
                  {data.classDays.map((day, idx) => (
                    <View key={idx} style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>{day}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.scheduleRow}>
              <Ionicons name="time-outline" size={20} color="#EA580C" />
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Class Timing</Text>
                <Text style={styles.scheduleValue}>{data.classTiming}</Text>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.scheduleRow}>
              <Ionicons name="videocam-outline" size={20} color="#2563EB" />
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Mode</Text>
                <Text style={styles.scheduleValue}>{data.mode}</Text>
              </View>
            </View>
          </View>

          {/* INSTRUCTOR */}
          <Text style={styles.sectionTitle}>Instructor</Text>
          <View style={styles.card}>
            <View style={styles.instructorRow}>
              <View style={styles.instructorAvatar}>
                <Text style={styles.instructorInitials}>{data.instructor.initials}</Text>
              </View>
              <View style={styles.instructorInfo}>
                <Text style={styles.instructorName}>{data.instructor.name}</Text>
                <Text style={styles.instructorTitle}>{data.instructor.title}</Text>
              </View>
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#EAB308" />
                <Text style={styles.ratingText}>{data.instructor.rating}</Text>
              </View>
            </View>
          </View>

          {/* ENROLL NOW BUTTON */}
          <TouchableOpacity style={styles.purpleEnrollButton} onPress={handleEnroll}>
            <Text style={styles.purpleEnrollButtonText}>Enroll Now - {data.fees}</Text>
          </TouchableOpacity>

          {/* DOWNLOAD BROCHURE BUTTON */}
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Download Brochure</Text>
          </TouchableOpacity>

          {/* COURSE SYLLABUS */}
          <Text style={styles.sectionTitle}>Course Syllabus</Text>
          <View style={styles.card}>
            {data.syllabus.map((item, idx) => (
              <View key={idx} style={styles.syllabusRow}>
                <View style={styles.syllabusNumberBox}>
                  <Text style={styles.syllabusNumber}>{idx + 1}</Text>
                </View>
                <Text style={styles.syllabusText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* WHAT YOU GET */}
          <Text style={styles.sectionTitle}>What You Get</Text>
          <View style={styles.card}>
            <View style={styles.whatYouGetGrid}>
              {data.whatYouGet.map((item, idx) => (
                <View key={idx} style={styles.whatYouGetCol}>
                  <View style={styles.greenDot} />
                  <Text style={styles.whatYouGetText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* FEES STRUCTURE */}
          <Text style={styles.sectionTitle}>Fees Structure</Text>
          <View style={styles.feesCard}>
            <View style={styles.feesTopRow}>
              <View style={styles.feesIconBox}>
                <Text style={styles.feesIconText}>$</Text>
              </View>
              <View style={styles.feesInfo}>
                <Text style={styles.feesLabel}>Course Fees</Text>
                <Text style={styles.feesValue}>{data.fees}</Text>
              </View>
            </View>
            <View style={styles.feesDivider} />
            <Text style={styles.installmentText}>{data.installment}</Text>
          </View>
          
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
  headerContainer: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 48, // space for overlapping card
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent', // Let header show through
  },
  scrollContent: {
    paddingBottom: 100, // For tabs overlay
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bodyBackground: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },
  topStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: -30, // Overlap the transparent spacer
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topStatCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBoxPurple: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxOrange: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  topStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  topStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  scheduleValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayBadge: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dayBadgeText: {
    color: '#9333EA',
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  instructorTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  outlineButtonText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  syllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  syllabusNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syllabusNumber: {
    color: '#9333EA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syllabusText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  whatYouGetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  whatYouGetCol: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingRight: 8,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  whatYouGetText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  feesCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  feesTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feesIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feesIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  feesInfo: {
    flex: 1,
  },
  feesLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  feesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  feesDivider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 16,
  },
  installmentText: {
    fontSize: 12,
    color: '#4B5563',
  },
  purpleEnrollButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  purpleEnrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 120,
  },
});
