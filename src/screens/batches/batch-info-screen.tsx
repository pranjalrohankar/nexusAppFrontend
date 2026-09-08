import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseSyllabus } from '../../utils/syllabus-parser';
import { getCompletedTopicsForCourse } from '../../utils/syllabus-progress-store';
import { api } from '../../services/api';
import { coursesData } from '@/screens/home/home-screen';

interface Batch {
  id: string;
  title: string;
  subtitle?: string;
  badges?: { text: string; type: string; bg: string; color: string }[];
  startDate?: string;
  duration?: string;
  instructor?: string;
  schedule?: string;
  syllabus?: any;
  syllabusTopics?: any;
  classDays?: string[];
  classTiming?: string;
}

interface BatchInfoScreenProps {
  onBack: () => void;
  onEnrollSuccess?: (batch: any) => void;
  batch?: any;
}

export default function BatchInfoScreen({ onBack, onEnrollSuccess, batch }: BatchInfoScreenProps) {
  const [fetchedSyllabus, setFetchedSyllabus] = useState<any>(null);
  const [fetchedWhatYouGet, setFetchedWhatYouGet] = useState<string[]>([]);

  const data = useMemo(() => {
    if (!batch) {
      return {
        title: 'Enrolled Course',
        subtitle: 'Active Batch',
        startDate: 'June 15, 2026',
        duration: '3 Months',
        classDays: ['Monday', 'Wednesday', 'Friday'],
        classTiming: '6:00 PM',
        mode: 'Live Online Classes (Google Meet)',
        instructor: { name: 'Expert Instructor', title: 'Senior Instructor', initials: 'EI', rating: '4.9' },
        syllabus: [],
        whatYouGet: [],
        fees: '₹25,000',
        installment: 'Installment Plan Available',
      };
    }

    const schedule = batch.schedule || 'Mon, Wed, Fri - 6:00 PM';
    let classDays = batch.classDays && batch.classDays.length > 0 ? batch.classDays : ['Monday', 'Wednesday', 'Friday'];
    let classTiming = batch.classTiming || '6:00 PM';

    if (!batch.classDays && schedule.includes(' - ')) {
      const parts = schedule.split(' - ');
      classTiming = parts[1];
      const dayAbbrs = parts[0].split(', ');
      classDays = dayAbbrs.map((abbr: string) => {
        const mapping: Record<string, string> = {
          'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
          'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday',
        };
        return mapping[abbr] || abbr;
      });
    }

    const rawSyllabus = batch.syllabusTopics || batch.syllabus || fetchedSyllabus;

    // Resolve whatYouGet: fetchedWhatYouGet (from DB) takes priority
    let whatYouGet: string[] = [];
    if (fetchedWhatYouGet.length > 0) {
      whatYouGet = fetchedWhatYouGet;
    } else if (batch.whatYouWillLearn) {
      const raw: string = typeof batch.whatYouWillLearn === 'string' ? batch.whatYouWillLearn : '';
      whatYouGet = raw
        .split(/\r?\n/)
        .map((s: string) => s.replace(/^[\*\#\-•\d\.]+\s*/, '').trim())
        .filter((s: string) => s.length > 0);
    } else if (Array.isArray(batch.whatYouGet) && batch.whatYouGet.length > 0) {
      whatYouGet = batch.whatYouGet;
    }

    const instructorName = batch.instructor || 'Expert Instructor';
    const instructorInitials = instructorName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'EI';

    return {
      title: batch.title || 'Enrolled Course',
      subtitle: batch.subtitle || 'Active Enrolled Batch',
      startDate: batch.startDate || 'June 15, 2026',
      duration: batch.duration || '3 Months',
      classDays,
      classTiming,
      mode: 'Live Online Classes (Google Meet)',
      instructor: { name: instructorName, title: 'Senior Technical Instructor', initials: instructorInitials, rating: '4.9' },
      syllabus: rawSyllabus || [],
      whatYouGet,
      fees: batch.fees || '₹25,000',
      installment: batch.installment || 'Installment Plan Available',
    };
  }, [batch, fetchedSyllabus, fetchedWhatYouGet]);

  useEffect(() => {
    const loadCourseFromAdmin = async () => {
      try {
        const res: any = await api.getAllCourses();
        const coursesList: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : [];
        const currentTitle = (batch?.title || '').trim().toLowerCase();
        const match = coursesList.find((c: any) => {
          if (!c.title) return false;
          const t = c.title.trim().toLowerCase();
          return t === currentTitle || t.includes(currentTitle) || (currentTitle.length > 0 && currentTitle.includes(t));
        });
        if (match) {
          if (match.syllabusTopics) setFetchedSyllabus(match.syllabusTopics);
          if (match.whatYouWillLearn) {
            const raw: string = match.whatYouWillLearn;
            const items = raw
              .split(/\r?\n/)
              .map((s: string) => s.replace(/^[\*\#\-•\d\.]+\s*/, '').trim())
              .filter((s: string) => s.length > 0);
            if (items.length > 0) setFetchedWhatYouGet(items);
          }
        } else if (batch?.title) {
          const fallback = coursesData[batch.title];
          if (fallback) {
            if (fallback.syllabusTopics || fallback.syllabus) {
              setFetchedSyllabus(fallback.syllabusTopics || fallback.syllabus);
            }
            if (fallback.skills && fallback.skills.length > 0) {
              setFetchedWhatYouGet(fallback.skills);
            }
          }
        }
      } catch (_) {
        if (batch?.title) {
          const fallback = coursesData[batch.title];
          if (fallback) {
            if (fallback.syllabusTopics || fallback.syllabus) {
              setFetchedSyllabus(fallback.syllabusTopics || fallback.syllabus);
            }
            if (fallback.skills && fallback.skills.length > 0) {
              setFetchedWhatYouGet(fallback.skills);
            }
          }
        }
      }
    };
    loadCourseFromAdmin();
  }, [batch?.title]);

  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  useEffect(() => {
    if (data.title) {
      getCompletedTopicsForCourse(data.title, data.instructor?.name).then(setCompletedTopics);
    }
  }, [data.title, data.instructor?.name]);

  const handleEnroll = () => {
    Alert.alert(
      'Confirm Enrollment',
      `Are you sure you want to enroll in ${data.title} (${data.subtitle})?\n\nCourse Fee: ${data.fees}\n${data.installment}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert(
              'Enrollment Successful',
              `Congratulations! You have successfully enrolled in ${data.title}.\n\nClasses start on ${data.startDate}.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onEnrollSuccess && batch) {
                      onEnrollSuccess(batch);
                    } else {
                      onBack();
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 1. TOP PURPLE HERO BANNER */}
        <View style={styles.headerBanner}>
          <View style={[styles.headerInnerContainer, { maxWidth: isDesktop ? 1200 : undefined }]}>
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>{data.title}</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveBadgeText}>Live Classes</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{data.subtitle} • {data.mode}</Text>
            </View>
          </View>
        </View>

        {/* 2. MAIN BODY LAYOUT (2-COLUMN GRID ON DESKTOP) */}
        <View style={[styles.bodyContainer, { maxWidth: isDesktop ? 1200 : undefined }]}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>
            
            {/* LEFT MAIN COLUMN (60% width on desktop) */}
            <View style={{ flex: isDesktop ? 1.6 : undefined, width: '100%' }}>
              
              {/* COURSE SYLLABUS & PROGRESS */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="book" size={20} color="#7B2CBF" />
                <Text style={styles.sectionTitle}>Course Syllabus & Live Progress</Text>
              </View>

              <View style={styles.card}>
                {(() => {
                  const modules = parseSyllabus(data.syllabus);
                  if (!modules || modules.length === 0) {
                    return (
                      <View style={{ paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', backgroundColor: '#FAF5FF', borderRadius: 12, borderWidth: 1, borderColor: '#F3E8FF' }}>
                        <Ionicons name="document-text-outline" size={36} color="#7B2CBF" style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>No Syllabus Modules Uploaded Yet</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                          The course modules and syllabus topics uploaded & saved through the Admin Panel will appear here.
                        </Text>
                      </View>
                    );
                  }

                  let allTopics: string[] = [];
                  modules.forEach(m => {
                    if (m.topics && m.topics.length > 0) allTopics.push(...m.topics);
                  });
                  const totalTopics = allTopics.length;
                  const doneCount = allTopics.filter(t => completedTopics.includes(t)).length;
                  const progressPct = totalTopics > 0 ? Math.round((doneCount / totalTopics) * 100) : 0;

                  return (
                    <View>
                      {/* Progress summary banner */}
                      <View style={styles.progressBannerCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="pie-chart" size={16} color="#7B2CBF" />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#7B2CBF' }}>Syllabus Completion</Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#7B2CBF' }}>{doneCount} / {totalTopics} Topics ({progressPct}%)</Text>
                        </View>
                        <View style={styles.progressBarTrack}>
                          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                        </View>
                      </View>

                      {/* Modules list */}
                      {modules.map((mod, idx) => (
                        <View key={idx} style={idx > 0 ? styles.batchModuleBlockWithBorder : styles.batchModuleBlock}>
                          <View style={styles.batchModuleHeader}>
                            <View style={styles.purpleModuleNumBox}>
                              <Text style={styles.purpleModuleNumText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.batchModuleTitle}>{mod.title}</Text>
                          </View>

                          <View style={styles.batchTopicsList}>
                            {mod.topics.map((t, tIdx) => {
                              const isCovered = completedTopics.includes(t);
                              return (
                                <View key={tIdx} style={styles.syllabusRow}>
                                  <Ionicons
                                    name={isCovered ? "checkmark-circle" : "ellipse-outline"}
                                    size={18}
                                    color={isCovered ? "#10B981" : "#9CA3AF"}
                                  />
                                  <Text style={[styles.syllabusText, { flex: 1, color: isCovered ? '#059669' : '#374151', fontWeight: isCovered ? '600' : '400' }]}>{t}</Text>
                                  {isCovered ? (
                                    <View style={styles.coveredBadge}>
                                      <Text style={styles.coveredBadgeText}>COVERED</Text>
                                    </View>
                                  ) : (
                                    <View style={styles.pendingBadge}>
                                      <Text style={styles.pendingBadgeText}>PENDING</Text>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>

              {/* WHAT YOU GET */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="checkmark-done-circle" size={20} color="#7B2CBF" />
                <Text style={styles.sectionTitle}>What You Will Learn & Get</Text>
              </View>

              <View style={styles.card}>
                {data.whatYouGet && data.whatYouGet.length > 0 ? (
                  <View style={styles.whatYouGetGrid}>
                    {data.whatYouGet.map((item: string, idx: number) => (
                      <View key={idx} style={styles.whatYouGetCol}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.whatYouGetText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>Learning outcomes will be updated by Admin.</Text>
                )}
              </View>

            </View>

            {/* RIGHT SIDEBAR COLUMN (40% width on desktop) */}
            <View style={{ flex: isDesktop ? 1 : undefined, width: '100%' }}>
              
              {/* BATCH OVERVIEW & SCHEDULE */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar" size={20} color="#7B2CBF" />
                <Text style={styles.sectionTitle}>Batch & Schedule</Text>
              </View>

              <View style={styles.card}>
                {/* Stats row */}
                <View style={styles.statsRowInline}>
                  <View style={styles.statBoxItem}>
                    <Ionicons name="calendar-outline" size={18} color="#A855F7" />
                    <View>
                      <Text style={styles.statItemLabel}>Start Date</Text>
                      <Text style={styles.statItemVal}>{data.startDate}</Text>
                    </View>
                  </View>

                  <View style={styles.statBoxDivider} />

                  <View style={styles.statBoxItem}>
                    <Ionicons name="time-outline" size={18} color="#EA580C" />
                    <View>
                      <Text style={styles.statItemLabel}>Duration</Text>
                      <Text style={styles.statItemVal}>{data.duration}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Days & timing */}
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={styles.scheduleSubtitle}>Class Days</Text>
                    <View style={styles.badgesRow}>
                      {data.classDays.map((day: string, idx: number) => (
                        <View key={idx} style={styles.dayBadge}>
                          <Text style={styles.dayBadgeText}>{day}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text style={styles.scheduleSubtitle}>Class Timing</Text>
                    <Text style={styles.scheduleTimeText}>{data.classTiming}</Text>
                  </View>
                </View>
              </View>

              {/* INSTRUCTOR PROFILE */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="person" size={20} color="#7B2CBF" />
                <Text style={styles.sectionTitle}>Instructor Profile</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.instructorRow}>
                  <View style={styles.instructorAvatar}>
                    <Text style={styles.instructorInitials}>{data.instructor.initials}</Text>
                  </View>
                  <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{data.instructor.name}</Text>
                    <Text style={styles.instructorTitle}>{data.instructor.title}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFB703" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                </View>
              </View>

            </View>

          </View>
          
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBanner: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 18 : 16,
    paddingBottom: 24,
    width: '100%',
  },
  headerInnerContainer: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: '#F9FAFB',
  },
  bodyContainer: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Progress
  progressBannerCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E9D5FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7B2CBF',
    borderRadius: 4,
  },

  // Modules
  batchModuleBlock: {
    paddingVertical: 6,
  },
  batchModuleBlockWithBorder: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
  },
  batchModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  purpleModuleNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purpleModuleNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  batchModuleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  batchTopicsList: {
    paddingLeft: 34,
  },
  syllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  syllabusText: {
    fontSize: 13,
    lineHeight: 18,
  },
  coveredBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coveredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  pendingBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // What you get
  whatYouGetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  whatYouGetCol: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  whatYouGetText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  // Sidebar Inline Stats
  statsRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  statBoxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statItemLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  statItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  statBoxDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
  },
  scheduleSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayBadge: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dayBadgeText: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Instructor
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  instructorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  instructorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  instructorTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },

  // Fees & Buttons
  feesCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  feesValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  greenCheckCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  installmentText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 8,
    fontStyle: 'italic',
  },
  purpleEnrollButton: {
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  purpleEnrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  outlineButtonText: {
    color: '#7B2CBF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 120,
  },
});
