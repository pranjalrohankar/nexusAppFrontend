import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Props { onBack: () => void; }

const SECTIONS = [
  {
    icon: <Ionicons name="book-outline" size={22} color="#7B2CBF" />,
    iconBg: '#F3E8FF',
    title: 'Enrolment & Access',
    points: [
      'Students must be at least 14 years of age to register independently. Students below 14 require parental consent.',
      'Access to courses, recordings, and study materials is granted only to enrolled students for the duration of their active batch.',
      'Login credentials are personal and must not be shared with others. Each account is for a single user only.',
      'We reserve the right to suspend or terminate accounts found in violation of these terms.',
    ],
  },
  {
    icon: <Ionicons name="card-outline" size={22} color="#10B981" />,
    iconBg: '#ECFDF5',
    title: 'Fees & Payments',
    points: [
      'Course and batch fees are payable as per the schedule communicated at the time of enrolment.',
      'Payments must be made through the approved methods available on the platform (UPI, cards, net banking).',
      'All fees are exclusive of applicable taxes unless stated otherwise.',
      'Nexus Training reserves the right to revise fee structures for new batches with reasonable prior notice.',
    ],
  },
  {
    icon: <MaterialCommunityIcons name="refresh" size={22} color="#FF7A00" />,
    iconBg: '#FFF7ED',
    title: 'Refund Policy',
    points: [
      'A full refund is available within 7 days of enrolment if less than 20% of the course content has been accessed.',
      'Partial refunds may be considered on a case-by-case basis for medical emergencies with supporting documentation.',
      'No refunds are applicable once a student has attended more than 30% of the scheduled classes.',
      'Refunds are processed within 7–10 working days to the original payment method.',
    ],
  },
  {
    icon: <MaterialCommunityIcons name="file-document-outline" size={22} color="#7B2CBF" />,
    iconBg: '#F3E8FF',
    title: 'Intellectual Property',
    points: [
      'All course content, recordings, study materials, and assessments are the exclusive intellectual property of Nexus Training Institute.',
      'Students may not reproduce, distribute, record, or resell any platform content without prior written permission.',
      'Study materials downloaded for personal use may not be shared with non-enrolled individuals.',
      'Violation of intellectual property rights may result in immediate account termination and legal action.',
    ],
  },
  {
    icon: <Ionicons name="ban-outline" size={22} color="#EF4444" />,
    iconBg: '#FEE2E2',
    title: 'Prohibited Conduct',
    points: [
      'Sharing login credentials, screen-recording live sessions, or distributing course content to third parties is strictly prohibited.',
      'Harassment, bullying, or disrespectful behaviour towards teachers, staff, or fellow students will not be tolerated.',
      'Submitting plagiarised assignments or using unfair means during tests will result in disqualification and may lead to account suspension.',
      'Any attempt to hack, exploit, or misuse the platform will result in immediate account termination and may be reported to authorities.',
    ],
  },
  {
    icon: <Ionicons name="warning-outline" size={22} color="#F59E0B" />,
    iconBg: '#FFFBEB',
    title: 'Disclaimers & Liability',
    points: [
      'Nexus Training does not guarantee specific academic results, employment outcomes, or admission to any institution.',
      'We are not responsible for any loss of data resulting from technical failures beyond our reasonable control.',
      'The platform may be temporarily unavailable for scheduled maintenance; we will provide advance notice where possible.',
      'Third-party links or resources provided in course materials are for reference only; we are not responsible for their content.',
    ],
  },
  {
    icon: <Ionicons name="scale-outline" size={22} color="#3B82F6" />,
    iconBg: '#EFF6FF',
    title: 'Governing Law',
    points: [
      'These Terms & Conditions are governed by the laws of India.',
      'Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.',
      'We encourage amicable resolution and will attempt mediation before any formal legal proceedings.',
    ],
  },
];

export default function TermsConditionsScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)','rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)','rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)','rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)','rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)']}
          locations={[0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.gradientBar}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <Text style={styles.headerSub}>Last updated: June 11, 2026</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro card */}
        <View style={styles.introCard}>
          <View style={styles.introIconBox}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color="#7B2CBF" />
          </View>
          <Text style={styles.introText}>
            By registering and using the Nexus Training platform, you agree to be bound by the following Terms & Conditions. Please read them carefully before accessing any course content or services.
          </Text>
        </View>

        {SECTIONS.map((sec, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: sec.iconBg }]}>{sec.icon}</View>
              <Text style={styles.cardTitle}>{sec.title}</Text>
            </View>
            {sec.points.map((pt, i) => (
              <View key={i} style={styles.pointRow}>
                <View style={styles.bullet} />
                <Text style={styles.pointText}>{pt}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Acknowledgement banner */}
        <View style={styles.ackBanner}>
          <Text style={styles.ackText}>
            By continuing to use Nexus Training, you acknowledge that you have read, understood, and agree to these{' '}
            <Text style={styles.ackLink}>Terms & Conditions</Text>.
          </Text>
        </View>

        {/* Questions card */}
        <LinearGradient
          colors={['#FAF5FF', '#EEF2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="mail-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Questions?</Text>
          </View>
          <Text style={styles.questionsText}>
            If you have any questions about these terms, please reach out to us:
          </Text>
          <Text style={styles.emailText}>legal@nexustraining.com</Text>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  gradientBar: { height: 3, borderRadius: 2, marginBottom: 6 },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginRight: 14 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  scroll: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: {
    padding: 20,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  introIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center',
  },
  introText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF', marginTop: 6, marginRight: 10, flexShrink: 0 },
  pointText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 20 },
  ackBanner: {
    backgroundColor: '#7B2CBF', borderRadius: 16, padding: 18, marginBottom: 14,
  },
  ackText: { color: '#FFF', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  ackLink: { fontWeight: '700', textDecorationLine: 'underline' },
  questionsText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  emailText: { fontSize: 14, fontWeight: '700', color: '#7B2CBF' },
});
