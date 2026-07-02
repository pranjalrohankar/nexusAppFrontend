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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEY = 'study_materials';

export default function StudyMaterialsScreen({ onClose }: StudyMaterialsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [fileType, setFileType] = useState('PDF');

  const fileTypes = ['PDF', 'DOC', 'PPT', 'VIDEO', 'IMAGE', 'ZIP'];

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        setMaterials(JSON.parse(savedData));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load materials');
    }
  };

  const saveMaterials = async (data: Material[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getFilters = () => {
    const allCount = materials.length;
    const pdfCount = materials.filter(m => m.type === 'PDF').length;
    const pptCount = materials.filter(m => m.type === 'PPT').length;

    return [`All (${allCount})`, `PDF (${pdfCount})`, `PPT (${pptCount})`];
  };

  const filters = getFilters();

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Unable to read file data'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];

        if (Platform.OS === 'web' && pickedFile.uri) {
          try {
            const response = await fetch(pickedFile.uri);
            const blob = await response.blob();
            const dataUrl = await blobToDataURL(blob);
            setSelectedFile({ ...pickedFile, uri: dataUrl });
          } catch (error) {
            setSelectedFile(pickedFile);
          }
        } else {
          setSelectedFile(pickedFile);
        }
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

    const newMaterial: Material = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim() || 'No description provided.',
      type: fileType,
      course: course.trim(),
      batch: batch.trim(),
      fileName: selectedFile.name,
      fileUri: selectedFile.uri,
      downloads: 0,
    };

    const updatedMaterials = [newMaterial, ...materials];

    try {
      setMaterials(updatedMaterials);
      await saveMaterials(updatedMaterials);

      Alert.alert('Success', 'Material uploaded successfully');

      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setCourse('');
      setBatch('');
      setFileType('PDF');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload material');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this material?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMaterials = materials.filter(item => item.id !== id);

              setMaterials(updatedMaterials);
              await saveMaterials(updatedMaterials);

              Alert.alert('Success', 'Material deleted successfully');
            } catch (error) {
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
        Alert.alert('Error', 'No file available to download.');
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const createDownload = (href: string) => {
          const link = document.createElement('a');
          link.href = href;
          link.download = item.fileName || 'material.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        if (item.fileUri.startsWith('data:')) {
          createDownload(item.fileUri);
          return;
        }

        try {
          const response = await fetch(item.fileUri);
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          createDownload(downloadUrl);
          window.URL.revokeObjectURL(downloadUrl);
        } catch (webError) {
          createDownload(item.fileUri);
        }
        return;
      }

      const supported = await Linking.canOpenURL(item.fileUri);
      if (!supported) {
        Alert.alert('Error', 'No app available to open this file.');
        return;
      }

      await Linking.openURL(item.fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const filteredMaterials = materials.filter(item => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(search) ||
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

        <View>
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
          {filteredMaterials.length === 0 ? (
            <Text style={styles.noResults}>No materials found</Text>
          ) : (
            filteredMaterials.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.materialCard}
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

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={event => {
                    event.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* <TouchableOpacity style={styles.uploadNewBtn} onPress={() => setShowUploadModal(true)}>
          <Ionicons name="cloud-upload-outline" size={24} color="#7B2CBF" />
          <Text style={styles.uploadNewText}>Upload New Material</Text>
        </TouchableOpacity> */}
      </ScrollView>

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
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Course"
                    value={course}
                    onChangeText={setCourse}
                  />
                </View>

                <View style={styles.half}>
                  <Text style={styles.label}>
                    Batch <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Batch"
                    value={batch}
                    onChangeText={setBatch}
                  />
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
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: { padding: 4 },

  headerTitle: {
    fontSize: 22,
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
    marginTop: 40,
  },
});