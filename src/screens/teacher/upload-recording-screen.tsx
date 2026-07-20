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
import DateTimePicker from '@react-native-community/datetimepicker';
import { api, getApiBaseUrl } from '@/services/api';

const API_BASE = getApiBaseUrl().replace('/api', '');
const IS_WEB = Platform.OS === 'web';

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const show = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
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
  id: number;
  title: string;
  classDate?: string;
  duration?: string;
  course: string;
  batch: string;
  uploadedAt?: string;
}

// Duration probe using expo-video
function DurationProbe({ uri, onDuration }: { uri: string; onDuration: (d: string) => void }) {
  const player = useVideoPlayer(uri, p => { p.muted = true; });

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.duration && player.duration > 0) {
        clearInterval(interval);
        const totalSec = Math.floor(player.duration);
        const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        onDuration(`${h}:${m}:${s}`);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [player]);

  return null;
}

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
      setIsPlaying(!player.paused);
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
            <TouchableOpacity onPress={() => { try { player.enterFullscreen?.(); } catch {} }} style={vm.iconBtn}>
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

// ── Shared modal wrapper ──────────────────────────────────────────────────────
function VideoModal({ visible, uri, title, onClose }: { visible: boolean; uri: string | null; title: string; onClose: () => void }) {
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
            </View>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <video
                src={uri}
                controls
                autoPlay
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classDate, setClassDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [probeUri, setProbeUri] = useState<string | null>(null);
  const [probeFetching, setProbeFetching] = useState(false);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const [recentUploads, setRecentUploads] = useState<ClassRecording[]>([]);
  const [loading, setLoading] = useState(false);

  const [courseOptions, setCourseOptions] = useState<{ id: number; title: string }[]>([]);
  const [batchOptions, setBatchOptions] = useState<{ id: number; batchName: string }[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);

  useEffect(() => {
    fetchRecentUploads();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.getMyCoursesBatches();
      if (res?.courses) setCourseOptions(res.courses);
    } catch {}
  };

  const handleCourseSelect = async (sel: string) => {
    setCourse(sel);
    setBatch('');
    setBatchOptions([]);
    setShowCourseDropdown(false);
    try {
      const res = await api.getMyCoursesBatches(sel);
      if (res?.batches) setBatchOptions(res.batches);
    } catch {}
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setSelectedFile(asset);
      setDuration('');
      setProbeFetching(true);
      setProbeUri(asset.uri);
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

  const getStreamUrl = (id: number) => `${API_BASE}/api/recordings/stream/${id}`;

  const handleDelete = (id: number, recTitle: string) => {
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

  const handleUpload = async () => {
    if (!selectedFile) return Alert.alert('Error', 'Please select a video file.');
    if (!course.trim()) return Alert.alert('Error', 'Please select a course.');
    if (!batch.trim()) return Alert.alert('Error', 'Please select a batch.');

    const fileName = selectedFile.name || `recording-${Date.now()}.mp4`;
    const formData = new FormData();

    if (IS_WEB) {
      try {
        const fileBlob = await (await fetch(selectedFile.uri)).blob();
        formData.append('file', fileBlob, fileName);
      } catch {
        Alert.alert('Error', 'Unable to read selected video file.');
        return;
      }
    } else {
      // On native, append URI directly — React Native FormData handles it
      formData.append('file', { uri: selectedFile.uri, name: fileName, type: selectedFile.mimeType || 'video/mp4' } as any);
    }
    formData.append('title', title.trim() || 'Untitled Recording');
    formData.append('description', description.trim());
    formData.append('classDate', classDate.toISOString().slice(0, 10));
    formData.append('duration', duration.trim() || '00:00:00');
    formData.append('course', course.trim());
    formData.append('batch', batch.trim());

    try {
      setLoading(true);
      await api.uploadClassRecording(formData);
      await fetchRecentUploads();
      setSelectedFile(null);
      setProbeUri(null);
      setProbeFetching(false);
      setTitle('');
      setDescription('');
      setDuration('');
      setCourse('');
      setBatch('');
      setBatchOptions([]);
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

  const formatDuration = (text: string) => {
    let f = text.replace(/[^0-9:]/g, '');
    if (f.length > 8) f = f.slice(0, 8);
    setDuration(f);
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      <ToastView />
      {probeUri && (
        <DurationProbe
          uri={probeUri}
          onDuration={(d) => { setDuration(d); setProbeUri(null); setProbeFetching(false); }}
        />
      )}

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
        {/* Upload Area */}
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

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>Class Date <Text style={s.req}>*</Text></Text>
              <TouchableOpacity style={s.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: '#1E2937', fontSize: 15 }}>{formatDate(classDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.half}>
              <Text style={s.label}>
                Duration (HH:MM:SS)
                {probeFetching && <Text style={{ color: '#7B2CBF', fontSize: 11 }}> fetching…</Text>}
              </Text>
              <TextInput
                style={s.input}
                placeholder={probeFetching ? 'Fetching...' : 'Auto-fetched from video'}
                value={duration}
                onChangeText={formatDuration}
                keyboardType="numbers-and-punctuation"
                maxLength={8}
              />
            </View>
          </View>
        </View>

        {/* Assign to Class */}
        <View style={[s.section, { zIndex: 30 }]}>
          <Text style={s.sectionTitle}>ASSIGN TO CLASS</Text>
          <View style={s.row}>
            <View style={[s.half, { zIndex: 30 }]}>
              <Text style={s.label}>Course <Text style={s.req}>*</Text></Text>
              <TouchableOpacity
                style={s.dropBtn}
                onPress={() => { setShowCourseDropdown(p => !p); setShowBatchDropdown(false); }}
              >
                <Text style={[s.dropText, !course && s.dropPlaceholder]} numberOfLines={1}>
                  {course || 'Select Course'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              {showCourseDropdown && (
                <View style={s.dropList}>
                  {courseOptions.length === 0
                    ? <Text style={s.dropEmpty}>No courses assigned</Text>
                    : courseOptions.map(o => (
                      <TouchableOpacity key={o.id} style={s.dropItem} onPress={() => handleCourseSelect(o.title)}>
                        <Text style={s.dropItemText}>{o.title}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>

            <View style={[s.half, { zIndex: 20 }]}>
              <Text style={s.label}>Batch <Text style={s.req}>*</Text></Text>
              <TouchableOpacity
                style={[s.dropBtn, !course && s.dropDisabled]}
                onPress={() => { if (!course) return; setShowBatchDropdown(p => !p); setShowCourseDropdown(false); }}
              >
                <Text style={[s.dropText, !batch && s.dropPlaceholder]} numberOfLines={1}>
                  {batch || (course ? 'Select Batch' : 'Course first')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
              {showBatchDropdown && (
                <View style={s.dropList}>
                  {batchOptions.length === 0
                    ? <Text style={s.dropEmpty}>No batches for this course</Text>
                    : batchOptions.map(o => (
                      <TouchableOpacity key={o.id} style={s.dropItem} onPress={() => { setBatch(o.batchName); setShowBatchDropdown(false); }}>
                        <Text style={s.dropItemText}>{o.batchName}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
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
          <Text style={s.sectionTitle}>RECENT UPLOADS</Text>
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
                    {item.duration || '00:00:00'} • {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-GB') : ''}
                  </Text>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity
                    style={s.playBtn}
                    onPress={() => {
                      setPreviewTitle(item.title || 'Recording');
                      setPreviewUri(getStreamUrl(item.id));
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="eye-outline" size={18} color="#7B2CBF" />
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
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: -12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    maxHeight: 180,
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
