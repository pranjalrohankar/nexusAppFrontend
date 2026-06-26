import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

export default function AdminDashboardScreen({ onViewAllEnrollments }: { onViewAllEnrollments?: () => void }) {
  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    api.getDashboard()
      .then((res: any) => setDashData(res?.data ?? null))
      .catch(() => {});
  }, []);

  const formatRevenue = (amount: number) => {
    if (!amount) return '₹0';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const metrics = [
    { label: 'Total Students', val: dashData ? String(dashData.totalStudents) : '-', change: dashData?.studentsPct ?? '+0%', icon: 'people-outline', color: '#7B2CBF', bg: '#F3E8FF' },
    { label: 'Total Teachers', val: dashData ? String(dashData.totalTeachers) : '-', change: dashData?.teachersPct ?? '+0%', icon: 'ribbon-outline', color: '#2563EB', bg: '#DBEAFE' },
    { label: 'Total Courses', val: dashData ? String(dashData.totalCourses) : '-', change: dashData?.coursesPct ?? '+0%', icon: 'school-outline', color: '#EA580C', bg: '#FFF7ED' },
    { label: 'Revenue', val: dashData ? formatRevenue(dashData.revenue) : '-', change: dashData?.revenuePct ?? '+0%', icon: 'cash-outline', color: '#16A34A', bg: '#DCFCE7' },
  ];

  const tagColors = ['#EA580C', '#7B2CBF', '#2563EB', '#16A34A'];
  const tagBgs   = ['#FFF7ED', '#F3E8FF', '#DBEAFE', '#DCFCE7'];

  const recentEnrollments: { id: string; name: string; course: string; time: string; dotColor: string }[] =
    (dashData?.recentEnrollments ?? []).map((e: any) => ({
      id: String(e.id),
      name: e.studentName,
      course: e.courseTitle,
      time: e.enrollmentDate || 'N/A',
      dotColor: '#10B981',
    }));

  const classesToday: { id: string; course: string; teacher: string; time: string; tagColor: string; tagBg: string }[] =
    (dashData?.classesToday ?? []).map((c: any, idx: number) => ({
      id: String(c.id),
      course: c.course,
      teacher: '',
      time: c.time,
      tagColor: tagColors[idx % tagColors.length],
      tagBg: tagBgs[idx % tagBgs.length],
    }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.logoText}>
              NE<Text style={styles.logoTextGold}>X</Text>US
            </Text>
            <Text style={styles.logoSubtext}>ADMIN CONSOLE</Text>
          </View>
          <TouchableOpacity 
            style={styles.alertBtn}
            onPress={() => Alert.alert('Notifications', 'No critical system alerts found.')}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFF" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Overview of your training center</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI METRICS GRID */}
        <View style={styles.metricsGrid}>
          {metrics.map((m, idx) => (
            <View key={idx} style={[styles.metricCard, { backgroundColor: m.bg }]}>
              <View style={styles.cardHeader}>
                <Ionicons name={m.icon as any} size={20} color={m.color} />
                <View style={[styles.changeBadge, { backgroundColor: m.color }]}>
                  <Text style={styles.changeBadgeText}>{m.change}</Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.val}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* RECENT ENROLLMENTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Enrollments</Text>
          <TouchableOpacity onPress={onViewAllEnrollments}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.enrollmentsCard}>
          {recentEnrollments.map((item) => (
            <View key={item.id} style={styles.enrollmentItem}>
              <View style={styles.enrollHeaderRow}>
                <View style={styles.titleWithDot}>
                  <View style={[styles.statusDot, { backgroundColor: item.dotColor }]} />
                  <Text style={styles.enrollName}>{item.name}</Text>
                </View>
                <Text style={styles.enrollTime}>{item.time}</Text>
              </View>
              <Text style={styles.enrollCourse}>{item.course}</Text>
            </View>
          ))}
        </View>

        {/* CLASSES TODAY */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Classes Today</Text>
        </View>

        <View style={styles.classesContainer}>
          {classesToday.map((item) => (
            <View key={item.id} style={styles.classCard}>
              <View style={styles.classHeaderCol}>
                <Text style={styles.classCourse}>{item.course}</Text>
                <Text style={styles.classTeacher}>{item.teacher ? `Instructor: ${item.teacher}` : ''}</Text>
              </View>
              <View style={[styles.classTag, { backgroundColor: item.tagBg }]}>
                <Text style={[styles.classTagText, { color: item.tagColor }]}>{item.time}</Text>
              </View>
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
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoTextGold: {
    color: '#FFB703',
  },
  logoSubtext: {
    fontSize: 8,
    color: '#FFB703',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 1,
  },
  alertBtn: {
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
    backgroundColor: '#EF4444',
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
  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  changeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  changeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllLink: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: 'bold',
  },
  // Recent Enrollments Card
  enrollmentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    gap: 14,
  },
  enrollmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  enrollHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  enrollName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  enrollTime: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  enrollCourse: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    paddingLeft: 16,
  },
  // Classes Today List
  classesContainer: {
    gap: 12,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classHeaderCol: {
    flex: 1,
  },
  classCourse: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  classTeacher: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  classTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  classTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
