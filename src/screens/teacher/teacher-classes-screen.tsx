import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Platform, ActivityIndicator, Linking, Share, StatusBar, Modal, KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { parseSyllabus } from '../../utils/syllabus-parser';
import { getCompletedTopicsForCourse, toggleTopicCompleted } from '../../utils/syllabus-progress-store';

interface BatchItem {
  id: number;
  courseId?: number;
  batchName: string;
  selectCourse: string;
  instructor: string;
  startDate: string;
  endDate: string;
  classDays: string[];
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  studentsCount: number;
  classTimings?: string;
  duration?: string;
  googleMeetLink?: string;
  totalSessions?: number;
  syllabusTopics?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  paymentStatus: string;
  active: boolean;
  onlineStatus?: 'online' | 'offline' | 'always_online';
}

interface TeacherClassesScreenProps {
  onOpenNotifications?: () => void;
}

export default function TeacherClassesScreen({ onOpenNotifications }: TeacherClassesScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ACTIVE');
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syllabusBatch, setSyllabusBatch] = useState<BatchItem | null>(null);
  const [meetBatch, setMeetBatch] = useState<BatchItem | null>(null);
  const [meetUrlInput, setMeetUrlInput] = useState('');
  const [savingMeetUrl, setSavingMeetUrl] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [completedTopicsMap, setCompletedTopicsMap] = useState<Record<string, string[]>>({});
  const selectedBatchRef = useRef<BatchItem | null>(null);

  const refreshCompletedTopicsForBatches = useCallback(async (batchList: BatchItem[]) => {
    const map: Record<string | number, string[]> = {};
    for (const b of batchList) {
      if (b.id) {
        try {
          const topics = await getCompletedTopicsForCourse(b.selectCourse, b.instructor, b.id);
          map[b.id] = topics;
        } catch {}
      }
    }
    setCompletedTopicsMap(map);
  }, []);

  useEffect(() => {
    if (syllabusBatch?.selectCourse && syllabusBatch?.id) {
      getCompletedTopicsForCourse(syllabusBatch.selectCourse, syllabusBatch.instructor, syllabusBatch.id).then(setCompletedTopics);
    } else {
      setCompletedTopics([]);
    }
  }, [syllabusBatch]);

  // Keep ref in sync so the polling interval can access current batch
  useEffect(() => { selectedBatchRef.current = selectedBatch; }, [selectedBatch]);

  // Poll every 10s to refresh online status when viewing students
  useEffect(() => {
    const interval = setInterval(async () => {
      const batch = selectedBatchRef.current;
      if (!batch) return;
      try {
        const res = await api.getBatchStudents(batch.id);
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setStudents(list.map((s: any) => ({
          id: String(s.id ?? s.enrollmentId ?? Math.random()),
          name: s.name || s.studentName || '—',
          email: s.email || s.studentEmail || '—',
          phone: s.phone || s.studentPhone || '—',
          enrollmentDate: s.enrollmentDate || s.joinedDate || s.createdAt || '',
          paymentStatus: s.paymentStatus || '',
          active: s.active ?? (s.paymentStatus === 'Paid'),
          onlineStatus: s.onlineStatus,
        })));
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const [res, coursesRes] = await Promise.all([
        api.getMyBatches(),
        api.getAllCourses(),
      ]);

      const courseList = Array.isArray(coursesRes?.data) ? coursesRes.data : Array.isArray(coursesRes?.content) ? coursesRes.content : Array.isArray(coursesRes) ? coursesRes : [];
      const courseSyllabusMap: Record<string, string> = {};
      courseList.forEach((c: any) => {
        if (c.title) courseSyllabusMap[c.title.toLowerCase().trim()] = c.syllabusTopics || '';
      });

      if (res.success && Array.isArray(res.data)) {
        const list = res.data.map((b: any) => {
          // Spring Boot serialises LocalDate as [yyyy,m,d] array
          const toDateStr = (v: any): string => {
            if (!v) return '';
            if (Array.isArray(v)) return `${v[0]}-${String(v[1]).padStart(2,'0')}-${String(v[2]).padStart(2,'0')}`;
            return String(v);
          };
          const matchedSyllabus = courseSyllabusMap[(b.selectCourse || '').toLowerCase().trim()] || b.syllabusTopics || '';
          return {
            ...b,
            startDate: toDateStr(b.startDate),
            endDate: toDateStr(b.endDate),
            duration: b.duration || '',
            classTimings: b.classTimings ?? '',
            totalSessions: b.totalSessions ?? null,
            courseId: b.courseId ?? null,
            syllabusTopics: matchedSyllabus,
          };
        });
        setBatches(list);
        await refreshCompletedTopicsForBatches(list);
      }
    } catch (e) {
      console.error('Failed to load batches', e);
    } finally {
      setLoading(false);
    }
  }, [refreshCompletedTopicsForBatches]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const fetchStudents = useCallback(async (batchId: number, showSpinner = true) => {
    if (showSpinner) setStudentsLoading(true);
    try {
      const res = await api.getBatchStudents(batchId);
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setStudents(list.map((s: any) => ({
        id: String(s.id ?? s.enrollmentId ?? Math.random()),
        name: s.name || s.studentName || '—',
        email: s.email || s.studentEmail || '—',
        phone: s.phone || s.studentPhone || '—',
        enrollmentDate: s.enrollmentDate || s.joinedDate || s.createdAt || '',
        paymentStatus: s.paymentStatus || '',
        active: s.active ?? (s.paymentStatus === 'Paid'),
        onlineStatus: s.onlineStatus,
      })));
    } catch (e) {
      console.error('Failed to load students', e);
    } finally {
      if (showSpinner) setStudentsLoading(false);
    }
  }, []);

  const loadStudents = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setStudents([]);
    fetchStudents(batch.id, true);
  };

  useEffect(() => {
    if (!selectedBatch) return;
    const interval = setInterval(() => {
      fetchStudents(selectedBatch.id, false);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedBatch, fetchStudents]);

  const formatEnrolledDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return 'Enrolled: ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getBatchModuleProgress = (item: BatchItem) => {
    const modules = parseSyllabus(item.syllabusTopics);
    const doneTopics = completedTopicsMap[item.id] || [];

    let totalTopics = 0;
    let doneTopicsCount = 0;
    let totalModules = modules.length;
    let doneModulesCount = 0;

    modules.forEach(m => {
      if (m.topics && m.topics.length > 0) {
        totalTopics += m.topics.length;
        const modDoneTopics = m.topics.filter(t => doneTopics.includes(t));
        doneTopicsCount += modDoneTopics.length;
        if (modDoneTopics.length === m.topics.length) {
          doneModulesCount++;
        }
      }
    });

    let progressPct = 0;
    if (totalTopics > 0) {
      progressPct = Math.round((doneTopicsCount / totalTopics) * 100);
    } else if (item.status === 'COMPLETED') {
      progressPct = 100;
    }

    return {
      totalModules,
      doneModulesCount,
      totalTopics,
      doneTopicsCount,
      progressPct,
    };
  };

  const filteredBatches = batches.filter(b => b.status === activeTab);
  const counts = {
    ACTIVE: batches.filter(b => b.status === 'ACTIVE').length,
    UPCOMING: batches.filter(b => b.status === 'UPCOMING').length,
    COMPLETED: batches.filter(b => b.status === 'COMPLETED').length,
  };

  const formatDays = (days: string[]) => days.map(d => d.substring(0, 3)).join(', ');

  // ── STUDENTS DRILLDOWN ──────────────────────────────────────────────────────
  if (selectedBatch) {
    const filtered = students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const activeCount = students.filter(s => s.onlineStatus === 'online' || s.onlineStatus === 'always_online').length;

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
        {/* Purple header: accent line + back + course title + batch + search bar */}
        <View style={styles.drillHeader}>
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
              'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
              'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
              'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
              'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
            ]}
            locations={[0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.headerAccentLine}
          />
          <View style={styles.drillHeaderRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedBatch(null); setSearchQuery(''); }}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.drillCourseTitle} numberOfLines={2}>{selectedBatch.selectCourse}</Text>
          </View>
          <Text style={styles.drillBatchSubtitle}>{selectedBatch.batchName}</Text>
          {/* Search bar inside purple header */}
          <View style={styles.drillSearchBar}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.drillSearchInput}
              placeholder="Search students..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#7B2CBF' }]}>{students.length}</Text>
              <Text style={styles.metricLabel}>Total Students</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>{activeCount}</Text>
              <Text style={styles.metricLabel}>Active</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#F97316' }]}>83%</Text>
              <Text style={styles.metricLabel}>Avg. Attendance</Text>
            </View>
          </View>

          <Text style={styles.rosterTitle}>Students ({students.length})</Text>

          {studentsLoading ? (
            <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {students.length === 0 ? 'No students enrolled in this batch' : 'No students match your search'}
              </Text>
            </View>
          ) : (
            <View style={styles.studentList}>
              {filtered.map(s => (
                <View key={s.id} style={styles.studentCard}>
                  {/* Avatar + Name + Enrolled date + Active badge */}
                  <View style={styles.studentHeader}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{getInitials(s.name)}</Text>
                    </View>
                    <View style={styles.studentMeta}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      {s.enrollmentDate ? (
                        <Text style={styles.enrolledDate}>{formatEnrolledDate(s.enrollmentDate)}</Text>
                      ) : null}
                    </View>
                    {(() => {
                      const isLogged = s.onlineStatus === 'online' || s.onlineStatus === 'always_online';
                      return (
                        <View style={[
                          styles.onlineStatusBadge,
                          isLogged
                            ? styles.onlineStatusBadgeActive
                            : styles.onlineStatusBadgeInactive
                        ]}>
                          <View style={[
                            styles.onlineDot,
                            isLogged ? styles.onlineDotGreen : styles.onlineDotGray
                          ]} />
                          <Text style={[
                            styles.onlineStatusText,
                            isLogged ? styles.onlineStatusTextActive : styles.onlineStatusTextInactive
                          ]}>
                            {isLogged ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Email + Phone */}
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={13} color="#6B7280" />
                    <Text style={styles.contactText} numberOfLines={1}>{s.email}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={13} color="#6B7280" />
                    <Text style={styles.contactText}>{s.phone}</Text>
                  </View>

                  {/* Attendance + Progress bars */}
                  <View style={styles.barsRow}>
                    <View style={styles.barBlock}>
                      <View style={styles.barLabelRow}>
                        <Text style={styles.barLabel}>Attendance</Text>
                        <Text style={[styles.barPct, { color: '#7B2CBF' }]}>92%</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: '92%', backgroundColor: '#7B2CBF' }]} />
                      </View>
                    </View>
                    <View style={styles.barBlock}>
                      <View style={styles.barLabelRow}>
                        <Text style={styles.barLabel}>Progress</Text>
                        <Text style={[styles.barPct, { color: '#F97316' }]}>78%</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: '78%', backgroundColor: '#F97316' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Send Message */}
                  <TouchableOpacity style={styles.messageBtn}>
                    <Ionicons name="chatbubble-outline" size={14} color="#7B2CBF" />
                    <Text style={styles.messageBtnText}>Send Message</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MAIN CLASSES LIST ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: isDesktop ? 1200 : undefined, alignSelf: 'center' }}>
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
            <Text style={styles.logoText}>
              NE<Text style={styles.logoTextGold}>X</Text>US
            </Text>
            <TouchableOpacity style={styles.iconButton} onPress={onOpenNotifications}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              <View style={styles.badgeDot} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>My Classes</Text>
          <Text style={styles.headerSubtitle}>Manage your courses and class schedules.</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.subTabContainer}>
        <View style={{ width: '100%', maxWidth: isDesktop ? 1200 : undefined, alignSelf: 'center', flexDirection: 'row', gap: 8 }}>
          {(['ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.subTabBtn, activeTab === tab && styles.subTabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.subTabText, activeTab === tab && styles.subTabTextActive]}>
                {tab === 'ACTIVE' ? 'Active' : tab === 'UPCOMING' ? 'Upcoming' : 'Completed'} ({counts[tab]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { width: '100%', maxWidth: isDesktop ? 1200 : undefined, alignSelf: 'center' }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 60 }} />
        ) : filteredBatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} classes</Text>
          </View>
        ) : (
          <View style={[styles.classList, { flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap' }]}>
            {filteredBatches.map(item => {
              const { totalModules, doneModulesCount, totalTopics, doneTopicsCount, progressPct } = getBatchModuleProgress(item);
              return (
                <View key={item.id} style={[styles.classCard, { width: isDesktop ? '48.8%' : '100%' }]}>
                  {/* Title + Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.classCardTitle}>{item.selectCourse}</Text>
                      <Text style={styles.classCardBatch}>{item.batchName}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      item.status === 'ACTIVE' ? styles.badgeActive :
                      item.status === 'UPCOMING' ? styles.badgeUpcoming : styles.badgeCompleted
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        item.status === 'ACTIVE' ? styles.badgeTextActive :
                        item.status === 'UPCOMING' ? styles.badgeTextUpcoming : styles.badgeTextCompleted
                      ]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Students count + Duration chips */}
                  <View style={styles.chipsRow}>
                    <View style={styles.chip}>
                      <Ionicons name="people-outline" size={13} color="#7B2CBF" />
                      <Text style={styles.chipText}>{item.studentsCount} students</Text>
                    </View>
                    <View style={styles.chip}>
                      <Ionicons name="time-outline" size={13} color="#7B2CBF" />
                      <Text style={styles.chipText}>{item.duration || '—'}</Text>
                    </View>
                  </View>

                  {/* Schedule box */}
                  <View style={styles.scheduleBox}>
                    <Text style={styles.scheduleLabel}>Schedule</Text>
                    <Text style={styles.scheduleValue}>
                      {item.classDays && item.classDays.length > 0 ? formatDays(item.classDays) : '—'}
                      {item.classTimings ? ` · ${item.classTimings}` : ''}
                    </Text>
                    {item.startDate ? (
                      <Text style={[styles.scheduleValue, { marginTop: 3, color: '#6B7280', fontWeight: '500' }]}>
                        {(() => { const [y,m,d] = item.startDate.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); })()}
                        {item.endDate ? ` → ${(() => { const [y,m,d] = item.endDate.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); })()}` : ''}
                      </Text>
                    ) : null}
                  </View>

                  {/* Module Progress Bar */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressLabel}>Module Progress</Text>
                      <Text style={styles.progressVal}>
                        {totalModules > 0
                          ? `${doneModulesCount}/${totalModules} Modules (${progressPct}%)`
                          : item.totalSessions && item.totalSessions > 0
                          ? `0/${item.totalSessions} Sessions`
                          : `${progressPct}%`}
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                    </View>
                    {totalTopics > 0 ? (
                      <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '500' }}>
                        {doneTopicsCount} of {totalTopics} topics covered
                      </Text>
                    ) : null}
                  </View>

                  {/* Google Meet Box */}
                  <View style={styles.meetBoxContainer}>
                    <Ionicons name="videocam-outline" size={16} color="#7B2CBF" />
                    <TouchableOpacity
                      style={{ flex: 1, marginHorizontal: 8 }}
                      onPress={() => {
                        const url = item.googleMeetLink || 'https://meet.google.com/miq-hydh-kkf';
                        Linking.openURL(url).catch(() => {});
                      }}
                    >
                      <Text style={styles.meetUrlText} numberOfLines={1}>
                        {item.googleMeetLink || 'https://meet.google.com/miq-hydh-kkf'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.meetEditBtn}
                      onPress={() => {
                        setMeetBatch(item);
                        setMeetUrlInput(item.googleMeetLink || 'https://meet.google.com/miq-hydh-kkf');
                      }}
                    >
                      <Ionicons name="create-outline" size={14} color="#7B2CBF" />
                      <Text style={styles.meetEditBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionBtnRow}>
                    <TouchableOpacity style={styles.cardViewStudentsBtn} onPress={() => loadStudents(item)}>
                      <Ionicons name="people-outline" size={14} color="#7B2CBF" />
                      <Text style={styles.cardViewStudentsText}>Students ({item.studentsCount})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cardViewSyllabusBtn} onPress={() => setSyllabusBatch(item)}>
                      <Ionicons name="book-outline" size={14} color="#7B2CBF" />
                      <Text style={styles.cardViewSyllabusText}>Syllabus</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardStartClassBtn}
                      onPress={() => {
                        const url = item.googleMeetLink || 'https://meet.google.com/miq-hydh-kkf';
                        Linking.openURL(url).catch(() => {});
                      }}
                    >
                      <Ionicons name="videocam" size={14} color="#FFF" />
                      <Text style={styles.cardStartClassText}>Start Class</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Update Google Meet Link Modal */}
      <Modal
        visible={!!meetBatch}
        transparent
        animationType="fade"
        onRequestClose={() => setMeetBatch(null)}
      >
        <View style={styles.meetModalOverlay}>
          <View style={styles.meetModalBoxContainer}>
            <Text style={styles.meetModalMainTitle}>Update Google Meet Link</Text>
            <Text style={styles.meetModalCourseTitle}>{meetBatch?.selectCourse}</Text>

            <View style={styles.meetModalInputBox}>
              <TextInput
                style={styles.meetModalInputField}
                value={meetUrlInput}
                onChangeText={setMeetUrlInput}
                placeholder="https://meet.google.com/..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.meetModalSubtitleNote}>
              This will update the link for all students in this course.
            </Text>

            <View style={styles.meetModalBtnRow}>
              <TouchableOpacity
                style={styles.meetModalCancelButton}
                onPress={() => setMeetBatch(null)}
                disabled={savingMeetUrl}
              >
                <Text style={styles.meetModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.meetModalSaveButton}
                onPress={async () => {
                  if (!meetBatch) return;
                  setSavingMeetUrl(true);
                  try {
                    await api.updateBatch(meetBatch.id, {
                      batchName: meetBatch.batchName,
                      selectCourse: meetBatch.selectCourse,
                      instructor: meetBatch.instructor,
                      duration: meetBatch.duration,
                      startDate: meetBatch.startDate,
                      endDate: meetBatch.endDate,
                      classDays: meetBatch.classDays,
                      classTimings: meetBatch.classTimings,
                      status: meetBatch.status,
                      googleMeetLink: meetUrlInput,
                    });
                    if (meetBatch.courseId) {
                      await api.updateCourse(meetBatch.courseId, { googleMeetLink: meetUrlInput });
                    }
                    setBatches(prev => prev.map(b => b.id === meetBatch.id ? { ...b, googleMeetLink: meetUrlInput } : b));
                    setMeetBatch(null);
                  } catch (e) {
                    console.error('Failed to update meet link', e);
                  } finally {
                    setSavingMeetUrl(false);
                  }
                }}
                disabled={savingMeetUrl}
              >
                {savingMeetUrl ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.meetModalSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Course Syllabus Modal */}
      <Modal visible={!!syllabusBatch} transparent animationType="slide" onRequestClose={() => setSyllabusBatch(null)}>
        <View style={styles.meetModalOverlay}>
          <SafeAreaView style={[styles.meetModalBox, { maxHeight: '85%', padding: 20, width: '100%', maxWidth: 680, alignSelf: 'center' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>Course Syllabus</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#7B2CBF' }}>{syllabusBatch?.selectCourse}</Text>
              </View>
              <TouchableOpacity onPress={() => setSyllabusBatch(null)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(() => {
                const modules = parseSyllabus(syllabusBatch?.syllabusTopics);
                if (!modules || modules.length === 0) {
                  return (
                    <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="book-outline" size={36} color="#9CA3AF" />
                      <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 10 }}>No syllabus modules added for this course yet.</Text>
                    </View>
                  );
                }

                // Calculate progress
                let allTopics: string[] = [];
                modules.forEach(m => {
                  if (m.topics && m.topics.length > 0) {
                    allTopics.push(...m.topics);
                  }
                });
                const totalTopics = allTopics.length;
                const doneCount = allTopics.filter(t => completedTopics.includes(t)).length;
                const progressPct = totalTopics > 0 ? Math.round((doneCount / totalTopics) * 100) : 0;

                return (
                  <View>
                    {/* Overall Progress Banner */}
                    <View style={{ backgroundColor: '#F3E8FF', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E9D5FF' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#7B2CBF' }}>Syllabus Completion</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#7B2CBF' }}>{doneCount} / {totalTopics} Covered ({progressPct}%)</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: '#E9D5FF', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#7B2CBF', borderRadius: 4 }} />
                      </View>
                      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6, fontStyle: 'italic' }}>
                        Tap any topic below to mark it as covered for students.
                      </Text>
                    </View>

                    {modules.map((mod, idx) => (
                      <View key={idx} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#7B2CBF', marginBottom: 10 }}>
                          {mod.title.startsWith('Module') ? mod.title : `Module ${idx + 1} – ${mod.title}`}
                        </Text>
                        {mod.topics && mod.topics.length > 0 ? (
                          mod.topics.map((t, tIdx) => {
                            const isDone = completedTopics.includes(t);
                            return (
                              <TouchableOpacity
                                key={tIdx}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 8,
                                  borderBottomWidth: tIdx < mod.topics.length - 1 ? 1 : 0,
                                  borderBottomColor: '#F3F4F6',
                                  gap: 8,
                                }}
                                onPress={async () => {
                                  if (!syllabusBatch?.selectCourse || !syllabusBatch?.id) return;
                                  const updated = await toggleTopicCompleted(syllabusBatch.selectCourse, t, syllabusBatch.instructor, syllabusBatch.id);
                                  setCompletedTopics(updated);
                                  setCompletedTopicsMap(prev => ({ ...prev, [syllabusBatch.id]: updated }));
                                }}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name={isDone ? "checkbox" : "square-outline"}
                                  size={20}
                                  color={isDone ? "#10B981" : "#9CA3AF"}
                                />
                                <Text style={{
                                  fontSize: 13,
                                  color: isDone ? '#059669' : '#374151',
                                  fontWeight: isDone ? '600' : '400',
                                  textDecorationLine: isDone ? 'line-through' : 'none',
                                  flex: 1,
                                }}>
                                  {t}
                                </Text>
                                {isDone ? (
                                  <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>COVERED</Text>
                                  </View>
                                ) : (
                                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Tap to complete</Text>
                                )}
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Comprehensive topics covered in this module.</Text>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>

            <TouchableOpacity
              style={{ backgroundColor: '#7B2CBF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}
              onPress={() => setSyllabusBatch(null)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
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
    paddingBottom: 24,
    paddingTop: 8,
  },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 6 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoTextGold: {
    color: '#FFB703',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB703',
  },
  backBtn: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  backBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 24, fontWeight: '700', color: '#FFF',
  },
  headerSubtitle: { fontSize: 13, fontWeight: '600', color: '#E9D5FF', marginTop: 3 },
  subTabContainer: {
    flexDirection: 'row', backgroundColor: '#FFF',
    paddingHorizontal: 16, paddingVertical: 10,
    paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 8,
  },
  subTabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F3F4F6' },
  subTabBtnActive: { backgroundColor: '#7B2CBF' },
  subTabText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  subTabTextActive: { color: '#FFF', fontWeight: 'bold' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  bottomSpacer: { height: 100 },
  classList: { gap: 16 },
  emptyCard: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: 20, padding: 40,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 12 },

  // ── Class Card ──────────────────────────────────────────────────────────────
  classCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  classCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  classCardBatch: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgeTextActive: { color: '#10B981' },
  badgeUpcoming: { backgroundColor: '#FFF7ED' },
  badgeTextUpcoming: { color: '#EA580C' },
  badgeCompleted: { backgroundColor: '#F3F4F6' },
  badgeTextCompleted: { color: '#6B7280' },

  // Chips row (students + duration)
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F3E8FF', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  chipText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },

  // Schedule box
  scheduleBox: {
    backgroundColor: '#FAF5FF', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14,
  },
  scheduleLabel: { fontSize: 8, color: '#9CA3AF', fontWeight: '600', marginBottom: 3 },
  scheduleValue: { fontSize: 11, fontWeight: '600', color: '#1F2937' },

  // Progress bar
  progressRow: { marginBottom: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  progressVal: { fontSize: 11, fontWeight: 'bold', color: '#1F2937' },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#7B2CBF', borderRadius: 3 },

  // Meet box
  meetBox: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
  },
  meetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  meetLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  meetLinkWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  meetLinkText: { flex: 1, fontSize: 12, color: '#2563EB', fontWeight: '500' },
  meetIconBtn: { padding: 4 },
  noMeetText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },

  // Action buttons
  cardActionBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cardViewStudentsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#7B2CBF',
    height: 42, borderRadius: 12, backgroundColor: '#FAF5FF',
  },
  cardViewStudentsText: { color: '#7B2CBF', fontSize: 12, fontWeight: 'bold' },
  cardViewSyllabusBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#7B2CBF', height: 42, borderRadius: 12,
  },
  cardViewSyllabusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  cardStartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#7B2CBF', height: 42, borderRadius: 12,
  },
  cardStartText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // ── Drilldown ───────────────────────────────────────────────────────────────
  drillHeader: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  drillCourseTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  drillBatchSubtitle: { fontSize: 13, color: '#E9D5FF', marginTop: 2, marginLeft: 40, marginBottom: 0 },
  drillHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  drillSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14, height: 44,
    paddingHorizontal: 14, marginTop: 14,
  },
  drillSearchInput: { flex: 1, color: '#1F2937', fontSize: 13 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14,
    height: 46, paddingHorizontal: 14, marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1F2937', fontSize: 13 },
  metricsRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: '#F3F4F6' },
  metricVal: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  metricLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  rosterTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  studentList: { gap: 14 },
  studentCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  studentAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#7B2CBF', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  studentMeta: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  enrolledDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  activeBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center',
  },
  onlineStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  onlineStatusBadgeActive: { backgroundColor: '#ECFDF5' },
  onlineStatusBadgeInactive: { backgroundColor: '#FEE2E2' },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineDotGreen: { backgroundColor: '#10B981' },
  onlineDotGray: { backgroundColor: '#EF4444' },
  onlineStatusText: { fontSize: 11, fontWeight: 'bold' },
  onlineStatusTextActive: { color: '#10B981' },
  onlineStatusTextInactive: { color: '#EF4444' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  contactText: { fontSize: 12, color: '#4B5563', flex: 1 },
  barsRow: {
    flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 14,
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  barBlock: { flex: 1 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  barPct: { fontSize: 11, fontWeight: 'bold' },
  barBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, height: 38,
  },
  messageBtnText: { fontSize: 13, fontWeight: '600', color: '#7B2CBF' },
  meetEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#F3E8FF', borderRadius: 8 },
  meetEditBtnText: { fontSize: 11, fontWeight: '600', color: '#7B2CBF' },
  meetModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  meetModalBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%' },
  meetModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  meetModalSub: { fontSize: 12, color: '#7B2CBF', fontWeight: '600', marginBottom: 16 },
  meetModalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 46, paddingHorizontal: 12, fontSize: 13, color: '#1F2937', backgroundColor: '#F9FAFB', marginBottom: 8 },
  meetModalHint: { fontSize: 11, color: '#9CA3AF', marginBottom: 20 },
  meetModalBtns: { flexDirection: 'row', gap: 12 },
  meetModalCancel: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  meetModalCancelText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  meetModalSave: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#7B2CBF', justifyContent: 'center', alignItems: 'center' },
  meetModalSaveText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },

  meetBoxContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#DDD6FE', marginBottom: 14,
  },
  meetUrlText: { fontSize: 12, color: '#7B2CBF', fontWeight: '600' },
  cardStartClassBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#7B2CBF', height: 42, borderRadius: 12,
  },
  cardStartClassText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  meetModalBoxContainer: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 460,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  meetModalMainTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  meetModalCourseTitle: { fontSize: 14, fontWeight: '600', color: '#7B2CBF', marginBottom: 20 },
  meetModalInputBox: { marginBottom: 8 },
  meetModalInputField: {
    borderWidth: 2, borderColor: '#FB8B24', borderRadius: 14,
    height: 48, paddingHorizontal: 14, fontSize: 14,
    color: '#1E293B', backgroundColor: '#FFFFFF',
  },
  meetModalSubtitleNote: { fontSize: 12, color: '#94A3B8', marginBottom: 24 },
  meetModalBtnRow: { flexDirection: 'row', gap: 12 },
  meetModalCancelButton: {
    flex: 1, height: 46, borderRadius: 14,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  meetModalCancelButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  meetModalSaveButton: {
    flex: 1, height: 46, borderRadius: 14,
    backgroundColor: '#7B2CBF', justifyContent: 'center', alignItems: 'center',
  },
  meetModalSaveButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
