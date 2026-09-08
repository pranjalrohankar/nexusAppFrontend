import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  Animated,
  PanResponder,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api, getApiBaseUrl, resolveDynamicFileUrl } from '@/services/api';
import { parseSyllabus } from '@/utils/syllabus-parser';

const API_BASE = getApiBaseUrl().replace('/api', '');
const IS_WEB = Platform.OS === 'web';

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const show = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => setToast(null));
  };

  const ToastView = () =>
    toast ? (
      <Animated.View style={[
        ts.toast,
        toast.type === 'success' ? ts.toastSuccess : ts.toastError,
        { opacity },
      ]}>
        <Text style={ts.toastText}>{toast.message}</Text>
      </Animated.View>
    ) : null;

  return { show, ToastView };
}

interface UploadRecordingScreenProps {
  onClose: () => void;
}

interface ClassRecording {
  id: number | string;
  title: string;
  classDate?: string;
  duration?: string;
  course: string;
  batch: string;
  uploadedAt?: string;
}

// Duration probe unused

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
function formatTime(secs: number) {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}



// ── Native custom player (Android / iOS) ─────────────────────────────────────
function NativeVideoPlayer({ uri, title, onClose }: { uri: string; title: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, p => { p.play(); });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const duration = player.duration ?? 0;

  // Poll player state every 500ms instead of useEvent
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
      setIsPlaying(player.playing);
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControlsVisible(true);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);
  useEffect(() => { resetHideTimer(); return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, []);

  const togglePlay = () => { isPlaying ? player.pause() : player.play(); resetHideTimer(); };
  const toggleMute = () => { player.muted = !muted; setMuted(!muted); resetHideTimer(); };
  const seek = (ratio: number) => { if (duration > 0) { player.currentTime = ratio * duration; resetHideTimer(); } };
  const setPlaybackSpeed = (s: number) => { player.playbackRate = s; setSpeed(s); setShowSpeedMenu(false); setShowMenu(false); };
  const handleDownload = () => { setShowMenu(false); Linking.openURL(uri); };
  const handlePiP = () => { setShowMenu(false); try { (player as any).enterPictureInPicture?.(); } catch {} };

  const barWidth = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / (barWidth.current || 1)))),
    onPanResponderMove: (e) => seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / (barWidth.current || 1)))),
  })).current;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={vm.root}>
      {/* TOP BAR */}
      <View style={vm.topBar}>
        <TouchableOpacity onPress={() => { player.pause(); onClose(); }} style={vm.iconBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={vm.titleText} numberOfLines={1}>{title}</Text>
      </View>
      {/* VIDEO */}
      <Pressable style={vm.videoWrap} onPress={() => { setShowMenu(false); setShowSpeedMenu(false); resetHideTimer(); }}>
        <VideoView player={player} style={vm.video} contentFit="contain" allowsPictureInPicture nativeControls={false} />
        {controlsVisible && (
          <View style={vm.centerWrap} pointerEvents="box-none">
            <TouchableOpacity style={vm.centerPlay} onPress={togglePlay} activeOpacity={0.8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={44} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
      {/* BOTTOM BAR */}
      <View style={vm.bottomBar}>
        <View style={vm.seekBar} onLayout={e => { barWidth.current = e.nativeEvent.layout.width; }} {...panResponder.panHandlers}>
          <View style={vm.seekTrack}>
            <View style={[vm.seekFill, { width: `${progress * 100}%` as any }]} />
            <View style={[vm.seekThumb, { left: `${progress * 100}%` as any }]} />
          </View>
        </View>
        <View style={vm.timeRow}>
          <Text style={vm.timeText}>{formatTime(currentTime ?? 0)} / {formatTime(duration)}</Text>
          <View style={vm.rightIcons}>
            <TouchableOpacity onPress={toggleMute} style={vm.iconBtn}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { try { (player as any).enterFullscreen?.(); } catch {} }} style={vm.iconBtn}>
              <Ionicons name="expand" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowMenu(v => !v); setShowSpeedMenu(false); }} style={vm.iconBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* 3-DOT MENU */}
      {showMenu && (
        <View style={vm.menu}>
          <TouchableOpacity style={vm.menuItem} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color="#1F2937" />
            <Text style={vm.menuText}>Download</Text>
          </TouchableOpacity>
          <View style={vm.menuDivider} />
          <TouchableOpacity style={vm.menuItem} onPress={() => setShowSpeedMenu(v => !v)}>
            <Ionicons name="speedometer-outline" size={20} color="#1F2937" />
            <Text style={vm.menuText}>Playback speed ({speed}x)</Text>
            <Ionicons name={showSpeedMenu ? 'chevron-down' : 'chevron-forward'} size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showSpeedMenu && (
            <View style={vm.speedList}>
              {SPEEDS.map(s => (
                <TouchableOpacity key={s} style={vm.speedItem} onPress={() => setPlaybackSpeed(s)}>
                  <Text style={[vm.speedText, speed === s && vm.speedActive]}>{s}x</Text>
                  {speed === s && <Ionicons name="checkmark" size={16} color="#7B2CBF" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={vm.menuDivider} />
          <TouchableOpacity style={vm.menuItem} onPress={handlePiP}>
            <Ionicons name="tablet-portrait-outline" size={20} color="#1F2937" />
            <Text style={vm.menuText}>Picture in picture</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getEmbedInfo(rawUrl: string): { isEmbed: boolean; embedUrl: string } {
  if (!rawUrl) return { isEmbed: false, embedUrl: '' };
  const url = rawUrl.trim();
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return { isEmbed: true, embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return { isEmbed: true, embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return { isEmbed: true, embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1` };
  }

  return { isEmbed: false, embedUrl: url };
}

// ── Shared modal wrapper ──────────────────────────────────────────────────────
function VideoModal({ visible, uri, title, onClose }: { visible: boolean; uri: string | null; title: string; onClose: () => void }) {
  const embed = uri ? getEmbedInfo(uri) : { isEmbed: false, embedUrl: '' };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {uri && IS_WEB ? (
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
              <TouchableOpacity
                onPress={() => Linking.openURL(uri)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7B2CBF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 }}
              >
                <Ionicons name="download-outline" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{embed.isEmbed ? 'Open Link' : 'Download'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              {embed.isEmbed ? (
                <iframe
                  src={embed.embedUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={uri}
                  controls
                  autoPlay
                  playsInline
                  onError={(e: any) => {
                    const fallbackSrc = 'https://vjs.zencdn.net/v/oceans.mp4';
                    if (e?.currentTarget && e.currentTarget.src !== fallbackSrc) {
                      e.currentTarget.src = fallbackSrc;
                      e.currentTarget.load();
                      const p = e.currentTarget.play();
                      if (p !== undefined) p.catch(() => {});
                    }
                  }}
                  style={{ width: '100%', height: '100%', backgroundColor: '#000', outline: 'none' } as any}
                />
              )}
            </View>
          </>
        ) : uri ? (
          <NativeVideoPlayer uri={uri} title={title} onClose={onClose} />
        ) : null}
      </View>
    </Modal>
  );
}

const vm = StyleSheet.create({
  safeRoot: { flex: 1, backgroundColor: '#000' },
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

export default function UploadRecordingScreen({ onClose }: UploadRecordingScreenProps) {
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = IS_WEB && winWidth >= 1024;
  const { show: showToast, ToastView } = useToast();

  const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
  const [videoLink, setVideoLink] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classDate, setClassDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const [recentUploads, setRecentUploads] = useState<ClassRecording[]>([]);
  const [loading, setLoading] = useState(false);

  const [courseOptions, setCourseOptions] = useState<{ id: number; title: string }[]>([]);
  const [batchOptions, setBatchOptions] = useState<{ id: number; batchName: string }[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const [editingRecording, setEditingRecording] = useState<ClassRecording | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [courseSyllabusMap, setCourseSyllabusMap] = useState<Record<string, string[]>>({});
  const [courseModuleTopicsMap, setCourseModuleTopicsMap] = useState<Record<string, Record<string, string[]>>>({});

  useEffect(() => {
    fetchRecentUploads();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const [cbRes, allCoursesRes] = await Promise.all([
        api.getMyCoursesBatches().catch(() => null),
        api.getAllCourses().catch(() => null),
      ]);

      const myCoursesList = cbRes?.courses ?? [];
      const allCoursesList = Array.isArray(allCoursesRes?.data) ? allCoursesRes.data : Array.isArray(allCoursesRes) ? allCoursesRes : [];

      const map: Record<string, string[]> = {};
      const modTopicsMap: Record<string, Record<string, string[]>> = {};

      const allList = [...allCoursesList, ...myCoursesList];
      allList.forEach((c: any) => {
        const title = (c.title || c.courseTitle || '').trim();
        if (!title) return;

        const rawSyl = c.syllabusTopics || c.syllabus || c.whatYouWillLearn || '';
        if (rawSyl) {
          const parsed = parseSyllabus(rawSyl);
          if (parsed && parsed.length > 0) {
            const modTitles: string[] = [];
            const topicsByMod: Record<string, string[]> = {};

            parsed.forEach((m, idx) => {
              const formattedTitle = m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`;
              modTitles.push(formattedTitle);
              topicsByMod[formattedTitle.toLowerCase()] = m.topics || [];
              topicsByMod[m.title.toLowerCase()] = m.topics || [];
            });

            map[title.toLowerCase()] = modTitles;
            modTopicsMap[title.toLowerCase()] = topicsByMod;
          }
        }
      });

      // Strictly set course options to teacher's assigned courses
      setCourseOptions(myCoursesList);
      setCourseSyllabusMap(map);
      setCourseModuleTopicsMap(modTopicsMap);
    } catch {}
  };

  const handleCourseSelect = async (sel: string) => {
    setCourse(sel);
    setBatch('');
    setBatchOptions([]);
    setSelectedModule('');
    setSelectedTopic('');
    setTopicOptions([]);
    setShowCourseDropdown(false);

    try {
      const res = await api.getMyCoursesBatches(sel);
      if (res?.batches) setBatchOptions(res.batches);
    } catch {}

    const normSel = sel.trim().toLowerCase();
    const modules = courseSyllabusMap[normSel] || [];
    if (modules.length > 0) {
      setModuleOptions(modules);
    } else {
      setModuleOptions(['Module 1', 'Module 2', 'Module 3', 'Module 4']);
    }
  };

  const handleModuleSelect = (modTitle: string) => {
    setSelectedModule(modTitle);
    setShowModuleDropdown(false);
    setSelectedTopic('');

    const normCourse = course.trim().toLowerCase();
    const courseTopics = courseModuleTopicsMap[normCourse] || {};
    const topics = courseTopics[modTitle.toLowerCase()] || [];
    setTopicOptions(topics);
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      setSelectedFile(asset);
    } catch {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const fetchRecentUploads = async () => {
    try {
      const recordings = await api.getClassRecordings();
      if (Array.isArray(recordings)) {
        setRecentUploads(
          recordings.sort((a, b) =>
            new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
          )
        );
      } else {
        setRecentUploads([]);
      }
    } catch {
      setRecentUploads([]);
    }
  };

  const getStreamUrl = (id: number | string) => api.getRecordingStreamUrl(id);

  const handleDelete = (id: number | string, recTitle: string) => {
    const doDelete = async () => {
      try {
        await api.deleteClassRecording(id);
        await fetchRecentUploads();
        showToast('Recording deleted successfully', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete recording', 'error');
      }
    };

    if (IS_WEB) {
      if ((globalThis as any).confirm?.(`Delete "${recTitle}"?`)) doDelete();
    } else {
      Alert.alert('Delete Recording', `Delete "${recTitle}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecording) return;
    if (!editTitle.trim() && !editVideoUrl.trim()) {
      Alert.alert('Error', 'Please provide a title or video link.');
      return;
    }
    try {
      setSavingEdit(true);
      await api.updateClassRecording(editingRecording.id, {
        title: editTitle.trim() || editingRecording.title,
        videoUrl: editVideoUrl.trim() || (editingRecording as any).videoUrl,
      });
      setEditingRecording(null);
      await fetchRecentUploads();
      showToast('Recording updated successfully!', 'success');
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Could not update recording.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'link') {
      if (!videoLink.trim()) return Alert.alert('Error', 'Please enter a video URL (YouTube, Google Drive, Vimeo, or MP4 link).');
    } else {
      if (!selectedFile) return Alert.alert('Error', 'Please select a video file.');
    }
    if (!course.trim()) return Alert.alert('Error', 'Please select a course.');
    if (!batch.trim()) return Alert.alert('Error', 'Please select a batch.');

    const formData = new FormData();

    if (uploadMode === 'link') {
      formData.append('videoUrl', videoLink.trim());
    } else {
      const fileName = selectedFile.name || `recording-${Date.now()}.mp4`;
      if (IS_WEB) {
        try {
          const fileBlob = await (await fetch(selectedFile.uri)).blob();
          formData.append('file', fileBlob, fileName);
        } catch {
          Alert.alert('Error', 'Unable to read selected video file.');
          return;
        }
      } else {
        formData.append('file', { uri: selectedFile.uri, name: fileName, type: selectedFile.mimeType || 'video/mp4' } as any);
      }
    }

    const topicText = selectedTopic.trim();
    const titleVal = topicText || title.trim() || 'Class Session';
    const finalTitle = selectedModule
      ? (titleVal.toLowerCase().includes('module') ? titleVal : `[${selectedModule}] ${titleVal}`)
      : titleVal;

    try {
      const userStr = await AsyncStorage.getItem('@nexus_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.email) formData.append('uploadedByEmail', u.email);
      }
    } catch {}

    formData.append('title', finalTitle);
    formData.append('description', selectedModule ? `Module: ${selectedModule}${topicText ? `\nTopic: ${topicText}` : ''}\n${description.trim()}` : description.trim());
    formData.append('classDate', classDate.toISOString().slice(0, 10));
    formData.append('course', course.trim());
    formData.append('batch', batch.trim());

    try {
      setLoading(true);
      await api.uploadClassRecording(formData);
      setSelectedFile(null);
      setVideoLink('');
      setTitle('');
      setDescription('');
      setCourse('');
      setBatch('');
      setBatchOptions([]);
      setSelectedModule('');
      setSelectedTopic('');
      setTopicOptions([]);
      await fetchRecentUploads();
      showToast('Recording uploaded successfully!', 'success');
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_: any, d?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (d) setClassDate(d);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      <ToastView />

      <View style={s.header}>
        <LinearGradient
          colors={['rgba(0,0,0,0)','rgba(251,139,36,0.86)','#FB8B24','rgba(251,139,36,0.86)','rgba(0,0,0,0)']}
          locations={[0, 0.35, 0.5, 0.65, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.headerAccentLine}
        />
        <View style={s.headerTop}>
          <TouchableOpacity onPress={onClose} style={s.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.headerTitles}>
            <Text style={s.headerTitle}>Upload Recording</Text>
            <Text style={s.headerSubtitle}>Share class recordings with students</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollDesktop]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Selector: Link vs File */}
        <View style={s.modeSelector}>
          <TouchableOpacity
            style={[s.modeBtn, uploadMode === 'link' && s.modeBtnActive]}
            onPress={() => setUploadMode('link')}
            activeOpacity={0.8}
          >
            <Ionicons name="link-outline" size={18} color={uploadMode === 'link' ? '#FFF' : '#6B7280'} />
            <Text style={[s.modeBtnText, uploadMode === 'link' && s.modeBtnTextActive]}>
              Video Link (YouTube / Drive / CDN)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modeBtn, uploadMode === 'file' && s.modeBtnActive]}
            onPress={() => setUploadMode('file')}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={uploadMode === 'file' ? '#FFF' : '#6B7280'} />
            <Text style={[s.modeBtnText, uploadMode === 'file' && s.modeBtnTextActive]}>
              Upload Video File
            </Text>
          </TouchableOpacity>
        </View>

        {uploadMode === 'link' ? (
          <View style={s.linkArea}>
            <View style={s.linkHeaderRow}>
              <Ionicons name="play-circle" size={20} color="#7B2CBF" />
              <Text style={s.linkLabel}>Video Link / Embed URL <Text style={s.req}>*</Text></Text>
            </View>
            <TextInput
              style={s.input}
              placeholder="e.g. YouTube unlisted link, Google Drive preview link, or MP4 URL"
              value={videoLink}
              onChangeText={setVideoLink}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={s.linkHelperText}>
              💡 Permanent storage: YouTube unlisted links, Google Drive share links, and cloud MP4s never expire or get deleted on server restarts.
            </Text>
            {videoLink.trim().length > 5 && (
              <TouchableOpacity
                style={s.previewBtn}
                onPress={() => {
                  setPreviewTitle(title.trim() || 'Video Link Preview');
                  setPreviewUri(videoLink.trim());
                }}
              >
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={s.previewBtnText}>Test / Preview Video Link</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* File Upload Area */
          <TouchableOpacity style={s.uploadArea} onPress={handleFileSelect} activeOpacity={0.9}>
            <View style={s.uploadIconBox}>
              <Ionicons name="cloud-upload-outline" size={48} color="#7B2CBF" />
            </View>
            <Text style={s.uploadTitle}>Drop your video here</Text>
            <Text style={s.uploadSub}>or tap to browse files</Text>
            <Text style={s.fileTypes}>MP4, MOV, MKV • Max 4 GB</Text>
            {selectedFile && (
              <Text style={s.selectedText}>✓ {selectedFile.name}</Text>
            )}
            {selectedFile && (
              <TouchableOpacity
                style={s.previewBtn}
                onPress={() => { setPreviewTitle('Preview Selected Video'); setPreviewUri(selectedFile.uri); }}
              >
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={s.previewBtnText}>Preview Selected Video</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}

        {/* Recording Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>RECORDING DETAILS</Text>

          <Text style={s.label}>Recording Title <Text style={s.req}>*</Text></Text>
          <TextInput style={s.input} placeholder="e.g. Introduction to NumPy" value={title} onChangeText={setTitle} />

          <Text style={s.label}>Description</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="What topics were covered..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={{ marginBottom: 16 }}>
            <Text style={s.label}>Class Date <Text style={s.req}>*</Text></Text>
            <TouchableOpacity style={s.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: '#1E2937', fontSize: 15 }}>{formatDate(classDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assign to Class */}
        <View style={[s.section, { zIndex: (showCourseDropdown || showBatchDropdown || showModuleDropdown) ? 100 : 1 }]}>
          <Text style={s.sectionTitle}>ASSIGN TO CLASS</Text>
          <View style={[s.row, { zIndex: (showCourseDropdown || showBatchDropdown) ? 90 : 1 }]}>
            <View style={[s.half, { zIndex: showCourseDropdown ? 100 : 1 }]}>
              <Text style={s.label}>Course <Text style={s.req}>*</Text></Text>
              <TouchableOpacity
                style={s.dropBtn}
                onPress={() => { setShowCourseDropdown(p => !p); setShowBatchDropdown(false); setShowModuleDropdown(false); }}
              >
                <Text style={[s.dropText, !course && s.dropPlaceholder]} numberOfLines={1}>
                  {course || 'Select Course'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              {showCourseDropdown && (
                <View style={s.dropList}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {courseOptions.length === 0
                      ? <Text style={s.dropEmpty}>No courses assigned</Text>
                      : courseOptions.map(o => (
                        <TouchableOpacity key={o.id} style={s.dropItem} onPress={() => handleCourseSelect(o.title)}>
                          <Text style={s.dropItemText}>{o.title}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={[s.half, { zIndex: showBatchDropdown ? 100 : 1 }]}>
              <Text style={s.label}>Batch <Text style={s.req}>*</Text></Text>
              <TouchableOpacity
                style={[s.dropBtn, !course && s.dropDisabled]}
                onPress={() => { if (!course) return; setShowBatchDropdown(p => !p); setShowCourseDropdown(false); setShowModuleDropdown(false); }}
              >
                <Text style={[s.dropText, !batch && s.dropPlaceholder]} numberOfLines={1}>
                  {batch || (course ? 'Select Batch' : 'Course first')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              {showBatchDropdown && (
                <View style={s.dropList}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {batchOptions.length === 0
                      ? <Text style={s.dropEmpty}>No batches for this course</Text>
                      : batchOptions.map(o => (
                        <TouchableOpacity key={o.id} style={s.dropItem} onPress={() => { setBatch(o.batchName); setShowBatchDropdown(false); }}>
                          <Text style={s.dropItemText}>{o.batchName}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Module Selection */}
          <View style={{ marginTop: 14, zIndex: showModuleDropdown ? 100 : 1, position: 'relative' }}>
            <Text style={s.label}>Module <Text style={s.req}>*</Text></Text>
            <TouchableOpacity
              style={[s.dropBtn, !course && s.dropDisabled]}
              onPress={() => { if (!course) return; setShowModuleDropdown(p => !p); setShowCourseDropdown(false); setShowBatchDropdown(false); setShowTopicDropdown(false); }}
            >
              <Text style={[s.dropText, !selectedModule && s.dropPlaceholder]} numberOfLines={1}>
                {selectedModule || (course ? 'Select Module' : 'Course first')}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            {showModuleDropdown && (
              <View style={s.dropList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {moduleOptions.length === 0
                    ? <Text style={s.dropEmpty}>No modules found for this course</Text>
                    : moduleOptions.map((mod, idx) => (
                      <TouchableOpacity key={idx} style={s.dropItem} onPress={() => handleModuleSelect(mod)}>
                        <Text style={s.dropItemText}>{mod}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Topic Selection */}
          <View style={{ marginTop: 14, zIndex: showTopicDropdown ? 100 : 1, position: 'relative' }}>
            <Text style={s.label}>Topic / Title</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={[
                  s.input,
                  { flex: 1, marginBottom: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
                  !selectedModule && s.dropDisabled
                ]}
                placeholder={selectedModule ? 'Select or type Topic...' : 'Module first'}
                placeholderTextColor="#94A3B8"
                value={selectedTopic}
                onChangeText={setSelectedTopic}
                editable={!!selectedModule}
              />
              <TouchableOpacity
                style={[
                  s.dropBtn,
                  { width: 44, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },
                  !selectedModule && s.dropDisabled
                ]}
                onPress={() => { if (!selectedModule) return; setShowTopicDropdown(p => !p); setShowCourseDropdown(false); setShowBatchDropdown(false); setShowModuleDropdown(false); }}
              >
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {showTopicDropdown && (
              <View style={[s.dropList, { top: 72 }]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {topicOptions.length === 0
                    ? <Text style={s.dropEmpty}>Type custom topic or select</Text>
                    : topicOptions.map((top, idx) => (
                      <TouchableOpacity key={idx} style={s.dropItem} onPress={() => { setSelectedTopic(top); setShowTopicDropdown(false); }}>
                        <Text style={s.dropItemText}>{top}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {!selectedFile && (
          <View style={s.warning}>
            <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
            <Text style={s.warningText}>Please select a video file before uploading.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.uploadBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpload}
          disabled={loading}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={s.uploadBtnText}>{loading ? 'Uploading...' : 'Upload Recording'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        {/* Recent Uploads */}
        <View style={s.recentSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[s.sectionTitle, { marginBottom: 0 }]}>RECENT UPLOADS ({recentUploads.length})</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              onPress={fetchRecentUploads}
            >
              <Ionicons name="refresh-outline" size={14} color="#7B2CBF" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#7B2CBF' }}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {recentUploads.length > 0 ? (
            recentUploads.map((item) => (
              <View key={item.id} style={s.recentCard}>
                <View style={s.recentIcon}>
                  <Ionicons name="play-circle" size={28} color="#7B2CBF" />
                </View>
                <View style={s.recentInfo}>
                  <Text style={s.recentTitle}>{item.title || 'Untitled Recording'}</Text>
                  <Text style={s.recentMeta}>{item.course}</Text>
                  <Text style={s.recentBatch}>{item.batch}</Text>
                  <Text style={s.recentMetaSmall}>
                    {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-GB') : ''}
                  </Text>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity
                    style={s.playBtn}
                    onPress={() => {
                      setPreviewTitle(item.title || 'Recording');
                      const targetUri = item.videoUrl ? resolveDynamicFileUrl(item.videoUrl) : (item.fileUrl ? resolveDynamicFileUrl(item.fileUrl) : getStreamUrl(item.id));
                      setPreviewUri(targetUri);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="eye-outline" size={18} color="#7B2CBF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.playBtn, { backgroundColor: '#EFF6FF' }]}
                    onPress={() => {
                      const url = item.videoUrl ? resolveDynamicFileUrl(item.videoUrl) : (item.fileUrl ? resolveDynamicFileUrl(item.fileUrl) : getStreamUrl(item.id));
                      if (IS_WEB) {
                        window.open(url, '_blank');
                      } else {
                        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open video stream'));
                      }
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="download-outline" size={18} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.playBtn, { backgroundColor: '#F3E8FF' }]}
                    onPress={() => {
                      setEditingRecording(item);
                      setEditTitle(item.title || '');
                      setEditVideoUrl((item as any).videoUrl?.startsWith('http') && !(item as any).videoUrl?.includes('/api/recordings/stream/') ? (item as any).videoUrl : '');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#7B2CBF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(item.id, item.title || 'Untitled')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={s.emptyText}>No recordings found yet.</Text>
          )}
        </View>
      </ScrollView>

      <VideoModal
        visible={!!previewUri}
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />

      {/* Edit Recording Modal */}
      <Modal visible={!!editingRecording} transparent animationType="fade" onRequestClose={() => setEditingRecording(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E2937' }}>Edit Recording Link</Text>
              <TouchableOpacity onPress={() => setEditingRecording(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Recording Title</Text>
            <TextInput
              style={s.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="e.g. [Module 2] Need of JDBC & Drivers"
            />

            <Text style={s.label}>Video Link (YouTube / Google Drive / MP4)</Text>
            <TextInput
              style={s.input}
              value={editVideoUrl}
              onChangeText={setEditVideoUrl}
              placeholder="e.g. https://youtu.be/... or Google Drive preview link"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: -8, marginBottom: 16 }}>
              💡 Pasting an unlisted YouTube or Google Drive link ensures this video remains accessible permanently without being deleted on server restarts.
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={[s.cancelBtn, { flex: 1, marginBottom: 0 }]}
                onPress={() => setEditingRecording(null)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.uploadBtn, { flex: 1, marginBottom: 0 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                <Text style={s.uploadBtnText}>{savingEdit ? 'Saving...' : 'Save Video Link'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={classDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 18,
  },
  headerAccentLine: { height: 4, marginBottom: 14 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: { padding: 4, marginRight: 12 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#E9D5FF', marginTop: 3 },

  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  scrollDesktop: { maxWidth: 860, alignSelf: 'center', width: '100%', paddingHorizontal: 40 },

  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: '#7B2CBF',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  linkArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  linkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2937',
  },
  linkHelperText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 4,
  },

  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  uploadIconBox: {
    width: 80, height: 80,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#1E2937', marginBottom: 4 },
  uploadSub: { fontSize: 15, color: '#64748B' },
  fileTypes: { fontSize: 13, color: '#94A3B8', marginTop: 8 },
  selectedText: { marginTop: 12, color: '#10B981', fontWeight: '600', textAlign: 'center', paddingHorizontal: 16 },
  previewBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#7B2CBF',
    borderRadius: 14,
    gap: 8,
  },
  previewBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E2937', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  req: { color: '#EF4444' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    justifyContent: 'center',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, position: 'relative' },

  dropBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropDisabled: { opacity: 0.45 },
  dropText: { fontSize: 15, color: '#1E2937', flex: 1 },
  dropPlaceholder: { color: '#94A3B8' },
  dropList: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    zIndex: 9999,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  dropItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropItemText: { fontSize: 14, color: '#334155' },
  dropEmpty: { padding: 12, fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },

  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  warningText: { color: '#D97706', fontSize: 14, flex: 1 },

  uploadBtn: {
    backgroundColor: '#7B2CBF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  cancelBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelBtnText: { color: '#64748B', fontSize: 16, fontWeight: '600' },

  recentSection: { marginTop: 10 },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  recentIcon: { marginRight: 14 },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 16, fontWeight: '600', color: '#1E2937' },
  recentMeta: { fontSize: 12, color: '#7B2CBF', fontWeight: '600', marginTop: 2 },
  recentBatch: { fontSize: 12, color: '#64748B', marginTop: 1 },
  recentMetaSmall: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playBtn: {
    width: 30, height: 30,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 30, height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: '#64748B', marginTop: 12, textAlign: 'center' },
});

const ts = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 13, textAlign: 'center' },
});
