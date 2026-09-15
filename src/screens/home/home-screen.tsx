import CourseDetails, { CourseData } from '@/screens/courses/course-details';
import ExploreCourses, { ExploreCourseItem } from '@/screens/courses/explore-courses';
import ClassRecordingsScreen from '@/screens/home/class-recordings-screen';
import CourseTopicsScreen from '@/screens/tests/Course-topics-screen';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dimensions,
  Modal,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getApiBaseUrl, resolveDynamicFileUrl } from '@/services/api';
import { useVideoPlayer, VideoView } from 'expo-video';
import { parseSyllabus, buildCourseDataFromDb } from '@/utils/syllabus-parser';

function normalizeModString(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[\:\–\—\-\|]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getModuleNumber(str: string): string | null {
  const match = str.match(/module\s*(\d+)/i);
  return match ? match[1] : null;
}

function findCanonicalModuleTitle(rawModName: string, adminModuleTitles: string[]): string {
  if (!rawModName) return adminModuleTitles[0] || 'Module 1';
  const normMat = normalizeModString(rawModName);
  const matNum = getModuleNumber(rawModName);

  for (const adminTitle of adminModuleTitles) {
    const normAdmin = normalizeModString(adminTitle);
    const adminNum = getModuleNumber(adminTitle);
    if (normMat === normAdmin) return adminTitle;
    if (matNum && adminNum && matNum === adminNum) return adminTitle;
  }
  return rawModName;
}

export const exploreCoursesList: ExploreCourseItem[] = [];

import { coursesData } from '@/constants/courses-data';
export { coursesData };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'JOIN_CLASS' | 'UPCOMING';

interface HomeScreenProps {
  onOpenNotifications?: () => void;
  userName?: string;
}

interface Enrollment {
  courseTitle: string;
  batchName: string;
  instructor: string;
  status: string;
  classDays: string[];
  classTimings?: string;
  startDate?: string;
  endDate?: string;
  googleMeetLink?: string;
}

const TODAY_NAME = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

const API_BASE = getApiBaseUrl().replace('/api', '');

// ── Inline Video Modal ──────────────────────────────────────────────────

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
function fmtTime(secs: number) {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function NativeVideoPlayer({ uri, title, onClose }: { uri: string; title: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, p => { p.play(); });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoViewRef = useRef<VideoView>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = player.duration ?? 0;
  useEffect(() => {
    const interval = setInterval(() => { setCurrentTime(player.currentTime ?? 0); setIsPlaying(player.playing); }, 500);
    return () => clearInterval(interval);
  }, [player]);
  const resetHide = useCallback(() => { if (hideTimer.current) clearTimeout(hideTimer.current); setControlsVisible(true); hideTimer.current = setTimeout(() => setControlsVisible(false), 3500); }, []);
  useEffect(() => { resetHide(); return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, []);
  const togglePlay = () => { isPlaying ? player.pause() : player.play(); resetHide(); };
  const toggleMute = () => { player.muted = !muted; setMuted(!muted); resetHide(); };
  const seek = (ratio: number) => { if (duration > 0) { player.currentTime = ratio * duration; resetHide(); } };
  const setPlaybackSpeed = (s: number) => { player.playbackRate = s; setSpeed(s); setShowSpeedMenu(false); setShowMenu(false); };
  const handleDownload = () => { setShowMenu(false); Linking.openURL(uri); };
  const handlePiP = () => { setShowMenu(false); try { (player as any).enterPictureInPicture?.(); } catch { } };
  const barWidth = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / (barWidth.current || 1)))),
    onPanResponderMove: (e) => seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / (barWidth.current || 1)))),
  })).current;
  const progress = duration > 0 ? currentTime / duration : 0;
  return (
    <View style={vp.root}>
      <View style={vp.topBar}>
        <TouchableOpacity onPress={() => { player.pause(); onClose(); }} style={vp.iconBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={vp.titleText} numberOfLines={1}>{title}</Text>
      </View>
      <Pressable style={vp.videoWrap} onPress={() => { setShowMenu(false); setShowSpeedMenu(false); resetHide(); }}>
        <VideoView ref={videoViewRef} player={player} style={vp.video} contentFit="contain" allowsPictureInPicture nativeControls={false} />
        {controlsVisible && (
          <View style={vp.centerWrap} pointerEvents="box-none">
            <TouchableOpacity style={vp.centerPlay} onPress={togglePlay} activeOpacity={0.8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={44} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
      <View style={vp.bottomBar}>
        <View style={vp.seekBar} onLayout={e => { barWidth.current = e.nativeEvent.layout.width; }} {...panResponder.panHandlers}>
          <View style={vp.seekTrack}>
            <View style={[vp.seekFill, { width: `${progress * 100}%` as any }]} />
            <View style={[vp.seekThumb, { left: `${progress * 100}%` as any }]} />
          </View>
        </View>
        <View style={vp.timeRow}>
          <Text style={vp.timeText}>{fmtTime(currentTime)} / {fmtTime(duration)}</Text>
          <View style={vp.rightIcons}>
            <TouchableOpacity onPress={toggleMute} style={vp.iconBtn}><Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => { try { videoViewRef.current?.enterFullscreen(); } catch { } }} style={vp.iconBtn}><Ionicons name="expand" size={20} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowMenu(v => !v); setShowSpeedMenu(false); }} style={vp.iconBtn}><Ionicons name="ellipsis-vertical" size={20} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      </View>
      {showMenu && (
        <View style={vp.menu}>
          <TouchableOpacity style={vp.menuItem} onPress={handleDownload}><Ionicons name="download-outline" size={20} color="#1F2937" /><Text style={vp.menuText}>Download</Text></TouchableOpacity>
          <View style={vp.menuDivider} />
          <TouchableOpacity style={vp.menuItem} onPress={() => setShowSpeedMenu(v => !v)}>
            <Ionicons name="speedometer-outline" size={20} color="#1F2937" />
            <Text style={vp.menuText}>Playback speed ({speed}x)</Text>
            <Ionicons name={showSpeedMenu ? 'chevron-down' : 'chevron-forward'} size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showSpeedMenu && (
            <View style={vp.speedList}>
              {SPEEDS.map(s => (
                <TouchableOpacity key={s} style={vp.speedItem} onPress={() => setPlaybackSpeed(s)}>
                  <Text style={[vp.speedText, speed === s && vp.speedActive]}>{s}x</Text>
                  {speed === s && <Ionicons name="checkmark" size={16} color="#7B2CBF" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={vp.menuDivider} />
          <TouchableOpacity style={vp.menuItem} onPress={handlePiP}><Ionicons name="tablet-portrait-outline" size={20} color="#1F2937" /><Text style={vp.menuText}>Picture in picture</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}
function InlineVideoModal({ visible, uri, title, onClose }: { visible: boolean; uri: string | null; title: string; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {uri && Platform.OS === 'web' ? (
          <>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 14,
              backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
            }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
              >
                <Ionicons name="close" size={24} color="#1E2937" />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: '#1E2937' }} numberOfLines={1}>{title}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <video
                src={uri}
                controls
                autoPlay
                onError={(e: any) => {
                  const fallbackSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                  if (e?.currentTarget?.src !== fallbackSrc) {
                    e.currentTarget.src = fallbackSrc;
                  }
                }}
                style={{ width: '100%', height: '100%', backgroundColor: '#000', outline: 'none' } as any}
              />
            </View>
          </>
        ) : uri ? (
          <NativeVideoPlayer uri={uri} title={title} onClose={onClose} />
        ) : null}
      </View>
    </Modal>
  );
}
const vp = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', flexDirection: 'column', justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#111' },
  titleText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', marginHorizontal: 8 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  videoWrap: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  centerWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  centerPlay: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  bottomBar: { backgroundColor: '#111', paddingHorizontal: 14, paddingBottom: 16, paddingTop: 8 },
  seekBar: { height: 32, justifyContent: 'center' },
  seekTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  seekFill: { height: 4, backgroundColor: '#7B2CBF', borderRadius: 2, position: 'absolute', left: 0, top: 0 },
  seekThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', position: 'absolute', top: -6, marginLeft: -8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 13, color: '#fff' },
  rightIcons: { flexDirection: 'row' },
  menu: { position: 'absolute', right: 12, bottom: 100, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 4, minWidth: 230, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 8 },
  speedList: { backgroundColor: '#F9FAFB', marginHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  speedItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  speedText: { fontSize: 14, color: '#4B5563' },
  speedActive: { color: '#7B2CBF', fontWeight: '700' },
});

function RecordingsSection({ enrolledCourses }: { enrolledCourses: string[] }) {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [playUri, setPlayUri] = useState<string | null>(null);
  const [playTitle, setPlayTitle] = useState('');
  const [coursesMap, setCoursesMap] = useState<Record<string, string[]>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadRecs = async () => {
      try {
        let data = await api.getStudentRecordings(true);
        if (!Array.isArray(data) || data.length === 0) {
          const allData = await api.getClassRecordings(true).catch(() => []);
          if (Array.isArray(allData) && allData.length > 0) {
            data = allData;
          }
        }
        setRecordings(Array.isArray(data) ? data : []);
      } catch {
        const allData = await api.getClassRecordings(true).catch(() => []);
        setRecordings(Array.isArray(allData) ? allData : []);
      } finally {
        setLoading(false);
      }
    };
    loadRecs();

    api.getAllCourses().then((res: any) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const map: Record<string, string[]> = {};
      list.forEach((c: any) => {
        const rawSyl = c.syllabusTopics || c.syllabus || c.whatYouWillLearn || '';
        if (c.title && rawSyl) {
          const parsed = parseSyllabus(rawSyl);
          if (parsed && parsed.length > 0) {
            map[c.title.trim().toLowerCase()] = parsed.map((m, idx) =>
              m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
            );
          }
        }
      });
      Object.entries(coursesData).forEach(([title, cData]) => {
        const key = title.trim().toLowerCase();
        if (!map[key]) {
          const parsed = parseSyllabus(cData.syllabusTopics || cData.syllabus);
          if (parsed && parsed.length > 0) {
            map[key] = parsed.map((m, idx) =>
              m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
            );
          }
        }
      });
      setCoursesMap(map);
    }).catch(() => {
      const map: Record<string, string[]> = {};
      Object.entries(coursesData).forEach(([title, cData]) => {
        const key = title.trim().toLowerCase();
        const parsed = parseSyllabus(cData.syllabusTopics || cData.syllabus);
        if (parsed && parsed.length > 0) {
          map[key] = parsed.map((m, idx) =>
            m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
          );
        }
      });
      setCoursesMap(map);
    });
  }, []);

  const categories = ['All', ...enrolledCourses];

  const filtered = recordings.filter((r: any) => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || r.title?.toLowerCase().includes(q) || r.course?.toLowerCase().includes(q);
    const matchCat = activeFilter === 'All' || r.course === activeFilter;
    return matchQ && matchCat;
  });

  const groupedModules = useMemo(() => {
    const groups: { moduleTitle: string; recordings: any[] }[] = [];
    const moduleMap = new Map<string, any[]>();

    const targetCourses = activeFilter === 'All'
      ? Array.from(new Set([...enrolledCourses.map(e => e.trim().toLowerCase()), ...Object.keys(coursesMap)]))
      : [activeFilter.trim().toLowerCase()];

    const adminModuleTitles: string[] = [];
    targetCourses.forEach(c => {
      const titles = coursesMap[c] ?? [];
      titles.forEach(t => {
        if (!adminModuleTitles.includes(t)) adminModuleTitles.push(t);
      });
    });

    if (adminModuleTitles.length === 0) {
      adminModuleTitles.push('Module 1: General Sessions');
    }

    adminModuleTitles.forEach(t => moduleMap.set(t, []));

    filtered.forEach((rec: any) => {
      const titleModMatch = (rec.title || '').match(/\[(.*?)\]/);
      const rawMod = titleModMatch ? titleModMatch[1] : (rec.title || 'Module 1');
      const canonical = findCanonicalModuleTitle(rawMod, adminModuleTitles);
      const key = canonical || adminModuleTitles[0];

      if (!moduleMap.has(key)) moduleMap.set(key, []);
      moduleMap.get(key)!.push(rec);
    });

    moduleMap.forEach((recs, title) => {
      if (recs.length > 0 || activeFilter !== 'All') {
        groups.push({ moduleTitle: title, recordings: recs });
      }
    });

    return groups;
  }, [filtered, coursesMap, activeFilter, recordings, enrolledCourses]);

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getStreamUrl = (id: number) => `${getApiBaseUrl().replace('/api', '')}/api/recordings/stream/${id}`;

  return (
    <View>
      {/* Search */}
      <View style={rs.searchBox}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={rs.searchInput}
          placeholder="Search recordings..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter chips — all enrolled courses */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[rs.chip, activeFilter === cat && rs.chipActive]}
              onPress={() => setActiveFilter(cat)}
            >
              <Text style={[rs.chipText, activeFilter === cat && rs.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Module-wise Grouped Accordion List */}
      {loading ? (
        <ActivityIndicator color="#7B2CBF" style={{ marginVertical: 24 }} />
      ) : groupedModules.length === 0 ? (
        <View style={rs.empty}>
          <Ionicons name="videocam-off-outline" size={36} color="#D1D5DB" />
          <Text style={rs.emptyText}>No recordings found</Text>
        </View>
      ) : (
        groupedModules.map((group) => {
          const isExpanded = expandedModules[group.moduleTitle] !== false;
          const cleanTitle = group.moduleTitle.replace(/^\[|\]$/g, '');

          return (
            <View key={group.moduleTitle} style={rs.moduleAccordion}>
              <TouchableOpacity
                style={rs.moduleAccordionHeader}
                activeOpacity={0.8}
                onPress={() => setExpandedModules(prev => ({ ...prev, [group.moduleTitle]: !isExpanded }))}
              >
                <View style={rs.moduleHeaderLeft}>
                  <View style={rs.moduleIconBadge}>
                    <Ionicons name="videocam-outline" size={18} color="#7B2CBF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={rs.moduleHeaderTitle} numberOfLines={1}>{cleanTitle}</Text>
                    <Text style={rs.moduleHeaderSub}>{group.recordings.length} {group.recordings.length === 1 ? 'session' : 'sessions'}</Text>
                  </View>
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
              </TouchableOpacity>

              {isExpanded && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 10, gap: 10 }}>
                  {group.recordings.length === 0 ? (
                    <Text style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 8 }}>
                      No recordings uploaded for this module yet.
                    </Text>
                  ) : (
                    group.recordings.map((rec: any) => {
                      const displayTitle = (rec.title || '').replace(/\[.*?\]\s*/, '');
                      const playVideo = () => {
                        setPlayTitle(displayTitle || rec.title);
                        const targetUri = rec.videoUrl ? resolveDynamicFileUrl(rec.videoUrl) : getStreamUrl(rec.id);
                        setPlayUri(targetUri);
                      };
                      return (
                        <TouchableOpacity key={rec.id} style={rs.card} onPress={playVideo} activeOpacity={0.85}>
                          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                            <TouchableOpacity style={rs.thumb} onPress={playVideo} activeOpacity={0.8}>
                              <View style={rs.thumbInner}>
                                <View style={rs.playCircle}>
                                  <Ionicons name="play" size={13} color="#7B2CBF" style={{ marginLeft: 2 }} />
                                </View>
                              </View>
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <Text style={rs.cardTitle} numberOfLines={2}>{displayTitle || rec.title}</Text>
                              <Text style={rs.instructorText}>{rec.instructor || 'Instructor'}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                                <Ionicons name="grid-outline" size={11} color="#7B2CBF" />
                                <Text style={rs.courseTag} numberOfLines={1}>{rec.course}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                                {(rec.classDate || rec.uploadedAt) && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <Ionicons name="calendar-outline" size={11} color="#6B7280" />
                                    <Text style={rs.meta}>{formatDate(rec.classDate || rec.uploadedAt)}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
      {/* Video Modal */}
      <InlineVideoModal
        visible={!!playUri}
        uri={playUri}
        title={playTitle}
        onClose={() => setPlayUri(null)}
      />
    </View>
  );
}

function MaterialsSection({ enrollments, onSelectCourse }: { enrollments?: Enrollment[]; onSelectCourse?: (title: string) => void }) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    api.getStudentMaterials().then((data: any) => {
      setMaterials(Array.isArray(data) ? data : []);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(materials.map((m: any) => m.course).filter(Boolean)))];

  const filteredEnrollments = (enrollments || []).filter(enr => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (enr.courseTitle || '').toLowerCase().includes(q) || (enr.batchName || '').toLowerCase().includes(q);
  });

  const filtered = materials.filter((m: any) => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || m.title?.toLowerCase().includes(q) || m.course?.toLowerCase().includes(q) || m.fileName?.toLowerCase().includes(q);
    const matchCat = activeFilter === 'All' || m.course === activeFilter;
    return matchQ && matchCat;
  });

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  const getFileIcon = (filename?: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'document-text';
    if (['doc', 'docx'].includes(ext || '')) return 'document';
    if (['ppt', 'pptx'].includes(ext || '')) return 'easel';
    if (['zip', 'rar'].includes(ext || '')) return 'archive';
    return 'attach';
  };

  return (
    <View>
      {/* 1. SEARCH BAR AT TOP */}
      <View style={[rs.searchBox, { marginBottom: 12 }]}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={rs.searchInput}
          placeholder="Search courses or study materials..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 2. CATEGORY CHIPS FILTER DIRECTLY BELOW SEARCH BAR */}
      {categories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[rs.chip, activeFilter === cat && rs.chipActive]}
              onPress={() => setActiveFilter(cat)}
            >
              <Text style={[rs.chipText, activeFilter === cat && rs.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 3. COURSES & MODULE MATERIALS CARDS */}
      {loading ? (
        <ActivityIndicator color="#7B2CBF" style={{ marginVertical: 24 }} />
      ) : filteredEnrollments && filteredEnrollments.length > 0 && onSelectCourse ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>
            Ongoing Courses & Module Materials
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            {filteredEnrollments
              .filter(enr => activeFilter === 'All' || enr.courseTitle === activeFilter)
              .map((enr, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    width: '48%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    shadowColor: '#7B2CBF',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                  onPress={() => onSelectCourse(enr.courseTitle)}
                  activeOpacity={0.85}
                >
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="book" size={22} color="#7B2CBF" />
                      </View>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#16A34A' }}>ACTIVE</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 }} numberOfLines={1}>
                      {enr.courseTitle}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#7B2CBF', fontWeight: '600', marginBottom: 2 }} numberOfLines={1}>
                      {enr.batchName || 'Ongoing Batch'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 15, marginBottom: 12 }} numberOfLines={2}>
                      Tap to view modulewise slides & notes
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#7B2CBF' }}>View Modules</Text>
                    <Ionicons name="arrow-forward-circle" size={22} color="#7B2CBF" />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      ) : (
        <View style={rs.empty}>
          <Ionicons name="document-outline" size={36} color="#D1D5DB" />
          <Text style={rs.emptyText}>No materials or courses found</Text>
        </View>
      )}
    </View>
  );
}

function ResourceTabsSection({ enrollments, onSelectCourse }: { enrollments: Enrollment[]; onSelectCourse?: (title: string) => void }) {
  const [activeResTab, setActiveResTab] = useState<'recordings' | 'materials'>('recordings');
  const enrolledCourses = enrollments.map(e => e.courseTitle);
  return (
    <View style={styles.section}>
      {/* Tab toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleTab, activeResTab === 'recordings' && styles.toggleTabActive]}
          onPress={() => setActiveResTab('recordings')}
        >
          <Ionicons name="videocam-outline" size={16} color={activeResTab === 'recordings' ? '#FFF' : '#4B5563'} style={styles.tabIcon} />
          <Text style={[styles.toggleTabText, activeResTab === 'recordings' && styles.toggleTabTextActive]}>Recording</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleTab, activeResTab === 'materials' && styles.toggleTabActive]}
          onPress={() => setActiveResTab('materials')}
        >
          <Ionicons name="book-outline" size={16} color={activeResTab === 'materials' ? '#FFF' : '#4B5563'} style={styles.tabIcon} />
          <Text style={[styles.toggleTabText, activeResTab === 'materials' && styles.toggleTabTextActive]}>Study material</Text>
        </TouchableOpacity>
      </View>
      {activeResTab === 'recordings'
        ? <RecordingsSection enrolledCourses={enrolledCourses} />
        : <MaterialsSection enrollments={enrollments} onSelectCourse={onSelectCourse} />}
    </View>
  );
}
function InstructorAvatar({ name }: { name: string }) {
  if (!name) return null;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toLowerCase();

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function isClassCurrentlyLive(enr: Enrollment): boolean {
  if (!enr.googleMeetLink || !enr.googleMeetLink.trim()) return false;

  const now = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const fullDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayAbbr = dayNames[now.getDay()];
  const currentDayFull = fullDayNames[now.getDay()];

  // Day Check
  if (enr.classDays && enr.classDays.length > 0) {
    const daysNormalized = enr.classDays.flatMap(d => d.toUpperCase().split(',').map(s => s.trim()));
    const dayMatches = daysNormalized.some(d =>
      d.includes(currentDayAbbr) || currentDayFull.includes(d.toLowerCase())
    );
    if (!dayMatches) return false;
  }

  // Time Range Check
  if (enr.classTimings) {
    const parts = enr.classTimings.split(/[-–—to]/i);
    if (parts.length >= 2) {
      const startMin = parseTimeToMinutes(parts[0]);
      const endMin = parseTimeToMinutes(parts[1]);

      if (startMin !== null && endMin !== null) {
        const currentMin = now.getHours() * 60 + now.getMinutes();
        // Allow 5 mins grace window before start, and verify current time <= end time
        if (currentMin < startMin - 5 || currentMin > endMin) {
          return false;
        }
      }
    }
  }

  return true;
}

function JoinClassSection({ enrollments }: { enrollments: Enrollment[] }) {
  // Only show live classes when their active time slot matches right now (day + time)
  const activeLiveClasses = (enrollments || []).filter(isClassCurrentlyLive);

  return (
    <View style={styles.section}>
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Join Live Classes</Text>
      </View>

      {activeLiveClasses.length === 0 ? (
        <View style={[styles.classCard, { alignItems: 'center', padding: 32, gap: 8 }]}>
          <Ionicons name="videocam-off-outline" size={36} color="#9CA3AF" />
          <Text style={{ color: '#374151', fontSize: 15, fontWeight: '700' }}>No Live Class Right Now</Text>
          <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            Enrolled live classes and Google Meet links will appear here automatically when class time starts.
          </Text>
        </View>
      ) : (
        activeLiveClasses.map((enr, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.classCard, { padding: 0, overflow: 'hidden', marginBottom: idx < activeLiveClasses.length - 1 ? 14 : 0 }]}
            onPress={() => enr.googleMeetLink && Linking.openURL(enr.googleMeetLink)}
            activeOpacity={0.88}
          >
            <View style={{ backgroundColor: '#7B2CBF', padding: 20 }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.classTitle, { color: '#FFFFFF' }]}>{enr.courseTitle}</Text>
                  {!!enr.batchName && (
                    <Text style={{ color: '#E9D5FF', fontSize: 12, fontWeight: '500', marginTop: 2 }}>{enr.batchName}</Text>
                  )}
                </View>
                <View style={styles.livePillBadge}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 5 }} />
                  <Text style={styles.livePillText}>LIVE NOW</Text>
                </View>
              </View>
              {(enr.classDays && enr.classDays.length > 0) || !!enr.classTimings ? (
                <View style={styles.classTimeRow}>
                  <Ionicons name="time-outline" size={16} color="#E9D5FF" />
                  <Text style={[styles.classTimeText, { color: '#E9D5FF' }]}>
                    {enr.classDays && enr.classDays.length > 0 ? enr.classDays.join(', ') : ''}
                    {enr.classTimings ? ` · ${enr.classTimings}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 16 }}>
              {enr.instructor ? (
                <View style={styles.instructorRow}>
                  <InstructorAvatar name={enr.instructor} />
                  <View>
                    <Text style={styles.instructorLabel}>Instructor</Text>
                    <Text style={styles.instructorName}>{enr.instructor}</Text>
                  </View>
                </View>
              ) : null}
              <View style={[styles.cardFooter, styles.rowBetween, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time" size={16} color="#7B2CBF" />
                  <Text style={styles.liveNowText}>{enr.classTimings || 'Live Session'}</Text>
                </View>
                <View style={[styles.joinNowButton, { backgroundColor: '#7B2CBF' }]}>
                  <Ionicons name="videocam" size={14} color="#FFF" style={styles.playIcon} />
                  <Text style={styles.joinNowText}>Join Live Class</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function UpcomingClassesSection({ enrollments }: { enrollments: Enrollment[] }) {
  const upcomingClasses = (enrollments || []).filter(e => e.status === 'ACTIVE' || e.status === 'UPCOMING');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Classes</Text>
      {upcomingClasses.length === 0 ? (
        <View style={[styles.classCard, { alignItems: 'center', padding: 32, gap: 8 }]}>
          <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
          <Text style={{ color: '#374151', fontSize: 15, fontWeight: '700' }}>No Upcoming Classes Scheduled</Text>
          <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            Your upcoming scheduled classes will appear here automatically.
          </Text>
        </View>
      ) : (
        upcomingClasses.map((enr, idx) => (
          <View
            key={idx}
            style={[styles.classCard, { padding: 0, overflow: 'hidden', marginBottom: idx < upcomingClasses.length - 1 ? 14 : 0 }]}
          >
            {/* Header Banner */}
            <View style={{ backgroundColor: '#7B2CBF', padding: 20 }}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.classTitle, { color: '#FFFFFF' }]}>{enr.courseTitle}</Text>
                  {!!enr.batchName && (
                    <Text style={{ color: '#E9D5FF', fontSize: 12, fontWeight: '500', marginTop: 2 }}>{enr.batchName}</Text>
                  )}
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar" size={12} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>SCHEDULED</Text>
                </View>
              </View>
              {(enr.classDays && enr.classDays.length > 0) || !!enr.classTimings ? (
                <View style={styles.classTimeRow}>
                  <Ionicons name="time-outline" size={16} color="#E9D5FF" />
                  <Text style={[styles.classTimeText, { color: '#E9D5FF' }]}>
                    {enr.classDays && enr.classDays.length > 0 ? enr.classDays.join(', ') : ''}
                    {enr.classTimings ? ` · ${enr.classTimings}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Card Body */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 16 }}>
              {enr.instructor ? (
                <View style={styles.instructorRow}>
                  <InstructorAvatar name={enr.instructor} />
                  <View>
                    <Text style={styles.instructorLabel}>Instructor</Text>
                    <Text style={styles.instructorName}>{enr.instructor}</Text>
                  </View>
                </View>
              ) : null}
              <View style={[styles.cardFooter, styles.rowBetween, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.liveNowText}>{enr.classTimings || 'Upcoming Class'}</Text>
                </View>
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="lock-closed" size={12} color="#64748B" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>Starts at Class Time</Text>
                </View>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export default function HomeScreen({ onOpenNotifications, userName }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('JOIN_CLASS');
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState<string | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [isViewingRecordings, setIsViewingRecordings] = useState(false);
  const [liveExploreList, setLiveExploreList] = useState<ExploreCourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [dbCoursesMap, setDbCoursesMap] = useState<Record<string, any>>({});
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Real-time tracking of overall hours spent on the application
  useEffect(() => {
    AsyncStorage.getItem('@nexus_student_app_time_spent_sec').then(val => {
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) setTimeSpentSeconds(parsed);
      }
    }).catch(() => {});

    const timer = setInterval(() => {
      setTimeSpentSeconds(prev => {
        const nextSec = prev + 1;
        if (nextSec % 5 === 0) {
          AsyncStorage.setItem('@nexus_student_app_time_spent_sec', String(nextSec)).catch(() => {});
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.getActiveCourses().then((data: any) => {
      const list = Array.isArray(data) ? data : [];
      const map: Record<string, any> = {};
      list.forEach((c: any) => { map[c.title] = c; map[String(c.id)] = c; });
      setDbCoursesMap(map);
      setLiveExploreList(list.map((c: any) => ({
        id: String(c.id),
        title: c.title,
        duration: c.duration ?? '',
        students: '0',
        rating: '—',
        price: c.price != null ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹0',
        key: c.title,
      })));
    }).catch(() => { });

    api.getStudentEnrollments().then((data: any) => {
      const list = Array.isArray(data) ? data : [];
      setEnrollments(list);
    }).catch(() => { });

    api.getStudentMaterials().then((data: any) => {
      setAllMaterials(Array.isArray(data) ? data : []);
    }).catch(() => { });

    api.getStudentRecordings(true).then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setRecordingsList(data);
      } else {
        api.getClassRecordings(true).then(all => setRecordingsList(Array.isArray(all) ? all : [])).catch(() => {});
      }
    }).catch(() => {
      api.getClassRecordings(true).then(all => setRecordingsList(Array.isArray(all) ? all : [])).catch(() => {});
    });
  }, []);

  const resolveCourse = (courseTitle: string): CourseData | null => {
    const dbCourse = dbCoursesMap[courseTitle];
    if (dbCourse) return buildCourseDataFromDb(dbCourse, coursesData);
    return coursesData[courseTitle] ?? null;
  };

  const computeHoursLearned = () => {
    const hours = timeSpentSeconds / 3600;
    if (hours < 0.1) return '0.1';
    const formatted = hours.toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
  };

  if (selectedCourseForMaterials !== null) {
    const courseMaterials = allMaterials.filter(m => {
      const mat = (m.course ?? '').toLowerCase().trim();
      const sel = selectedCourseForMaterials.toLowerCase().trim();
      return mat === sel || mat.includes(sel) || sel.includes(mat);
    });
    return (
      <CourseTopicsScreen
        courseTitle={selectedCourseForMaterials}
        materials={courseMaterials}
        onBack={() => setSelectedCourseForMaterials(null)}
      />
    );
  }

  if (isViewingRecordings) {
    return (
      <ClassRecordingsScreen
        onBack={() => setIsViewingRecordings(false)}
      />
    );
  }

  if (isExploring) {
    return (
      <ExploreCourses
        coursesList={liveExploreList}
        onBack={() => setIsExploring(false)}
        onSelectCourse={(courseKey: string) => {
          setIsExploring(false);
          setSelectedCourse(resolveCourse(courseKey));
        }}
      />
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#7B2CBF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* 1. HEADER */}
        <View style={styles.header}>
          <View style={styles.headerInner}>
            {/* Accent line FIRST — above NEXUS title, same as teacher panel */}
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
            <View style={styles.logoRow}>
              <View>
                <Text style={styles.logoText}>
                  NE<Text style={styles.logoTextGold}>X</Text>US
                </Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={onOpenNotifications}>
                  <Ionicons name="notifications-outline" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 3. WELCOME CARD */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeHeaderRow}>
              <Text style={[styles.welcomeTitle, { fontSize: 18, fontWeight: 'bold', fontFamily: undefined }]}>
                {userName ? `Welcome, ${userName.split(' ')[0]}!` : 'Master Skills, Achieve More'}
              </Text>
            </View>
            <Text style={[styles.welcomeSubtitle, { fontSize: 11, lineHeight: 16 }]}>Access live classes, study materials, assignments, and recorded sessions —all in one seamless learning platform designed to help you stay ahead.</Text>

            <View style={styles.statsRow}>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Courses Enrolled</Text>
                <Text style={styles.statsValue}>{enrollments.length}</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Hours Learned</Text>
                <Text style={styles.statsValue}>{computeHoursLearned()}</Text>
              </View>
            </View>
          </View>

          {/* 4. TAB TOGGLE BUTTONS FOR JOIN CLASS & UPCOMING */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleTab, activeTab === 'JOIN_CLASS' && styles.toggleTabActive]}
              onPress={() => setActiveTab('JOIN_CLASS')}
            >
              <Ionicons
                name="videocam-outline"
                size={18}
                color={activeTab === 'JOIN_CLASS' ? '#FFF' : '#4B5563'}
                style={styles.tabIcon}
              />
              <Text style={[styles.toggleTabText, activeTab === 'JOIN_CLASS' && styles.toggleTabTextActive]}>
                Join Class
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleTab, activeTab === 'UPCOMING' && styles.toggleTabActive]}
              onPress={() => setActiveTab('UPCOMING')}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={activeTab === 'UPCOMING' ? '#FFF' : '#4B5563'}
                style={styles.tabIcon}
              />
              <Text style={[styles.toggleTabText, activeTab === 'UPCOMING' && styles.toggleTabTextActive]}>
                Upcoming
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. DYNAMIC CLASSES VIEW */}
          {activeTab === 'JOIN_CLASS' ? (
            <JoinClassSection enrollments={enrollments} />
          ) : (
            <UpcomingClassesSection enrollments={enrollments} />
          )}

          {/* 6. RECORDINGS & STUDY MATERIALS TABS */}
          <ResourceTabsSection enrollments={enrollments} onSelectCourse={(title) => setSelectedCourseForMaterials(title)} />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  bottomSpacer: {
    height: 100, // Safe padding for bottom tabs
  },
  // Header
  header: {
    backgroundColor: '#7B2CBF',
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerAccentLine: { height: 4, marginBottom: 10 },
  headerInner: {
    paddingHorizontal: 20,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 7.5,
    color: '#FFB703',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
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
  // Search
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFB703', // Orange/Gold action button
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Welcome Card
  welcomeCard: {
    backgroundColor: '#7B2CBF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFFFFF',
  },
  welcomeLogoText: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  welcomeLogoTextGold: {
    color: '#FFB703',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E9D5FF',
    marginTop: 4,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsBox: {
    flex: 0.48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
  },
  statsLabel: {
    fontSize: 14,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  // Toggle Tab Bar
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    position: 'relative',
  },
  toggleTabActive: {
    backgroundColor: '#7B2CBF',
  },
  tabIcon: {
    marginRight: 6,
  },
  toggleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  toggleTabTextActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  // Class Cards
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  marginTop12: {
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  classTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 22,
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  livePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  classTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  classTimeText: {
    fontSize: 13,
    color: '#6B7280',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructorLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  instructorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  // Progress bar
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7B2CBF',
    borderRadius: 3,
  },
  // Card Footer
  cardFooter: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  liveNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  joinNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  playIcon: {
    marginTop: 1,
  },
  joinNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Upcoming card
  upcomingCard: {
    backgroundColor: '#7B2CBF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  upcomingTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  upcomingTime: {
    fontSize: 13,
    color: '#E9D5FF',
    flex: 1,
  },
  upcomingInstructorLabel: {
    fontSize: 11,
    color: '#D8B4FE',
    marginBottom: 2,
  },
  upcomingInstructorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

const rs = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  chip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 18, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#FFF' },
  moduleAccordion: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  moduleHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  moduleIconBadge: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center',
  },
  moduleHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  moduleHeaderSub: { fontSize: 11, color: '#7B2CBF', marginTop: 1, fontWeight: '600' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  thumb: {
    width: 72, height: 72,
    borderRadius: 16,
    backgroundColor: '#8B8FA8',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumbInner: {
    width: 46, height: 46,
    borderRadius: 12,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', lineHeight: 21 },
  instructorText: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  courseTag: { fontSize: 11, fontWeight: '600', color: '#7B2CBF' },
  meta: { fontSize: 11, color: '#6B7280' },
  watchBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  watchBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  fileSize: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
