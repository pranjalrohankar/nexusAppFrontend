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

interface AdminSecuritySettingsScreenProps {
  onBack: () => void;
}

export default function AdminSecuritySettingsScreen({ onBack }: AdminSecuritySettingsScreenProps) {
  const [tfaEnabled, setTfaEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const handleRevokeSessions = () => {
    Alert.alert(
      'Confirm Revocation',
      'Are you sure you want to terminate all other active administrator sessions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: () => Alert.alert('Sessions Terminated', 'All other active sessions have been successfully logged out.')
        }
      ]
    );
  };

  const handleResetSecurity = () => {
    Alert.alert(
      'Confirm Reset',
      'This will reset all preferences to defaults and clear API keys. Proceed with caution?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setTfaEnabled(true);
            setSessionTimeout(true);
            setLoginAlerts(true);
            Alert.alert('Reset Complete', 'Security preferences restored to defaults.');
          }
        }
      ]
    );
  };

  const loginHistory = [
    { id: '1', device: 'Chrome on Windows', location: 'Bangalore, Karnataka', time: 'May 30, 2026 - 11:30 AM', current: true },
    { id: '2', device: 'Safari on macOS', location: 'Bangalore, Karnataka', time: 'May 28, 2026 - 4:15 PM', current: false },
    { id: '3', device: 'Chrome on Android', location: 'Mumbai, Maharashtra', time: 'May 25, 2026 - 9:00 AM', current: false }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. STATUS BLOCK */}
        <View style={styles.securedCard}>
          <View style={styles.securedIconBox}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          </View>
          <View style={styles.securedTextBox}>
            <Text style={styles.securedTitle}>System Secured</Text>
            <Text style={styles.securedDescription}>All security features are active</Text>
          </View>
        </View>

        {/* 2. PASSWORD & AUTHENTICATION */}
        <Text style={styles.sectionTitle}>Password & Authentication</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert('Action', 'Password update portal launching...')}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>Change Password</Text>
              <Text style={styles.rowDesc}>Last changed 2 months ago</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
              <Text style={styles.rowDesc}>Enabled via Auth App</Text>
            </View>
            <Switch
              value={tfaEnabled}
              onValueChange={setTfaEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={tfaEnabled ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>

          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('API Keys', 'Opening API credentials dashboard...')}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>API Keys</Text>
              <Text style={styles.rowDesc}>Manage API access tokens</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 3. SECURITY PREFERENCES */}
        <Text style={styles.sectionTitle}>Security Preferences</Text>
        <View style={styles.cardContainer}>
          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>Session Timeout</Text>
              <Text style={styles.rowDesc}>Auto logout after 30 minutes</Text>
            </View>
            <Switch
              value={sessionTimeout}
              onValueChange={setSessionTimeout}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={sessionTimeout ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.textContainer}>
              <Text style={styles.rowLabel}>Login Alerts</Text>
              <Text style={styles.rowDesc}>Email on new device login</Text>
            </View>
            <Switch
              value={loginAlerts}
              onValueChange={setLoginAlerts}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={loginAlerts ? '#7B2CBF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* 4. LOGIN HISTORY */}
        <Text style={styles.sectionTitle}>Login History</Text>
        <View style={styles.cardContainer}>
          {loginHistory.map((log) => (
            <View key={log.id} style={styles.historyRow}>
              <View style={styles.deviceWrapper}>
                <Ionicons
                  name={log.device.includes('Android') ? 'phone-portrait-outline' : 'desktop-outline'}
                  size={18}
                  color="#4B5563"
                />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.deviceTitleRow}>
                  <Text style={styles.rowLabel}>{log.device}</Text>
                  {log.current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowDesc}>{log.location} | {log.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 5. DANGER ZONE */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDesc}>These actions are irreversible. Please proceed with caution.</Text>
          <View style={styles.dangerActionCol}>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleRevokeSessions}>
              <Text style={styles.dangerBtnText}>Revoke All Sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleResetSecurity}>
              <Text style={styles.dangerBtnText}>Reset Security Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  securedCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  securedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  securedTextBox: {
    flex: 1,
  },
  securedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065F46',
  },
  securedDescription: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
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
    paddingHorizontal: 16,
    paddingVertical: 4,
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
  rowDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deviceWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#10B981',
  },
  // Danger Zone
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 20,
    padding: 20,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  dangerDesc: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    lineHeight: 16,
  },
  dangerActionCol: {
    marginTop: 16,
    gap: 12,
  },
  dangerBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
