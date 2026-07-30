import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import AccountSettingsScreen from './account-settings-screen';
import AdminHelpSupportScreen from './admin-help-support-screen';
import AdminSecuritySettingsScreen from './admin-security-settings-screen';
import AdminSystemSettingsScreen from './admin-system-settings-screen';
import HelpSupportScreen from './help-support-screen';
import NotificationsScreen from './notifications-screen';
import PrivacySecurityScreen from './privacy-security-screen';
import { LinearGradient } from 'expo-linear-gradient';

const PROFILE_PHOTO_KEY = 'user_profile_photo';

let _adminProfileCache: any = null;
let _teacherProfileCache: any = null;

interface ProfileScreenProps {
  onLogout: () => void;
  currentSubView: 'profile' | 'notifications' | 'privacy' | 'help' | 'account';
  onChangeSubView: (view: 'profile' | 'notifications' | 'privacy' | 'help' | 'account') => void;
  userRole?: 'student' | 'teacher' | 'admin';
  userName?: string;
  userEmail?: string;
  lastLogin?: string;
}

export default function ProfileScreen({ onLogout, currentSubView, onChangeSubView, userRole = 'student', userName = '', userEmail = '', lastLogin = '' }: ProfileScreenProps) {
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);

  const loadPhoto = useCallback(() => {
    AsyncStorage.getItem(PROFILE_PHOTO_KEY)
      .then(uri => setPhotoUri(uri ?? null))
      .catch(() => { });
  }, []);

  const refreshTeacherProfile = useCallback(() => {
    if (userRole === 'teacher') {
      api.getTeacherProfile()
        .then((res: any) => setTeacherProfile(res?.data ?? null))
        .catch(() => { });
    }
  }, [userRole]);

  useEffect(() => {
    loadPhoto();
    if (userRole === 'student') {
      api.getStudentProfile()
        .then((res: any) => setStudentProfile(res?.data ?? null))
        .catch(() => {});
      api.getStudentEnrollments()
        .then((res: any) => setStudentEnrollments(Array.isArray(res) ? res : []))
        .catch(() => {});
    }
    if (userRole === 'admin') {
      // Always fetch fresh so lastLogin reflects the current session
      _adminProfileCache = null;
      api.getAdminProfile()
        .then((res: any) => {
          const data = res?.data ?? null;
          if (data && lastLogin) data.lastLogin = lastLogin;
          _adminProfileCache = data;
          setAdminProfile(data);
        })
        .catch(() => { });
    }
    if (userRole === 'teacher') {
      if (_teacherProfileCache) {
        setTeacherProfile(_teacherProfileCache);
      } else {
        api.getTeacherProfile()
          .then((res: any) => { _teacherProfileCache = res?.data ?? null; setTeacherProfile(_teacherProfileCache); })
          .catch(() => { });
      }
    }
  }, [userRole]);

  // If the stored photo URI is broken/invalid, clear it so the
  // initials-avatar fallback can render instead of a blank box.
  const handlePhotoError = useCallback(() => {
    setPhotoUri(null);
    AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => { });
  }, []);

  const formatRevenue = (amount: number) => {
    if (!amount) return '₹0';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };
  // Sub-view Routing
  if (currentSubView === 'notifications') {
    return <NotificationsScreen onBack={() => onChangeSubView('profile')} />;
  }

  if (currentSubView === 'privacy') {
    if (userRole === 'admin') {
      return <AdminSecuritySettingsScreen onBack={() => onChangeSubView('profile')} userId={adminProfile?.id} />;
    }
    return <PrivacySecurityScreen onBack={() => onChangeSubView('profile')} />;
  }

  if (currentSubView === 'help') {
    if (userRole === 'admin') {
      return <AdminHelpSupportScreen onBack={() => onChangeSubView('profile')} />;
    }
    return <HelpSupportScreen onBack={() => onChangeSubView('profile')} teacherProfile={userRole === 'teacher' ? teacherProfile : null} />;
  }

  if (currentSubView === 'account') {
    if (userRole === 'admin') {
      return <AdminSystemSettingsScreen onBack={() => onChangeSubView('profile')} />;
    }
    return (
      <AccountSettingsScreen
        onBack={() => { _teacherProfileCache = null; loadPhoto(); refreshTeacherProfile(); onChangeSubView('profile'); }}
        userRole={userRole}
        teacherProfile={userRole === 'teacher' ? teacherProfile : null}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. PURPLE HEADER (always rounded — matches design for every role) */}

      
      <View style={styles.headerBanner}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
          ]}
          locations={[0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <Text style={styles.headerTitle}>
          {userRole === 'admin' ? 'Admin Profile' : userRole === 'teacher' ? 'Profile' : 'My Profile'}
        </Text>
      </View>
      
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        {/* 2. PROFILE DETAILS CARD — avatar sits on top overlapping header */}
        <View style={styles.profileCardOuter}>
          {/* AVATAR floats above card */}
          <View style={styles.avatarFloatContainer}>
            <View style={styles.avatarWrapper}>
              {photoUri && userRole !== 'admin' ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.avatarImage}
                  onError={handlePhotoError}
                />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {userRole === 'teacher'
                      ? ((teacherProfile?.name ?? '').charAt(0).toUpperCase() || 'T')
                      : userRole === 'admin'
                        ? 'A'
                        : ((userName ?? '').charAt(0).toUpperCase() || 'S')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* WHITE CARD */}
          <View style={styles.profileCard}>

            {/* User Info */}
            <Text style={styles.userName}>
              {userRole === 'teacher'
                ? ((teacherProfile?.name ?? userName) || 'Teacher')
                : userRole === 'admin'
                  ? ((adminProfile?.name ?? userName) || 'Administrator')
                  : ((studentProfile?.name ?? userName) || 'Student')}
            </Text>
            <Text style={styles.userRole}>
              {userRole === 'teacher'
                ? 'Senior Instructor'
                : userRole === 'admin'
                  ? 'System Administrator'
                  : 'Student'}
            </Text>

            <View style={styles.joinedRow}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.joinedText}>
                {userRole === 'teacher' && teacherProfile?.joinDate
                  ? `Since ${teacherProfile.joinDate}`
                  : userRole === 'teacher'
                    ? 'Since January 2024'
                    : userRole === 'student' && studentProfile?.joinedDate
                      ? `Joined ${studentProfile.joinedDate}`
                      : userRole === 'admin' && adminProfile?.createdAt
                        ? `Joined ${adminProfile.createdAt}`
                        : ''}
              </Text>
            </View>

            {/* Badges / Skills tags row */}
            <View style={styles.badgesWrapper}>
              {userRole === 'teacher' ? (
                teacherProfile?.specialization
                  ? teacherProfile.specialization.split(',').map((spec: string, i: number) => {
                    const colors = [
                      { bg: '#F3E8FF', text: '#7B2CBF' },
                      { bg: '#ECFDF5', text: '#10B981' },
                      { bg: '#FFF7ED', text: '#EA580C' },
                      { bg: '#E0F2FE', text: '#0369A1' },
                      { bg: '#FEE2E2', text: '#DC2626' },
                    ];
                    const c = colors[i % colors.length];
                    return (
                      <View key={i} style={[styles.skillsBadge, { backgroundColor: c.bg }]}>
                        <Text style={[styles.skillsBadgeText, { color: c.text }]}>{spec.trim()}</Text>
                      </View>
                    );
                  })
                  : null
              ) : userRole === 'admin' ? (
                <>
                  <View style={[styles.skillsBadge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.skillsBadgeText, { color: '#DC2626' }]}>Security</Text></View>
                  <View style={[styles.skillsBadge, { backgroundColor: '#E0F2FE' }]}><Text style={[styles.skillsBadgeText, { color: '#0369A1' }]}>Operations</Text></View>
                  <View style={[styles.skillsBadge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.skillsBadgeText, { color: '#7B2CBF' }]}>Database</Text></View>
                </>
              ) : null}
            </View>

            {/* Stats Badges Row */}
            <View style={styles.statsRow}>
              {userRole === 'teacher' ? (
                <>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#7B2CBF' }]}>
                      <Ionicons name="book-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{teacherProfile ? String(teacherProfile.coursesCount) : '-'}</Text>
                    <Text style={styles.statLabel}>Courses</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' }]}>
                      <Ionicons name="people-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{teacherProfile ? String(teacherProfile.studentsCount) : '-'}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{teacherProfile ? String(teacherProfile.classesCount ?? 48) : '48'}</Text>
                    <Text style={styles.statLabel}>Classes</Text>
                  </View>
                </>
              ) : userRole === 'admin' ? (
                <>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#7B2CBF' }]}>
                      <Ionicons name="people-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{adminProfile ? String(adminProfile.totalStudents) : '-'}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' }]}>
                      <Ionicons name="person-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{adminProfile ? String(adminProfile.totalTeachers) : '-'}</Text>
                    <Text style={styles.statLabel}>Teachers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#EA580C' }]}>
                      <Ionicons name="book-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{adminProfile ? String(adminProfile.totalCourses) : '-'}</Text>
                    <Text style={styles.statLabel}>Courses</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="cash-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{adminProfile ? formatRevenue(adminProfile.revenue) : '-'}</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                  </View>
                </>
              ) : (
                // Student
                <>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#7B2CBF' }]}>
                      <Ionicons name="book-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{studentEnrollments.length}</Text>
                    <Text style={styles.statLabel}>Enrolled</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="ribbon-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{studentEnrollments.filter((e: any) => e.status === 'COMPLETED').length}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#FF7A00' }]}>
                      <Ionicons name="trending-up-outline" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.statCount}>{studentEnrollments.filter((e: any) => e.status === 'ACTIVE').length}</Text>
                    <Text style={styles.statLabel}>In Progress</Text>
                  </View>
                </>
              )}
            </View>

            {/* Contact Details Pills */}
            <View style={styles.contactDetails}>
              {/* Email */}
              <View style={[styles.detailPill, userRole === 'teacher' && { borderWidth: 0, borderRadius: 0, backgroundColor: '#F3F4F6' }]}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="mail-outline" size={18} color="#6B7280" />
                </View>
                <View style={styles.detailTextBox}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>
                    {userRole === 'teacher'
                      ? ((teacherProfile?.email ?? userEmail) || '')
                      : userRole === 'admin'
                        ? ((adminProfile?.email ?? userEmail) || '')
                        : ((studentProfile?.email ?? userEmail) || '')}
                  </Text>
                </View>
              </View>

              {/* Phone */}
              {(userRole === 'student'
                ? studentProfile?.phone
                : userRole === 'teacher' ? teacherProfile?.phone
                : adminProfile?.phone) ? (
                <View style={[styles.detailPill, userRole === 'teacher' && { borderWidth: 0, borderRadius: 0, backgroundColor: '#F3F4F6' }]}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="call-outline" size={18} color="#6B7280" />
                  </View>
                  <View style={styles.detailTextBox}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>
                      {userRole === 'student' ? studentProfile.phone
                        : userRole === 'teacher' ? teacherProfile.phone
                        : adminProfile.phone}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Location */}
              {userRole === 'student' && (studentProfile?.city || studentProfile?.street) ? (
                <View style={styles.detailPill}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="location-outline" size={18} color="#6B7280" />
                  </View>
                  <View style={styles.detailTextBox}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {[studentProfile.city, studentProfile.state].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
              ) : userRole === 'teacher' && (teacherProfile?.city || teacherProfile?.street) ? (
                <View style={[styles.detailPill, { borderWidth: 0, borderRadius: 0, backgroundColor: '#F3F4F6' }]}>
                  <View style={styles.detailIconBox}>
                    <Ionicons name="location-outline" size={18} color="#6B7280" />
                  </View>
                  <View style={styles.detailTextBox}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {[teacherProfile.street, teacherProfile.city, teacherProfile.state, teacherProfile.pinCode].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>{/* profileCardOuter */}

        {/* DYNAMIC SECTION (System Administration for Admin, Enrolled Courses for Student — teacher has no section) */}
        {userRole === 'teacher' ? null : userRole === 'admin' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>System Administration</Text>
            <View style={styles.achievementsCard}>
              <View style={styles.adminDetailRow}>
                <Text style={styles.adminDetailLabel}>Role</Text>
                <Text style={styles.adminDetailValue}>Super Administrator</Text>
              </View>
              <View style={styles.adminDetailRow}>
                <Text style={styles.adminDetailLabel}>Access Level</Text>
                <Text style={styles.adminDetailValue}>Full Access</Text>
              </View>
              <View style={styles.adminDetailRow}>
                <Text style={styles.adminDetailLabel}>Last Login</Text>
                <Text style={styles.adminDetailValue}>{adminProfile?.lastLogin ?? 'Not recorded'}</Text>
              </View>
              <View style={[styles.adminDetailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.adminDetailLabel}>System Version</Text>
                <Text style={styles.adminDetailValue}>v1.0.0</Text>
              </View>
            </View>
          </View>
        ) : (
          // Student Courses
          <View style={styles.sectionContainer}>
            {/* <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Courses</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View> */}
            {/* <View style={styles.coursesList}>
              {studentEnrollments.length === 0 ? (
                <View style={styles.courseCard}>
                  <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>No enrollments yet.</Text>
                </View>
              ) : (
                studentEnrollments.map((e: any, i: number) => {
                  const isCompleted = e.status === 'COMPLETED';
                  const isActive = e.status === 'ACTIVE';
                  const progressColor = isCompleted ? '#10B981' : '#FF7A00';
                  const progressPct = isCompleted ? 100 : isActive ? 50 : 25;
                  return (
                    <View key={i} style={styles.courseCard}>
                      <View style={styles.courseHeaderRow}>
                        <Text style={styles.courseTitle}>{e.courseTitle}</Text>
                        <Text style={[styles.coursePercent, { color: progressColor }]}>
                          {isCompleted ? '100%' : e.paymentStatus === 'Paid' ? '50%' : '25%'}
                        </Text>
                      </View>
                      <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#ECFDF5' : '#FFF7ED' }]}>
                          <Text style={[styles.statusBadgeText, { color: progressColor }]}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, {
                          width: `${isCompleted ? 100 : e.paymentStatus === 'Paid' ? 50 : 25}%` as any,
                          backgroundColor: progressColor
                        }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View> */}
          </View>
        )}

        {/* 4. SETTINGS LIST CONTAINER */}
        <View style={styles.settingsContainer}>
          {userRole === 'admin' ? (
            <>
              {/* System Settings */}
              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.7}
                onPress={() => onChangeSubView('account')}
              >
                <Ionicons name="settings-outline" size={20} color="#4B5563" />
                <Text style={styles.settingsItemText}>System Settings</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Security Settings */}
              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.7}
                onPress={() => onChangeSubView('privacy')}
              >
                <Ionicons name="shield-outline" size={20} color="#4B5563" />
                <Text style={styles.settingsItemText}>Security Settings</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => onChangeSubView('help')}
              >
                <Ionicons name="help-circle-outline" size={20} color="#4B5563" />
                <Text style={styles.settingsItemText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Account Settings */}
              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.7}
                onPress={() => onChangeSubView('account')}
              >
                <Ionicons name="settings-outline" size={20} color="#4B5563" />
                <Text style={styles.settingsItemText}>Account Settings</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Notifications — student only */}
              {userRole !== 'teacher' && (
                <TouchableOpacity
                  style={styles.settingsItem}
                  activeOpacity={0.7}
                  onPress={() => onChangeSubView('notifications')}
                >
                  <Ionicons name="notifications-outline" size={20} color="#4B5563" />
                  <Text style={styles.settingsItemText}>Notifications</Text>
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>3</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* Privacy & Security — student only */}
              {userRole !== 'teacher' && (
                <TouchableOpacity
                  style={styles.settingsItem}
                  activeOpacity={0.7}
                  onPress={() => onChangeSubView('privacy')}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
                  <Text style={styles.settingsItemText}>Privacy & Security</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* Help & Support */}
              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => onChangeSubView('help')}
              >
                <Ionicons name="help-circle-outline" size={20} color="#E05A00" />
                <Text style={styles.settingsItemText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 5. LOGOUT BUTTON */}
        <TouchableOpacity style={[styles.logoutButton, { borderRadius: 14 }]} onPress={async () => {
          if (userRole === 'student') {
            try { await api.setActivityStatus(false); } catch {}
          }
          onLogout();
        }} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Logout</Text>
          <Ionicons name="arrow-forward" size={18} color="#EF4444" />
        </TouchableOpacity>

        {/* 6. COPYRIGHT FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Nexus Corporate Training Center v1.0.0</Text>
          <Text style={styles.footerText}>
            {userRole === 'teacher' ? 'Teacher Portal' : '© 2026 Nexus Corporate Training Center. All rights reserved.'}
          </Text>
        </View>

        {/* Bottom spacer to account for floating tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF', // Matches curved header color
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 26,
  },
  bottomSpacer: {
    height: 100, // Enough spacing to not be covered by floating tab bar
  },

  headerAccentLine: {
    height: 4,
    marginBottom: 10,
  },
  // Curved purple banner header
  headerBanner: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  // Avatar floats between header and card
  avatarFloatContainer: {
    alignItems: 'center',
    marginBottom: -52,
    zIndex: 10,
  },
  // Outer container: positions avatar over the card
  profileCardOuter: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  // Profile Info Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 68,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Avatar wrapper (relative so camera badge positions correctly)
  avatarWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB', // visible placeholder bg while loading, instead of a blank/invisible box
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FF7A00',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  joinedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Stats row style
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 24,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  // Contact details capsules
  contactDetails: {
    width: '100%',
    gap: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailIconBox: {
    marginRight: 14,
  },
  detailTextBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  // My Courses Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF7A00',
  },
  coursesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    paddingRight: 8,
  },
  coursePercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Settings List Container
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 24,
    height: 48,
    gap: 8,
  },
  logoutIcon: {
    marginTop: 0,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Footer text
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 4,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  skillsBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  skillsBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  achievementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  achievementYear: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  adminDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  adminDetailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  adminDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
});