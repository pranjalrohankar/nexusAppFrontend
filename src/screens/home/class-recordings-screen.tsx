import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import * as Linking from 'expo-linking';
import { api, getApiBaseUrl } from '@/services/api';

const IS_WEB = Platform.OS === 'web';

// Always resolve fresh so mobile gets correct host, not stale localhost
const getStreamUrl = (id: number) => `${getApiBaseUrl().replace('/api', '')}/api/recordings/stream/${id}`;

interface ClassRecordingsScreenProps {
  onBack: () => void;
}

interface RecordingItem {
  id: number;
  title: string;
  course: string;
  batch: string;
  classDate?: string;
  duration?: string;
  uploadedAt?: string;
}

const THEME_COLORS = ['#8B5CF6', '#6366F1', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];

// Shared full-screen video modal
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
        <View style={vm.header}>
          <TouchableOpacity onPress={handleClose} style={vm.closeBtn}>
            <Ionicons name="close" size={24} color="#1E2937" />
          </TouchableOpacity>
          <Text style={vm.titleText} numberOfLines={1}>{title}</Text>
        </View>

        <View
          style={vm.playerArea}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) setPlayerSize({ w: width, h: height });
          }}
        >
          {uri && IS_WEB ? (
            // Web: use native HTML video element
            <video
              src={uri}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', backgroundColor: '#000', outline: 'none' } as any}
            />
          ) : uri && playerSize.w > 0 ? (
            // Native iOS/Android: use expo-av
            <Video
              source={{ uri }}
              style={{ width: playerSize.w, height: playerSize.h, backgroundColor: '#000' }}
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

export default function ClassRecordingsScreen({ onBack }: ClassRecordingsScreenProps) {
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = IS_WEB && winWidth >= 1024;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => { loadRecordings(); }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const data = await api.getClassRecordings();
      if (Array.isArray(data)) {
        setRecordings(
          data.sort((a: any, b: any) =>
            new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
          )
        );
      }
    } catch {}
    finally { setLoading(false); }
  };

  const filterCategories = ['All', ...Array.from(new Set(recordings.map(r => r.course).filter(Boolean)))];

  const filtered = recordings.filter(rec => {
    const q = searchQuery.toLowerCase();
    return (
      (rec.title.toLowerCase().includes(q) || rec.course.toLowerCase().includes(q) || rec.batch.toLowerCase().includes(q)) &&
      (selectedCategory === 'All' || rec.course === selectedCategory)
    );
  });

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <TouchableOpacity style={s.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={s.headerTitle}>Class Recordings</Text>
        <Text style={s.headerSubtitle}>Watch previous lectures anytime</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Filters */}
        <View style={s.searchContainer}>
          <View style={s.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search recordings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsContent}
            style={{ marginTop: 12 }}
          >
            {filterCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.chip, selectedCategory === cat && s.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cards */}
        <View style={[s.listContainer, isDesktop && s.listDesktop]}>
          {loading ? (
            <Text style={s.emptyText}>Loading recordings...</Text>
          ) : filtered.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#9CA3AF" />
              <Text style={s.emptyText}>No recordings found</Text>
              <Text style={s.emptySubtext}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            filtered.map((rec, idx) => (
              <View key={rec.id} style={[s.card, isDesktop && s.cardDesktop]}>
                <View style={s.cardHeader}>
                  <View style={s.thumbnail}>
                    <View style={s.playCircle}>
                      <Ionicons name="play" size={14} color="#1F2937" style={{ marginLeft: 2 }} />
                    </View>
                    <View style={[s.thumbnailBadge, { backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }]} />
                  </View>

                  <View style={s.cardInfo}>
                    <Text style={s.cardTitle} numberOfLines={2}>{rec.title}</Text>
                    <View style={s.catRow}>
                      <Ionicons name="book-outline" size={12} color="#7B2CBF" />
                      <Text style={s.catText}>{rec.course}</Text>
                    </View>
                    <View style={s.statsRow}>
                      {(rec.classDate || rec.uploadedAt) && (
                        <View style={s.statItem}>
                          <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                          <Text style={s.statText}>{formatDate(rec.classDate || rec.uploadedAt)}</Text>
                        </View>
                      )}
                      {rec.duration && (
                        <View style={s.statItem}>
                          <Ionicons name="time-outline" size={12} color="#6B7280" />
                          <Text style={s.statText}>{rec.duration}</Text>
                        </View>
                      )}
                      <View style={s.statItem}>
                        <Ionicons name="people-outline" size={12} color="#6B7280" />
                        <Text style={s.statText}>{rec.batch}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={s.cardFooter}>
                  <TouchableOpacity
                    style={s.watchNowBtn}
                    activeOpacity={0.8}
                    onPress={() => { setPreviewTitle(rec.title); setPreviewUri(getStreamUrl(rec.id)); }}
                  >
                    <Ionicons name="play" size={14} color="#FFF" />
                    <Text style={s.watchNowText}>Watch Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <VideoModal
        visible={!!previewUri}
        uri={previewUri}
        title={previewTitle}
        onClose={() => setPreviewUri(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 16, paddingBottom: 36 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: Platform.OS === 'android' ? 12 : 0,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF', marginTop: 4 },

  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16 },
  scrollDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 32 },

  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: -24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  chipsContent: { gap: 8, alignItems: 'center', paddingRight: 4 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 18, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#fff' },

  listContainer: { gap: 16 },
  listDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDesktop: { width: IS_WEB ? ('calc(50% - 10px)' as any) : '48%', minWidth: 320 },

  cardHeader: { flexDirection: 'row', gap: 16 },
  thumbnail: {
    width: 64, height: 64,
    borderRadius: 16,
    backgroundColor: '#8B939E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  playCircle: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', lineHeight: 20 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  catText: { fontSize: 11, fontWeight: '600', color: '#7B2CBF' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: '#6B7280' },

  cardFooter: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 14, paddingTop: 12 },
  watchNowBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  watchNowText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 12, textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
});
