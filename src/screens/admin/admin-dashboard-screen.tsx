import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { adminDataCache } from '../../components/layout/app-tabs';
import AdminEnquiriesScreen from './admin-enquiries-screen';

export default function AdminDashboardScreen({ onViewAllEnrollments }: { onViewAllEnrollments?: () => void }) {
  const [dashData, setDashData] = useState<any>(adminDataCache.dashboard);
  const [enquiries, setEnquiries] = useState<any[]>(adminDataCache.enquiries);
  const [showEnquiries, setShowEnquiries] = useState(false);

  const fetchEnquiries = () => {
    api.getEnquiries()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        adminDataCache.enquiries = list;
        setEnquiries(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(() => null),
      api.getEnquiries().catch(() => null),
    ]).then(([dashRes, enqRes]) => {
      const d = dashRes?.data ?? null;
      const list = Array.isArray(enqRes) ? enqRes : Array.isArray(enqRes?.data) ? enqRes.data : [];
      adminDataCache.dashboard = d;
      adminDataCache.enquiries = list;
      setDashData(d);
      setEnquiries(list);
    });

    // Sync badge count from cache every 5s (picks up polling updates from app-tabs)
    const sync = setInterval(() => {
      setEnquiries([...adminDataCache.enquiries]);
    }, 5000);
    return () => clearInterval(sync);
  }, []);

  const unreadCount = enquiries.filter(e => !e.isRead).length;

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
  const tagBgs = ['#FFF7ED', '#F3E8FF', '#DBEAFE', '#DCFCE7'];

  const recentEnrollments = (dashData?.recentEnrollments ?? []).map((e: any) => ({
    id: String(e.id),
    name: e.studentName,
    course: e.courseTitle,
    time: e.enrollmentDate || 'N/A',
    dotColor: '#10B981',
  }));

  const classesToday = (dashData?.classesToday ?? []).map((c: any, idx: number) => ({
    id: String(c.id),
    course: c.course,
    teacher: '',
    time: c.time,
    tagColor: tagColors[idx % tagColors.length],
    tagBg: tagBgs[idx % tagBgs.length],
  }));

  if (showEnquiries) {
    return (
      <AdminEnquiriesScreen
        enquiries={enquiries}
        onClose={() => setShowEnquiries(false)}
        onEnquiriesUpdate={(updated) => {
          setEnquiries(updated);
          adminDataCache.enquiries = updated;
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
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
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Overview of your training center</Text>
          </View>
          <TouchableOpacity
            style={styles.alertBtn}
            onPress={() => { fetchEnquiries(); setShowEnquiries(true); }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={24} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          {recentEnrollments.map((item: any) => (
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
          {classesToday.map((item: any) => (
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
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 6 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  headerSubtitle: { fontSize: 13, color: '#E9D5FF', fontWeight: '600', marginTop: 3 },
  alertBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  iconContainer: { position: 'relative', width: 46, height: 46, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: '#7B2CBF' },
  badgeCount: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  bottomSpacer: { height: 100 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  metricCard: { width: '48%', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  changeBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  changeBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },
  metricValue: { fontSize: 22, fontWeight: 'bold' },
  metricLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  viewAllLink: { fontSize: 12, color: '#7B2CBF', fontWeight: 'bold' },
  enrollmentsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24, gap: 14 },
  enrollmentItem: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  enrollHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleWithDot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  enrollName: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  enrollTime: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  enrollCourse: { fontSize: 11, color: '#6B7280', marginTop: 4, paddingLeft: 16 },
  classesContainer: { gap: 12 },
  classCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  classHeaderCol: { flex: 1 },
  classCourse: { fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  classTeacher: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  classTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  classTagText: { fontSize: 11, fontWeight: 'bold' },
});
