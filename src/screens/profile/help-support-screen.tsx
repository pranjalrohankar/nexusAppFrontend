import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const SUPPORT_PHONE_1 = '+91 9545450788';
const SUPPORT_PHONE_2 = '+91 9545450677';
const SUPPORT_EMAIL_1 = 'info@nexusctc.com';
const SUPPORT_EMAIL_2 = 'support@nexusctc.com';
const SUPPORT_ADDRESS = 'Office No. 4-B, Second Floor, Ganesham Commercial -A, Pimple Saudagar, Pune - 411027';
const SUPPORT_HOURS = 'Mon – Sat: 9:00 AM – 6:00 PM';
const SUPPORT_HOURS_2 = 'Sunday: Closed';

const GRADIENT_COLORS = ['rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)','rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)','rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)','rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)','rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)'] as const;
const GRADIENT_LOCATIONS = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1] as const;

interface HelpSupportScreenProps {
  onBack: () => void;
  teacherProfile?: any;
}

export default function HelpSupportScreen({ onBack, teacherProfile }: HelpSupportScreenProps) {
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

  const handleCall = () => Linking.openURL(`tel:${SUPPORT_PHONE_1.replace(/\s/g, '')}`).catch(() => {});
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/${SUPPORT_PHONE_1.replace(/[^0-9]/g, '')}`).catch(() => {});

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={GRADIENT_COLORS}
          locations={GRADIENT_LOCATIONS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBar}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help and Support</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* CONTACT US LABEL */}
        <Text style={styles.sectionTitle}>Contact Us</Text>

        {/* 2x2 CONTACT CARDS GRID */}
        <View style={styles.grid}>
          {/* Phone */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="call" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardLabel}>Phone</Text>
            <Text style={styles.cardValue}>{SUPPORT_PHONE_1}</Text>
            <Text style={styles.cardValue}>{SUPPORT_PHONE_2}</Text>
          </View>

          {/* Email */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="mail" size={20} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue}>{SUPPORT_EMAIL_1}</Text>
            <Text style={styles.cardValue}>{SUPPORT_EMAIL_2}</Text>
          </View>

          {/* Address */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="location" size={20} color="#7B2CBF" />
            </View>
            <Text style={styles.cardLabel}>Address</Text>
            <Text style={styles.cardValue}>{SUPPORT_ADDRESS}</Text>
          </View>

          {/* Hours */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={20} color="#FF7A00" />
            </View>
            <Text style={styles.cardLabel}>Hours</Text>
            <Text style={styles.cardValue}>{SUPPORT_HOURS}</Text>
            <Text style={styles.cardValue}>{SUPPORT_HOURS_2}</Text>
          </View>
        </View>

        {/* CALL NOW / WHATSAPP BUTTONS */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
            <Ionicons name="call" size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* SEND US A MESSAGE FORM */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send us a Message</Text>

          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            value={emailAddress}
            onChangeText={setEmailAddress}
          />

          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Course Inquiry"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about your training needs..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} activeOpacity={0.85}>
            <Ionicons name="send" size={16} color="#FFF" />
            <Text style={styles.sendBtnText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  gradientBar: { height: 3, borderRadius: 2, marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: {
    padding: 20,
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    width: '48%',
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  iconBox: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  cardValue: { fontSize: 11, color: '#4B5563', lineHeight: 16 },
  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  callBtn: {
    flex: 1, backgroundColor: '#10B981', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, height: 48, gap: 8,
  },
  whatsappBtn: {
    flex: 1, backgroundColor: '#3B82F6', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, height: 48, gap: 8,
  },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  // Form
  formCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    height: 48, paddingHorizontal: 14, fontSize: 14, color: '#1F2937', backgroundColor: '#F9FAFB',
  },
  textArea: { height: 110, paddingTop: 12, textAlignVertical: 'top' },
  sendBtn: {
    backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 12, height: 52, marginTop: 20, gap: 8,
  },
  sendBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
