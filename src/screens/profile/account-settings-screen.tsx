import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';

interface AccountSettingsScreenProps {
  onBack: () => void;
  userRole?: 'student' | 'teacher' | 'admin';
  teacherProfile?: any;
}

export default function AccountSettingsScreen({ onBack, userRole = 'student', teacherProfile: initialProfile }: AccountSettingsScreenProps) {
  const [profile, setProfile] = useState<any>(initialProfile ?? null);
  const [loading, setLoading] = useState(!initialProfile && userRole === 'teacher');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Populate form from profile
  useEffect(() => {
    if (userRole === 'teacher' && !initialProfile) {
      api.getTeacherProfile()
        .then((res: any) => {
          const data = res?.data ?? null;
          setProfile(data);
        })
        .catch(() => setLoading(false))
        .finally(() => setLoading(false));
    }
  }, [userRole, initialProfile]);

  useEffect(() => {
    const data = profile ?? initialProfile;
    if (data) {
      setName(data.name ?? '');
      setPhone(data.phone ?? '');
      setStreet(data.street ?? '');
      setCity(data.city ?? '');
      setState(data.state ?? '');
      setPinCode(data.pinCode ?? '');
    }
  }, [profile, initialProfile]);

  const roleLabel = userRole === 'teacher' ? 'Senior Instructor' : userRole === 'admin' ? 'Administrator' : 'Student';

  const initials = name
    ? name.split(' ').slice(0, 2).map((w: string) => w.charAt(0).toUpperCase()).join('')
    : userRole === 'teacher' ? 'T' : userRole === 'admin' ? 'A' : 'S';

  const email = profile?.email ?? '';
  const joinDate = profile?.joinDate ?? '';

  const location = [street, city, state, pinCode].filter(Boolean).join(', ');

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      if (userRole === 'teacher') {
        await (api as any).updateTeacherProfile({ name, phone, street, city, state, pinCode });
      }
      // Show success banner, then go back after 1.5s
      setSuccessMsg('Changes saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onBack();
      }, 1500);
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Profile Photo', 'Camera and gallery integration coming soon!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Account Settings</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
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
        {/* AVATAR */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color="#FF7A00" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{name || '—'}</Text>
          <Text style={styles.profileRole}>{roleLabel}</Text>
        </View>

        {/* FORM CARD */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Personal Information</Text>

          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <View style={[styles.inputIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="person-outline" size={18} color="#7B2CBF" />
            </View>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
            />
            <Ionicons name="create-outline" size={16} color="#9CA3AF" />
          </View>

          {/* Email — read only */}
          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
            <View style={[styles.inputIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="mail-outline" size={18} color="#EA580C" />
            </View>
            <TextInput
              style={[styles.textInput, styles.readOnlyText]}
              value={email}
              editable={false}
            />
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
          </View>

          {/* Phone */}
          <Text style={styles.inputLabel}>Phone</Text>
          <View style={styles.inputWrapper}>
            <View style={[styles.inputIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="call-outline" size={18} color="#10B981" />
            </View>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor="#9CA3AF"
            />
            <Ionicons name="create-outline" size={16} color="#9CA3AF" />
          </View>

          {/* Location */}
          <Text style={styles.inputLabel}>Location</Text>
          <View style={styles.inputWrapper}>
            <View style={[styles.inputIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="location-outline" size={18} color="#3B82F6" />
            </View>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
            />
            <Ionicons name="create-outline" size={16} color="#9CA3AF" />
          </View>
          {/* State & PIN side-by-side */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <TextInput
                style={styles.textInput}
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <TextInput
                style={styles.textInput}
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="PIN Code"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Member Since — read only */}
          {joinDate ? (
            <>
              <Text style={styles.inputLabel}>Member Since</Text>
              <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                <View style={[styles.inputIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#7B2CBF" />
                </View>
                <TextInput
                  style={[styles.textInput, styles.readOnlyText]}
                  value={joinDate}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
              </View>
            </>
          ) : null}

          {/* Role — read only */}
          <Text style={styles.inputLabel}>Role</Text>
          <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
            <View style={[styles.inputIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="school-outline" size={18} color="#EA580C" />
            </View>
            <TextInput
              style={[styles.textInput, styles.readOnlyText]}
              value={roleLabel}
              editable={false}
            />
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} activeOpacity={0.8} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
          }
        </TouchableOpacity>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity style={styles.deleteButton} activeOpacity={0.8}
          onPress={() => Alert.alert('Delete Account', 'This will permanently delete your account. Contact admin to proceed.')}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: { backgroundColor: '#7B2CBF', height: 70, justifyContent: 'center', paddingHorizontal: 20 },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined, alignSelf: 'center',
  },
  backButton: { padding: 4 },
  headerTitle: {
    color: '#FFFFFF', fontSize: 20, fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginLeft: 16,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: {
    padding: 20, width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined, alignSelf: 'center',
  },
  bottomSpacer: { height: 100 },
  // Avatar
  avatarContainer: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#7B2CBF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF7A00',
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  profileRole: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  // Form
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03, shadowRadius: 8, elevation: 3, marginBottom: 20,
  },
  sectionHeading: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 14, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    height: 48, paddingHorizontal: 12, backgroundColor: '#F9FAFB', gap: 10,
  },
  readOnlyWrapper: { backgroundColor: '#F3F4F6' },
  inputIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, fontSize: 13, color: '#1F2937', height: '100%' },
  readOnlyText: { color: '#6B7280' },
  rowInputs: { flexDirection: 'row', gap: 10, marginTop: 8 },
  // Buttons
  saveButton: {
    backgroundColor: '#7B2CBF', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 14, height: 52, gap: 8,
    shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4, marginBottom: 12,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  deleteButton: {
    borderWidth: 1, borderColor: '#FECACA', borderRadius: 14,
    height: 48, justifyContent: 'center', alignItems: 'center',
  },
  deleteButtonText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
