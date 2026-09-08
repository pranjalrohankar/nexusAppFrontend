import React, { useEffect, useState, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { api, getApiBaseUrl } from '@/services/api';
import { parseSyllabus } from '@/utils/syllabus-parser';
import { coursesData } from '@/screens/home/home-screen';

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
  moduleName?: string;
  topic?: string;
  fileName: string;
  fileUri: string;
  downloads: number;
}

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1];

const DEFAULT_MODULE_OPTIONS = [
  'Module 1: Core Fundamentals & Introduction',
  'Module 2: Core Concepts & Syntax',
  'Module 3: Advanced Applications & Frameworks',
  'Module 4: Practical Projects & Assignments',
  'Module 5: Industry Case Studies & Evaluation',
];

const TYPE_ICON: Record<string, { name: any; color: string; bg: string }> = {
  PDF: { name: 'document-text', color: '#EF4444', bg: '#FEE2E2' },
  PPT: { name: 'easel', color: '#F97316', bg: '#FFEDD5' },
  DOC: { name: 'document', color: '#3B82F6', bg: '#DBEAFE' },
  VIDEO: { name: 'videocam', color: '#8B5CF6', bg: '#EDE9FE' },
  IMAGE: { name: 'image', color: '#10B981', bg: '#D1FAE5' },
  ZIP: { name: 'archive', color: '#64748B', bg: '#F1F5F9' },
};

