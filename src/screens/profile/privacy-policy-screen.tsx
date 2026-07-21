import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Props { onBack: () => void; }

const SECTIONS = [
  {
    icon: <Ionicons name="eye-outline" size={22} color="#3B82F6" />,
    iconBg: '#EFF6FF',
    title: 'Information We Collect',
    items: [
      { title: 'Personal Information', text: 'We collect information you provide when registering, such as your full name, email address, phone number, date of birth, and profile photograph.' },
      { title: 'Academic Data', text: 'We collect data related to your enrolled courses, batch assignments, attendance records, test scores, and progress reports to provide you a personalised learning experience.' },
      { title: 'Device & Usage Data', text: 'We automatically collect information about the device you use to access our platform, including IP address, browser type, operating system, and pages visited.' },
    ],
  },
  {
    icon: <MaterialCommunityIcons name="database-outline" size={22} color="#7B2CBF" />,
    iconBg: '#F3E8FF',
    title: 'How We Use Your Information',
    items: [
      { title: 'Platform Operations', text: 'To create and manage your student account, deliver course content, track attendance, and provide access to recordings and study materials.' },
      { title: 'Communication', text: 'To send you important notifications about class schedules, new study materials, batch updates, fee reminders, and platform announcements.' },
      { title: 'Improvement & Analytics', text: 'To analyse usage patterns, identify technical issues, and improve the quality of our courses, platform features, and user experience.' },
    ],
  },
  {
    icon: <MaterialCommunityIcons name="share-variant-outline" size={22} color="#FF7A00" />,
    iconBg: '#FFF7ED',
    title: 'Sharing of Information',
    items: [
      { title: 'With Instructors', text: 'Your name, attendance, and academic performance may be visible to your assigned teachers and batch coordinators to facilitate effective teaching.' },
      { title: 'With Service Providers', text: 'We may share data with trusted third-party service providers (e.g., payment gateways, cloud hosting) who assist in operating our platform under strict confidentiality agreements.' },
      { title: 'Legal Obligations', text: 'We may disclose information when required by law, court order, or to protect the rights, property, or safety of our students, staff, or the public.' },
    ],
  },
  {
    icon: <Ionicons name="lock-closed-outline" size={22} color="#10B981" />,
    iconBg: '#ECFDF5',
    title: 'Data Security',
    items: [
      { title: 'Encryption', text: 'All data transmitted between your device and our servers is protected using industry-standard SSL/TLS encryption.' },
      { title: 'Access Controls', text: 'Access to student data is restricted to authorised personnel only. We enforce role-based access controls and regularly audit access logs.' },
      { title: 'Data Retention', text: 'We retain your personal data for the duration of your enrolment and for up to 3 years thereafter for academic record purposes, unless you request deletion.' },
    ],
  },
  {
    icon: <Ionicons name="notifications-outline" size={22} color="#F59E0B" />,
    iconBg: '#FFFBEB',
    title: 'Cookies & Tracking',
    items: [
      { title: 'Essential Cookies', text: 'We use essential cookies to keep you logged in and maintain your session preferences. These cannot be disabled as they are required for the platform to function.' },
      { title: 'Analytics Cookies', text: 'With your consent, we use analytics cookies to understand how students interact with the platform and to improve our services.' },
    ],
  },
  {
    icon: <MaterialCommunityIcons name="account-outline" size={22} color="#7B2CBF" />,
    iconBg: '#F3E8FF',
    title: 'Your Rights',
    items: [
      { title: 'Access & Correction', text: 'You have the right to access the personal information we hold about you and request corrections to any inaccurate data through your profile settings.' },
      { title: 'Data Deletion', text: 'You may request deletion of your personal account and associated data. Note that academic records required for certification may be retained as per institutional policy.' },
      { title: 'Opt-Out', text: 'You may opt out of non-essential communications such as promotional emails and platform newsletters at any time via your notification settings.' },
    ],
  },
];

export default function PrivacyPolicyScreen({ onBack }: Props) {
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSub}>Last updated: June 11, 2026</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro card */}
        <View style={styles.card}>
          <View style={styles.introRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="shield-account-outline" size={22} color="#7B2CBF" />
            </View>
            <Text style={styles.introText}>
              Nexus Training Institute ("we", "us", or "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard the personal information of students using our platform.
            </Text>
          </View>
        </View>

        {SECTIONS.map((sec, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: sec.iconBg }]}>{sec.icon}</View>
              <Text style={styles.cardTitle}>{sec.title}</Text>
            </View>
            {sec.items.map((item, i) => (
              <View key={i} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact Us card */}
        <LinearGradient colors={['#FAF5FF', '#EEF2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="mail-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Contact Us</Text>
          </View>
          <Text style={styles.itemText}>
            If you have any questions about this Privacy Policy or wish to exercise your rights, please contact our Data Protection Officer:
          </Text>
          <Text style={styles.contactEmail}>privacy@nexustraining.com</Text>
          <Text style={styles.contactAddress}>Nexus Training Institute, 4th Floor, Knowledge Tower, Bengaluru – 560001, India</Text>
        </LinearGradient>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          We may update this policy from time to time. Continued use of the platform after changes constitutes acceptance.
        </Text>

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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  introText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  itemBlock: { marginBottom: 14 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  itemText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  contactEmail: { fontSize: 14, fontWeight: '700', color: '#7B2CBF', marginTop: 12 },
  contactAddress: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginTop: 4 },
  footerNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8, marginBottom: 8 },
});
