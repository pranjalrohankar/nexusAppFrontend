import React, { useState, useEffect } from 'react';
import TermsConditionsScreen from './terms-conditions-screen';
import PrivacyPolicyScreen from './privacy-policy-screen';
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
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

interface PrivacySecurityScreenProps {
  onBack: () => void;
}

export default function PrivacySecurityScreen({ onBack }: PrivacySecurityScreenProps) {
  const [activityVisible, setActivityVisible] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    api.getPrivacySettings()
      .then((res: any) => {
        if (res?.data?.activityStatusEnabled !== undefined)
          setActivityVisible(res.data.activityStatusEnabled);
      })
      .catch(() => {});
  }, []);

  const handleActivityToggle = (value: boolean) => {
    setActivityVisible(value);
    api.updatePrivacySettings({ activityStatusEnabled: value }).catch(() => {});
  };

  if (showPrivacy) return <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />;
  if (showTerms) return <TermsConditionsScreen onBack={() => setShowTerms(false)} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER BANNER */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)','rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)','rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)','rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)','rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)']}
          locations={[0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBar}
        />
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
          {/* Activity Status */}
          <View style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time-outline" size={18} color="#3B82F6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>Activity Status</Text>
              <Text style={styles.itemSubtitle}>Show when you&apos;re online</Text>
            </View>
            <Switch
              value={activityVisible}
              onValueChange={handleActivityToggle}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={activityVisible ? '#7B2CBF' : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>


        </View>

        {/* 4. PRIVACY POLICY BLOCK */}
        <View style={styles.policyBlock}>
          <Text style={styles.policyTitle}>Privacy Policy</Text>
          <Text style={styles.policyDescription}>
            We are committed to protecting your personal information. Your data is encrypted and stored
            securely. We never share your information with third parties without your consent.
          </Text>
          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}
            onPress={() => setShowPrivacy(true)}>
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
          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}
            onPress={() => setShowTerms(true)}>
            <Text style={styles.outlineButtonText}>Read Terms of Service</Text>
          </TouchableOpacity>
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
  gradientBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 14,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
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
