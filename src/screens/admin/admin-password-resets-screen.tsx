import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { adminDataCache } from '../../services/admin-data-cache';

const GRADIENT_COLORS: any = [
  'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
];
const GRADIENT_LOCS: any = [0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1];

function formatDateTime(dt?: string) {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return dt; }
}

interface Props {
  onClose: () => void;
  onResetsUpdate?: (requests: any[], pendingCount: number) => void;
}

export default function AdminPasswordResetsScreen({ onClose, onResetsUpdate }: Props) {
  const [resetRequests, setResetRequests] = useState<any[]>(adminDataCache.passwordResets || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [selectedReset, setSelectedReset] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchPasswordResets = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.getPasswordResetRequests();
      const list = Array.isArray(res?.data?.requests)
        ? res.data.requests
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const pendingCount = res?.data?.pendingCount ?? list.filter((r: any) => r.status === 'PENDING').length;
      setResetRequests(list);
      adminDataCache.passwordResets = list;
      adminDataCache.pendingResetCount = pendingCount;
      if (onResetsUpdate) onResetsUpdate(list, pendingCount);
    } catch {
      setResetRequests([]);
    } finally {
      setLoading(false);
    }
  }, [onResetsUpdate]);

  useEffect(() => {
    fetchPasswordResets();
  }, [fetchPasswordResets]);

  const handleResolveReset = async (item: any) => {
    setResolvingId(item.id);
    try {
      const pass = newPasswordInput.trim();
      await api.resolvePasswordResetRequest(item.id, pass ? pass : undefined);
      Alert.alert(
        'Success',
        pass
          ? `Password reset for ${item.name} (${item.email}) to "${pass}" and request marked as resolved.`
          : `Request for ${item.name} marked as resolved.`
      );
      setSelectedReset(null);
      setNewPasswordInput('');
      fetchPasswordResets();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to resolve request.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleDeleteReset = async (id: number) => {
    try {
      await api.deletePasswordResetRequest(id);
      const updated = resetRequests.filter(r => r.id !== id);
      const pendingCount = updated.filter(r => r.status === 'PENDING').length;
      setResetRequests(updated);
      adminDataCache.passwordResets = updated;
      adminDataCache.pendingResetCount = pendingCount;
      if (onResetsUpdate) onResetsUpdate(updated, pendingCount);
      setSelectedReset(null);
    } catch {
      Alert.alert('Error', 'Failed to delete request.');
    }
  };

  const filteredResets = resetRequests.filter(r => {
    const matchesSearch = [r.name, r.email, r.role, r.status].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
    const matchesFilter = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = resetRequests.filter(r => r.status === 'PENDING').length;
  const resolvedCount = resetRequests.filter(r => r.status === 'RESOLVED').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient colors={GRADIENT_COLORS} locations={GRADIENT_LOCS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentLine} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Password Reset Requests</Text>
            <Text style={styles.headerSubtitle}>
              {pendingCount} Pending · {resolvedCount} Resolved
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchPasswordResets}>
            <Ionicons name="refresh-outline" size={16} color="#7B2CBF" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search user name, email, role..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* FILTER PILLS */}
        <View style={styles.filterRow}>
          {(['ALL', 'PENDING', 'RESOLVED'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterPillText, statusFilter === f && styles.filterPillTextActive]}>
                {f === 'ALL' ? `All (${resetRequests.length})` : f === 'PENDING' ? `Pending (${pendingCount})` : `Resolved (${resolvedCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BODY CONTENT */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Fetching password reset requests...</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredResets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="key-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No password reset requests found</Text>
              <Text style={styles.emptySubtext}>
                {statusFilter !== 'ALL' ? `No requests with status "${statusFilter}"` : 'Requests will appear when non-admin users submit forgot password assistance.'}
              </Text>
            </View>
          ) : (
            filteredResets.map((item: any) => {
              const isPending = item.status === 'PENDING';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, isPending && styles.cardPending]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedReset(item);
                    setNewPasswordInput('');
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.userRow}>
                      <View style={[styles.avatar, { backgroundColor: isPending ? '#EF4444' : '#10B981' }]}>
                        <Ionicons name="key-outline" size={16} color="#FFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>{item.name || 'User'}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, isPending ? styles.statusBadgePending : styles.statusBadgeResolved]}>
                      <View style={[styles.statusDot, { backgroundColor: isPending ? '#DC2626' : '#16A34A' }]} />
                      <Text style={[styles.statusBadgeText, { color: isPending ? '#DC2626' : '#16A34A' }]}>
                        {isPending ? 'PENDING' : 'RESOLVED'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.metaCol}>
                      <View style={styles.metaRow}>
                        <Ionicons name="person-outline" size={12} color="#6B7280" />
                        <Text style={styles.roleText}>{item.role || 'STUDENT'}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.timeText}>{formatDateTime(item.createdAt)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.actionBtn, isPending ? styles.actionBtnPending : styles.actionBtnResolved]}
                      onPress={() => {
                        setSelectedReset(item);
                        setNewPasswordInput('');
                      }}
                    >
                      <Text style={[styles.actionBtnText, { color: isPending ? '#FFF' : '#374151' }]}>
                        {isPending ? 'Resolve / Reset' : 'View Details'}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={isPending ? '#FFF' : '#374151'} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* RESOLVE / RESET MODAL */}
      <Modal
        visible={!!selectedReset}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReset(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: selectedReset?.status === 'PENDING' ? '#FEE2E2' : '#DCFCE7' }]}>
                <Ionicons name="key" size={20} color={selectedReset?.status === 'PENDING' ? '#DC2626' : '#16A34A'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Password Reset Request</Text>
                <Text style={styles.modalSubtitle}>User assistance verification</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReset(null)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedReset && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User Name:</Text>
                  <Text style={styles.detailValue}>{selectedReset.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedReset.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Role:</Text>
                  <Text style={styles.detailValue}>{selectedReset.role || 'STUDENT'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(selectedReset.createdAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: selectedReset.status === 'PENDING' ? '#DC2626' : '#16A34A', fontWeight: '700' }]}>
                    {selectedReset.status}
                  </Text>
                </View>

                {selectedReset.status === 'RESOLVED' && selectedReset.resolvedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Resolved At:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(selectedReset.resolvedAt)}</Text>
                  </View>
                )}

                {selectedReset.status === 'PENDING' && (
                  <View style={styles.passwordSection}>
                    <Text style={styles.passLabel}>Set New Password for User (Optional):</Text>
                    <View style={styles.passInputRow}>
                      <TextInput
                        style={styles.passInput}
                        placeholder="Enter new password (e.g. Student@123)"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={newPasswordInput}
                        onChangeText={setNewPasswordInput}
                        autoComplete="new-password"
                        autoCorrect={false}
                        autoCapitalize="none"
                        spellCheck={false}
                        textContentType="none"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.passHint}>
                      Leaving password blank will mark the request resolved without altering account credentials.
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {selectedReset.status === 'PENDING' ? (
                    <TouchableOpacity
                      style={styles.modalPrimaryBtn}
                      disabled={resolvingId === selectedReset.id}
                      onPress={() => handleResolveReset(selectedReset)}
                    >
                      {resolvingId === selectedReset.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                          <Text style={styles.modalPrimaryBtnText}>
                            {newPasswordInput.trim() ? 'Reset Password & Resolve' : 'Mark Resolved'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                    <TouchableOpacity
                      style={styles.modalDeleteBtn}
                      onPress={() => {
                        Alert.alert(
                          'Delete Request',
                          'Are you sure you want to delete this password reset request?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteReset(selectedReset.id) },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={styles.modalDeleteBtnText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedReset(null)}
                    >
                      <Text style={styles.modalCloseBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  accentLine: { height: 2, marginBottom: 12, borderRadius: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 11, color: '#E9D5FF', marginTop: 2 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  refreshText: { fontSize: 12, fontWeight: '700', color: '#7B2CBF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 42, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937', padding: 0 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterPillActive: { backgroundColor: '#FFF' },
  filterPillText: { fontSize: 11, fontWeight: '600', color: '#E9D5FF' },
  filterPillTextActive: { color: '#7B2CBF', fontWeight: '700' },
  loadingBox: { flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#6B7280' },
  list: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubtext: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardPending: { borderColor: '#FECACA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgePending: { backgroundColor: '#FEE2E2' },
  statusBadgeResolved: { backgroundColor: '#DCFCE7' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  metaCol: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  roleText: { fontSize: 11, fontWeight: '700', color: '#4B5563', textTransform: 'uppercase' },
  timeText: { fontSize: 11, color: '#9CA3AF' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnPending: { backgroundColor: '#7B2CBF' },
  actionBtnResolved: { backgroundColor: '#F3F4F6' },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  modalBody: { gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '600' },
  passwordSection: { backgroundColor: '#FAF5FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E9D5FF', marginTop: 6 },
  passLabel: { fontSize: 12, fontWeight: '700', color: '#6B21A8', marginBottom: 6 },
  passInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#D8B4FE', paddingHorizontal: 10, height: 40 },
  passInput: { flex: 1, fontSize: 13, color: '#1F2937', padding: 0 },
  passHint: { fontSize: 10, color: '#7E22CE', marginTop: 4, lineHeight: 14 },
  modalActions: { gap: 10, marginTop: 12 },
  modalPrimaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#7B2CBF', borderRadius: 12, height: 44 },
  modalPrimaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  modalDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 12, height: 40 },
  modalDeleteBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  modalCloseBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, height: 40 },
  modalCloseBtnText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
});
