import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
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

// Hidden Video that fires onPlaybackStatusUpdate to read durationMillis
function DurationProbe({
  uri,
  onDuration,
}: {
  uri: string;
  onDuration: (d: string) => void;
}) {
  const fired = useRef(false);
  const handleStatus = (status: AVPlaybackStatus) => {
    if (fired.current) return;
    if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
      fired.current = true;
      const totalSec = Math.floor(status.durationMillis / 1000);
      const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
      const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
      const s = (totalSec % 60).toString().padStart(2, '0');
      onDuration(`${h}:${m}:${s}`);
    }
  };
  return (
    <View
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
      pointerEvents="none"
    >
      <Video
        source={{ uri }}
        style={{ width: 1, height: 1 }}
        shouldPlay={false}
        isMuted
        onPlaybackStatusUpdate={handleStatus}
      />
    </View>
  );
}

// Full-screen video modal — truly responsive via onLayout
function VideoModal({
  visible,
  uri,
  title,
  onClose,
}: {
  visible: boolean;
  uri: string | null;
  title: string;
  onClose: () => void;
}) {
  const [playerSize, setPlayerSize] = useState({ w: 0, h: 0 });

  // Reset size when modal closes so onLayout fires fresh on reopen
  const handleClose = () => { setPlayerSize({ w: 0, h: 0 }); onClose(); };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      transparent={false}
      statusBarTranslucent
    >
      <View style={vm.root}>
        {/* Header */}
        <View style={vm.header}>
          <TouchableOpacity onPress={handleClose} style={vm.closeBtn}>
            <Ionicons name="close" size={24} color="#1E2937" />
          </TouchableOpacity>
          <Text style={vm.titleText} numberOfLines={1}>{title}</Text>
        </View>

        {/* playerArea fills all remaining space; onLayout gives us exact px */}
        <View
          style={vm.playerArea}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) setPlayerSize({ w: width, h: height });
          }}
        >
          {uri && playerSize.w > 0 ? (
            <Video
              source={{ uri }}
              style={{
                width: playerSize.w,
                height: playerSize.h,
                backgroundColor: '#000',
              }}
              // videoStyle makes the inner <video>/native layer fill the component box
              videoStyle={{ width: '100%', height: '100%' } as any}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              onError={() => { Alert.alert('Playback Error', 'Unable to play this video.'); handleClose(); }}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const vm = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 44 : 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleText: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1E2937' },
  playerArea: { flex: 1, backgroundColor: '#000' },
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
    let fileBlob: Blob | null = null;
    try {
      fileBlob = await (await fetch(selectedFile.uri)).blob();
    } catch {
      Alert.alert('Error', 'Unable to read selected video file.');
      return;
    }

    const formData = new FormData();
    if (fileBlob) formData.append('file', fileBlob, fileName);
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
      <ToastView />
      {/* Duration probe — rendered outside scroll so it's always mounted */}
      {probeUri && (
        <DurationProbe
          uri={probeUri}
          onDuration={(d) => {
            setDuration(d);
            setProbeUri(null);
            setProbeFetching(false);
          }}
        />
      )}

      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Upload Recording</Text>
        <Text style={s.headerSubtitle}>Share class recordings with students</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 16,
  },
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? 55 : 20, left: 20, zIndex: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF', textAlign: 'center', marginTop: 4 },

  container: { flex: 1 },
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
