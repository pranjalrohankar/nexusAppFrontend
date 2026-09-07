import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1];

interface AdminHelpSupportScreenProps {
  onBack: () => void;
}

const FAQ_CATEGORIES = [
  {
    category: 'SYSTEM MANAGEMENT',
    items: [
      {
        id: 's1',
        q: 'How do I add new teachers or students?',
        a: 'Go to the Users tab in the bottom navigation. Tap the "+" button at the top right, select the role (Teacher or Student), fill in the required details such as name, email, phone, and course, then tap "Create". Login credentials will be automatically emailed to the user.',
      },
      {
        id: 's2',
        q: 'How do I create a new course?',
        a: 'Navigate to the Courses tab and tap the orange "+" button. Enter the course title, description, duration, pricing, class timings, and set the status to Active. Tap "Create Course" to save. The course will immediately appear in the student portal.',
      },
      {
        id: 's3',
        q: 'Can I bulk import students/teachers?',
        a: 'Bulk import is available via the web admin console. Go to Settings > Import Data and upload a CSV file using the provided template. Ensure all required fields (name, email, role, course) are filled before uploading. The system will validate and create accounts automatically.',
      },
    ],
  },
  {
    category: 'REPORTS & ANALYTICS',
    items: [
      {
        id: 'r1',
        q: 'How do I generate enrollment reports?',
        a: 'From the Admin Dashboard, scroll to the Recent Enrollments section to view the latest 5 enrollments. For full reports, go to the Users tab, select a student, and view their enrollment history. Detailed PDF/Excel exports are available in the web admin portal under Reports.',
      },
      {
        id: 'r2',
        q: 'Where can I view revenue analytics?',
        a: 'The Admin Dashboard displays total revenue calculated from all active course prices. For a detailed breakdown by course, batch, or time period, visit the web administration portal under Billing & Revenue. Graphical analytics with monthly trends are available there.',
      },
      {
        id: 'r3',
        q: 'Can I export student data?',
        a: 'Yes. In the Users tab, you can view all student records. For bulk export, use the web admin portal where you can filter by course, batch, or enrollment date and export as CSV or Excel. Individual student profiles can be printed directly from the app.',
      },
    ],
  },
  {
    category: 'TECHNICAL SUPPORT',
    items: [
      {
        id: 't1',
        q: 'System is running slow, what should I do?',
        a: 'First, check your internet connection. If the issue persists, try force-closing and reopening the app. The backend runs on a Supabase PostgreSQL instance — if server response is slow, it may be due to connection pool limits on the free tier. Contact technical support if the issue continues for more than 10 minutes.',
      },
      {
        id: 't2',
        q: 'How do I enable maintenance mode?',
        a: 'Go to Profile > System Settings and toggle the "Maintenance Mode" switch to ON. This will display a maintenance notice to all teachers and students attempting to log in. Remember to turn it OFF once maintenance is complete to restore normal access.',
      },
      {
        id: 't3',
        q: 'Lost access to admin account?',
        a: 'If you cannot log in to the admin account, contact the system developer to reset the admin credentials directly in the database. For security, admin password resets are not available through the self-service portal. Reach out via support@nexus.com or call +91 9876543200 for immediate assistance.',
      },
    ],
  },
];

export default function AdminHelpSupportScreen({ onBack }: AdminHelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const filtered = searchQuery.trim()
    ? FAQ_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : FAQ_CATEGORIES;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentLine} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
        {/* Search bar inside header */}
        <View style={styles.searchBox}>
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ SECTION */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {filtered.map((cat, ci) => (
          <View key={ci} style={styles.categoryCard}>
            {/* Category header */}
            <Text style={styles.categoryLabel}>{cat.category}</Text>

            {cat.items.map((item, ii) => {
              const isExpanded = expandedId === item.id;
              const isLast = ii === cat.items.length - 1;
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[styles.faqRow, isLast && !isExpanded && { borderBottomWidth: 0 }]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQ}>{item.q}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={[styles.answerBox, isLast && { borderBottomWidth: 0 }]}>
                      <Text style={styles.answerText}>{item.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* PRIORITY SUPPORT HOURS */}
        <LinearGradient
          colors={['#F9FAFB', 'rgba(250,245,255,0.6)', 'rgba(255,247,237,0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hoursCard}
        >
          <Text style={styles.hoursTitle}>Priority Support Hours</Text>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Monday - Friday</Text>
            <Text style={styles.hoursVal}>24/7 Available</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Saturday - Sunday</Text>
            <Text style={styles.hoursVal}>24/7 Available</Text>
          </View>
          <View style={styles.avgRow}>
            <Text style={styles.avgText}>
              Average response time:{' '}
              <Text style={styles.avgHighlight}>15 minutes</Text>
            </Text>
          </View>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },

  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  accentLine: { height: 4, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    borderWidth: 0,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ outline: 'none', boxShadow: 'none' } as any) : {}),
  },

  scroll: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },

  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  answerBox: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  answerText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 19,
    paddingTop: 2,
  },

  // Priority Support Hours card
  hoursCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 4,
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  hoursLabel: { fontSize: 13, color: '#6B7280' },
  hoursVal: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  avgRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  avgText: { fontSize: 12, color: '#6B7280' },
  avgHighlight: { color: '#7B2CBF', fontWeight: 'bold' },
});
