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
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '@/services/api';

const { width } = Dimensions.get('window');

interface UploadRecordingScreenProps {
  onClose: () => void;
}

interface ClassRecording {
  id: number;
  title: string;
  description?: string;
  classDate?: string;
  duration?: string;
  course: string;
  batch: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
}

export default function UploadRecordingScreen({ onClose }: UploadRecordingScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classDate, setClassDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('');
  const [course, setCourse] = useState('Full Stack Developing');
  const [batch, setBatch] = useState('Gen A');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewVideoUri, setPreviewVideoUri] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState('Preview Recording');
  const [previewVisible, setPreviewVisible] = useState(false);
  const videoRef = useRef<Video | null>(null);
  const [recentUploads, setRecentUploads] = useState<ClassRecording[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });

      if ('canceled' in result && result.canceled) {
        return;
      }

      const asset = result.assets && result.assets.length > 0 ? result.assets[0] : null;
      if (!asset) {
        return;
      }

      setSelectedFile(asset);
      const fileSizeInMB = ((asset.size ?? 0) / (1024 * 1024)).toFixed(2);
      Alert.alert('Success', `Selected: ${asset.name ?? 'Video file'}\nSize: ${fileSizeInMB} MB`);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const fetchRecentUploads = async () => {
    try {
      const recordings = await api.getClassRecordings();
      if (Array.isArray(recordings)) {
        setRecentUploads(recordings.sort((a, b) => {
          if (!a.uploadedAt || !b.uploadedAt) return 0;
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }));
      }
    } catch (error) {
      console.warn('Failed to load recordings', error);
    }
  };

  const handlePreviewVideo = (uri: string, title: string) => {
    setPreviewVideoUri(uri);
    setPreviewVideoTitle(title);
    setPreviewVisible(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a video file before uploading.');
      return;
    }

    const fileType = selectedFile.mimeType || selectedFile.type || 'video/mp4';
    const fileName = selectedFile.name || `recording-${Date.now()}.mp4`;

    let fileBlob: Blob | null = null;
    try {
      const response = await fetch(selectedFile.uri);
      fileBlob = await response.blob();
    } catch (error) {
      console.error('Failed to read selected file blob', error);
      Alert.alert('Error', 'Unable to read selected video file. Please try again.');
      return;
    }

    const formData = new FormData();
    if (fileBlob) {
      formData.append('file', fileBlob, fileName);
    }

    formData.append('title', title.trim() || 'Untitled Recording');
    formData.append('description', description.trim());
    formData.append('classDate', classDate.toISOString().slice(0, 10));
    formData.append('duration', duration.trim() || '00:00:00');
    formData.append('course', course.trim() || 'Unknown Course');
    formData.append('batch', batch.trim() || 'Unknown Batch');

    try {
      setLoading(true);
      await api.uploadClassRecording(formData);
      await fetchRecentUploads();
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setDuration('');
      Alert.alert('Success', `Recording uploaded successfully!`, [{ text: 'OK', onPress: onClose }]);
    } catch (err: any) {
      console.error('Upload failed', err);
      Alert.alert('Upload failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setClassDate(selectedDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (text: string) => {
    let formatted = text.replace(/[^0-9:]/g, '');
    if (formatted.length > 8) formatted = formatted.slice(0, 8);
    setDuration(formatted);
  };

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Recording</Text>
        <Text style={styles.headerSubtitle}>Share class recordings with students</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Upload Area - Now Fully Functional */}
        <TouchableOpacity style={styles.uploadArea} onPress={handleFileSelect} activeOpacity={0.9}>
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={48} color="#7B2CBF" />
          </View>
          <Text style={styles.uploadTitle}>Drop your video here</Text>
          <Text style={styles.uploadSubtitle}>or tap to browse files</Text>
          <Text style={styles.fileTypes}>MP4, MOV, MKV • Max 4 GB</Text>
          
          {selectedFile && (
            <Text style={styles.selectedFileText}>
              Selected: {selectedFile.name}
            </Text>
          )}

          {selectedFile && (
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => selectedFile?.uri && handlePreviewVideo(selectedFile.uri, 'Preview Selected Video')}
            >
              <Ionicons name="play-circle" size={18} color="#FFFFFF" />
              <Text style={styles.previewButtonText}>Preview Selected Video</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Video Preview Modal */}
        {previewVisible && previewVideoUri && (
          <Modal
            visible={previewVisible}
            animationType="slide"
            onRequestClose={() => {
              setPreviewVisible(false);
              setPreviewVideoUri(null);
            }}
            transparent={false}
          >
            <SafeAreaView style={styles.videoModalContainer}>
              <View style={styles.videoModalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setPreviewVisible(false);
                    setPreviewVideoUri(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#1E2937" />
                </TouchableOpacity>
                <Text style={styles.videoModalTitle}>{previewVideoTitle}</Text>
              </View>

              <View style={styles.videoPlayerWrapper}>
                <Video
                  ref={videoRef}
                  source={{ uri: previewVideoUri }}
                  style={styles.videoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                />
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* Recording Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECORDING DETAILS</Text>

          <Text style={styles.label}>Recording Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Introduction to NumPy"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What topics were covered in this session..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Class Date <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: '#1E2937', fontSize: 15 }}>
                  {formatDate(classDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.half}>
              <Text style={styles.label}>Duration (HH:MM:SS)</Text>
              <TextInput
                style={styles.input}
                placeholder="01:30:00"
                value={duration}
                onChangeText={formatDuration}
                keyboardType="numbers-and-punctuation"
                maxLength={8}
              />
            </View>
          </View>
        </View>

        {/* Assign to Class */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ASSIGN TO CLASS</Text>
          <Text style={styles.label}>Course <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} value={course} onChangeText={setCourse} />

          <Text style={styles.label}>Batch <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} value={batch} onChangeText={setBatch} />
        </View>

        {/* Warning */}
        {!selectedFile && (
          <View style={styles.warning}>
            <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>Please select a video file before uploading.</Text>
          </View>
        )}

        {/* Buttons */}
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Upload Recording</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {/* Recent Uploads */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>RECENT UPLOADS</Text>
          {recentUploads.length > 0 ? (
            recentUploads.map((item) => (
              <View key={item.id} style={styles.recentCard}>
                <View style={styles.recentIcon}>
                  <Ionicons name="play-circle" size={28} color="#7B2CBF" />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>{item.title || 'Untitled Recording'}</Text>
                  <Text style={styles.recentMeta}>{item.course} • {item.batch}</Text>
                  <Text style={styles.recentMetaSmall}>
                    {item.duration || '00:00:00'} • {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-GB') : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.recentPlayButton}
                  onPress={() =>
                    item.fileUrl
                      ? handlePreviewVideo(item.fileUrl, item.title || 'Recording Preview')
                      : Alert.alert('Unavailable', 'This recording file is not available for preview.')
                  }
                >
                  <Ionicons name="eye-outline" size={22} color="#10B981" />
                  <Text style={styles.recentPlayText}>Watch</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recordings found yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* Date Picker */}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 16,
  },
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? 55 : 20, left: 20, zIndex: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF', textAlign: 'center', marginTop: 4 },

  container: { flex: 1 },
  scrollContent: { padding: 20 },

  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#1E2937', marginBottom: 4 },
  uploadSubtitle: { fontSize: 15, color: '#64748B' },
  fileTypes: { fontSize: 13, color: '#94A3B8', marginTop: 8 },
  selectedFileText: { marginTop: 12, color: '#10B981', fontWeight: '600' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E2937', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#FFFFFF',
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
  half: { flex: 1 },

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

  uploadButton: {
    backgroundColor: '#7B2CBF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  uploadButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  previewButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#7B2CBF',
    borderRadius: 14,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginRight: 12,
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2937',
  },
  videoPlayerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: width - 40,
    height: (width - 40) * (9 / 16),
    borderRadius: 16,
    backgroundColor: '#000',
  },

  cancelButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelButtonText: { color: '#64748B', fontSize: 16, fontWeight: '600' },

  recentSection: { marginTop: 10 },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  recentIcon: { marginRight: 14 },
  recentInfo: { flex: 1 },
  recentPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentPlayText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  recentTitle: { fontSize: 16, fontWeight: '600', color: '#1E2937' },
  recentMeta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  recentMetaSmall: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#64748B', marginTop: 12, textAlign: 'center' },
});