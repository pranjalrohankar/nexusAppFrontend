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
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { api, getApiBaseUrl } from '@/services/api';

const { width } = Dimensions.get('window');

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

export default function StudyMaterialsScreen({ onClose }: StudyMaterialsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);

  const fileTypes = ['PDF', 'DOC', 'PPT', 'VIDEO', 'IMAGE', 'ZIP'];
  const courseOptions = Array.from(
    new Set([
      ...(materials.map(item => item.course).filter(Boolean) as string[]),
      'Course A',
      'Course B',
      'Course C',
      course,
    ].filter(Boolean))
  );
  const batchOptions = Array.from(
    new Set([
      ...(materials.map(item => item.batch).filter(Boolean) as string[]),
      'Batch 1',
      'Batch 2',
      'Batch 3',
      batch,
    ].filter(Boolean))
  );

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await api.getStudyMaterials();
      const mappedMaterials = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        description: item.description || 'No description provided.',
        type: item.fileType || item.type || 'PDF',
        course: item.course || '',
        batch: item.batch || '',
        fileName: item.fileName || 'file',
        fileUri: item.id ? `${API_BASE_URL}/api/materials/download/${item.id}` : '',
        downloads: item.downloads || 0,
      }));
      setMaterials(mappedMaterials);
    } catch (error) {
      console.error('Failed to load materials', error);
      Alert.alert('Error', 'Failed to load materials from server');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilters = () => {
    const allCount = materials.length;
    const pdfCount = materials.filter(m => m.type === 'PDF').length;
    const pptCount = materials.filter(m => m.type === 'PPT').length;
    return [`All (${allCount})`, `PDF (${pdfCount})`, `PPT (${pptCount})`];
  };

  const filters = getFilters();

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleUploadMaterial = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter title');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Error', 'Please select file');
      return;
    }
    if (!course.trim()) {
      Alert.alert('Error', 'Please enter course');
      return;
    }
    if (!batch.trim()) {
      Alert.alert('Error', 'Please enter batch');
      return;
    }

    try {
      const fileResponse = await fetch(selectedFile.uri);
      const fileBlob = await fileResponse.blob();

      const formData = new FormData();
      formData.append('file', fileBlob, selectedFile.name || 'material');
      formData.append('title', title.trim());
      formData.append('description', description.trim() || 'No description provided.');
      formData.append('course', course.trim());
      formData.append('batch', batch.trim());
      formData.append('fileType', fileType);

      const uploadResponse = await api.uploadStudyMaterial(formData);
      const uploadedMaterial: Material = {
        id: uploadResponse?.id || Date.now(),
        title: uploadResponse?.title || title.trim(),
        description: uploadResponse?.description || description.trim() || 'No description provided.',
        type: uploadResponse?.fileType || fileType,
        course: uploadResponse?.course || course.trim(),
        batch: uploadResponse?.batch || batch.trim(),
        fileName: uploadResponse?.fileName || selectedFile.name || 'material',
        fileUri: uploadResponse?.id ? `${API_BASE_URL}/api/materials/download/${uploadResponse.id}` : '',
        downloads: 0,
      };

      setMaterials(prev => [uploadedMaterial, ...prev]);
      try {
        await loadMaterials();
      } catch {
        // keep the newly uploaded item visible even if the refresh call fails
      }

      Alert.alert('Success', 'Material uploaded successfully');

      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setCourse('');
      setBatch('');
      setFileType('PDF');
    } catch (error: any) {
      console.error('Failed to upload material', error);
      const message = error?.message || 'Unknown error';
      Alert.alert('Upload failed', message.includes('HTTP')
        ? message
        : 'The file could not be saved. Please make sure the backend is running and the app can reach it.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteStudyMaterial(id);
              await loadMaterials();
              Alert.alert('Success', 'Material deleted successfully');
            } catch (error) {
              console.error('Failed to delete material', error);
              Alert.alert('Error', 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  const handleOpenMaterial = async (item: Material) => {
    try {
      if (!item.fileUri) {
        Alert.alert('Error', 'No file available to open.');
        return;
      }

      if (Platform.OS === 'web') {
        const response = await fetch(item.fileUri);
        if (!response.ok) {
          throw new Error('File download failed');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      await Linking.openURL(item.fileUri);
    } catch (error) {
      console.error('Failed to open material:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const filteredMaterials = materials.filter(item => {
    const search = searchQuery.toLowerCase().trim();

    const matchesSearch = 
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.course.toLowerCase().includes(search) ||
      item.batch.toLowerCase().includes(search);

    if (activeFilter.startsWith('PDF')) {
      return matchesSearch && item.type === 'PDF';
    }
    if (activeFilter.startsWith('PPT')) {
      return matchesSearch && item.type === 'PPT';
    }
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
  <TouchableOpacity onPress={onClose} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
  </TouchableOpacity>

  <View style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>Study Materials</Text>
    <Text style={styles.headerSubtitle}>{materials.length} files</Text>
  </View>

  <TouchableOpacity style={styles.addButton} onPress={() => setShowUploadModal(true)}>
    <Ionicons name="add" size={24} color="#FFFFFF" />
  </TouchableOpacity>
</View>

      <ScrollView style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="#7B2CBF" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.materialsList}>
          {isLoading ? (
            <Text style={styles.noResults}>Loading materials...</Text>
          ) : filteredMaterials.length === 0 ? (
            <Text style={styles.noResults}>
              {searchQuery ? 'No materials found matching your search' : 'No materials available'}
            </Text>
          ) : (
            filteredMaterials.map(item => (
              <View key={item.id} style={styles.materialCard}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  onPress={() => handleOpenMaterial(item)}
                >
                <View style={styles.materialIcon}>
                  <Ionicons
                    name={item.type === 'PDF' ? 'document-text' : 'reader'}
                    size={32}
                    color="#7B2CBF"
                  />
                </View>

                <View style={styles.materialInfo}>
                  <Text style={styles.materialTitle}>{item.title}</Text>
                  <Text style={styles.materialDesc}>{item.description}</Text>

                  <Text style={styles.fileName}>File: {item.fileName}</Text>
                  <Text style={styles.fileName}>Course: {item.course}</Text>
                  <Text style={styles.fileName}>Batch: {item.batch}</Text>

                  <View style={styles.materialMeta}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                    <Text style={styles.downloads}>{item.downloads} downloads</Text>
                  </View>
                </View>

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload Study Material</Text>
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.dropZone} onPress={handleFileSelect}>
                <View style={styles.uploadIcon}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#7B2CBF" />
                </View>
                <Text style={styles.dropText}>Tap to browse file</Text>
                <Text style={styles.supportedTypes}>PDF, PPT, DOC, Video, Image, ZIP</Text>
                {selectedFile && (
                  <Text style={styles.selectedFileText}>
                    Selected: {selectedFile.name}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Python Basics Week 1"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What does this material cover?"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>
                    Course <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowCourseDropdown(prev => !prev);
                      setShowBatchDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, !course && styles.dropdownPlaceholder]}>
                      {course || 'Select Course'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>
                  {showCourseDropdown && (
                    <View style={styles.inlineDropdownList}>
                      {courseOptions.map(option => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setCourse(option);
                            setShowCourseDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.half}>
                  <Text style={styles.label}>
                    Batch <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowBatchDropdown(prev => !prev);
                      setShowCourseDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, !batch && styles.dropdownPlaceholder]}>
                      {batch || 'Select Batch'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>
                  {showBatchDropdown && (
                    <View style={styles.inlineDropdownList}>
                      {batchOptions.map(option => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setBatch(option);
                            setShowBatchDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.label}>File Type</Text>
              <View style={styles.fileTypeContainer}>
                {fileTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.fileTypeChip,
                      fileType === type && styles.fileTypeChipActive,
                    ]}
                    onPress={() => setFileType(type)}
                  >
                    <Text
                      style={[
                        styles.fileTypeText,
                        fileType === type && styles.fileTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadMaterial}>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                <Text style={styles.uploadBtnText}>Upload Material</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUploadModal(false)}>
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitleContainer: {
  flex: 1,
  marginLeft: 16,        // ← Gap after back button
},


  backButton: { padding: 4 },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
  },

  addButton: {
    backgroundColor: '#F97316',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: { flex: 1 },

  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },

  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  filterScroll: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: '#7B2CBF',
  },

  filterText: {
    color: '#64748B',
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  materialsList: {
    paddingHorizontal: 20,
  },

  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  materialIcon: {
    marginRight: 16,
  },

  materialInfo: {
    flex: 1,
  },

  materialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2937',
  },

  materialDesc: {
    fontSize: 13,
    color: '#64748B',
    marginVertical: 4,
  },

  fileName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },

  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },

  typeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },

  typeText: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: '600',
  },

  downloads: {
    fontSize: 12,
    color: '#94A3B8',
  },

  deleteBtn: {
    padding: 8,
  },

  uploadNewBtn: {
    margin: 20,
    backgroundColor: '#F3E8FF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },

  uploadNewText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '92%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E2937',
  },

  dropZone: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginBottom: 24,
  },

  uploadIcon: {
    marginBottom: 16,
  },

  dropText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2937',
    marginBottom: 4,
  },

  supportedTypes: {
    fontSize: 13,
    color: '#64748B',
  },

  selectedFileText: {
    marginTop: 12,
    color: '#10B981',
    fontWeight: '600',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },

  required: {
    color: '#EF4444',
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },

  dropdownButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },

  dropdownText: {
    fontSize: 15,
    color: '#1E2937',
    flex: 1,
  },

  dropdownPlaceholder: {
    color: '#94A3B8',
  },

  inlineDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    maxHeight: 180,
  },

  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  dropdownOptionText: {
    fontSize: 14,
    color: '#334155',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  half: {
    flex: 1,
    position: 'relative',
  },

  fileTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },

  fileTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },

  fileTypeChipActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },

  fileTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  fileTypeTextActive: {
    color: '#FFFFFF',
  },

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

  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  cancelBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },

  noResults: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 60,
    fontWeight: '500',
  },
});