import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface PrivacySecurityScreenProps {
  onBack: () => void;
}

export default function PrivacySecurityScreen({ onBack }: PrivacySecurityScreenProps) {
  const [profileVisible, setProfileVisible] = useState(true);
  const [activityVisible, setActivityVisible] = useState(true);
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER BANNER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. ACCOUNT SECURED CARD */}
        <View style={styles.securedCard}>
          <View style={styles.securedIconBox}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          </View>
          <View style={styles.securedTextBox}>
            <Text style={styles.securedTitle}>Account Secured</Text>
            <Text style={styles.securedDescription}>Your account is protected</Text>
          </View>
        </View>

        {/* 3. PRIVACY SETTINGS */}
        <Text style={styles.sectionHeader}>Privacy Settings</Text>
        <View style={styles.cardContainer}>
          {/* Profile Visibility */}
          <View style={styles.rowItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="eye-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Profile Visibility</Text>
              <Text style={styles.itemSubtitle}>Show profile to other students</Text>
            </View>
            <Switch
              value={profileVisible}
              onValueChange={setProfileVisible}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={profileVisible ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Activity Status */}
          <View style={styles.rowItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time-outline" size={18} color="#3B82F6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Activity Status</Text>
              <Text style={styles.itemSubtitle}>Show when you&apos;re online</Text>
            </View>
            <Switch
              value={activityVisible}
              onValueChange={setActivityVisible}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={activityVisible ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Data Collection */}
          <View style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="analytics-outline" size={18} color="#FF7A00" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Data Collection</Text>
              <Text style={styles.itemSubtitle}>Allow analytics data</Text>
            </View>
            <Switch
              value={dataCollectionEnabled}
              onValueChange={setDataCollectionEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={dataCollectionEnabled ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        {/* 4. SECURITY OPTIONS */}
        <Text style={styles.sectionHeader}>Security Options</Text>
        <View style={styles.cardContainer}>
          {/* Change Password */}
          <TouchableOpacity style={styles.rowItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Change Password</Text>
              <Text style={styles.itemSubtitle}>Update your password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Two-Factor Authentication */}
          <TouchableOpacity style={styles.rowItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="key-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Two-Factor Authentication</Text>
              <Text style={styles.itemSubtitle}>Add extra security layer</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Login History */}
          <TouchableOpacity style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="phone-portrait-outline" size={18} color="#3B82F6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Login History</Text>
              <Text style={styles.itemSubtitle}>View recent login activity</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 5. PRIVACY POLICY BLOCK */}
        <View style={styles.policyBlock}>
          <Text style={styles.policyTitle}>Privacy Policy</Text>
          <Text style={styles.policyDescription}>
            We are committed to protecting your personal information. Your data is encrypted and stored
            securely. We never share your information with third parties without your consent.
          </Text>
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Read Full Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* 6. TERMS OF SERVICE BLOCK */}
        <View style={styles.policyBlock}>
          <Text style={styles.policyTitle}>Terms of Service</Text>
          <Text style={styles.policyDescription}>
            By using Nexus Corporate Training Center, you agree to our terms of service and community
            guidelines.
          </Text>
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Read Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* 7. DATA MANAGEMENT */}
        <View style={styles.dataManagementCard}>
          <View style={styles.dataHeader}>
            <View style={styles.alertIconBox}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            </View>
            <View style={styles.securedTextBox}>
              <Text style={styles.dataTitle}>Data Management</Text>
              <Text style={styles.dataDescription}>
                Request a copy of your data or permanently delete your account and all associated data.
              </Text>
            </View>
          </View>
          <View style={styles.dataButtonsRow}>
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>Download Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
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
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
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
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  // Account Secured Card
  securedCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Policy Block
  policyBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  policyDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#7B2CBF',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#7B2CBF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Data Management Card
  dataManagementCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 20,
    padding: 20,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  dataTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  dataDescription: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
    lineHeight: 18,
  },
  dataButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
