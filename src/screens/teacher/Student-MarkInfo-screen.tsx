import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Platform, StatusBar, ActivityIndicator, TextInput, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

interface Props {
  onBack?: () => void;
}

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1];

function initials(name: string = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StudentMarkInfoScreen({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [studentsByCourse, setStudentsByCourse] = useState<Record<string, any[]>>({});
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await api.getTeacherProfile().catch(() => null);
      const profileData = profileRes?.data ?? profileRes;
      const assignedCourses: any[] = profileData?.assignedCourses ?? [];
      setCourses(assignedCourses);

      if (assignedCourses.length > 0) {
        const results = await Promise.all(
          assignedCourses.map((c: any) =>
            api.getStudentsByCourse(c.title).catch(() => ({ data: [] }))
          )
        );
        const map: Record<string, any[]> = {};
        assignedCourses.forEach((c: any, i: number) => {
          const raw = results[i];
          const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          map[c.title] = list;
        });
        setStudentsByCourse(map);
      }
    } catch {
      // fail silently, empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Merge + dedupe all students across courses for the "All" tab
  const allStudents = useMemo(() => {
    const seen = new Map<string, any>();
    Object.entries(studentsByCourse).forEach(([courseTitle, list]) => {
      list.forEach((s: any) => {
        const key = s.id ?? s.studentId ?? s.email;
        if (!seen.has(key)) {
          seen.set(key, { ...s, course: s.course ?? courseTitle });
        }
      });
    });
    return Array.from(seen.values());
  }, [studentsByCourse]);

  const baseList = selectedCourse === 'All'
    ? allStudents
    : (studentsByCourse[selectedCourse] ?? []).map((s: any) => ({ ...s, course: s.course ?? selectedCourse }));

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((s: any) =>
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      (s.rollNo ?? s.rollNumber ?? '').toString().toLowerCase().includes(q)
    );
  }, [baseList, searchQuery]);

  const openStudent = async (student: any) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
    setMarksLoading(true);
    try {
      const res = await api.getStudentMarks(student.id ?? student.studentId).catch(() => ({ data: [] }));
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStudentMarks(list);
    } catch {
      setStudentMarks([]);
    } finally {
      setMarksLoading(false);
    }
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setStudentMarks([]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.logoText}>
            NE<Text style={styles.logoTextGold}>X</Text>US
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.welcomeText}>Student Marks</Text>
        <Text style={styles.headerSubtitle}>Search and review your students' performance</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or roll no."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* COURSE TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={{ flexGrow: 0 }}
      >
        {['All', ...courses.map((c: any) => c.title)].map((title, i) => {
          const active = selectedCourse === title;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.tabChip, active && styles.tabChipActive]}
              onPress={() => setSelectedCourse(title)}
            >
              <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                {title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* STUDENT LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={36} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No students found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, i) => String(item.id ?? item.studentId ?? i)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.studentGrid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.studentCard} onPress={() => openStudent(item)} activeOpacity={0.75}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>{initials(item.name)}</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>{item.name ?? 'Unnamed'}</Text>
              <Text style={styles.studentCourse} numberOfLines={1}>{item.course}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* STUDENT DETAIL MODAL */}
      <Modal visible={showStudentModal} transparent animationType="fade" onRequestClose={closeStudentModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.studentAvatarLg}>
                <Text style={styles.studentAvatarLgText}>{initials(selectedStudent?.name)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalStudentName}>{selectedStudent?.name ?? '—'}</Text>
                <Text style={styles.modalStudentCourse}>{selectedStudent?.course ?? '—'}</Text>
              </View>
              <TouchableOpacity onPress={closeStudentModal}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Contact info */}
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color="#7B2CBF" />
                <Text style={styles.infoText}>{selectedStudent?.email ?? 'No email on file'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#7B2CBF" />
                <Text style={styles.infoText}>{selectedStudent?.phone ?? 'No phone on file'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#7B2CBF" />
                <Text style={styles.infoText}>
                  Enrolled: {selectedStudent?.enrolledDate ?? selectedStudent?.enrollmentDate ?? '—'}
                </Text>
              </View>

              <Text style={styles.marksSectionTitle}>Test Marks</Text>
              {marksLoading ? (
                <ActivityIndicator size="small" color="#7B2CBF" style={{ marginTop: 12 }} />
              ) : studentMarks.length === 0 ? (
                <Text style={styles.noMarksText}>No test records yet.</Text>
              ) : (
                studentMarks.map((m: any, i: number) => (
                  <View key={i} style={styles.markRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.markSubject}>{m.subject ?? m.testName ?? 'Test'}</Text>
                      <Text style={styles.markDateTime}>
                        {(m.date ?? '—')}{m.time ? `  •  ${m.time}` : ''}
                      </Text>
                    </View>
                    <View style={styles.markScoreBadge}>
                      <Text style={styles.markScoreText}>
                        {m.marks ?? m.score ?? '—'}{m.totalMarks ? ` / ${m.totalMarks}` : ''}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },

  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 20,
  },
  headerAccentLine: { height: 4, marginBottom: 10 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoTextGold: { color: '#FFB703' },
  welcomeText: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#E9D5FF', marginTop: 4 },

  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },

  tabsRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  tabChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tabChipActive: { backgroundColor: '#7B2CBF' },
  tabChipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  tabChipTextActive: { color: '#FFF' },

  studentGrid: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  studentCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  studentAvatarText: { fontSize: 16, fontWeight: '700', color: '#7B2CBF' },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  studentCourse: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyStateText: { fontSize: 14, color: '#9CA3AF' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', maxWidth: 420,
    backgroundColor: '#FFF', borderRadius: 16, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  studentAvatarLg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarLgText: { fontSize: 18, fontWeight: '700', color: '#7B2CBF' },
  modalStudentName: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  modalStudentCourse: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontSize: 13, color: '#374151', flexShrink: 1 },

  marksSectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 14, marginBottom: 8 },
  noMarksText: { fontSize: 13, color: '#9CA3AF' },
  markRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    padding: 12, marginBottom: 8,
  },
  markSubject: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  markDateTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  markScoreBadge: {
    backgroundColor: '#F3E8FF', paddingVertical: 5,
    paddingHorizontal: 12, borderRadius: 20,
  },
  markScoreText: { fontSize: 13, fontWeight: '700', color: '#7B2CBF' },
});