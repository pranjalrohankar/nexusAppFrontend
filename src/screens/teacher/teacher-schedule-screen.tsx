import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ClassScheduleItem {
  courseTitle: string;
  batchName: string;
  time: string;
  meetLink: string;
}

interface DayAgenda {
  dayName: string;
  classes: ClassScheduleItem[];
}

export default function TeacherScheduleScreen() {

  const timetableData: DayAgenda[] = [
    {
      dayName: 'Monday',
      classes: [
        { courseTitle: 'Data Science & ML', batchName: 'Batch A - Evening', time: '8:00 PM - 9:30 PM', meetLink: 'https://meet.google.com/abc-defg-hij' }
      ]
    },
    {
      dayName: 'Tuesday',
      classes: [
        { courseTitle: 'Full Stack Web Development', batchName: 'Batch B - Morning', time: '10:00 AM - 11:30 AM', meetLink: 'https://meet.google.com/xyz-pqrs-uvw' }
      ]
    },
    {
      dayName: 'Wednesday',
      classes: [
        { courseTitle: 'Data Science & ML', batchName: 'Batch A - Evening', time: '8:00 PM - 9:30 PM', meetLink: 'https://meet.google.com/abc-defg-hij' }
      ]
    },
    {
      dayName: 'Thursday',
      classes: [
        { courseTitle: 'Full Stack Web Development', batchName: 'Batch B - Morning', time: '10:00 AM - 11:30 AM', meetLink: 'https://meet.google.com/xyz-pqrs-uvw' },
        { courseTitle: 'UI/UX Design Mastery', batchName: 'Batch C - Evening', time: '6:00 PM - 7:30 PM', meetLink: 'https://meet.google.com/ui-ux-design-sys' }
      ]
    },
    {
      dayName: 'Friday',
      classes: [
        { courseTitle: 'Data Science & ML', batchName: 'Batch A - Evening', time: '8:00 PM - 9:30 PM', meetLink: 'https://meet.google.com/abc-defg-hij' }
      ]
    },
    {
      dayName: 'Saturday',
      classes: [
        { courseTitle: 'Full Stack Web Development', batchName: 'Batch B - Morning', time: '10:00 AM - 11:30 AM', meetLink: 'https://meet.google.com/xyz-pqrs-uvw' }
      ]
    },
    {
      dayName: 'Sunday',
      classes: []
    }
  ];

  const handleJoinMeet = (course: string, link: string) => {
    Alert.alert('Redirecting', `Opening Google Meet for ${course}:\n${link}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
          ]}
          locations={[0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <Text style={styles.headerTitle}>Weekly Timetable</Text>
        <Text style={styles.headerSubtitle}>Your teaching schedule for the week.</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* WEEK SWITCHER */}
        <View style={styles.weekSwitcher}>
          <TouchableOpacity onPress={() => { }}>
            <Ionicons name="chevron-back" size={20} color="#7B2CBF" />
          </TouchableOpacity>
          <Text style={styles.weekRange}>May 25 - May 31, 2026</Text>
          <TouchableOpacity onPress={() => { }}>
            <Ionicons name="chevron-forward" size={20} color="#7B2CBF" />
          </TouchableOpacity>
        </View>

        {/* WEEK SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{"This Week's Summary"}</Text>
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatVal}>7</Text>
              <Text style={styles.summaryStatLabel}>Classes</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatVal}>14</Text>
              <Text style={styles.summaryStatLabel}>Hours</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatVal}>3</Text>
              <Text style={styles.summaryStatLabel}>Courses</Text>
            </View>
          </View>
        </View>

        {/* TIMETABLE DAYS LIST */}
        <View style={styles.timetableContainer}>
          {timetableData.map((day, idx) => (
            <View key={idx} style={styles.dayCard}>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <View style={styles.dayClassCountBadge}>
                  <Text style={styles.dayClassCountText}>
                    {day.classes.length} {day.classes.length === 1 ? 'class' : 'classes'}
                  </Text>
                </View>
              </View>

              {day.classes.length === 0 ? (
                <View style={styles.freeDayBlock}>
                  <Ionicons name="happy-outline" size={20} color="#9CA3AF" />
                  <Text style={styles.freeDayText}>Free Day - No classes scheduled</Text>
                </View>
              ) : (
                day.classes.map((cls, cIdx) => (
                  <View key={cIdx} style={styles.classBlock}>
                    <View style={styles.classHeaderCol}>
                      <Text style={styles.classCourse}>{cls.courseTitle}</Text>
                      <Text style={styles.classBatch}>{cls.batchName}</Text>
                    </View>
                    <View style={styles.classTimeRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.classTime}>{cls.time}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.meetBtn}
                      onPress={() => handleJoinMeet(cls.courseTitle, cls.meetLink)}
                    >
                      <Ionicons name="videocam" size={14} color="#FFFFFF" />
                      <Text style={styles.meetBtnText}>Join Google Meet</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ))}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
  },
  headerAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  // Week switcher
  weekSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  weekRange: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  summaryStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  // Timetable
  timetableContainer: {
    gap: 16,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 12,
  },
  dayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dayClassCountBadge: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dayClassCountText: {
    color: '#7B2CBF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  freeDayBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  freeDayText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  classBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classHeaderCol: {
    marginBottom: 6,
  },
  classCourse: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  classBatch: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  classTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  classTime: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  meetBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  meetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
