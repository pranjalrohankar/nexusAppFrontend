import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AdminSystemSettingsScreenProps {
  onBack: () => void;
}

export default function AdminSystemSettingsScreen({ onBack }: AdminSystemSettingsScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(true);
  const [smtpServer, setSmtpServer] = useState('smtp.nexus.com');
  const [fromEmail, setFromEmail] = useState('noreply@nexus.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSaveChanges = () => {
    Alert.alert('Success', 'System configuration saved successfully!', [
      { text: 'OK', onPress: onBack }
    ]);
  };

  const handleDownloadBackup = () => {
    Alert.alert('Backup Downloaded', 'Database SQL backup file generated and downloaded successfully.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. GENERAL SETTINGS */}
        <Text style={styles.sectionTitle}>General Settings</Text>
        <View style={styles.cardContainer}>
          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>System Language</Text>
              <Text style={styles.rowVal}>English (US)</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Language', 'Language settings coming soon.')}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>Time Zone</Text>
              <Text style={styles.rowVal}>Asia/Kolkata (IST)</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Timezone', 'Timezone configuration coming soon.')}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>System Notifications</Text>
              <Text style={styles.rowDesc}>Enable administrative push alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={notificationsEnabled ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* 2. EMAIL CONFIGURATION */}
        <Text style={styles.sectionTitle}>Email Configuration</Text>
        <View style={styles.cardContainer}>
          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>Auto Email Notifications</Text>
              <Text style={styles.rowDesc}>Send updates automatically</Text>
            </View>
            <Switch
              value={autoEmailEnabled}
              onValueChange={setAutoEmailEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={autoEmailEnabled ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SMTP Server</Text>
            <TextInput
              style={styles.textInput}
              value={smtpServer}
              onChangeText={setSmtpServer}
              placeholder="smtp.example.com"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={[styles.inputGroup, { marginBottom: 12 }]}>
            <Text style={styles.inputLabel}>From Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={fromEmail}
              onChangeText={setFromEmail}
              placeholder="noreply@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* 3. DATABASE & BACKUP */}
        <Text style={styles.sectionTitle}>Database & Backup</Text>
        <View style={styles.cardContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Database Size</Text>
              <Text style={styles.statVal}>52.4 MB</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Last Backup</Text>
              <Text style={styles.statVal}>May 31, 2026 - 3:00 PM</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.outlineBtn} onPress={handleDownloadBackup}>
            <Ionicons name="download-outline" size={16} color="#7B2CBF" />
            <Text style={styles.outlineBtnText}>Download Latest Backup</Text>
          </TouchableOpacity>
        </View>

        {/* 4. MAINTENANCE MODE */}
        <View style={styles.maintenanceCard}>
          <View style={styles.maintenanceHeader}>
            <View style={styles.textContainer}>
              <Text style={styles.maintenanceTitle}>Maintenance Mode</Text>
              <Text style={styles.maintenanceDesc}>
                Enable this to temporarily disable access for students and teachers during system updates.
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
              thumbColor={maintenanceMode ? '#DC2626' : '#F3F4F6'}
            />
          </View>
          {maintenanceMode && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color="#DC2626" />
              <Text style={styles.warningText}>System is currently closed for maintenance.</Text>
            </View>
          )}
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
          <Text style={styles.saveBtnText}>Save All Changes</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
  header: {
    backgroundColor: '#7B2CBF',
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 12,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  rowVal: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rowDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  changeLink: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 2,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 12,
    height: 44,
    gap: 8,
  },
  outlineBtnText: {
    color: '#7B2CBF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  maintenanceCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  maintenanceDesc: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
    lineHeight: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  warningText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#7B2CBF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
