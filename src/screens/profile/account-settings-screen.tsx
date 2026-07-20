import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
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

const PROFILE_PHOTO_KEY = 'user_profile_photo';

interface AccountSettingsScreenProps {
  onBack: () => void;
  userRole?: 'student' | 'teacher' | 'admin';
  teacherProfile?: any;
}

export default function AccountSettingsScreen({
  onBack,
  userRole = 'student',
  teacherProfile: initialProfile,
}: AccountSettingsScreenProps) {
  const [profile, setProfile] = useState<any>(initialProfile ?? null);
  const [loading, setLoading] = useState(
    (!initialProfile && userRole === 'teacher') || userRole === 'student'
  );
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  // Load saved photo
  useEffect(() => {
    AsyncStorage.getItem(PROFILE_PHOTO_KEY)
      .then(uri => { if (uri) setPhotoUri(uri); })
      .catch(() => {});
  }, []);

  // Fetch profile
  useEffect(() => {
    if (userRole === 'student') {
      api.getStudentProfile()
        .then((res: any) => setProfile(res?.data ?? null))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (userRole === 'teacher' && !initialProfile) {
      api.getTeacherProfile()
        .then((res: any) => setProfile(res?.data ?? null))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userRole, initialProfile]);

  // Fill form fields when profile loads
  useEffect(() => {
    const data = profile ?? initialProfile;
    if (data) {
      setName(data.name ?? '');
      setPhone(data.phone ?? '');
      setCity(data.city ?? '');
      setState(data.state ?? '');
    }
  }, [profile, initialProfile]);

  const roleLabel =
    userRole === 'teacher' ? 'Senior Instructor' :
    userRole === 'admin' ? 'Administrator' : 'Student';

  const initials = name
    ? name.split(' ').slice(0, 2).map((w: string) => w.charAt(0).toUpperCase()).join('')
    : userRole === 'teacher' ? 'T' : userRole === 'admin' ? 'A' : 'S';

  const email = profile?.email ?? (initialProfile?.email ?? '');
  const joinDate = profile?.joinedDate ?? profile?.joinDate ?? (initialProfile?.joinDate ?? '');

  const handlePhotoError = () => {
    setPhotoUri(null);
    AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
  };

  // Photo picker — available for both student and teacher
  const handleChangePhoto = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri);
      }
      return;
    }

    const options: any[] = [
      {
        text: 'Choose from Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow photo library access.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri);
          }
        },
      },
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow camera access.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri);
          }
        },
      },
    ];
    if (photoUri) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: async () => { setPhotoUri(null); await AsyncStorage.removeItem(PROFILE_PHOTO_KEY); },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile Photo', 'Choose an option', options);
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      if (userRole === 'student') {
        if (!profile) { showToast('Profile not loaded yet. Please wait.', 'error'); setSaving(false); return; }
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '.';
        const res: any = await (api as any).updateStudentProfile({
          firstName, lastName, phone, city, state,
        });
        if (res?.success === false) { showToast(res.message || 'Failed to update.', 'error'); return; }
        setProfile((prev: any) => ({ ...prev, name: name.trim(), phone, city, state }));
        showToast('Profile updated successfully!', 'success');
      } else if (userRole === 'teacher') {
        await (api as any).updateTeacherProfile({ name, phone, city, state, profileImage: photoUri });
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => onBack(), 1600);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const gradientColors = ['rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)','rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)','rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)','rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)','rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)'] as const;
  const gradientLocations = [0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1] as const;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <LinearGradient colors={gradientColors} locations={gradientLocations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerAccentLine} />
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Account Settings</Text>
          </View>
        </View>
        <View style={styles.loadingBox}><ActivityIndicator size="large" color="#7B2CBF" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastOpacity }]}>
          <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'close-circle'} size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={gradientColors} locations={gradientLocations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerAccentLine} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangePhoto} activeOpacity={0.85}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} onError={handlePhotoError} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={15} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{name || '—'}</Text>
          <Text style={styles.avatarRole}>{roleLabel}</Text>
          {photoUri && (
            <TouchableOpacity
              onPress={async () => { setPhotoUri(null); await AsyncStorage.removeItem(PROFILE_PHOTO_KEY); }}
              style={styles.removePhotoBtn}
            >
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>

          {/* Full Name — editable */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EDE9FF' }]}>
              <Ionicons name="person-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Full Name</Text>
              <TextInput style={styles.rowInput} value={name} onChangeText={setName} placeholder="Enter full name" placeholderTextColor="#C4C4C4" />
            </View>
            <Ionicons name="create-outline" size={16} color="#C4C4C4" />
          </View>
          <View style={styles.divider} />

          {/* Email — read only */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E8' }]}>
              <Ionicons name="mail-outline" size={18} color="#FF8C00" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{email || '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Phone — editable */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#E8FFF3' }]}>
              <Ionicons name="call-outline" size={18} color="#22C55E" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Phone</Text>
              <TextInput style={styles.rowInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone number" placeholderTextColor="#C4C4C4" />
            </View>
            <Ionicons name="create-outline" size={16} color="#C4C4C4" />
          </View>
          <View style={styles.divider} />

          {/* City — editable */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF4FF' }]}>
              <Ionicons name="location-outline" size={18} color="#6B8FFF" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>City</Text>
              <TextInput style={styles.rowInput} value={city} onChangeText={setCity} placeholder="Enter city" placeholderTextColor="#C4C4C4" />
            </View>
            <Ionicons name="create-outline" size={16} color="#C4C4C4" />
          </View>
          <View style={styles.divider} />

          {/* State — editable */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF4FF' }]}>
              <Ionicons name="map-outline" size={18} color="#6B8FFF" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>State</Text>
              <TextInput style={styles.rowInput} value={state} onChangeText={setState} placeholder="Enter state" placeholderTextColor="#C4C4C4" />
            </View>
            <Ionicons name="create-outline" size={16} color="#C4C4C4" />
          </View>
          <View style={styles.divider} />

          {/* Member Since — read only */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="calendar-outline" size={18} color="#7B2CBF" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Member Since</Text>
              <Text style={styles.rowValue}>{joinDate || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} activeOpacity={0.85} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        {/* Delete Account — teacher/admin only */}
        {userRole !== 'student' && (
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Delete Account', 'This will permanently delete your account. Contact admin to proceed.', [{ text: 'OK' }])}
          >
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  header: { backgroundColor: '#7B2CBF', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  scroll: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: {
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 40,
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  avatarCard: {
    backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center',
    paddingVertical: 24, paddingHorizontal: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#7B2CBF', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E7EB' },
  avatarInitials: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF7A00',
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  avatarRole: { fontSize: 13, color: '#888', marginTop: 3 },
  removePhotoBtn: { marginTop: 10, paddingVertical: 4, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  removePhotoText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12, marginTop: 4 },
  infoCard: {
    backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, color: '#999', marginBottom: 2, fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  rowInput: { fontSize: 14, color: '#1A1A1A', fontWeight: '500', padding: 0, margin: 0 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 50 },
  saveBtn: {
    backgroundColor: '#7B2CBF', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FFF' },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  spacer: { height: 40 },
});
