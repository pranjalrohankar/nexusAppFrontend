import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { adminDataCache } from '../../components/layout/app-tabs';

const AVATAR_COLORS = ['#7B2CBF', '#2563EB', '#EA580C', '#16A34A', '#DB2777', '#0891B2'];
const PILL_STYLES: Record<number, { bg: string; color: string }> = {
  0: { bg: '#EDE9FE', color: '#6D28D9' },
  1: { bg: '#D1FAE5', color: '#065F46' },
  2: { bg: '#FEF3C7', color: '#92400E' },
  3: { bg: '#DBEAFE', color: '#1E40AF' },
  4: { bg: '#FCE7F3', color: '#9D174D' },
};

function EnquiryDetailModal({ enquiry, idx, onClose }: { enquiry: any; idx: number; onClose: () => void }) {
  const pill = PILL_STYLES[idx % Object.keys(PILL_STYLES).length];
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const initials = (enquiry.fullName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={det.overlay}>
        <View style={det.sheet}>
          {/* Drag handle */}
          <View style={det.handle} />
          {/* Header */}
          <View style={det.header}>
            <View style={[det.avatar, { backgroundColor: avatarColor }]}>
              <Text style={det.avatarText}>{initials}</Text>
            </View>
            <View style={det.headerMid}>
              <Text style={det.name}>{enquiry.fullName}</Text>
              <View style={det.metaRow}>
                <Text style={det.metaText}>{enquiry.createdAt ?? ''}</Text>
                {enquiry.phoneNumber ? (
                  <><Text style={det.metaDot}> · </Text>
                    <Ionicons name="globe-outline" size={12} color="#9CA3AF" />
                    <Text style={det.metaText}> website</Text></>
                ) : null}
              </View>
            </View>
            <View style={det.newBadge}>
              <Ionicons name="information-circle-outline" size={12} color="#2563EB" />
              <Text style={det.newBadgeText}>New</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* CONTACT */}
            <View style={det.section}>
              <Text style={det.sectionLabel}>CONTACT</Text>
              <View style={det.row}>
                <View style={det.iconBox}><Ionicons name="mail-outline" size={16} color="#7B2CBF" /></View>
                <Text style={det.rowText}>{enquiry.email}</Text>
              </View>
              <View style={det.divider} />
              <View style={det.row}>
                <View style={det.iconBox}><Ionicons name="call-outline" size={16} color="#16A34A" /></View>
                <Text style={det.rowText}>{enquiry.phoneNumber}</Text>
              </View>
            </View>

            {/* ENQUIRY DETAILS */}
            <View style={det.section}>
              <Text style={det.sectionLabel}>ENQUIRY DETAILS</Text>
              {enquiry.course ? (
                <View style={det.row}>
                  <View style={det.iconBox}><Ionicons name="book-outline" size={16} color="#6B7280" /></View>
                  <View style={[det.coursePill, { backgroundColor: pill.bg }]}>
                    <Text style={[det.coursePillText, { color: pill.color }]}>{enquiry.course}</Text>
                  </View>
                </View>
              ) : null}
              <View style={det.divider} />
              <View style={det.row}>
                <View style={det.iconBox}><Ionicons name="pricetag-outline" size={16} color="#EF4444" /></View>
                <Text style={det.priorityText}>High Priority</Text>
              </View>
              {enquiry.message ? (
                <>
                  <View style={det.divider} />
                  <Text style={det.messageText}>"{enquiry.message}"</Text>
                </>
              ) : null}
            </View>

            {/* QUICK ACTIONS */}
            <View style={det.section}>
              <Text style={det.sectionLabel}>QUICK ACTIONS</Text>
              <View style={det.actionsRow}>
                <TouchableOpacity style={det.actionBtn} onPress={() => Linking.openURL(`tel:${enquiry.phoneNumber}`)}>
                  <Ionicons name="call-outline" size={15} color="#16A34A" />
                  <Text style={[det.actionText, { color: '#16A34A' }]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={det.actionBtn} onPress={() => Linking.openURL(`mailto:${enquiry.email}`)}>
                  <Ionicons name="mail-outline" size={15} color="#2563EB" />
                  <Text style={[det.actionText, { color: '#2563EB' }]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={det.actionBtn} onPress={() => Linking.openURL(`https://wa.me/${enquiry.phoneNumber?.replace(/\D/g, '')}`)}>
                  <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                  <Text style={[det.actionText, { color: '#16A34A' }]}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* FOOTER BUTTONS */}
          <View style={det.footer}>
            <TouchableOpacity style={det.saveBtn}>
              <Ionicons name="send-outline" size={16} color="#FFF" />
              <Text style={det.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={det.closeBtn} onPress={onClose}>
              <Text style={det.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const det = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerMid: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  metaDot: { fontSize: 11, color: '#9CA3AF' },
  newBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  newBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  section: { borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  iconBox: { width: 28, alignItems: 'center' },
  rowText: { fontSize: 14, color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  coursePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  coursePillText: { fontSize: 13, fontWeight: '600' },
  priorityText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  messageText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginTop: 8, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 10 },
  actionText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7B2CBF', borderRadius: 14, height: 50 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  closeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, height: 50 },
  closeBtnText: { color: '#1F2937', fontWeight: '600', fontSize: 15 },
});

function EnquiriesScreen({ enquiries, onClose }: { enquiries: any[]; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ enquiry: any; idx: number } | null>(null);
  const filtered = enquiries.filter(e =>
    [e.fullName, e.email, e.phoneNumber, e.course].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );
  return (
    <SafeAreaView style={eq.safeArea} edges={['top']}>
      <View style={eq.header}>
        <View style={eq.headerRow}>
          <Text style={eq.headerTitle}>Enquiries</Text>
          <View style={eq.headerRight}>
            <TouchableOpacity style={eq.filterBtn}>
              <Ionicons name="filter" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={eq.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={eq.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={eq.searchInput}
            placeholder="Search name, email, phone, course..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      <ScrollView style={eq.list} contentContainerStyle={eq.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={eq.emptyBox}>
            <Ionicons name="mail-outline" size={40} color="#D1D5DB" />
            <Text style={eq.emptyText}>No enquiries found</Text>
          </View>
        ) : (
          filtered.map((e: any, idx: number) => {
            const pill = PILL_STYLES[idx % Object.keys(PILL_STYLES).length];
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const initials = (e.fullName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <TouchableOpacity key={e.id} style={eq.card} activeOpacity={0.85} onPress={() => setSelected({ enquiry: e, idx })}>
                <View style={eq.cardTop}>
                  <View style={[eq.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={eq.avatarText}>{initials}</Text>
                  </View>
                  <View style={eq.cardMid}>
                    <View style={eq.nameRow}>
                      <Text style={eq.name}>{e.fullName}</Text>
                      <View style={eq.newBadge}>
                        <View style={eq.newDot} />
                        <Text style={eq.newBadgeText}>New</Text>
                      </View>
                    </View>
                    {e.course ? (
                      <View style={[eq.coursePill, { backgroundColor: pill.bg }]}>
                        <Text style={[eq.coursePillText, { color: pill.color }]}>{e.course}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {e.message ? <Text style={eq.message} numberOfLines={2}>{e.message}</Text> : null}
                <View style={eq.infoRow}>
                  <View style={eq.infoItem}>
                    <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                    <Text style={eq.infoText}>{e.createdAt ?? 'N/A'}</Text>
                  </View>
                  <View style={eq.infoItem}>
                    <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                    <Text style={eq.infoText}>{e.phoneNumber}</Text>
                  </View>
                  {e.email ? (
                    <View style={eq.infoItem}>
                      <Ionicons name="mail-outline" size={12} color="#9CA3AF" />
                      <Text style={eq.infoText} numberOfLines={1}>{e.email}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      {selected && (
        <EnquiryDetailModal
          enquiry={selected.enquiry}
          idx={selected.idx}
          onClose={() => setSelected(null)}
        />
      )}
    </SafeAreaView>
  );
}

const eq = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  headerRight: { flexDirection: 'row', gap: 10 },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, height: 46, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937' },
  list: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: { padding: 16, gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  cardMid: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  newBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  newDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  newBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  coursePill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  coursePillText: { fontSize: 12, fontWeight: '600' },
  message: { fontSize: 13, color: '#4B5563', lineHeight: 19, marginBottom: 10 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: '#9CA3AF' },
});

export default function AdminDashboardScreen({ onViewAllEnrollments }: { onViewAllEnrollments?: () => void }) {
  const [dashData, setDashData] = useState<any>(adminDataCache.dashboard);
  const [enquiries, setEnquiries] = useState<any[]>(adminDataCache.enquiries);
  const [showEnquiries, setShowEnquiries] = useState(false);
  const [showNewEnquiryPopup, setShowNewEnquiryPopup] = useState(false);   // ← NEW

  const fetchEnquiries = () => {
    api.getEnquiries()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        adminDataCache.enquiries = list;
        setEnquiries(list);
      })
      .catch(() => { });
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
  const tagBgs = ['#FFF7ED', '#F3E8FF', '#DBEAFE', '#DCFCE7'];

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
        {/* Exact gradient accent line */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(9,2,0,0.14)',
            'rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)',
            'rgba(118,62,11,0.573)',
            'rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)',
            '#FB8B24',
            'rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)',
            'rgba(118,62,11,0.573)',
            'rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)',
            'rgba(9,2,0,0.14)',
            'rgba(0,0,0,0)',
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
              {enquiries.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeCount}>
                    {enquiries.length > 99 ? '99+' : enquiries.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
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

      {/* ENQUIRIES MODAL */}
      <Modal visible={showEnquiries} animationType="slide" transparent={false} onRequestClose={() => setShowEnquiries(false)}>
        <EnquiriesScreen enquiries={enquiries} onClose={() => setShowEnquiries(false)} />
      </Modal>
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerAccentLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
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
    fontWeight: '600',
    marginTop: 3,
  },
  alertBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#7B2CBF',
  },
  badgeCount: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
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
