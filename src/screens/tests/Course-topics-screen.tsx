import React, { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, getApiBaseUrl } from '@/services/api';
import { parseSyllabus } from '@/utils/syllabus-parser';
import { coursesData } from '@/screens/home/home-screen';

const API_BASE = getApiBaseUrl().replace('/api', '');

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1];

export interface RealMaterial {
  id: number;
  title: string;
  description: string;
  course: string;
  batch: string;
  topic: string;
  moduleName?: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  uploadedByEmail: string;
  uploadedAt: string;
}

interface Props {
  courseTitle: string;
  materials: RealMaterial[];
  onBack: () => void;
}

function getFileIcon(fileType: string): { icon: any; bg: string; color: string } {
  switch ((fileType || '').toUpperCase()) {
    case 'PDF': return { icon: 'document-text', bg: '#FEE2E2', color: '#EF4444' };
    case 'PPT': return { icon: 'easel', bg: '#FFF7ED', color: '#F97316' };
    case 'DOC': return { icon: 'document', bg: '#E0F2FE', color: '#0284C7' };
    case 'VIDEO': return { icon: 'videocam', bg: '#EDE9FE', color: '#8B5CF6' };
    case 'IMAGE': return { icon: 'image', bg: '#D1FAE5', color: '#10B981' };
    case 'ZIP': return { icon: 'archive', bg: '#FEF3C7', color: '#D97706' };
    default: return { icon: 'document', bg: '#F3F4F6', color: '#6B7280' };
  }
}

function isImageType(fileType: string, fileName: string): boolean {
  if ((fileType || '').toUpperCase() === 'IMAGE') return true;
  const ext = (fileName || '').split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return dateStr; }
}

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

function normalizeMaterial(item: any): RealMaterial {
  const rawMod = item.moduleName || item.module || item.topic || item.chapter || 'Module 1';
  return {
    id: Number(item.id),
    title: item.title || item.fileName || 'Untitled',
    description: (item.description === 'No description provided.' ? '' : item.description) || '',
    course: item.course || '',
    batch: item.batch || '',
    topic: rawMod,
    moduleName: rawMod,
    fileType: (item.fileType || item.type || 'PDF').toUpperCase(),
    fileName: item.fileName || '',
    fileUrl: item.fileUrl || '',
    uploadedByEmail: item.uploadedByEmail || '',
    uploadedAt: item.uploadedAt || '',
  };
}

