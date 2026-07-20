import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, Platform, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const AVATAR_COLORS = ['#7B2CBF', '#2563EB', '#EA580C', '#16A34A', '#DB2777', '#0891B2'];
const PILL_STYLES: Record<number, { bg: string; color: string }> = {
  0: { bg: '#EDE9FE', color: '#6D28D9' },
  1: { bg: '#D1FAE5', color: '#065F46' },
  2: { bg: '#FEF3C7', color: '#92400E' },
  3: { bg: '#DBEAFE', color: '#1E40AF' },
  4: { bg: '#FCE7F3', color: '#9D174D' },
};

const GRADIENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const GRADIENT_LOCS: any = [0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1];

function sourceIcon(source?: string): { name: any; color: string } {
  switch ((source ?? '').toLowerCase()) {
    case 'whatsapp': return { name: 'logo-whatsapp', color: '#25D366' };
    case 'referral': return { name: 'people-outline', color: '#F59E0B' };
    default: return { name: 'globe-outline', color: '#2563EB' };
  }
}

function formatDateTime(dt?: string) {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return dt; }
}

function formatDate(dt?: string) {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dt; }
}

function EnquiryDetail({
  enquiry, idx, onClose, onRead,
}: { enquiry: any; idx: number; onClose: () => void; onRead: (id: number) => void }) {
  const pill = PILL_STYLES[idx % 5];
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const initials = (enquiry.fullName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const src = sourceIcon(enquiry.source);

  React.useEffect(() => {
    if (!enquiry.isRead) {
      api.markEnquiryRead(enquiry.id).catch(() => {});
      onRead(enquiry.id);
    }
  }, []);

  return (
    <SafeAreaView style={det.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {/* Header */}
      <View style={det.header}>
        <LinearGradient colors={GRADIENT_COLORS} locations={GRADIENT_LOCS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={det.accentLine} />
        <View style={det.headerRow}>
          <TouchableOpacity style={det.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={det.headerTitle}>Enquiry Detail</Text>
          {!enquiry.isRead && (
            <View style={det.newBadge}>
              <Ionicons name="information-circle-outline" size={12} color="#2563EB" />
              <Text style={det.newBadgeText}>New</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={det.scroll} contentContainerStyle={det.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Person card */}
        <View style={det.personCard}>
          <View style={[det.avatar, { backgroundColor: avatarColor }]}>
            <Text style={det.avatarText}>{initials}</Text>
          </View>
          <View style={det.personMid}>
            <Text style={det.name}>{enquiry.fullName}</Text>
            <View style={det.metaRow}>
              <Text style={det.metaText}>{formatDateTime(enquiry.createdAt)}</Text>
              {enquiry.source ? (
                <>
                  <Text style={det.metaDot}> · </Text>
                  <Ionicons name={src.name} size={12} color={src.color} />
                  <Text style={[det.metaText, { color: src.color, marginLeft: 3 }]}>{enquiry.source}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* CONTACT */}
        <View style={det.section}>
          <Text style={det.sectionLabel}>CONTACT</Text>
          <View style={det.row}>
            <View style={det.iconBox}><Ionicons name="mail-outline" size={16} color="#7B2CBF" /></View>
            <Text style={det.rowText}>{enquiry.email}</Text>
          </View>
          <View style={det.row}>
            <View style={det.iconBox}><Ionicons name="call-outline" size={16} color="#16A34A" /></View>
            <Text style={det.rowText}>{enquiry.phoneNumber}</Text>
          </View>
        </View>

        {/* ENQUIRY DETAILS */}
        <View style={det.section}>
          <Text style={det.sectionLabel}>ENQUIRY DETAILS</Text>
          {enquiry.course ? (
            <View style={det.row}>
              <View style={det.iconBox}><Ionicons name="book-outline" size={16} color="#6B7280" /></View>
              <View style={[det.coursePill, { backgroundColor: pill.bg }]}>
                <Text style={[det.coursePillText, { color: pill.color }]}>{enquiry.course}</Text>
              </View>
            </View>
          ) : null}
          <View style={det.row}>
            <View style={det.iconBox}><Ionicons name="pricetag-outline" size={16} color="#EF4444" /></View>
            <Text style={det.priorityText}>High Priority</Text>
          </View>
          {enquiry.source ? (
            <View style={det.row}>
              <View style={det.iconBox}><Ionicons name={src.name} size={16} color={src.color} /></View>
              <Text style={[det.rowText, { color: src.color, fontWeight: '600' }]}>{enquiry.source}</Text>
            </View>
          ) : null}
          {enquiry.message ? (
            <View style={det.messageBox}>
              <Text style={det.messageText}>"{enquiry.message}"</Text>
            </View>
          ) : null}
        </View>

        {/* QUICK ACTIONS */}
        <View style={det.section}>
          <Text style={det.sectionLabel}>QUICK ACTIONS</Text>
          <View style={det.actionsRow}>
            <TouchableOpacity style={det.actionBtn} onPress={() => Linking.openURL(`tel:${enquiry.phoneNumber}`)}>
              <Ionicons name="call-outline" size={15} color="#16A34A" />
              <Text style={[det.actionText, { color: '#16A34A' }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={det.actionBtn} onPress={() => Linking.openURL(`mailto:${enquiry.email}`)}>
              <Ionicons name="mail-outline" size={15} color="#2563EB" />
              <Text style={[det.actionText, { color: '#2563EB' }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={det.actionBtn} onPress={() => Linking.openURL(`https://wa.me/${enquiry.phoneNumber?.replace(/\D/g, '')}`)}>
              <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
              <Text style={[det.actionText, { color: '#25D366' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={det.footer}>
        <TouchableOpacity style={det.saveBtn}>
          <Ionicons name="send-outline" size={16} color="#FFF" />
          <Text style={det.saveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={det.closeBtn} onPress={onClose}>
          <Text style={det.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const det = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  accentLine: { height: 3, borderRadius: 2, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFF' },
  newBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  newBadgeText: { fontSize: 11, color: '#FFF', fontWeight: '600' },
  scroll: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16 },
  personCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  personMid: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  metaDot: { fontSize: 11, color: '#9CA3AF' },
  section: { borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 14, padding: 16, marginBottom: 14, backgroundColor: '#FFF' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  iconBox: { width: 28, alignItems: 'center' },
  rowText: { fontSize: 14, color: '#1F2937' },
  coursePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  coursePillText: { fontSize: 13, fontWeight: '600' },
  priorityText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  messageBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginTop: 8 },
  messageText: { fontSize: 13, color: '#4B5563', lineHeight: 20, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 10 },
  actionText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7B2CBF', borderRadius: 14, height: 50 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  closeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, height: 50 },
  closeBtnText: { color: '#1F2937', fontWeight: '600', fontSize: 15 },
});

interface Props {
  enquiries: any[];
  onClose: () => void;
  onEnquiriesUpdate: (updated: any[]) => void;
}

export default function AdminEnquiriesScreen({ enquiries, onClose, onEnquiriesUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ enquiry: any; idx: number } | null>(null);
  const [localEnquiries, setLocalEnquiries] = useState(
    [...enquiries].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
  );

  const handleRead = (id: number) => {
    const updated = localEnquiries.map(e => e.id === id ? { ...e, isRead: true } : e);
    setLocalEnquiries(updated);
    onEnquiriesUpdate(updated);
  };

  if (selected) {
    return (
      <EnquiryDetail
        enquiry={selected.enquiry}
        idx={selected.idx}
        onClose={() => setSelected(null)}
        onRead={handleRead}
      />
    );
  }

  const filtered = localEnquiries.filter(e =>
    [e.fullName, e.email, e.phoneNumber, e.course].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <SafeAreaView style={eq.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {/* Header */}
      <View style={eq.header}>
        <LinearGradient colors={GRADIENT_COLORS} locations={GRADIENT_LOCS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={eq.accentLine} />
        <View style={eq.headerRow}>
          <TouchableOpacity style={eq.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={eq.headerTitle}>Enquiries</Text>
          <TouchableOpacity style={eq.filterBtn}>
            <Ionicons name="filter" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={eq.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={eq.searchInput}
            placeholder="Search name, email, phone, course..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView style={eq.list} contentContainerStyle={eq.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={eq.emptyBox}>
            <Ionicons name="mail-outline" size={40} color="#D1D5DB" />
            <Text style={eq.emptyText}>No enquiries found</Text>
          </View>
        ) : (
          filtered.map((e: any, idx: number) => {
            const pill = PILL_STYLES[idx % 5];
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const initials = (e.fullName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            const src = sourceIcon(e.source);
            const isNew = !e.isRead;
            return (
              <TouchableOpacity key={e.id} style={eq.card} activeOpacity={0.85} onPress={() => setSelected({ enquiry: e, idx })}>
                <View style={eq.cardTop}>
                  <View style={[eq.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={eq.avatarText}>{initials}</Text>
                  </View>
                  <View style={eq.cardMid}>
                    <View style={eq.nameRow}>
                      <Text style={eq.name}>{e.fullName}</Text>
                      {isNew && (
                        <View style={eq.newBadge}>
                          <View style={eq.newDot} />
                          <Ionicons name="information-circle-outline" size={11} color="#2563EB" />
                          <Text style={eq.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>
                    {e.course ? (
                      <View style={[eq.coursePill, { backgroundColor: pill.bg }]}>
                        <Text style={[eq.coursePillText, { color: pill.color }]}>{e.course}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {e.message ? <Text style={eq.message} numberOfLines={2}>{e.message}</Text> : null}
                <View style={eq.infoRow}>
                  <View style={eq.infoItem}>
                    <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                    <Text style={eq.infoText}>{formatDate(e.createdAt)}</Text>
                  </View>
                  {e.source ? (
                    <View style={eq.infoItem}>
                      <Ionicons name={src.name} size={12} color={src.color} />
                      <Text style={[eq.infoText, { color: src.color }]}>{e.source}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const eq = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  accentLine: { height: 3, borderRadius: 2, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 26, fontWeight: '700', color: '#FFF' },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, height: 46, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937' },
  list: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: { padding: 16, gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  cardMid: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  newBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 3 },
  newDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  newBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  coursePill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  coursePillText: { fontSize: 12, fontWeight: '600' },
  message: { fontSize: 13, color: '#4B5563', lineHeight: 19, marginBottom: 10 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: '#9CA3AF' },
});
