import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountSettingsScreen from './account-settings-screen';
import AdminHelpSupportScreen from './admin-help-support-screen';
import AdminSecuritySettingsScreen from './admin-security-settings-screen';
import AdminSystemSettingsScreen from './admin-system-settings-screen';
import HelpSupportScreen from './help-support-screen';
import NotificationsScreen from './notifications-screen';
import PrivacySecurityScreen from './privacy-security-screen';

interface ProfileScreenProps {
  onLogout: () => void;
  currentSubView: 'profile' | 'notifications' | 'privacy' | 'help' | 'account';
  onChangeSubView: (view: 'profile' | 'notifications' | 'privacy' | 'help' | 'account') => void;
  userRole?: 'student' | 'teacher' | 'admin';
}

export default function ProfileScreen({ onLogout, currentSubView, onChangeSubView, userRole = 'student' }: ProfileScreenProps) {
  // Sub-view Routing
  if (currentSubView === 'notifications') {
    return <NotificationsScreen onBack={() => onChangeSubView('profile')} />;
  }

  if (currentSubView === 'privacy') {
    if (userRole === 'admin') {
      return <AdminSecuritySettingsScreen onBack={() => onChangeSubView('profile')} />;
    }
    return <PrivacySecurityScreen onBack={() => onChangeSubView('profile')} />;
  }

  if (currentSubView === 'help') {
    if (userRole === 'admin') {
      return <AdminHelpSupportScreen onBack={() => onChangeSubView('profile')} />;
    }
    return <HelpSupportScreen onBack={() => onChangeSubView('profile')} />;
  }

  if (currentSubView === 'account') {
    if (userRole === 'admin') {
      return <AdminSystemSettingsScreen onBack={() => onChangeSubView('profile')} />;
    }
    return <AccountSettingsScreen onBack={() => onChangeSubView('profile')} userRole={userRole} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. CURVED PURPLE HEADER */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {/* 2. PROFILE DETAILS CARD */}
        <View style={styles.profileCard}>
          {/* Avatar Container */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userRole === 'student' ? 'J' : userRole === 'teacher' ? 'P' : 'A'}
              </Text>
            </View>
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
              <Ionicons name="camera" size={12} color="#FF7A00" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>
            {userRole === 'student' ? 'John Doe' : userRole === 'teacher' ? 'Priya Sharma' : 'Administrator'}
          </Text>
          <Text style={styles.userRole}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Text>

          <View style={styles.joinedRow}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.joinedText}>Joined January 2025</Text>
          </View>

          {/* Badges / Skills tags row */}
          <View style={styles.badgesWrapper}>
            {userRole === 'teacher' ? (
              <>
                <View style={[styles.skillsBadge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.skillsBadgeText, { color: '#7B2CBF' }]}>Data Science</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#ECFDF5' }]}><Text style={[styles.skillsBadgeText, { color: '#10B981' }]}>Machine Learning</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#FFF7ED' }]}><Text style={[styles.skillsBadgeText, { color: '#EA580C' }]}>Python</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#E0F2FE' }]}><Text style={[styles.skillsBadgeText, { color: '#0369A1' }]}>Full Stack</Text></View>
              </>
            ) : userRole === 'admin' ? (
              <>
                <View style={[styles.skillsBadge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.skillsBadgeText, { color: '#DC2626' }]}>Security</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#E0F2FE' }]}><Text style={[styles.skillsBadgeText, { color: '#0369A1' }]}>Operations</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.skillsBadgeText, { color: '#7B2CBF' }]}>Database</Text></View>
              </>
            ) : (
              <>
                <View style={[styles.skillsBadge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.skillsBadgeText, { color: '#7B2CBF' }]}>Frontend</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#ECFDF5' }]}><Text style={[styles.skillsBadgeText, { color: '#10B981' }]}>Backend</Text></View>
                <View style={[styles.skillsBadge, { backgroundColor: '#FFF7ED' }]}><Text style={[styles.skillsBadgeText, { color: '#EA580C' }]}>UI/UX Design</Text></View>
              </>
            )}
          </View>

          {/* Stats Badges Row */}
          <View style={styles.statsRow}>
            {userRole === 'teacher' ? (
              <>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#7B2CBF' }]}>
                    <Ionicons name="book-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>3</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="people-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>156</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="calendar-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>48</Text>
                  <Text style={styles.statLabel}>Classes</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FF7A00' }]}>
                    <Ionicons name="star-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>4.9</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </>
            ) : userRole === 'admin' ? (
              <>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#7B2CBF' }]}>
                    <Ionicons name="people-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>1.2k</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="person-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>48</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#EA580C' }]}>
                    <Ionicons name="book-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>24</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="cash-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>₹12.5L</Text>
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
                  <Text style={styles.statCount}>5</Text>
                  <Text style={styles.statLabel}>Enrolled</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="ribbon-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>3</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="medal-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>3</Text>
                  <Text style={styles.statLabel}>Certificates</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FF7A00' }]}>
                    <Ionicons name="trending-up-outline" size={18} color="#FFF" />
                  </View>
                  <Text style={styles.statCount}>2</Text>
                  <Text style={styles.statLabel}>In Progress</Text>
                </View>
              </>
            )}
          </View>

          {/* Contact Details Pills */}
          <View style={styles.contactDetails}>
            {/* Email */}
            <View style={styles.detailPill}>
              <View style={styles.detailIconBox}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>
                  {userRole === 'teacher'
                    ? 'priya.sharma@pratham.org'
                    : userRole === 'admin'
                      ? 'admin@pratham.edu'
                      : 'john.doe@email.com'}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.detailPill}>
              <View style={styles.detailIconBox}>
                <Ionicons name="call-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>
                  {userRole === 'teacher'
                    ? '+91 98765 43210'
                    : userRole === 'admin'
                      ? '+91 99999 88888'
                      : '+91 98765 43210'}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailPill}>
              <View style={styles.detailIconBox}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Bangalore, Karnataka</Text>
              </View>
            </View>
          </View>
        </View>

        {/* DYNAMIC SECTION (Achievements for Teacher, Roster control for Admin, Enrolled Courses for Student) */}
        {userRole === 'teacher' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsCard}>
              <View style={styles.achievementItem}>
                <Ionicons name="trophy-outline" size={18} color="#FFB703" />
                <View>
                  <Text style={styles.achievementTitle}>Top Rated Instructor</Text>
                  <Text style={styles.achievementYear}>Awarded 2025</Text>
                </View>
              </View>
              <View style={styles.achievementItem}>
                <Ionicons name="people-outline" size={18} color="#7B2CBF" />
                <View>
                  <Text style={styles.achievementTitle}>100+ Students Taught</Text>
                  <Text style={styles.achievementYear}>Milestone Achievement</Text>
                </View>
              </View>
              <View style={styles.achievementItem}>
                <Ionicons name="medal-outline" size={18} color="#10B981" />
                <View>
                  <Text style={styles.achievementTitle}>Best Course Content</Text>
                  <Text style={styles.achievementYear}>Ranked #1 in 2026</Text>
                </View>
              </View>
            </View>
          </View>
        ) : userRole === 'admin' ? (
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
                <Text style={styles.adminDetailValue}>May 22, 2026 - 9:08 AM</Text>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Courses</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.coursesList}>
              {/* Course 1: Full Stack Development */}
              <View style={styles.courseCard}>
                <View style={styles.courseHeaderRow}>
                  <Text style={styles.courseTitle}>Full Stack Development</Text>
                  <Text style={[styles.coursePercent, { color: '#FF7A00' }]}>75%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '75%', backgroundColor: '#FF7A00' }]} />
                </View>
              </View>

              {/* Course 2: Data Science & AI */}
              <View style={styles.courseCard}>
                <View style={styles.courseHeaderRow}>
                  <Text style={styles.courseTitle}>Data Science & AI</Text>
                  <Text style={[styles.coursePercent, { color: '#FF7A00' }]}>45%</Text>
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#FF7A00' }]}>In Progress</Text>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '45%', backgroundColor: '#FF7A00' }]} />
                </View>
              </View>

              {/* Course 3: Digital Marketing */}
              <View style={styles.courseCard}>
                <View style={styles.courseHeaderRow}>
                  <Text style={styles.courseTitle}>Digital Marketing</Text>
                  <Text style={[styles.coursePercent, { color: '#10B981' }]}>100%</Text>
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>Completed</Text>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#10B981' }]} />
                </View>
              </View>
            </View>
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

              {/* Notifications */}
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

              {/* Privacy & Security */}
              <TouchableOpacity
                style={styles.settingsItem}
                activeOpacity={0.7}
                onPress={() => onChangeSubView('privacy')}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
                <Text style={styles.settingsItemText}>Privacy & Security</Text>
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
          )}
        </View>

        {/* 5. LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* 6. COPYRIGHT FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Nexus Corporate Training Center v1.0.0</Text>
          <Text style={styles.footerText}>© 2026 Nexus Corporate Training Center. All rights reserved.</Text>
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
    backgroundColor: '#F9FAFB', // Light gray main screen background
  },
  scrollContent: {
    paddingBottom: 24,
    width: '100%',
    maxWidth: (Platform.OS as string) === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 120, // Enough spacing to not be covered by floating tab bar
  },
  // Curved purple banner header
  headerBanner: {
    backgroundColor: '#7B2CBF',
    height: 140,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  // Profile Info Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -55, // Overlap the curved header
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Overlapping avatar
  avatarWrapper: {
    marginTop: -55, // Negative margin to overlap card top boundary
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 26,
    height: 26,
    borderRadius: 13,
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
