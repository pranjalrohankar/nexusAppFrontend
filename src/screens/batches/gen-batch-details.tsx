import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BatchInfoScreen from './batch-info-screen';

export const availableBatches = [
  {
    id: 'b1',
    title: 'Data Science & Machine Learning',
    subtitle: 'Batch A - Evening',
    badges: [
      { text: 'Filling Fast', type: 'warning', bg: '#F97316', color: '#FFF' },
      { text: 'Data Science', type: 'category', bg: '#F3E8FF', color: '#7B2CBF' }
    ],
    startDate: 'June 15, 2026',
    duration: '3 Months',
    instructor: 'Priya Sharma',
    schedule: 'Mon, Wed, Fri - 6:00 PM',
  },
  {
    id: 'b2',
    title: 'Full Stack Web Development',
    subtitle: 'Batch B - Morning',
    badges: [
      { text: 'Open', type: 'success', bg: '#22C55E', color: '#FFF' },
      { text: 'Web Development', type: 'category', bg: '#F3E8FF', color: '#7B2CBF' }
    ],
    startDate: 'June 20, 2026',
    duration: '4 Months',
    instructor: 'Rajesh Kumar',
    schedule: 'Tue, Thu, Sat - 10:00 AM',
  },
  {
    id: 'b3',
    title: 'UI/UX Design Mastery',
    subtitle: 'Batch C - Evening',
    badges: [
      { text: 'Last Seats', type: 'danger', bg: '#EF4444', color: '#FFF' },
      { text: 'Design', type: 'category', bg: '#F3E8FF', color: '#7B2CBF' }
    ],
    startDate: 'June 18, 2026',
    duration: '3 Months',
    instructor: 'Amit Verma',
    schedule: 'Mon, Thu - 6:00 PM',
  },
  {
    id: 'b4',
    title: 'Digital Marketing Bootcamp',
    subtitle: 'Batch D - Weekend',
    badges: [
      { text: 'Open', type: 'success', bg: '#22C55E', color: '#FFF' },
      { text: 'Marketing', type: 'category', bg: '#F3E8FF', color: '#7B2CBF' }
    ],
    startDate: 'June 22, 2026',
    duration: '2 Months',
    instructor: 'Neha Gupta',
    schedule: 'Sat, Sun - 11:00 AM',
  }
];

interface GenBatchDetailsProps {
  onBack: () => void;
  onEnrollSuccess?: (batch: typeof availableBatches[0]) => void;
}

export default function GenBatchDetails({ onBack, onEnrollSuccess }: GenBatchDetailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<typeof availableBatches[0] | null>(null);

  if (selectedBatch) {
    return (
      <BatchInfoScreen 
        onBack={() => setSelectedBatch(null)} 
        onEnrollSuccess={onEnrollSuccess}
        batch={selectedBatch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#FFF" />
                <View style={styles.badgeDot} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerTitle}>Upcoming Batches</Text>
          <Text style={styles.headerSubtitle}>Enroll in new courses starting soon</Text>
          
          {/* SEARCH BAR (Overlapping style in original, here just inside header) */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search batches..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.bodyBackground}>
          {/* STATS ROW */}
          <View style={styles.statsContainer}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#7B2CBF' }]}>6</Text>
              <Text style={styles.statLabel}>Batches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>3</Text>
              <Text style={styles.statLabel}>Open</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#F97316' }]}>104</Text>
              <Text style={styles.statLabel}>Seats Left</Text>
            </View>
          </View>

          {/* LIST HEADER */}
          <Text style={styles.listTitle}>Available Batches ({availableBatches.length})</Text>

          {/* CARDS */}
          <View style={styles.listContainer}>
          {availableBatches
            .filter(batch => batch.title.toLowerCase().includes(searchQuery.toLowerCase()) || batch.instructor.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((batch) => (
            <View key={batch.id} style={styles.batchCard}>
              <Text style={styles.batchTitle}>{batch.title}</Text>
              <Text style={styles.batchSubtitle}>{batch.subtitle}</Text>
              
              <View style={styles.badgesRow}>
                {batch.badges.map((badge, idx) => (
                  <View key={idx} style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <View style={styles.infoIconRow}>
                    <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.infoLabel}>Start Date</Text>
                  </View>
                  <Text style={styles.infoValue}>{batch.startDate}</Text>
                </View>
                <View style={styles.infoCol}>
                  <View style={styles.infoIconRow}>
                    <Ionicons name="pie-chart-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.infoLabel}>Duration</Text>
                  </View>
                  <Text style={styles.infoValue}>{batch.duration}</Text>
                </View>
              </View>

              <View style={styles.instructorSection}>
                <View style={styles.infoCol}>
                  <Text style={styles.instructorLabel}>Instructor</Text>
                  <Text style={styles.instructorValue}>{batch.instructor}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.scheduleLabel}>Schedule</Text>
                  <Text style={styles.scheduleValue}>{batch.schedule}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => {
                  setSelectedBatch(batch);
                }}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={{ height: 20 }} />
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
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 64, // Increased to prevent search bar overlap
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
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
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 100, // For bottom tabs
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bodyBackground: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -46, // Overlaps the purple header
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  listContainer: {
    gap: 16,
  },
  batchCard: {
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
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  batchSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 20, // Align under label
  },
  instructorSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 16,
  },
  instructorLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  instructorValue: {
    color: '#1F2937',
    fontWeight: '600',
  },
  scheduleLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  scheduleValue: {
    color: '#1F2937',
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#7B2CBF',
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