export default function CourseTopicsScreen({ courseTitle, materials, onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<RealMaterial | null>(null);
  const [adminSyllabusModules, setAdminSyllabusModules] = useState<string[]>([]);

  useEffect(() => {
    // Fetch course details to parse admin syllabus modules
    api.getAllCourses().then((res: any) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const match = list.find((c: any) => c.title?.trim().toLowerCase() === courseTitle.trim().toLowerCase());
      const rawSyl = match?.syllabusTopics || match?.syllabus || coursesData[courseTitle]?.syllabusTopics || coursesData[courseTitle]?.syllabus;
      if (rawSyl) {
        const parsed = parseSyllabus(rawSyl);
        if (parsed && parsed.length > 0) {
          const titles = parsed.map((m, idx) =>
            m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
          );
          setAdminSyllabusModules(titles);
          return;
        }
      }
    }).catch(() => {
      const rawSyl = coursesData[courseTitle]?.syllabusTopics || coursesData[courseTitle]?.syllabus;
      if (rawSyl) {
        const parsed = parseSyllabus(rawSyl);
        if (parsed && parsed.length > 0) {
          const titles = parsed.map((m, idx) =>
            m.title.startsWith('Module') ? m.title : `Module ${idx + 1}: ${m.title}`
          );
          setAdminSyllabusModules(titles);
        }
      }
    });
  }, [courseTitle]);

  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All Batches');

  const courseMaterials = useMemo(() => {
    const sel = courseTitle.trim().toLowerCase();
    return (materials || [])
      .map(normalizeMaterial)
      .filter(item => {
        const mat = item.course.trim().toLowerCase();
        return mat === sel || mat.includes(sel) || sel.includes(mat);
      });
  }, [materials, courseTitle]);

  const availableBatches = useMemo(() => {
    const set = new Set(courseMaterials.map(m => m.batch).filter(Boolean));
    return ['All Batches', ...Array.from(set)];
  }, [courseMaterials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return courseMaterials.filter(item => {
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.course.toLowerCase().includes(q) ||
        item.batch.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.fileType.toLowerCase().includes(q);

      const matchBatch =
        selectedBatchFilter === 'All Batches' ||
        item.batch.trim().toLowerCase() === selectedBatchFilter.trim().toLowerCase();

      return matchSearch && matchBatch;
    });
  }, [courseMaterials, searchQuery, selectedBatchFilter]);

  // Group materials module-wise using canonical module matching
  const topicGroups = useMemo(() => {
    const result: Record<string, RealMaterial[]> = {};

    // Initialize admin module titles if present
    adminSyllabusModules.forEach(t => { result[t] = []; });

    filteredMaterials.forEach(m => {
      const canonicalMod = findCanonicalModuleTitle(m.topic, adminSyllabusModules);
      if (!result[canonicalMod]) result[canonicalMod] = [];
      result[canonicalMod].push(m);
    });

    // Remove empty admin modules if other modules contain files
    const finalGroups: Record<string, RealMaterial[]> = {};
    const entries = Object.entries(result);
    const hasAnyFiles = entries.some(([_, items]) => items.length > 0);

    entries.forEach(([modTitle, items]) => {
      if (items.length > 0 || !hasAnyFiles) {
        finalGroups[modTitle] = items;
      }
    });

    return finalGroups;
  }, [filteredMaterials, adminSyllabusModules]);

  const topicNames = useMemo(() => Object.keys(topicGroups), [topicGroups]);
  const topicMaterials = selectedTopic ? topicGroups[selectedTopic] || [] : [];

  const getFileUrl = (item: RealMaterial) => {
    if (item.id) return api.getMaterialDownloadUrl(item.id);
    if (!item.fileUrl) return '';
    return item.fileUrl.startsWith('http') ? item.fileUrl : `${API_BASE}${item.fileUrl}`;
  };

  const handleDownload = async (item: RealMaterial) => {
    const url = getFileUrl(item);
    if (!url) return Alert.alert('Unavailable', 'No file available.');
    setDownloading(item.id);
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = item.fileName || 'material';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Error', 'Could not open or download the file.');
    } finally {
      setDownloading(null);
    }
  };

  if (selectedTopic) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <LinearGradient colors={ACCENT_COLORS} locations={ACCENT_LOCS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerAccentLine} />
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedTopic(null)}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>{selectedTopic}</Text>
              <Text style={styles.headerSubtitle}>{topicMaterials.length} materials in this module</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.listBg} contentContainerStyle={styles.listPad}>
          {topicMaterials.map(item => {
            const icon = getFileIcon(item.fileType);
            const image = isImageType(item.fileType, item.fileName);
            const url = getFileUrl(item);
            return (
              <View key={item.id} style={styles.materialCard}>
                {image && url ? <Image source={{ uri: url }} style={styles.imagePreviewStrip} resizeMode="cover" /> : null}
                <View style={styles.materialCardBody}>
                  <View style={styles.materialTopRow}>
                    <View style={[styles.fileIconBox, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.icon} size={26} color={icon.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.materialTitle}>{item.title}</Text>
                      {!!item.description && item.description !== 'No description provided.' && (
                        <Text style={styles.materialDesc}>{item.description}</Text>
                      )}
                      <View style={styles.infoRow}>
                        <View style={styles.infoChip}>
                          <Ionicons name="school-outline" size={12} color="#64748B" />
                          <Text style={styles.infoText}>{item.course}</Text>
                        </View>
                        {!!item.batch && (
                          <View style={styles.infoChip}>
                            <Ionicons name="people-outline" size={12} color="#64748B" />
                            <Text style={styles.infoText}>{item.batch}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={[styles.typeBadge, { backgroundColor: icon.bg }]}>
                      <Text style={[styles.typeText, { color: icon.color }]}>{item.fileType}</Text>
                    </View>
                    {!!item.uploadedAt && <Text style={styles.metaText}>{formatDate(item.uploadedAt)}</Text>}
                    {!!item.fileName && <Text style={styles.metaText} numberOfLines={1}>{item.fileName}</Text>}
                  </View>

                  <View style={styles.actionRow}>
                    {image && (
                      <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewItem(item)}>
                        <Ionicons name="eye-outline" size={17} color="#7B2CBF" />
                        <Text style={styles.previewBtnText}>Preview</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)} disabled={downloading === item.id}>
                      {downloading === item.id ? <ActivityIndicator size="small" color="#FFF" /> : (
                        <>
                          <Ionicons name="cloud-download-outline" size={17} color="#FFF" />
                          <Text style={styles.downloadBtnText}>Open / Download</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Modal visible={!!previewItem} transparent animationType="fade" onRequestClose={() => setPreviewItem(null)}>
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewItem(null)}>
              <Ionicons name="close-circle" size={34} color="#FFF" />
            </TouchableOpacity>
            {previewItem && <Image source={{ uri: getFileUrl(previewItem) }} style={styles.previewImage} resizeMode="contain" />}
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <LinearGradient colors={ACCENT_COLORS} locations={ACCENT_LOCS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerAccentLine} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{courseTitle}</Text>
            <Text style={styles.headerSubtitle}>{topicNames.length} modules · {filteredMaterials.length} files</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput style={styles.searchInput} placeholder="Search modules or materials..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {availableBatches.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
            {availableBatches.map(b => {
              const active = selectedBatchFilter === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onPress={() => setSelectedBatchFilter(b)}
                >
                  <Ionicons name="people" size={13} color={active ? '#7B2CBF' : '#FFFFFF'} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#7B2CBF' : '#FFFFFF' }}>
                    {b}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView style={styles.listBg} contentContainerStyle={styles.listPad}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statVal}>{topicNames.length}</Text><Text style={styles.statLabel}>Modules</Text></View>
          <View style={styles.statCard}><Text style={styles.statVal}>{filteredMaterials.length}</Text><Text style={styles.statLabel}>Materials</Text></View>
          <View style={styles.statCard}><Text style={styles.statVal}>{filteredMaterials.filter(m => m.id || m.fileUrl).length}</Text><Text style={styles.statLabel}>Downloadable</Text></View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
          📦 Course Modules & Study Materials
        </Text>

        {topicNames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No module materials available for this course</Text>
          </View>
        ) : topicNames.map((topicName, index) => {
          const items = topicGroups[topicName];
          const types = [...new Set(items.map(i => i.fileType))];
          const colors = ['#7B2CBF', '#F97316', '#0284C7', '#16A34A', '#DC2626', '#D97706'];
          const color = colors[index % colors.length];
          return (
            <TouchableOpacity key={topicName} style={styles.topicCard} onPress={() => setSelectedTopic(topicName)} activeOpacity={0.85}>
              <View style={[styles.topicStrip, { backgroundColor: color }]}>
                <Ionicons name="folder-open" size={22} color="#FFF" />
              </View>
              <View style={styles.topicContent}>
                <Text style={styles.topicName} numberOfLines={2}>{topicName}</Text>
                <View style={styles.topicMetaRow}>
                  <Text style={styles.topicCountText}>{items.length} {items.length === 1 ? 'file' : 'files'}</Text>
                  {types.slice(0, 3).map(type => {
                    const icon = getFileIcon(type);
                    return <View key={type} style={[styles.typeChip, { backgroundColor: icon.bg }]}><Text style={[styles.typeChipText, { color: icon.color }]}>{type}</Text></View>;
                  })}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={color} style={{ marginRight: 16 }} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 8 : 4, paddingBottom: 20 },
  headerAccentLine: { height: 4, marginBottom: 12 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTextWrap: { flex: 1, marginLeft: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#E9D5FF', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  listBg: { flex: 1, backgroundColor: '#F3F4F6' },
  listPad: { padding: 16, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center', elevation: 3 },
  statVal: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  topicCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, marginBottom: 12, overflow: 'hidden', elevation: 4 },
  topicStrip: { width: 64, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  topicContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  topicName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  topicMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  topicCountText: { fontSize: 11, fontWeight: '700', color: '#7B2CBF', backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeChipText: { fontSize: 10, fontWeight: '700' },
  materialCard: { backgroundColor: '#FFF', borderRadius: 18, marginBottom: 14, overflow: 'hidden', elevation: 4 },
  imagePreviewStrip: { width: '100%', height: 150 },
  materialCardBody: { padding: 16 },
  materialTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  fileIconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  materialTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  materialDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  infoText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 11, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, maxWidth: 130 },
  actionRow: { flexDirection: 'row', gap: 10 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#7B2CBF', backgroundColor: '#F3E8FF' },
  previewBtnText: { color: '#7B2CBF', fontWeight: '700', fontSize: 14 },
  downloadBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, backgroundColor: '#7B2CBF' },
  downloadBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  previewClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  previewImage: { width: '100%', height: '70%', borderRadius: 12 },
});