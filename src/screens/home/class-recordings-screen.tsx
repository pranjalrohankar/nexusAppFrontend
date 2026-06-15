import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface RecordingItem {
  id: string;
  title: string;
  teacher: string;
  category: string;
  date: string;
  duration: string;
  views: string;
  fileSize: string;
  themeColor: string;
}

interface ClassRecordingsScreenProps {
  onBack: () => void;
}

const recordingsData: RecordingItem[] = [
  {
    id: '1',
    title: 'Introduction to React Hooks',
    teacher: 'Prof. Sarah Johnson',
    category: 'Advanced Web Technologies',
    date: 'Nov 20, 2024',
    duration: '1:45:20',
    views: '245 views',
    fileSize: '850 MB',
    themeColor: '#8B5CF6',
  },
  {
    id: '2',
    title: 'State Management with Redux',
    teacher: 'Prof. Sarah Johnson',
    category: 'Advanced Web Technologies',
    date: 'Nov 18, 2024',
    duration: '2:10:15',
    views: '199 views',
    fileSize: '1.2 GB',
    themeColor: '#6366F1',
  },
  {
    id: '3',
    title: 'Neural Networks Fundamentals',
    teacher: 'Dr. Michael Chen',
    category: 'Machine Learning Basics',
    date: 'Nov 17, 2024',
    duration: '1:55:45',
    views: '312 views',
    fileSize: '950 MB',
    themeColor: '#FFB703',
  },
  {
    id: '4',
    title: 'Building REST APIs',
    teacher: 'Dr. James Wilson',
    category: 'Node.js Backend Development',
    date: 'Nov 15, 2024',
    duration: '3:05:20',
    views: '278 views',
    fileSize: '1.1 GB',
    themeColor: '#10B981',
  },
  {
    id: '5',
    title: 'Docker and Containerization',
    teacher: 'Prof. Lisa Anderson',
    category: 'DevOps & CI/CD',
    date: 'Nov 13, 2024',
    duration: '1:40:10',
    views: '189 views',
    fileSize: '780 MB',
    themeColor: '#3B82F6',
  },
  {
    id: '6',
    title: 'Advanced CSS Animations',
    teacher: 'Prof. Emily Davis',
    category: 'React & Modern Frontend',
    date: 'Nov 12, 2024',
    duration: '1:33:25',
    views: '234 views',
    fileSize: '650 MB',
    themeColor: '#EC4899',
  },
  {
    id: '7',
    title: 'GraphQL Query Optimization',
    teacher: 'Dr. Robert Taylor',
    category: 'API Design & Development',
    date: 'Nov 10, 2024',
    duration: '1:50:35',
    views: '166 views',
    fileSize: '890 MB',
    themeColor: '#8B5CF6',
  },
  {
    id: '8',
    title: 'Data Visualization with D3.js',
    teacher: 'Dr. Kevin Brown',
    category: 'Data Science with Python',
    date: 'Nov 8, 2024',
    duration: '2:18:40',
    views: '287 views',
    fileSize: '1.3 GB',
    themeColor: '#10B981',
  },
];

const filterCategories = [
  'All',
  'UI/UX',
  'Advanced Web Technologies',
  'Machine Learning Basics',
  'Node.js Backend Development',
  'DevOps & CI/CD',
  'React & Modern Frontend',
  'API Design & Development',
  'Data Science with Python',
];

export default function ClassRecordingsScreen({ onBack }: ClassRecordingsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter recordings based on search query and category
  const filteredRecordings = recordingsData.filter((rec) => {
    const matchesCategory = selectedCategory === 'All' || rec.category === selectedCategory;
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: Platform.OS === 'web' ? 1200 : undefined, alignSelf: 'center' }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Class Recordings</Text>
          <Text style={styles.headerSubtitle}>Watch previous lectures anytime</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SEARCH & FILTERS BOX */}
        <View style={styles.searchContainer}>
          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recordings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Chips categories */}
          <View style={styles.chipsWrapper}>
            <TouchableOpacity style={styles.filterIconButton}>
              <Ionicons name="funnel-outline" size={18} color="#7B2CBF" />
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollContent}
            >
              {filterCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* LIST OF RECORDINGS */}
        <View style={styles.listContainer}>
          {filteredRecordings.length > 0 ? (
            filteredRecordings.map((recording) => (
              <View key={recording.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  {/* Left: Custom Video Player Thumbnail */}
                  <View style={styles.thumbnailContainer}>
                    {/* Dark rounded square thumbnail */}
                    <View style={styles.thumbnail}>
                      {/* Play circle */}
                      <View style={styles.playCircle}>
                        <Ionicons name="play" size={14} color="#1F2937" style={styles.playArrow} />
                      </View>
                      {/* Tiny color badge on bottom-left for visual premium detail */}
                      <View style={[styles.thumbnailBadge, { backgroundColor: recording.themeColor }]} />
                    </View>
                  </View>

                  {/* Right: Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {recording.title}
                    </Text>
                    <Text style={styles.cardTeacher}>{recording.teacher}</Text>
                    
                    {/* Category Label */}
                    <View style={styles.categoryLabelRow}>
                      <Ionicons name="book-outline" size={12} color="#7B2CBF" />
                      <Text style={styles.categoryLabelText}>{recording.category}</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                        <Text style={styles.statText}>{recording.date}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={12} color="#6B7280" />
                        <Text style={styles.statText}>{recording.duration}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="play-circle-outline" size={12} color="#6B7280" />
                        <Text style={styles.statText}>{recording.views}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Bottom action button */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.watchNowButton} activeOpacity={0.8}>
                    <Ionicons name="play" size={14} color="#FFF" style={styles.buttonIcon} />
                    <Text style={styles.watchNowText}>Watch Now</Text>
                  </TouchableOpacity>
                  <Text style={styles.fileSizeText}>File size: {recording.fileSize}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No recordings found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search query or filters.</Text>
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: Platform.OS === 'android' ? 12 : 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  // Search & Filter container
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: -24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  chipsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  chipsScrollContent: {
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  // List items
  listContainer: {
    gap: 16,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: Platform.OS === 'web' ? 'wrap' : 'nowrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    width: Platform.OS === 'web' ? '48.5%' : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnailContainer: {
    justifyContent: 'flex-start',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#8B939E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  playArrow: {
    marginLeft: 2,
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 20,
  },
  cardTeacher: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  categoryLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#6B7280',
  },
  // Card Footer Action
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 14,
    paddingTop: 12,
    alignItems: 'center',
  },
  watchNowButton: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 40,
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonIcon: {
    marginTop: 0,
  },
  watchNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fileSizeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Empty state
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
