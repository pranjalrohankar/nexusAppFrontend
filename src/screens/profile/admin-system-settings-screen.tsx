import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const ACCENT_COLORS: any = [
  'rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)',
  'rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)',
  'rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)',
  'rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)',
  'rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)',
];
const ACCENT_LOCS: any = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1];

interface Props { onBack: () => void; }

export default function AdminSystemSettingsScreen({ onBack }: Props) {
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient colors={ACCENT_COLORS} locations={ACCENT_LOCS}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentLine} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* GENERAL SETTINGS */}
        <Text style={styles.sectionTitle}>General Settings</Text>
        <View style={styles.card}>

          {/* System Language */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="globe-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>System Language</Text>
              <Text style={styles.rowDesc}>English (US)</Text>
            </View>
            <TouchableOpacity style={styles.changePill}
              onPress={() => Alert.alert('Language', 'Language settings coming soon.')}>
              <Text style={styles.changePillText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Time Zone */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="time-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Time Zone</Text>
              <Text style={styles.rowDesc}>Asia/Kolkata (IST)</Text>
            </View>
            <TouchableOpacity style={styles.changePill}
              onPress={() => Alert.alert('Timezone', 'Timezone configuration coming soon.')}>
              <Text style={styles.changePillText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* System Notifications */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>System Notifications</Text>
              <Text style={styles.rowDesc}>Enable all notifications</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={notifications ? '#7B2CBF' : '#F3F4F6'} />
          </View>
        </View>

        {/* DATABASE & BACKUP */}
        <Text style={styles.sectionTitle}>Database & Backup</Text>
        <View style={styles.card}>

          {/* Auto Backup */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="server-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Auto Backup</Text>
              <Text style={styles.rowDesc}>Daily at 2:00 AM</Text>
            </View>
            <Switch value={autoBackup} onValueChange={setAutoBackup}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={autoBackup ? '#7B2CBF' : '#F3F4F6'} />
          </View>

          {/* Last Backup row */}
          <View style={styles.lastBackupRow}>
            <View>
              <Text style={styles.lastBackupLabel}>Last Backup</Text>
              <Text style={styles.lastBackupVal}>May 27, 2026 - 2:00 AM</Text>
            </View>
            <TouchableOpacity style={styles.backupNowBtn}
              onPress={() => Alert.alert('Backup', 'Manual backup started...')}>
              <Ionicons name="refresh-outline" size={14} color="#7B2CBF" />
              <Text style={styles.backupNowText}>Backup Now</Text>
            </TouchableOpacity>
          </View>

          {/* Download button */}
          <TouchableOpacity style={styles.downloadBtn}
            onPress={() => Alert.alert('Download', 'Backup file downloaded successfully.')}>
            <Text style={styles.downloadBtnText}>Download Latest Backup</Text>
          </TouchableOpacity>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveBtn}
          onPress={() => Alert.alert('Saved', 'System settings saved successfully!')}>
          <Text style={styles.saveBtnText}>Save All Changes</Text>
        </TouchableOpacity>

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

  sectionTitle: {
    fontSize: 15, fontWeight: 'bold', color: '#1F2937',
    marginBottom: 10, marginTop: 4,
  },

  card: {
    backgroundColor: '#FFF', borderRadius: 18,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', gap: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  rowDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  changePill: {
    backgroundColor: '#F3F4F6', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  changePillText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  lastBackupRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastBackupLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  lastBackupVal: { fontSize: 12, color: '#1F2937', fontWeight: '600', marginTop: 2 },

  backupNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#DDD6FE',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#F5F3FF',
  },
  backupNowText: { fontSize: 12, fontWeight: '700', color: '#7B2CBF' },

  downloadBtn: {
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, height: 44,
    justifyContent: 'center', alignItems: 'center',
    marginVertical: 14,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  saveBtn: {
    backgroundColor: '#7B2CBF', borderRadius: 14,
    height: 52, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
