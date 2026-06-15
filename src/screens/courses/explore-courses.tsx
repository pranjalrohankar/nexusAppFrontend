import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ExploreCourseItem {
  id: string;
  title: string;
  duration: string;
  students: string;
  rating: string;
  price: string;
  key: string; // Key to match coursesData in index.tsx
}

interface ExploreCoursesProps {
  onBack: () => void;
  onSelectCourse: (courseKey: string) => void;
  coursesList: ExploreCourseItem[];
}

export default function ExploreCourses({ onBack, onSelectCourse, coursesList }: ExploreCoursesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByRating, setSortByRating] = useState(false);

  // Filter courses based on search query
  const filteredCourses = coursesList
    .filter(course =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortByRating) {
        return parseFloat(b.rating) - parseFloat(a.rating);
      }
      return 0; // Maintain original order otherwise
    });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: Platform.OS === 'web' ? 800 : undefined, alignSelf: 'center' }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Explore Courses</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search courses..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity 
                style={[styles.filterIconBadge, sortByRating && styles.filterIconBadgeActive]} 
                onPress={() => setSortByRating(!sortByRating)}
              >
                <Ionicons name="funnel" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* COURSES LIST */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => onSelectCourse(course.key)}
                activeOpacity={0.8}
              >
                {/* Book Icon Left */}
                <View style={styles.iconSquircle}>
                  <Ionicons name="book" size={32} color="#FFFFFF" />
                </View>

                {/* Details Middle */}
                <View style={styles.detailsCol}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>{course.duration}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="people-outline" size={14} color="#6B7280" />
                      <Text style={styles.infoText}>{course.students}</Text>
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFB703" />
                    <Text style={styles.ratingVal}>{course.rating}</Text>
                  </View>
                </View>

                {/* Price Right */}
                <View style={styles.priceCol}>
                  <Text style={styles.priceText}>{course.price}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>{`No courses found matching "${searchQuery}"`}</Text>
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
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  searchRow: {
    flexDirection: 'row',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    height: '100%',
  },
  filterIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconBadgeActive: {
    backgroundColor: '#FFB703',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  listContainer: {
    gap: 12,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconSquircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#E65F2B', // Orange/gold background
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 8,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priceCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65F2B', // Orange/gold color
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
