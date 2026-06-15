import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HelpSupportScreenProps {
  onBack: () => void;
}

export default function HelpSupportScreen({ onBack }: HelpSupportScreenProps) {
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!fullName || !emailAddress || !phoneNumber || !subject || !message) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    Alert.alert('Success', 'Your message has been sent successfully. We will get back to you soon!');
    // Reset form
    setFullName('');
    setEmailAddress('');
    setPhoneNumber('');
    setSubject('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER BANNER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help and Support</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CONTACT OPTIONS GRID */}
        <View style={styles.gridContainer}>
          {/* Card 1: Phone */}
          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="call" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.gridLabel}>Phone</Text>
            <Text style={styles.gridValue}>+91 9876543210</Text>
            <Text style={styles.gridValue}>+91 9876543211</Text>
          </View>

          {/* Card 2: Email */}
          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="mail" size={20} color="#10B981" />
            </View>
            <Text style={styles.gridLabel}>Email</Text>
            <Text style={styles.gridValue}>info@nexusctc.com</Text>
            <Text style={styles.gridValue}>support@nexusctc.com</Text>
          </View>

          {/* Card 3: Address */}
          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="location" size={20} color="#7B2CBF" />
            </View>
            <Text style={styles.gridLabel}>Address</Text>
            <Text style={styles.gridValue}>123 Business Park</Text>
            <Text style={styles.gridValue}>Bangalore, Karnataka 560001</Text>
          </View>

          {/* Card 4: Hours */}
          <View style={styles.gridCard}>
            <View style={[styles.gridIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={20} color="#FF7A00" />
            </View>
            <Text style={styles.gridLabel}>Hours</Text>
            <Text style={styles.gridValue}>Mon - Sat: 9:00 AM - 6:00 PM</Text>
            <Text style={styles.gridValue}>Sunday: Closed</Text>
          </View>
        </View>

        {/* 3. COMMUNICATION ACTIONS ROW */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.callNowButton} activeOpacity={0.8}>
            <Ionicons name="call" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton} activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* 4. SEND US A MESSAGE FORM */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send us a Message</Text>

          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />

          {/* Email Address */}
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            value={emailAddress}
            onChangeText={setEmailAddress}
          />

          {/* Phone Number */}
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="+91 9876543210"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          {/* Subject */}
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Course Inquiry"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
          />

          {/* Message */}
          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Tell us about your training needs..."
            placeholderTextColor="#9CA3AF"
            multiline={true}
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          {/* Send Button */}
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} activeOpacity={0.8}>
            <Ionicons name="send" size={16} color="#FFF" style={styles.sendIcon} />
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* 5. MAP LOCATION CARD */}
        <View style={styles.mapCard}>
          <View style={styles.mapIconCircle}>
            <Ionicons name="location" size={24} color="#4B5563" />
          </View>
          <Text style={styles.mapTitle}>Map Location</Text>
          <Text style={styles.mapSubtitle}>123 Business Park, Bangalore</Text>
        </View>

        {/* Bottom Spacer */}
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
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  // Contact Options Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  gridValue: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  // Call / WhatsApp Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  callNowButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Send Us A Message Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    marginTop: 20,
    gap: 8,
  },
  sendIcon: {
    marginTop: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Map Location Card
  mapCard: {
    backgroundColor: '#ECEFF1',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  mapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  mapSubtitle: {
    fontSize: 12,
    color: '#546E7A',
    marginTop: 2,
    fontWeight: '500',
  },
});
