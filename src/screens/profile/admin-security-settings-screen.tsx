import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Platform, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1];

function formatLoginTime(loginTime: string) {
  if (!loginTime) return '';
  const d = new Date(loginTime);
  return d.toLocaleString('en-IN', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function deviceIcon(device: string) {
  if (device.includes('Android') || device.includes('iOS') || device.includes('iPhone')) return 'phone-portrait-outline';
  if (device.includes('MacOS')) return 'laptop-outline';
  return 'desktop-outline';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'current') return (
    <View style={[badge.pill, { backgroundColor: '#3B82F6' }]}>
      <Text style={badge.text}>Current</Text>
    </View>
  );
  if (status === 'success') return (
    <View style={[badge.pill, { backgroundColor: '#10B981' }]}>
      <Text style={badge.text}>Success</Text>
    </View>
  );
  return (
    <View style={[badge.pill, { backgroundColor: '#EF4444' }]}>
      <Text style={badge.text}>Failed</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  pill: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
});

interface LoginHistoryItem {
  id: number;
  device: string;
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  status: string;
  loginTime: string;
}

interface Props { onBack: () => void; userId?: number | string; }

export default function AdminSecuritySettingsScreen({ onBack, userId }: Props) {
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(false);
  const [failedLoginAlerts, setFailedLoginAlerts] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Load settings + history on mount
  useEffect(() => {
    if (!userId) return;
    setSettingsLoading(true);
    api.getSecuritySettings(userId)
      .then((res: any) => {
        const d = res?.data;
        if (d) {
          setSessionTimeout(d.sessionTimeout ?? false);
          setLoginAlerts(d.loginAlerts ?? false);
          setFailedLoginAlerts(d.failedLoginAlerts ?? false);
        }
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));

    setLoading(true);
    api.getLoginHistory(userId)
      .then((res: any) => setLoginHistory(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const saveSettings = (patch: Partial<{ sessionTimeout: boolean; loginAlerts: boolean; failedLoginAlerts: boolean }>) => {
    if (!userId) return;
    api.updateSecuritySettings({ userId, ...patch }).catch(() => {});
  };

  const handleSessionTimeout = (val: boolean) => {
    setSessionTimeout(val);
    saveSettings({ sessionTimeout: val, loginAlerts, failedLoginAlerts });
  };

  const handleLoginAlerts = (val: boolean) => {
    setLoginAlerts(val);
    saveSettings({ sessionTimeout, loginAlerts: val, failedLoginAlerts });
  };

  const handleFailedLoginAlerts = (val: boolean) => {
    setFailedLoginAlerts(val);
    saveSettings({ sessionTimeout, loginAlerts, failedLoginAlerts: val });
  };

  const history = showAll ? loginHistory : loginHistory.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />

      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentLine} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* System Secured */}
        <View style={styles.securedCard}>
          <View style={styles.securedIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          </View>
          <View>
            <Text style={styles.securedTitle}>System Secured</Text>
            <Text style={styles.securedSub}>All security features enabled</Text>
          </View>
        </View>

        {/* Password & Authentication */}
        <Text style={styles.sectionTitle}>Password & Authentication</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="finger-print-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
              <Text style={styles.rowDesc}>Add extra security layer</Text>
            </View>
            <View style={[styles.enabledBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.enabledText}>Enabled</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 6 }} />
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="key-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>API Keys</Text>
              <Text style={styles.rowDesc}>Manage API access tokens</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </View>

        {/* Security Preferences */}
        <Text style={styles.sectionTitle}>Security Preferences</Text>
        <View style={styles.card}>
          {settingsLoading ? (
            <ActivityIndicator color="#7B2CBF" style={{ paddingVertical: 20 }} />
          ) : (
            <>
              {/* Session Timeout */}
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="timer-outline" size={18} color="#3B82F6" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Session Timeout</Text>
                  <Text style={styles.rowDesc}>
                    {sessionTimeout ? 'Auto logout active — 30 min inactivity' : 'Auto logout after 30 minutes'}
                  </Text>
                </View>
                <Switch value={sessionTimeout} onValueChange={handleSessionTimeout}
                  trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
                  thumbColor={sessionTimeout ? '#7B2CBF' : '#F3F4F6'} />
              </View>

              {/* Login Alerts */}
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="notifications-outline" size={18} color="#7B2CBF" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Login Alerts</Text>
                  <Text style={styles.rowDesc}>
                    {loginAlerts ? 'Email alert on new device login — active' : 'Email on new device login'}
                  </Text>
                </View>
                <Switch value={loginAlerts} onValueChange={handleLoginAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
                  thumbColor={loginAlerts ? '#7B2CBF' : '#F3F4F6'} />
              </View>

              {/* Failed Login Alerts */}
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Failed Login Alerts</Text>
                  <Text style={styles.rowDesc}>
                    {failedLoginAlerts ? 'Email alert after 3 failed attempts — active' : 'Notify after 3 failed attempts'}
                  </Text>
                </View>
                <Switch value={failedLoginAlerts} onValueChange={handleFailedLoginAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
                  thumbColor={failedLoginAlerts ? '#7B2CBF' : '#F3F4F6'} />
              </View>
            </>
          )}
        </View>

        {/* Login History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Login History</Text>
          {loginHistory.length > 3 && (
            <TouchableOpacity onPress={() => setShowAll(v => !v)}>
              <Text style={styles.viewAll}>{showAll ? 'Show Less' : 'View All'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color="#7B2CBF" style={{ paddingVertical: 20 }} />
          ) : history.length === 0 ? (
            <Text style={[styles.rowDesc, { textAlign: 'center', paddingVertical: 20 }]}>No login history found.</Text>
          ) : (
            history.map((log, idx) => (
              <View key={log.id} style={[styles.historyRow, idx === history.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.deviceIconBox}>
                  <Ionicons name={deviceIcon(log.device) as any} size={18} color="#6B7280" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{log.device}</Text>
                  <Text style={styles.rowDesc}>{log.ipAddress}</Text>
                  <Text style={styles.rowDesc}>{formatLoginTime(log.loginTime)}</Text>
                </View>
                <StatusBadge status={log.status} />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  accentLine: { height: 4, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  scroll: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },

  securedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0',
    borderRadius: 18, padding: 16, marginBottom: 20,
  },
  securedIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
  },
  securedTitle: { fontSize: 15, fontWeight: 'bold', color: '#065F46' },
  securedSub: { fontSize: 12, color: '#047857', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAll: { fontSize: 13, fontWeight: 'bold', color: '#7B2CBF' },

  card: {
    backgroundColor: '#FFF', borderRadius: 18,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  rowDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  enabledBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  enabledText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },

  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  deviceIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
});
