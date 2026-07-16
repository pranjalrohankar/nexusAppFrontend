import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar,
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

  // Track last known enquiry count so we only re-render when something
  // actually changed — prevents cascading setEnquiries calls from the
  // interval that were logging a "Sending request with token" on each tick.
  const lastEnqCountRef = useRef(adminDataCache.enquiries.length);
  const dashDataRef = useRef<any>(adminDataCache.dashboard);

  const fetchEnquiries = () => {
    api.getEnquiries()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        adminDataCache.enquiries = list;
        setEnquiries(list);
        lastEnqCountRef.current = list.length;
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
      dashDataRef.current = d;
      setEnquiries(list);
      lastEnqCountRef.current = list.length;
    });

    // Sync badge count from cache every 5 s (picks up badge updates written
    // by app-tabs polling), but ONLY update React state when the count
    // actually changed so we don't cause unnecessary re-renders (and the
    // flood of "Sending request with token" console lines that came with them).
    const sync = setInterval(() => {
      const cached = adminDataCache.enquiries;
      if (cached.length !== lastEnqCountRef.current) {
        lastEnqCountRef.current = cached.length;
        setEnquiries([...cached]);
      }
      // Also pick up dashboard cache changes (e.g. teacher added/deleted)
      const cachedDash = adminDataCache.dashboard;
      if (cachedDash && cachedDash !== dashDataRef.current) {
        dashDataRef.current = cachedDash;
        setDashData(cachedDash);
      }
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

  const recentEnrollments = (dashData?.recentEnrollments ?? []).map((e: any) => ({
    id: String(e.id),
    name: e.studentName,
    course: e.courseTitle,
    time: e.enrollmentDate || 'N/A',
    dotColor: '#10B981',
  }));

  const classesToday = (dashData?.classesToday ?? []).map((c: any) => ({
    id: String(c.id),
    course: c.course,
    instructor: c.instructor || '',
    time: c.time,
    studentsCount: c.studentsCount ?? 0,
  }));

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  if (showEnquiries) {
    return (
      <AdminEnquiriesScreen
        enquiries={enquiries}
        onClose={() => setShowEnquiries(false)}
        onEnquiriesUpdate={(updated) => {
          setEnquiries(updated);
          adminDataCache.enquiries = updated;
          lastEnqCountRef.current = updated.length;
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
          {recentEnrollments.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No recent enrollments</Text>
            </View>
          ) : recentEnrollments.map((item: any) => {
            const initials = (item.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            const isToday = item.time && (item.time === new Date().toISOString().split('T')[0] || item.time === 'Today');
            const displayDate = isToday ? 'Today' : item.time;
            return (
              <View key={item.id} style={styles.enrollmentItem}>
                <View style={[styles.enrollAvatar, { backgroundColor: '#7B2CBF' }]}>
                  <Text style={styles.enrollAvatarText}>{initials}</Text>
                </View>
                <View style={styles.enrollInfo}>
                  <Text style={styles.enrollName}>{item.name}</Text>
                  <Text style={styles.enrollCourse}>{item.course}</Text>
                </View>
                <View style={styles.enrollRight}>
                  <View style={styles.enrollActiveBadge}>
                    <Text style={styles.enrollActiveBadgeText}>Active</Text>
                  </View>
                  <Text style={styles.enrollTime}>{displayDate}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* CLASSES TODAY */}
        <LinearGradient
          colors={['#F9FAFB', 'rgba(250,245,255,0.6)', 'rgba(255,247,237,0.6)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.classesTodayCard}
        >
          <View style={styles.classesTodayHeader}>
            <View style={styles.classesTodayIconBox}>
              <Ionicons name="calendar" size={20} color="#7B2CBF" />
            </View>
            <View>
              <Text style={styles.classesTodayTitle}>Classes Today</Text>
              <Text style={styles.classesTodayDate}>{todayLabel}</Text>
            </View>
          </View>
          {classesToday.length === 0 ? (
            <View style={styles.noClassesBox}>
              <Text style={styles.noClassesText}>No classes scheduled for today</Text>
            </View>
          ) : (
            classesToday.map((item: any) => (
              <View key={item.id} style={styles.classRow}>
                <View style={styles.classRowAccent} />
                <View style={styles.classRowContent}>
                  <Text style={styles.classCourse}>{item.course}</Text>
                  <Text style={styles.classTeacher}>
                    {item.instructor}{item.studentsCount > 0 ? ` • ${item.studentsCount} students` : ''}
                  </Text>
                </View>
                {!!item.time && (
                  <View style={styles.classTimePill}>
                    <Text style={styles.classTimeText}>{item.time}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </LinearGradient>

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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
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
  enrollmentsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  enrollmentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  enrollAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  enrollAvatarText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  enrollInfo: { flex: 1 },
  enrollName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  enrollCourse: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  enrollRight: { alignItems: 'flex-end', gap: 3 },
  enrollActiveBadge: { backgroundColor: '#DCFCE7', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 },
  enrollActiveBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  enrollTime: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  classesTodayCard: {
    borderRadius: 20, padding: 18, marginBottom: 8,
    borderWidth: 1, borderColor: '#E9D5FF',
    shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  classesTodayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  classesTodayIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  classesTodayTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  classesTodayDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  noClassesBox: { paddingVertical: 20, alignItems: 'center' },
  noClassesText: { fontSize: 13, color: '#9CA3AF' },
  classRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  classRowAccent: { width: 4, height: '100%', borderRadius: 2, backgroundColor: '#7B2CBF', marginRight: 12 },
  classRowContent: { flex: 1 },
  classCourse: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  classTeacher: { fontSize: 11, color: '#6B7280', marginTop: 3 },
  classTimePill: { backgroundColor: '#FFF7ED', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  classTimeText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
});