function normalizeModString(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[\:\–\—\-\|]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getModuleNumber(str: string): string | null {
  const match = str.match(/module\s*(\d+)/i);
  return match ? match[1] : null;
}

function findCanonicalModuleTitle(materialModName: string, adminModuleTitles: string[]): string {
  if (!materialModName) return adminModuleTitles[0] || 'Module 1';

  const normMat = normalizeModString(materialModName);
  const matNum = getModuleNumber(materialModName);

  for (const adminTitle of adminModuleTitles) {
    const normAdmin = normalizeModString(adminTitle);
    const adminNum = getModuleNumber(adminTitle);

    if (normMat === normAdmin) return adminTitle;
    if (matNum && adminNum && matNum === adminNum) return adminTitle;
  }

  return materialModName;
}

export default function StudyMaterialsScreen({ onClose }: StudyMaterialsScreenProps) {
  // Navigation Hierarchy State: 'COURSES' -> 'BATCHES' -> 'MODULES'
  const [navStep, setNavStep] = useState<'COURSES' | 'BATCHES' | 'MODULES'>('COURSES');
  const [selectedCourseCard, setSelectedCourseCard] = useState<string | null>(null);
  const [selectedBatchCard, setSelectedBatchCard] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [fileType, setFileType] = useState('PDF');

  // Module Selection State
  const [selectedModule, setSelectedModule] = useState(DEFAULT_MODULE_OPTIONS[0]);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [availableModules, setAvailableModules] = useState<string[]>(DEFAULT_MODULE_OPTIONS);

  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [courseModuleTopicsMap, setCourseModuleTopicsMap] = useState<Record<string, Record<string, string[]>>>({});

  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);
  const [allTeacherBatches, setAllTeacherBatches] = useState<any[]>([]);

  const fileTypes = ['PDF', 'DOC', 'PPT', 'VIDEO', 'IMAGE', 'ZIP'];

  useEffect(() => {
    loadMaterials();
    loadCoursesAndBatches();
  }, []);

  const loadCoursesAndBatches = async () => {
    try {
      const [cbRes, allCoursesRes, myBatchesRes] = await Promise.all([
        api.getMyCoursesBatches().catch(() => null),
        api.getAllCourses().catch(() => null),
        api.getMyBatches().catch(() => null),
      ]);

      const myCoursesList = cbRes?.courses ?? [];
      const allCoursesList = Array.isArray(allCoursesRes?.data) ? allCoursesRes.data : Array.isArray(allCoursesRes) ? allCoursesRes : [];
      const rawBatches = Array.isArray(myBatchesRes?.data) ? myBatchesRes.data : Array.isArray(myBatchesRes) ? myBatchesRes : [];

      setAllTeacherBatches(rawBatches);

      // Merge courses with full admin properties (including syllabusTopics added by admin and coursesData fallback)
      const mergedCourses = myCoursesList.map((c: any) => {
        const full = allCoursesList.find((ac: any) => ac.title?.toLowerCase() === c.title?.toLowerCase());
        const rawSyl = full?.syllabusTopics || c.syllabusTopics || (coursesData as any)[c.title]?.syllabusTopics || '';
        return {
          id: c.id,
          title: c.title,
          category: full?.category || c.category || 'Professional Training',
          syllabusTopics: rawSyl,
        };
      });

      setCourseOptions(mergedCourses.length > 0 ? mergedCourses : myCoursesList);
    } catch (e) {
      console.error('Failed to load courses & batches', e);
    }
  };

  const handleCourseSelectInForm = async (selectedCourseName: string) => {
    setCourse(selectedCourseName);
    setBatch('');
    setBatchOptions([]);
    setShowCourseDropdown(false);

    // Extract modules and topics added by admin for selected course
    const courseObj = courseOptions.find(c => c.title === selectedCourseName);
    let adminMods: string[] = [];
    const topicsMap: Record<string, string[]> = {};

    if (courseObj && courseObj.syllabusTopics) {
      const parsedMods = parseSyllabus(courseObj.syllabusTopics);
      if (parsedMods && parsedMods.length > 0) {
        parsedMods.forEach((m, idx) => {
          const modTitle = m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`;
          adminMods.push(modTitle);
          topicsMap[modTitle.toLowerCase()] = m.topics || [];
          topicsMap[m.title.toLowerCase()] = m.topics || [];
        });
      }
    }

    setCourseModuleTopicsMap(prev => ({ ...prev, [selectedCourseName.toLowerCase()]: topicsMap }));

    if (adminMods.length > 0) {
      setAvailableModules(adminMods);
      setSelectedModule(adminMods[0]);
      const initialTopics = topicsMap[adminMods[0].toLowerCase()] || [];
      setTopicOptions(initialTopics);
      setSelectedTopic('');
    } else {
      setAvailableModules(DEFAULT_MODULE_OPTIONS);
      setSelectedModule(DEFAULT_MODULE_OPTIONS[0]);
      setTopicOptions([]);
      setSelectedTopic('');
    }

    try {
      const res = await api.getMyCoursesBatches(selectedCourseName);
      if (res?.batches) setBatchOptions(res.batches);
    } catch (e) {
      console.error('Failed to load batches for course', e);
    }
  };

  const handleModuleSelectInForm = (modTitle: string) => {
    setSelectedModule(modTitle);
    setShowModuleDropdown(false);
    setSelectedTopic('');

    const normCourse = course.trim().toLowerCase();
    const courseTopics = courseModuleTopicsMap[normCourse] || {};
    const topics = courseTopics[modTitle.toLowerCase()] || [];
    setTopicOptions(topics);
  };

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await api.getStudyMaterials();
      const mapped = (data || []).map((item: any, idx: number) => ({
        id: item.id,
        title: item.title || '',
        description: (item.description === 'No description provided.' ? '' : item.description) || '',
        type: (item.fileType || item.type || 'PDF').toUpperCase(),
        course: item.course || '',
        batch: item.batch || '',
        moduleName: item.moduleName || item.module || item.topic || item.chapter || DEFAULT_MODULE_OPTIONS[0],
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

  // ── Hierarchy Filtering ──────────────────────────────────────────────────
  // Filter materials based on selected Course Card and selected Batch Card
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.course.toLowerCase().includes(search) ||
        (item.moduleName ?? '').toLowerCase().includes(search) ||
        item.batch.toLowerCase().includes(search);

      const matchesCourse =
        !selectedCourseCard ||
        selectedCourseCard === 'ALL' ||
        item.course.trim().toLowerCase() === selectedCourseCard.trim().toLowerCase();

      const matchesBatch =
        !selectedBatchCard ||
        selectedBatchCard === 'ALL' ||
        item.batch.trim().toLowerCase() === selectedBatchCard.trim().toLowerCase();

      return matchesSearch && matchesCourse && matchesBatch;
    });
  }, [materials, searchQuery, selectedCourseCard, selectedBatchCard]);

  // Group materials module-wise for the final step
  const groupedByModule = useMemo(() => {
    const groups: Record<string, Material[]> = {};

    // Get admin syllabus modules if a course card is selected
    const activeCourseObj = courseOptions.find(
      c => c.title.trim().toLowerCase() === (selectedCourseCard || '').trim().toLowerCase()
    );
    let adminModuleTitles: string[] = [];
    if (activeCourseObj && activeCourseObj.syllabusTopics) {
      const parsed = parseSyllabus(activeCourseObj.syllabusTopics);
      if (parsed && parsed.length > 0) {
        adminModuleTitles = parsed.map((m, idx) =>
          m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
        );
      }
    }

    // Initialize admin module sections
    adminModuleTitles.forEach(t => { groups[t] = []; });

    filteredMaterials.forEach(m => {
      const rawMod = m.moduleName || (adminModuleTitles.length > 0 ? adminModuleTitles[0] : DEFAULT_MODULE_OPTIONS[0]);
      const canonicalMod = findCanonicalModuleTitle(rawMod, adminModuleTitles);
      if (!groups[canonicalMod]) groups[canonicalMod] = [];
      groups[canonicalMod].push(m);
    });

    // Remove empty admin module sections if other modules contain files, preventing duplicate empty cards
    const finalGroups: Record<string, Material[]> = {};
    const entries = Object.entries(groups);
    const hasAnyFiles = entries.some(([_, items]) => items.length > 0);

    entries.forEach(([modTitle, items]) => {
      if (items.length > 0 || !hasAnyFiles) {
        finalGroups[modTitle] = items;
      }
    });

    return finalGroups;
  }, [filteredMaterials, selectedCourseCard, courseOptions]);

  // ── Step Navigation Handlers ─────────────────────────────────────────────
  const handleOpenUploadModal = async () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setFileType('PDF');

    // Determine Default Course (active selected course card or first assigned course)
    let initialCourse = '';
    if (selectedCourseCard && selectedCourseCard !== 'ALL') {
      initialCourse = selectedCourseCard;
    } else if (courseOptions.length > 0) {
      initialCourse = courseOptions[0].title;
    }

    if (initialCourse) {
      setCourse(initialCourse);

      // Populate Admin Modules for initialCourse
      const courseObj = courseOptions.find(c => c.title === initialCourse);
      let adminMods: string[] = [];
      if (courseObj && courseObj.syllabusTopics) {
        const parsedMods = parseSyllabus(courseObj.syllabusTopics);
        if (parsedMods && parsedMods.length > 0) {
          adminMods = parsedMods.map((m, idx) =>
            m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
          );
        }
      }
      if (adminMods.length > 0) {
        setAvailableModules(adminMods);
        setSelectedModule(adminMods[0]);
      } else {
        setAvailableModules(DEFAULT_MODULE_OPTIONS);
        setSelectedModule(DEFAULT_MODULE_OPTIONS[0]);
      }

      // Fetch and pre-select Batch for initialCourse
      try {
        const res = await api.getMyCoursesBatches(initialCourse);
        const batches = res?.batches || [];
        setBatchOptions(batches);

        let initialBatch = '';
        if (selectedBatchCard && selectedBatchCard !== 'ALL') {
          initialBatch = selectedBatchCard;
        } else if (batches.length > 0) {
          initialBatch = batches[0].batchName;
        } else if (allTeacherBatches.length > 0) {
          initialBatch = allTeacherBatches[0].batchName || allTeacherBatches[0].name || '';
        }
        setBatch(initialBatch);
      } catch (e) {
        console.error('Failed to load initial batch options', e);
      }
    }

    setShowUploadModal(true);
  };

  const handleSelectCourseCard = async (courseTitle: string) => {
    setSelectedCourseCard(courseTitle);
    setSelectedBatchCard(null);
    setNavStep('BATCHES');

    if (courseTitle !== 'ALL') {
      try {
        const res = await api.getMyCoursesBatches(courseTitle);
        if (res?.batches) setBatchOptions(res.batches);
      } catch (_) {}
    }
  };

  const handleSelectBatchCard = (batchName: string) => {
    setSelectedBatchCard(batchName);
    setNavStep('MODULES');
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['*/*'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setSelectedFile(null);
    setCourse(''); setBatch(''); setBatchOptions([]); setFileType('PDF');
    setSelectedModule(DEFAULT_MODULE_OPTIONS[0]); setSelectedTopic(''); setTopicOptions([]);
    setShowCourseDropdown(false); setShowBatchDropdown(false); setShowModuleDropdown(false); setShowTopicDropdown(false);
  };

  const handleUploadMaterial = async () => {
    if (!selectedFile) return Alert.alert('Error', 'Please select a file to upload');
    if (!course.trim()) return Alert.alert('Error', 'Please select course');
    if (!batch.trim()) return Alert.alert('Error', 'Please select batch');

    const topicText = selectedTopic.trim();
    const uploadTitle = title.trim() || topicText || selectedFile.name || 'Study Material';
    const finalModule = selectedModule;

    try {
      const fileBlob = await (await fetch(selectedFile.uri)).blob();
      const formData = new FormData();
      formData.append('file', fileBlob, selectedFile.name || 'material');
      formData.append('title', uploadTitle);
      formData.append('description', topicText ? `Topic: ${topicText}\n${description.trim()}` : description.trim());
      formData.append('course', course.trim());
      formData.append('batch', batch.trim());
      formData.append('moduleName', finalModule);
      formData.append('module', finalModule);
      formData.append('topic', topicText || finalModule);
      formData.append('fileType', fileType);

      const res = await api.uploadStudyMaterial(formData);
      setMaterials(prev => [{
        id: res?.id || Date.now(),
        title: res?.title || uploadTitle,
        description: res?.description || description.trim(),
        type: (res?.fileType || fileType).toUpperCase(),
        course: res?.course || course.trim(),
        batch: res?.batch || batch.trim(),
        moduleName: res?.moduleName || res?.module || finalModule,
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
    try {
      if (Platform.OS === 'web') {
        if (downloadUrl) {
          try {
            const res = await fetch(downloadUrl);
            if (res.ok) {
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              window.open(objectUrl, '_blank');
              return;
            }
          } catch (_) {}
        }
        const content = `Nexus Training Institute - Study Material\n\nTitle: ${item.title}\nCourse: ${item.course || ''}\nModule: ${item.moduleName || item.topic || ''}\nBatch: ${item.batch || ''}\n\nDescription & Notes:\n${item.description || 'Official course study material and module reference notes.'}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
      } else if (downloadUrl) {
        await Linking.openURL(downloadUrl);
      }
    } catch {
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const handleDownloadMaterial = async (item: Material) => {
    const downloadUrl = item.id ? api.getMaterialDownloadUrl(item.id) : item.fileUri;
    try {
      if (Platform.OS === 'web') {
        if (downloadUrl) {
          try {
            const res = await fetch(downloadUrl);
            if (res.ok) {
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = objectUrl;
              link.download = item.fileName || 'Nexus_Study_Material.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(objectUrl);
              return;
            }
          } catch (_) {}
        }
        const content = `Nexus Training Institute - Study Material\n\nTitle: ${item.title}\nCourse: ${item.course || ''}\nModule: ${item.moduleName || item.topic || ''}\nBatch: ${item.batch || ''}\n\nDescription & Notes:\n${item.description || 'Official course study material and module reference notes.'}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = (item.fileName || 'Nexus_Study_Material.txt').replace(/\.[^/.]+$/, "") + ".txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } else if (downloadUrl) {
        await Linking.openURL(downloadUrl);
      }
    } catch {
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const getIcon = (type: string) => TYPE_ICON[type] || TYPE_ICON['PDF'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* ── HEADER BANNER ── */}
      <View style={styles.header}>
        <LinearGradient
          colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
              onPress={() => { loadMaterials(); loadCoursesAndBatches(); }}
            >
              <Ionicons name="refresh-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenUploadModal}>
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#B39DDB" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials, modules, courses..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      {/* ── BREADCRUMB & NAVIGATION BAR ── */}
      <View style={styles.breadcrumbBar}>
        <TouchableOpacity
          style={[styles.crumbChip, navStep === 'COURSES' && styles.crumbChipActive]}
          onPress={() => { setNavStep('COURSES'); setSelectedCourseCard(null); setSelectedBatchCard(null); }}
        >
          <Ionicons name="school" size={14} color={navStep === 'COURSES' ? '#7B2CBF' : '#64748B'} />
          <Text style={[styles.crumbText, navStep === 'COURSES' && styles.crumbTextActive]}>
            Ongoing Courses
          </Text>
        </TouchableOpacity>

        {selectedCourseCard && (
          <>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            <TouchableOpacity
              style={[styles.crumbChip, navStep === 'BATCHES' && styles.crumbChipActive]}
              onPress={() => { setNavStep('BATCHES'); setSelectedBatchCard(null); }}
            >
              <Ionicons name="people" size={14} color={navStep === 'BATCHES' ? '#7B2CBF' : '#64748B'} />
              <Text style={[styles.crumbText, navStep === 'BATCHES' && styles.crumbTextActive]} numberOfLines={1}>
                {selectedCourseCard === 'ALL' ? 'All Batches' : selectedCourseCard}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {selectedBatchCard && (
          <>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            <View style={[styles.crumbChip, styles.crumbChipActive]}>
              <Ionicons name="cube" size={14} color="#7B2CBF" />
              <Text style={[styles.crumbText, styles.crumbTextActive]} numberOfLines={1}>
                {selectedBatchCard === 'ALL' ? 'All Modules' : selectedBatchCard}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── SCREEN BODY CONTENT ── */}
      <ScrollView style={styles.container} contentContainerStyle={styles.listContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 60 }} />
        ) : navStep === 'COURSES' ? (

          /* STEP 1: ONGOING COURSES CARDS */
          <View>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepSectionTitle}>Select Ongoing Course</Text>
              <Text style={styles.stepSectionSubtitle}>Choose a course to view its ongoing batches & module materials</Text>
            </View>

            <View style={styles.cardGrid}>
              {/* All Courses Card */}
              <TouchableOpacity
                style={[styles.courseCard, selectedCourseCard === 'ALL' && styles.cardSelectedBorder]}
                activeOpacity={0.8}
                onPress={() => handleSelectCourseCard('ALL')}
              >
                <View style={[styles.courseCardIconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="apps" size={26} color="#7B2CBF" />
                </View>
                <Text style={styles.courseCardTitle}>All Ongoing Courses</Text>
                <Text style={styles.courseCardMeta}>View materials across all courses</Text>
                <View style={styles.cardFooterRow}>
                  <Text style={styles.activeTag}>ONGOING</Text>
                  <Ionicons name="arrow-forward-circle" size={22} color="#7B2CBF" />
                </View>
              </TouchableOpacity>

              {courseOptions.map((c: any) => {
                const count = materials.filter(m => m.course.toLowerCase() === c.title.toLowerCase()).length;
                return (
                  <TouchableOpacity
                    key={c.id || c.title}
                    style={styles.courseCard}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCourseCard(c.title)}
                  >
                    <View style={styles.courseCardIconBox}>
                      <Ionicons name="book" size={24} color="#7B2CBF" />
                    </View>
                    <Text style={styles.courseCardTitle} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.courseCardMeta}>{c.category || 'Professional Training'} · {count} files</Text>
                    <View style={styles.cardFooterRow}>
                      <Text style={styles.activeTag}>ACTIVE</Text>
                      <Ionicons name="arrow-forward-circle" size={22} color="#7B2CBF" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        ) : navStep === 'BATCHES' ? (

          /* STEP 2: ONGOING BATCHES CARDS */
          <View>
            <TouchableOpacity style={styles.backStepBtn} onPress={() => { setNavStep('COURSES'); setSelectedCourseCard(null); }}>
              <Ionicons name="arrow-back" size={16} color="#7B2CBF" />
              <Text style={styles.backStepBtnText}>Back to Ongoing Courses</Text>
            </TouchableOpacity>

            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepSectionTitle}>👥 Select Ongoing Batch</Text>
              <Text style={styles.stepSectionSubtitle}>Course: {selectedCourseCard === 'ALL' ? 'All Courses' : selectedCourseCard}</Text>
            </View>

            <View style={styles.cardGrid}>
              {/* All Batches Option */}
              <TouchableOpacity
                style={styles.batchCard}
                activeOpacity={0.8}
                onPress={() => handleSelectBatchCard('ALL')}
              >
                <View style={[styles.batchCardIconBox, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="people" size={24} color="#EA580C" />
                </View>
                <Text style={styles.batchCardTitle}>All Batches in Course</Text>
                <Text style={styles.batchCardMeta}>Show materials for all active batches</Text>
                <View style={styles.cardFooterRow}>
                  <Text style={[styles.activeTag, { color: '#EA580C', backgroundColor: '#FFEDD5' }]}>ALL BATCHES</Text>
                  <Ionicons name="arrow-forward-circle" size={22} color="#EA580C" />
                </View>
              </TouchableOpacity>

              {(batchOptions.length > 0 ? batchOptions : allTeacherBatches).map((b: any, idx: number) => {
                const bName = b.batchName ?? `Batch ${idx + 1}`;
                const count = materials.filter(m => m.batch.toLowerCase() === bName.toLowerCase()).length;
                return (
                  <TouchableOpacity
                    key={b.id || idx}
                    style={styles.batchCard}
                    activeOpacity={0.8}
                    onPress={() => handleSelectBatchCard(bName)}
                  >
                    <View style={styles.batchCardIconBox}>
                      <Ionicons name="people" size={22} color="#7B2CBF" />
                    </View>
                    <Text style={styles.batchCardTitle} numberOfLines={1}>{bName}</Text>
                    <Text style={styles.batchCardMeta}>{b.classTimings || 'Ongoing Batch'} · {count} files</Text>
                    <View style={styles.cardFooterRow}>
                      <Text style={styles.activeTag}>ONGOING</Text>
                      <Ionicons name="arrow-forward-circle" size={22} color="#7B2CBF" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        ) : (

          /* STEP 3: MODULE-WISE STUDY MATERIALS */
          <View>
            <TouchableOpacity style={styles.backStepBtn} onPress={() => { setNavStep('BATCHES'); setSelectedBatchCard(null); }}>
              <Ionicons name="arrow-back" size={16} color="#7B2CBF" />
              <Text style={styles.backStepBtnText}>Back to Ongoing Batches</Text>
            </TouchableOpacity>

            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepSectionTitle}>📦 Module-Wise Study Materials</Text>
              <Text style={styles.stepSectionSubtitle}>
                Course: {selectedCourseCard}  •  Batch: {selectedBatchCard}
              </Text>
            </View>

            {Object.keys(groupedByModule).length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="folder-open-outline" size={36} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Materials Found</Text>
                <Text style={styles.emptySubtitle}>Upload new study materials or select a different batch/course.</Text>
              </View>
            ) : (
              Object.entries(groupedByModule).map(([moduleTitle, items]) => (
                <View key={moduleTitle} style={styles.moduleSectionCard}>
                  <View style={styles.moduleHeaderRow}>
                    <View style={styles.moduleIconBox}>
                      <Ionicons name="folder-open" size={18} color="#7B2CBF" />
                    </View>
                    <Text style={styles.moduleHeaderTitle} numberOfLines={1}>{moduleTitle}</Text>
                    <View style={styles.moduleCountBadge}>
                      <Text style={styles.moduleCountText}>{items.length} {items.length === 1 ? 'file' : 'files'}</Text>
                    </View>
                  </View>

                  {items.length === 0 ? (
                    <Text style={styles.emptyModuleText}>No files uploaded for this module unit yet.</Text>
                  ) : (
                    items.map(item => {
                      const icon = getIcon(item.type);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.materialCard}
                          activeOpacity={0.85}
                          onPress={() => handleOpenMaterial(item)}
                        >
                          <View style={styles.cardTop}>
                            <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
                              <Ionicons name={icon.name} size={28} color={icon.color} />
                            </View>
                            <View style={styles.cardInfo}>
                              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                              <Text style={styles.cardMeta}>{item.course} · {item.batch}</Text>
                              {!!item.description && item.description !== 'No description provided.' && (
                                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.cardBottom}>
                            <View style={[styles.typeBadge, { backgroundColor: icon.bg }]}>
                              <Text style={[styles.typeText, { color: icon.color }]}>{item.type}</Text>
                            </View>
                            <View style={styles.downloadsBadge}>
                              <Ionicons name="download-outline" size={13} color="#64748B" />
                              <Text style={styles.downloadsText}>{item.downloads} downloads</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                              <TouchableOpacity
                                style={{ backgroundColor: '#EDE9FE', padding: 6, borderRadius: 8 }}
                                onPress={() => setPreviewMaterial(item)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="eye-outline" size={18} color="#7B2CBF" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{ backgroundColor: '#EFF6FF', padding: 6, borderRadius: 8 }}
                                onPress={() => handleDownloadMaterial(item)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="download-outline" size={18} color="#2563EB" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.deleteBtn, { marginLeft: 0 }]}
                                onPress={() => handleDelete(item.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              ))
            )}
          </View>

        )}
      </ScrollView>

      {/* ── UPLOAD MODAL FORM ── */}
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

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Python Basics Week 1"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What does this material cover?"
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.row}>
                {/* Course dropdown */}
                <View style={styles.half}>
                  <Text style={styles.label}>Course <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => { setShowCourseDropdown(p => !p); setShowBatchDropdown(false); setShowModuleDropdown(false); }}>
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
                          <TouchableOpacity key={o.id} style={styles.dropdownOption} onPress={() => handleCourseSelectInForm(o.title)}>
                            <Text style={styles.dropdownOptionText}>{o.title}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>

                {/* Batch dropdown */}
                <View style={styles.half}>
                  <Text style={styles.label}>Batch <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={[styles.dropdownButton, !course && styles.dropdownDisabled]} onPress={() => { if (!course) return; setShowBatchDropdown(p => !p); setShowCourseDropdown(false); setShowModuleDropdown(false); }}>
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

              {/* MODULE CHECKLIST DROPDOWN SELECTOR (ADMIN MODULES) */}
              <Text style={styles.label}>Module <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowModuleDropdown(p => !p);
                  setShowCourseDropdown(false);
                  setShowBatchDropdown(false);
                  setShowTopicDropdown(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="checkbox" size={18} color="#7B2CBF" />
                  <Text style={[styles.dropdownText, !selectedModule && styles.dropdownPlaceholder]} numberOfLines={1}>
                    {selectedModule}
                  </Text>
                </View>
                <Ionicons name={showModuleDropdown ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
              </TouchableOpacity>

              {/* INLINE MODULE CHECKLIST CONTAINER */}
              {showModuleDropdown && (
                <View style={styles.inlineChecklistContainer}>
                  <Text style={styles.checklistInstructionText}>
                    Select module added by Admin:
                  </Text>
                  {availableModules.map(mod => {
                    const isChecked = selectedModule === mod;
                    return (
                      <TouchableOpacity
                        key={mod}
                        style={[styles.checkboxOptionRow, isChecked && styles.checkboxOptionRowSelected]}
                        onPress={() => handleModuleSelectInForm(mod)}
                      >
                        <Ionicons
                          name={isChecked ? "checkbox" : "square-outline"}
                          size={20}
                          color={isChecked ? "#7B2CBF" : "#94A3B8"}
                          style={{ marginRight: 10 }}
                        />
                        <Text style={[styles.checkboxOptionLabel, isChecked && styles.checkboxOptionLabelSelected]}>
                          {mod}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* TOPIC HYBRID INPUT & DROPDOWN */}
              <Text style={[styles.label, { marginTop: 14 }]}>Topic / Title</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginBottom: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
                    !selectedModule && styles.dropdownDisabled
                  ]}
                  placeholder={selectedModule ? 'Select or type Topic...' : 'Module first'}
                  placeholderTextColor="#94A3B8"
                  value={selectedTopic}
                  onChangeText={setSelectedTopic}
                  editable={!!selectedModule}
                />
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    { width: 44, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },
                    !selectedModule && styles.dropdownDisabled
                  ]}
                  onPress={() => {
                    if (!selectedModule) return;
                    setShowTopicDropdown(p => !p);
                    setShowCourseDropdown(false);
                    setShowBatchDropdown(false);
                    setShowModuleDropdown(false);
                  }}
                >
                  <Ionicons name={showTopicDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {showTopicDropdown && (
                <View style={[styles.inlineChecklistContainer, { marginTop: -10, marginBottom: 14 }]}>
                  {topicOptions.length === 0 ? (
                    <Text style={styles.checklistInstructionText}>Type custom topic or select</Text>
                  ) : (
                    topicOptions.map((top, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.checkboxOptionRow, selectedTopic === top && styles.checkboxOptionRowSelected]}
                        onPress={() => {
                          setSelectedTopic(top);
                          setShowTopicDropdown(false);
                        }}
                      >
                        <Text style={[styles.checkboxOptionLabel, selectedTopic === top && styles.checkboxOptionLabelSelected]}>
                          {top}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

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

      {/* ── MATERIAL PREVIEW MODAL ── */}
      <Modal
        visible={!!previewMaterial}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewMaterial(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 640 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{previewMaterial?.title}</Text>
                <Text style={{ fontSize: 13, color: '#7B2CBF', fontWeight: '600', marginTop: 2 }}>
                  {previewMaterial?.course} • {previewMaterial?.batch} • {previewMaterial?.moduleName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewMaterial(null)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, marginVertical: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={[styles.iconBox, { backgroundColor: getIcon(previewMaterial?.type || 'PDF').bg }]}>
                  <Ionicons name={getIcon(previewMaterial?.type || 'PDF').name} size={32} color={getIcon(previewMaterial?.type || 'PDF').color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>{previewMaterial?.fileName || 'Document File'}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Type: {previewMaterial?.type} • {previewMaterial?.downloads} downloads</Text>
                </View>
              </View>

              {!!previewMaterial?.description && (
                <View style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Description & Overview:</Text>
                  <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }}>{previewMaterial.description}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.uploadBtn, { flex: 1, backgroundColor: '#7B2CBF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                onPress={() => {
                  if (previewMaterial) handleOpenMaterial(previewMaterial);
                }}
              >
                <Ionicons name="open-outline" size={18} color="#FFF" />
                <Text style={styles.uploadBtnText}>Open / View File</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadBtn, { flex: 1, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                onPress={() => {
                  if (previewMaterial) handleDownloadMaterial(previewMaterial);
                }}
              >
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.uploadBtnText}>Download File</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPreviewMaterial(null)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 16,
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

  searchRow: { flexDirection: 'row', gap: 10 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' },

  // Breadcrumb Bar
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
    flexWrap: 'wrap',
  },
  crumbChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  crumbChipActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7B2CBF',
  },
  crumbText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  crumbTextActive: { color: '#7B2CBF', fontWeight: '700' },

  // List Container
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  listContent: { padding: 16, paddingBottom: 40 },

  stepHeaderRow: { marginBottom: 16 },
  stepSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  stepSectionSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },

  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 6,
  },
  backStepBtnText: { color: '#7B2CBF', fontSize: 13, fontWeight: '700' },

  // Cards Grid
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  courseCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
    marginBottom: 12,
  },
  cardSelectedBorder: {
    borderColor: '#7B2CBF',
    borderWidth: 2,
  },
  courseCardIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  courseCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  courseCardMeta: { fontSize: 12, color: '#64748B', marginBottom: 12 },

  batchCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
    marginBottom: 12,
  },
  batchCardIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  batchCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  batchCardMeta: { fontSize: 12, color: '#64748B', marginBottom: 12 },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  // Module Section Card
  moduleSectionCard: {
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
    gap: 8,
  },
  moduleIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
  },
  moduleHeaderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  moduleCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moduleCountText: { fontSize: 11, fontWeight: '700', color: '#7B2CBF' },
  emptyModuleText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', paddingVertical: 10, paddingHorizontal: 6 },

  // Material Card
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#7B2CBF', fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 16 },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700' },
  downloadsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  downloadsText: { fontSize: 12, color: '#64748B' },
  deleteBtn: {
    width: 32, height: 32,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 10 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 4 },

  // Modal
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
    paddingVertical: 28, alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1',
    marginBottom: 16, gap: 6,
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
  textArea: { height: 70, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 12, zIndex: 20 },
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
    borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, backgroundColor: '#FFFFFF',
    overflow: 'hidden', marginTop: 4, marginBottom: 8,
  },
  dropdownOption: {
    paddingVertical: 11, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  dropdownOptionText: { fontSize: 13, color: '#334155' },
  dropdownEmptyText: { padding: 12, fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

  // Inline Checklist Container for Modules (Never overlaps or clips at bottom!)
  inlineChecklistContainer: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  checklistInstructionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
  },
  checkboxOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkboxOptionRowSelected: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },
  checkboxOptionLabel: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  checkboxOptionLabelSelected: {
    fontWeight: '700',
    color: '#7B2CBF',
  },

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
