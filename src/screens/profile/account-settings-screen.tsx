import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AccountSettingsScreenProps {
  onBack: () => void;
  userRole?: 'student' | 'teacher' | 'admin';
}

export default function AccountSettingsScreen({ onBack, userRole = 'student' }: AccountSettingsScreenProps) {
  const getDefaultName = () => {
    if (userRole === 'teacher') return 'Priya Sharma';
    if (userRole === 'admin') return 'Administrator';
    return 'John Doe';
  };

  const getDefaultEmail = () => {
    if (userRole === 'teacher') return 'priya.sharma@pratham.org';
    if (userRole === 'admin') return 'admin@pratham.edu';
    return 'john.doe@email.com';
  };

  const getDefaultPhone = () => {
    if (userRole === 'teacher') return '+91 98765 43210';
    if (userRole === 'admin') return '+91 99999 88888';
    return '+91 98765 43210';
  };

  const [name, setName] = useState(getDefaultName());
  const [email, setEmail] = useState(getDefaultEmail());
  const [phone, setPhone] = useState(getDefaultPhone());
  const [location, setLocation] = useState('Bangalore, Karnataka');

  const roleLabel = userRole === 'teacher' ? 'Teacher' : userRole === 'admin' ? 'Administrator' : 'Student';

  const handleSaveChanges = () => {
    if (!name || !email || !phone || !location) {
      Alert.alert('Error', 'Please fill in all editable fields.');
      return;
    }
    Alert.alert('Success', 'Your changes have been saved successfully!', [
      { text: 'OK', onPress: onBack },
    ]);
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Profile Photo', 'Camera and gallery integration coming soon!');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER BANNER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. AVATAR CHANGE BOX */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userRole === 'teacher' ? 'P' : userRole === 'admin' ? 'A' : 'J'}
              </Text>
            </View>
            <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color="#FF7A00" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change Profile Picture</Text>
          </TouchableOpacity>
        </View>

        {/* 3. SETTINGS FORM CARD */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Email Address */}
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Phone Number */}
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Location */}
          <Text style={styles.inputLabel}>Location</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* User Role (Read-only) */}
          <Text style={styles.inputLabel}>{roleLabel} Role</Text>
          <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
            <Ionicons name="school-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, styles.disabledTextInput]}
              value={roleLabel}
              editable={false}
            />
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={styles.lockIcon} />
          </View>
        </View>

        {/* 4. SAVE BUTTON */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

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
  // Avatar Container
  avatarContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD7B5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  changePhotoBtn: {
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  // Form card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    height: '100%',
  },
  disabledInputWrapper: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  disabledTextInput: {
    color: '#9CA3AF',
  },
  lockIcon: {
    marginLeft: 8,
  },
  // Save Changes Button
  saveButton: {
    backgroundColor: '#7B2CBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    gap: 8,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveIcon: {
    marginTop: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
