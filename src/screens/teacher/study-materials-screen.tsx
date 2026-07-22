import React, { useEffect, useState } from 'react';
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
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { api, getApiBaseUrl } from '@/services/api';

interface StudyMaterialsScreenProps {
  onClose?: () => void;
}

interface Material {
  id: number;
  title: string;
  description: string;
  type: string;
  course: string;
  batch: string;
  fileName: string;
  fileUri: string;
  downloads: number;
}

const API_BASE_URL = getApiBaseUrl().replace('/api', '');

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1];

const TYPE_ICON: Record<string, { name: any; color: string; bg: string }> = {
  PDF: { name: 'document-text', color: '#EF4444', bg: '#FEE2E2' },
  PPT: { name: 'easel', color: '#F97316', bg: '#FFEDD5' },
  DOC: { name: 'document', color: '#3B82F6', bg: '#DBEAFE' },
  VIDEO: { name: 'videocam', color: '#8B5CF6', bg: '#EDE9FE' },
  IMAGE: { name: 'image', color: '#10B981', bg: '#D1FAE5' },
  ZIP: { name: 'archive', color: '#64748B', bg: '#F1F5F9' },
};

export default function StudyMaterialsScreen({ onClose }: StudyMaterialsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // form state
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [courseOptions, setCourseOptions] = useState<{ id: number; title: string }[]>([]);
  const [batchOptions, setBatchOptions] = useState<{ id: number; batchName: string }[]>([]);

  const fileTypes = ['PDF', 'DOC', 'PPT', 'VIDEO', 'IMAGE', 'ZIP'];

  useEffect(() => {
    loadMaterials();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.getMyCoursesBatches();
      if (res?.courses) setCourseOptions(res.courses);
    } catch (e) {
      console.error('Failed to load teacher courses', e);
    }
  };

  const handleCourseSelect = async (selectedCourse: string) => {
    setCourse(selectedCourse);
    setBatch('');
    setBatchOptions([]);
    setShowCourseDropdown(false);
    try {
      const res = await api.getMyCoursesBatches(selectedCourse);
      if (res?.batches) setBatchOptions(res.batches);
    } catch (e) {
      console.error('Failed to load batches for course', e);
    }
  };

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await api.getStudyMaterials();
      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        description: item.description || '',
        type: (item.fileType || item.type || 'PDF').toUpperCase(),
        course: item.course || '',
        batch: item.batch || '',
        fileName: item.fileName || 'file',
        fileUri: item.id ? api.getMaterialDownloadUrl(item.id) : '',
        downloads: item.downloads || 0,
      }));
      setMaterials(mapped);
    } catch (error) {
      Alert.alert('Error', 'Failed to load materials from server');
    } finally {
      setIsLoading(false);
    }
  };

  const totalDownloads = materials.reduce((sum, m) => sum + m.downloads, 0);

  // Filter tabs: "All" + unique course names from teacher's assigned courses
  const filterTabs = [
    'All',
    ...Array.from(new Set(materials.map(m => m.course).filter(Boolean))),
  ];

  const filteredMaterials = materials.filter(item => {
    const search = searchQuery.toLowerCase().trim();
    const matchesSearch =
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.course.toLowerCase().includes(search) ||
      item.batch.toLowerCase().includes(search);
    const matchesFilter = activeFilter === 'All' || item.course === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['*/*'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length > 0) setSelectedFile(result.assets[0]);
    } catch {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setSelectedFile(null);
    setCourse(''); setBatch(''); setBatchOptions([]); setFileType('PDF');
    setShowCourseDropdown(false); setShowBatchDropdown(false);
  };

  const handleUploadMaterial = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter title');
    if (!selectedFile) return Alert.alert('Error', 'Please select file');
    if (!course.trim()) return Alert.alert('Error', 'Please select course');
    if (!batch.trim()) return Alert.alert('Error', 'Please select batch');

    try {
      const fileBlob = await (await fetch(selectedFile.uri)).blob();
      const formData = new FormData();
      formData.append('file', fileBlob, selectedFile.name || 'material');
      formData.append('title', title.trim());
      formData.append('description', description.trim() || 'No description provided.');
      formData.append('course', course.trim());
      formData.append('batch', batch.trim());
      formData.append('fileType', fileType);

      const res = await api.uploadStudyMaterial(formData);
      setMaterials(prev => [{
        id: res?.id || Date.now(),
        title: res?.title || title.trim(),
        description: res?.description || description.trim() || '',
        type: (res?.fileType || fileType).toUpperCase(),
        course: res?.course || course.trim(),
        batch: res?.batch || batch.trim(),
        fileName: res?.fileName || selectedFile.name || 'material',
        fileUri: res?.id ? api.getMaterialDownloadUrl(res.id) : '',
        downloads: 0,
      }, ...prev]);
      loadMaterials().catch(() => { });
      Alert.alert('Success', 'Material uploaded successfully');
      setShowUploadModal(false);
      resetForm();
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      Alert.alert('Upload failed', msg.includes('HTTP') ? msg : 'Could not save file. Check backend connection.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Material', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteStudyMaterial(id);
            await loadMaterials();
          } catch {
            Alert.alert('Error', 'Failed to delete material');
          }
        },
      },
    ]);
  };

  const handleOpenMaterial = async (item: Material) => {
    const downloadUrl = item.id ? api.getMaterialDownloadUrl(item.id) : item.fileUri;
    if (!downloadUrl) return Alert.alert('Error', 'No file available.');
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = item.fileName;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
      } else {
        await Linking.openURL(downloadUrl);
      }
    } catch {
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const getIcon = (type: string) => TYPE_ICON[type] || TYPE_ICON['PDF'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* Gold accent line — same as dashboard */}
        <LinearGradient
          colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />

        {/* Title row */}
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Study Materials</Text>
            <Text style={styles.headerSubtitle}>
              {materials.length} files · {totalDownloads} total downloads
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowUploadModal(true)}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#B39DDB" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* ── FILTER TABS inside header (same purple bg) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterScrollView}
        >
          {filterTabs.map((tab) => {
            const count = tab === 'All'
              ? materials.length
              : materials.filter(m => m.course === tab).length;
            const label = tab === 'All' ? `All (${count})` : `${tab} (${count})`;
            const active = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── MATERIALS LIST ── */}
      <ScrollView style={styles.container} contentContainerStyle={styles.listContent}>
        {isLoading ? (
          <Text style={styles.noResults}>Loading materials...</Text>
        ) : filteredMaterials.length === 0 ? (
          <Text style={styles.noResults}>
            {searchQuery ? 'No materials found' : 'No materials available'}
          </Text>
        ) : (
          filteredMaterials.map(item => {
            const icon = getIcon(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.materialCard}
                activeOpacity={0.85}
                onPress={() => handleOpenMaterial(item)}
              >
                {/* Top row: icon + title/meta */}
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name} size={28} color={icon.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardMeta}>{item.course} · {item.batch}</Text>
                    {!!item.description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    )}
                  </View>
                </View>

                {/* Bottom row: type badge + downloads + delete */}
                <View style={styles.cardBottom}>
                  <View style={[styles.typeBadge, { backgroundColor: icon.bg }]}>
                    <Text style={[styles.typeText, { color: icon.color }]}>{item.type}</Text>
                  </View>
                  <View style={styles.downloadsBadge}>
                    <Ionicons name="download-outline" size={13} color="#64748B" />
                    <Text style={styles.downloadsText}>{item.downloads} downloads</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── UPLOAD MODAL ── */}
      <Modal visible={showUploadModal} animationType="slide" transparent onRequestClose={() => { setShowUploadModal(false); resetForm(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload Study Material</Text>
                <TouchableOpacity onPress={() => { setShowUploadModal(false); resetForm(); }}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.dropZone} onPress={handleFileSelect}>
                <Ionicons name="cloud-upload-outline" size={48} color="#7B2CBF" />
                <Text style={styles.dropText}>Tap to browse file</Text>
                <Text style={styles.supportedTypes}>PDF, PPT, DOC, Video, Image, ZIP</Text>
                {selectedFile && <Text style={styles.selectedFileText}>✓ {selectedFile.name}</Text>}
              </TouchableOpacity>

              <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="e.g. Python Basics Week 1" value={title} onChangeText={setTitle} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="What does this material cover?" value={description} onChangeText={setDescription} multiline />

              <View style={styles.row}>
                {/* Course dropdown */}
                <View style={styles.half}>
                  <Text style={styles.label}>Course <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => { setShowCourseDropdown(p => !p); setShowBatchDropdown(false); }}>
                    <Text style={[styles.dropdownText, !course && styles.dropdownPlaceholder]} numberOfLines={1}>
                      {course || 'Select Course'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>
                  {showCourseDropdown && (
                    <View style={styles.inlineDropdownList}>
                      {courseOptions.length === 0
                        ? <Text style={styles.dropdownEmptyText}>No courses assigned</Text>
                        : courseOptions.map(o => (
                          <TouchableOpacity key={o.id} style={styles.dropdownOption} onPress={() => handleCourseSelect(o.title)}>
                            <Text style={styles.dropdownOptionText}>{o.title}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>

                {/* Batch dropdown */}
                <View style={styles.half}>
                  <Text style={styles.label}>Batch <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={[styles.dropdownButton, !course && styles.dropdownDisabled]} onPress={() => { if (!course) return; setShowBatchDropdown(p => !p); setShowCourseDropdown(false); }}>
                    <Text style={[styles.dropdownText, !batch && styles.dropdownPlaceholder]} numberOfLines={1}>
                      {batch || (course ? 'Select Batch' : 'Course first')}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>
                  {showBatchDropdown && (
                    <View style={styles.inlineDropdownList}>
                      {batchOptions.length === 0
                        ? <Text style={styles.dropdownEmptyText}>No batches for this course</Text>
                        : batchOptions.map(o => (
                          <TouchableOpacity key={o.id} style={styles.dropdownOption} onPress={() => { setBatch(o.batchName); setShowBatchDropdown(false); }}>
                            <Text style={styles.dropdownOptionText}>{o.batchName}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.label}>File Type</Text>
              <View style={styles.fileTypeContainer}>
                {fileTypes.map(type => (
                  <TouchableOpacity key={type} style={[styles.fileTypeChip, fileType === type && styles.fileTypeChipActive]} onPress={() => setFileType(type)}>
                    <Text style={[styles.fileTypeText, fileType === type && styles.fileTypeTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadMaterial}>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                <Text style={styles.uploadBtnText}>Upload Material</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowUploadModal(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },

  // ── Header ──
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
    marginBottom: 16,
  },
  backButton: { padding: 4, marginRight: 12 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#E9D5FF', marginTop: 3 },
  addButton: {
    backgroundColor: '#F97316',
    width: 46, height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search inside header
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' },
  filterIconBtn: {
    width: 48, height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Filter tabs (inside header) ──
  filterScrollView: { marginBottom: 4 },
  filterScroll: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
  },
  filterChipActive: { backgroundColor: '#FFFFFF' },
  filterText: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#7B2CBF', fontWeight: '700' },

  // ── List ──
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  listContent: { padding: 16, paddingBottom: 32 },

  // ── Material Card ──
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: {
    width: 52, height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#7B2CBF', fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: { fontSize: 11, fontWeight: '700' },
  downloadsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  downloadsText: { fontSize: 12, color: '#64748B' },
  deleteBtn: {
    width: 32, height: 32,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noResults: {
    textAlign: 'center', color: '#94A3B8',
    fontSize: 15, marginTop: 60, fontWeight: '500',
  },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E2937' },

  dropZone: {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    paddingVertical: 36, alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1',
    marginBottom: 20, gap: 6,
  },
  dropText: { fontSize: 15, fontWeight: '600', color: '#1E2937' },
  supportedTypes: { fontSize: 12, color: '#64748B' },
  selectedFileText: { marginTop: 6, color: '#10B981', fontWeight: '600', fontSize: 13 },

  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 10 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 4,
  },
  textArea: { height: 76, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 12, zIndex: 20, overflow: 'visible' },
  half: { flex: 1, position: 'relative', zIndex: 20 },

  dropdownButton: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownDisabled: { opacity: 0.45 },
  dropdownText: { fontSize: 13, color: '#1E2937', flex: 1 },
  dropdownPlaceholder: { color: '#94A3B8' },
  inlineDropdownList: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    zIndex: 1000, marginTop: 2,
    borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, backgroundColor: '#FFFFFF',
    overflow: 'hidden', maxHeight: 180,
  },
  dropdownOption: {
    paddingVertical: 11, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  dropdownOptionText: { fontSize: 13, color: '#334155' },
  dropdownEmptyText: { padding: 12, fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

  fileTypeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, marginTop: 4 },
  fileTypeChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  fileTypeChipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  fileTypeText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  fileTypeTextActive: { color: '#FFFFFF' },

  uploadBtn: {
    backgroundColor: '#7B2CBF', height: 54, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 10,
  },
  uploadBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    height: 50, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
});
