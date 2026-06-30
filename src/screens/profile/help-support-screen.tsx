import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Institution contact constants — change these when the institution details change
const SUPPORT_PHONE_1 = '+91 9545450788';
const SUPPORT_PHONE_2 = '+91 9545450677';
const SUPPORT_EMAIL_1 = 'info@nexusctc.com';
const SUPPORT_EMAIL_2 = 'support@nexusctc.com';
const SUPPORT_ADDRESS = 'Office No. 4-B, Second Floor, Ganesham Commercial -A, Pimple Saudagar, Pune - 411027';
const SUPPORT_HOURS = 'Mon – Sat: 9:00 AM – 6:00 PM';
const SUPPORT_HOURS_2 = 'Sunday: Closed';

const FAQ_SECTIONS = [
  {
    title: 'TEACHING TOOLS',
    items: [
      'How do I update Google Meet links?',
      'How do I view student progress?',
      'Can I reschedule a class?',
    ],
  },
  {
    title: 'STUDENT MANAGEMENT',
    items: [
      'How do I message students?',
      'How do I track attendance?',
      'What if a student is inactive?',
    ],
  },
  {
    title: 'ACCOUNT & SETTINGS',
    items: [
      'How do I update my profile?',
      'How do I change notification preferences?',
      'Can I add more courses?',
    ],
  },
];

interface HelpSupportScreenProps {
  onBack: () => void;
  teacherProfile?: any;
}

export default function HelpSupportScreen({ onBack, teacherProfile }: HelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState(teacherProfile?.name ?? '');
  const [emailAddress, setEmailAddress] = useState(teacherProfile?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(teacherProfile?.phone ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!fullName || !emailAddress || !subject || !message) {
      Alert.alert('Error', 'Please fill in Name, Email, Subject and Message.');
      return;
    }
    Alert.alert('Success', 'Your message has been sent. We will get back to you shortly!');
    setSubject('');
    setMessage('');
  };

  const handleCall = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE_1.replace(/\s/g, '')}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const number = SUPPORT_PHONE_1.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${number}`).catch(() => {});
  };

  const filteredFaq = FAQ_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
        {/* Search bar in header */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ SECTION — shown when searching or always */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {filteredFaq.map((section, si) => (
          <View key={si} style={styles.faqCard}>
            <Text style={styles.faqCategoryTitle}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.faqItem, ii === section.items.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => Alert.alert(item, 'Contact support for detailed assistance.')}
              >
                <Text style={styles.faqItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* CONTACT CARDS */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Contact Us</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="call" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.gridLabel}>Phone</Text>
            <Text style={styles.gridValue}>{SUPPORT_PHONE_1}</Text>
            <Text style={styles.gridValue}>{SUPPORT_PHONE_2}</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="mail" size={20} color="#10B981" />
            </View>
            <Text style={styles.gridLabel}>Email</Text>
            <Text style={styles.gridValue}>{SUPPORT_EMAIL_1}</Text>
            <Text style={styles.gridValue}>{SUPPORT_EMAIL_2}</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="location" size={20} color="#7B2CBF" />
            </View>
            <Text style={styles.gridLabel}>Address</Text>
            <Text style={styles.gridValue}>{SUPPORT_ADDRESS}</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={20} color="#FF7A00" />
            </View>
            <Text style={styles.gridLabel}>Hours</Text>
            <Text style={styles.gridValue}>{SUPPORT_HOURS}</Text>
            <Text style={styles.gridValue}>{SUPPORT_HOURS_2}</Text>
          </View>
        </View>

        {/* CALL / WHATSAPP BUTTONS */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.callNowButton} onPress={handleCall} activeOpacity={0.8}>
            <Ionicons name="call" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* SEND MESSAGE FORM — pre-filled from teacher profile */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send us a Message</Text>

          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            value={emailAddress}
            onChangeText={setEmailAddress}
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your phone"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="How can we help?"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your issue..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} activeOpacity={0.8}>
            <Ionicons name="send" size={16} color="#FFF" />
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    width: '100%', maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined, alignSelf: 'center',
  },
  backButton: { padding: 4 },
  headerTitle: {
    color: '#FFFFFF', fontSize: 20, fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginLeft: 16,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 14, height: 44,
    width: '100%', maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined, alignSelf: 'center',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: {
    padding: 20, width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined, alignSelf: 'center',
  },
  bottomSpacer: { height: 100 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  // FAQ
  faqCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, marginBottom: 12,
  },
  faqCategoryTitle: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 },
  faqItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  faqItemText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1, paddingRight: 8 },
  // Contact cards
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: 12, marginBottom: 20,
  },
  gridCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, width: '48%',
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 6, elevation: 2,
  },
  gridIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  gridValue: { fontSize: 11, color: '#4B5563', lineHeight: 16, fontWeight: '500' },
  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  callNowButton: {
    flex: 1, backgroundColor: '#10B981', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 48, gap: 8,
  },
  whatsappButton: {
    flex: 1, backgroundColor: '#3B82F6', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 48, gap: 8,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  // Form
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 3, marginBottom: 24,
  },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12 },
  textInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    height: 44, paddingHorizontal: 12, fontSize: 13, color: '#1F2937', backgroundColor: '#F9FAFB',
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  sendButton: {
    backgroundColor: '#7B2CBF', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 12, height: 48, marginTop: 20, gap: 8,
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
