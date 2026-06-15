import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AdminHelpSupportScreenProps {
  onBack: () => void;
}

interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export default function AdminHelpSupportScreen({ onBack }: AdminHelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const faqs: FaqItem[] = [
    { id: '1', q: 'How do I create a new course?', a: 'Navigate to the "Courses" tab in the bottom bar and click the orange "+" button in the top right. Fill out the Course Title, pricing, and timetable schedule, then click "Create Course".' },
    { id: '2', q: 'Can I bulk import students/teachers?', a: 'Yes. Go to Settings > Database Backup or import features in the web console to upload CSV templates containing student/teacher datasets.' },
    { id: '3', q: 'How do I generate enrollment reports?', a: 'Comprehensive PDF/Excel enrollment stats are available on the web portal reports dashboard.' },
    { id: '4', q: 'Where can I view revenue analytics?', a: 'Detailed graphical breakdown of the ₹12.5L revenue metric can be accessed in the billing module in web administration portal.' },
    { id: '5', q: 'Can I export student data?', a: 'Yes. Export actions are found in the students directory by selecting target rows or clicking "Export Selected" button.' },
    { id: '6', q: 'System is running slow, what should I do?', a: 'Verify the server status (99.9% uptime). If slow response persists, clear cache or perform db optimization tasks.' },
    { id: '7', q: 'How do I enable maintenance mode?', a: 'Go to Profile > System Settings and toggle the "Maintenance Mode" switch. This will block platform access for teachers and students.' },
    { id: '8', q: 'Lost access to admin account?', a: 'Contact primary database developer or super admin support line (+91 9876543200) to reset master credentials.' }
  ];

  const filteredFaqs = faqs.filter(
    faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for FAQs..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('Tutorial', 'Launching Administrator portal quick guide...')}>
            <Ionicons name="play-circle-outline" size={16} color="#7B2CBF" />
            <Text style={styles.quickActionBtnText}>Launch Tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => Alert.alert('Documentation', 'Opening system manual documentation...')}>
            <Ionicons name="book-outline" size={16} color="#7B2CBF" />
            <Text style={styles.quickActionBtnText}>Read Docs</Text>
          </TouchableOpacity>
        </View>

        {/* CONTACT SUPPORT CARDS */}
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <View style={styles.contactContainer}>
          {/* Live Chat */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#7B2CBF" />
              </View>
              <View style={styles.contactTextCol}>
                <Text style={styles.contactLabel}>Live Chat</Text>
                <Text style={styles.contactDesc}>Chat with support team</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Live Chat', 'Connecting to support operator...')}>
              <Text style={styles.contactBtnText}>Start Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Email Support */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="mail-outline" size={20} color="#0369A1" />
              </View>
              <View style={styles.contactTextCol}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactDesc}>support@nexus.com</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Email Support', 'Opening mail client to send support inquiry...')}>
              <Text style={styles.contactBtnText}>Send Email</Text>
            </TouchableOpacity>
          </View>

          {/* Priority Call */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="call-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.contactTextCol}>
                <Text style={styles.contactLabel}>Priority Support</Text>
                <Text style={styles.contactDesc}>+91 9876543200</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Priority Call', 'Placing call to dedicated helpline...')}>
              <Text style={styles.contactBtnText}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ ACCORDIONS */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeaderRow}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#4B5563"
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* DOCUMENTATION LINKS */}
        <Text style={styles.sectionTitle}>Documentation & Resources</Text>
        <View style={styles.cardContainer}>
          {[
            { label: 'Admin User Guide', icon: 'document-text-outline' },
            { label: 'Video Tutorials', icon: 'videocam-outline' },
            { label: 'System Documentation', icon: 'terminal-outline' },
            { label: 'Admin Community Forum', icon: 'chatbox-ellipses-outline' },
            { label: 'API Documentation', icon: 'code-slash-outline' },
            { label: 'Release Notes', icon: 'newspaper-outline' }
          ].map((item, idx, arr) => (
            <TouchableOpacity
              key={idx}
              style={[styles.linkRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('Resource', `Opening ${item.label}...`)}
            >
              <Ionicons name={item.icon as any} size={16} color="#4B5563" style={styles.linkIcon} />
              <Text style={styles.linkLabel}>{item.label}</Text>
              <Ionicons name="open-outline" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* SUPPORT HOURS INFO BANNER */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>Priority Support Hours</Text>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Monday - Friday</Text>
            <Text style={styles.hoursVal}>24/7 Available</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Saturday - Sunday</Text>
            <Text style={styles.hoursVal}>24/7 Available</Text>
          </View>
          <View style={styles.avgTimeBlock}>
            <Text style={styles.avgTimeText}>Average response time: 15 minutes</Text>
          </View>
        </View>

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
  // Search FAQs
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    height: '100%',
  },
  // Quick action buttons
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E8DFFA',
    borderRadius: 12,
    flex: 1,
    height: 40,
    gap: 6,
  },
  quickActionBtnText: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  // Support options cards
  contactContainer: {
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTextCol: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  contactDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  contactBtn: {
    backgroundColor: '#7B2CBF',
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // FAQ accordion
  faqList: {
    gap: 10,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  // Resource links
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkIcon: {
    marginRight: 10,
  },
  linkLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  // Hours banner
  hoursCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  hoursTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hoursLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  hoursVal: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  avgTimeBlock: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    alignItems: 'center',
  },
  avgTimeText: {
    fontSize: 11,
    color: '#7B2CBF',
    fontWeight: 'bold',
  },
});
