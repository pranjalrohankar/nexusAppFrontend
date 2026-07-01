import AdminBatchesScreen from '@/screens/admin/admin-batches-screen';
import AdminCoursesScreen from '@/screens/admin/admin-courses-screen';
import AdminDashboardScreen from '@/screens/admin/admin-dashboard-screen';
import AdminUsersScreen from '@/screens/admin/admin-users-screen';
import BatchesScreen from '@/screens/batches/batches-screen';
import CoursesScreen from '@/screens/courses/courses-screen';
import HomeScreen from '@/screens/home/home-screen';
import ProfileScreen from '@/screens/profile/profile-screen';
import StudyMaterialsScreen from '@/screens/teacher/study-materials-screen';
import TeacherAlertsScreen from '@/screens/teacher/teacher-alerts-screen';
import TeacherClassesScreen from '@/screens/teacher/teacher-classes-screen';
import TeacherDashboardScreen from '@/screens/teacher/teacher-dashboard-screen';
import TeacherScheduleScreen from '@/screens/teacher/teacher-schedule-screen';
import UploadRecordingScreen from '@/screens/teacher/upload-recording-screen';
import TestsScreen from '@/screens/tests/tests-screen';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProfileSubView = 'profile' | 'notifications' | 'privacy' | 'help' | 'account';

interface AppTabsProps {
  userRole: 'student' | 'teacher' | 'admin';
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export default function AppTabs({ userRole, userName, userEmail, onLogout }: AppTabsProps) {

  const [activeIndex, setActiveIndex] = useState(0);
  const [showUploadRecording, setShowUploadRecording] = useState(false);
  const [showStudyMaterials, setShowStudyMaterials] = useState(false);

  const [profileSubView, setProfileSubView] = useState<ProfileSubView>('profile');
  const [tabKeys, setTabKeys] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // Tab details definition based on user role
  const getTabsConfig = () => {
    switch (userRole) {
      case 'teacher':
        return [
          { name: 'Dashboard', iconActive: 'home', iconInactive: 'home-outline' },
          { name: 'Classes', iconActive: 'book', iconInactive: 'book-outline' },
          { name: 'Schedule', iconActive: 'calendar', iconInactive: 'calendar-outline' },
          { name: 'Alerts', iconActive: 'notifications', iconInactive: 'notifications-outline' },
          { name: 'Profile', iconActive: 'person', iconInactive: 'person-outline' },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', iconActive: 'home', iconInactive: 'home-outline' },
          { name: 'Users', iconActive: 'people', iconInactive: 'people-outline' },
          { name: 'Batches', iconActive: 'albums', iconInactive: 'albums-outline' },
          { name: 'Courses', iconActive: 'book', iconInactive: 'book-outline' },
          { name: 'Profile', iconActive: 'person', iconInactive: 'person-outline' },
        ];
      case 'student':
      default:
        return [
          { name: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
          { name: 'Batch', iconActive: 'reader', iconInactive: 'reader-outline' },
          { name: 'Test', iconActive: 'clipboard', iconInactive: 'clipboard-outline' },
          { name: 'Profile', iconActive: 'person', iconInactive: 'person-outline' },
          { name: 'Courses', iconActive: 'book', iconInactive: 'book-outline' },
        ];
    }
  };

  const tabs = getTabsConfig();

  // Render correct screen component based on active tab
  const renderScreen = () => {
    if (userRole === 'teacher') {
      if (showUploadRecording) {
        return <UploadRecordingScreen onClose={() => setShowUploadRecording(false)} />;
      }

      if (showStudyMaterials) {
        return <StudyMaterialsScreen onClose={() => setShowStudyMaterials(false)} />;
      }
      switch (activeIndex) {
        case 0: return <TeacherDashboardScreen onViewSchedule={() => setActiveIndex(2)} userName={userName}
          onUploadRecording={() => setShowUploadRecording(true)}
          onUploadStudyMaterial={() => setShowStudyMaterials(true)}
        />;
        case 1: return <TeacherClassesScreen />;
        case 2: return <TeacherScheduleScreen />;
        case 3: return <TeacherAlertsScreen />;
        case 4:
          return (
            <ProfileScreen
              onLogout={onLogout}
              currentSubView={profileSubView}
              onChangeSubView={setProfileSubView}
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
            />
          );
        default: return <TeacherDashboardScreen userName={userName} />;
      }
    } else if (userRole === 'admin') {
      switch (activeIndex) {
        case 0: return <AdminDashboardScreen onViewAllEnrollments={() => setActiveIndex(1)} />;
        case 1: return <AdminUsersScreen />;
        case 2: return <AdminBatchesScreen />;
        case 3: return <AdminCoursesScreen />;
        case 4:
          return (
            <ProfileScreen
              onLogout={onLogout}
              currentSubView={profileSubView}
              onChangeSubView={setProfileSubView}
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
            />
          );
        default: return <AdminDashboardScreen />;
      }
    } else {
      // Student
      switch (activeIndex) {
        case 0:
          return (
            <HomeScreen
              key={tabKeys[0]}
              onOpenNotifications={() => {
                setActiveIndex(3); // profile index
                setProfileSubView('notifications');
              }}
            />
          );
        case 1: return <BatchesScreen key={tabKeys[1]} />;
        case 2: return <TestsScreen key={tabKeys[2]} />;
        case 3:
          return (
            <ProfileScreen
              key={tabKeys[3]}
              onLogout={onLogout}
              currentSubView={profileSubView}
              onChangeSubView={setProfileSubView}
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
            />
          );
        case 4: return <CoursesScreen key={tabKeys[4]} />;
        default:
          return (
            <HomeScreen
              onOpenNotifications={() => {
                setActiveIndex(3);
                setProfileSubView('notifications');
              }}
            />
          );
      }
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Left Sidebar */}
        <View style={styles.webSidebar}>
          {/* Logo */}
          <View style={styles.webLogoWrapper}>
            <Text style={styles.webLogoText}>
              NE<Text style={styles.webLogoTextGold}>X</Text>US
            </Text>
            <Text style={styles.webLogoSubtext}>
              {userRole === 'teacher' ? 'TEACHER PORTAL' : userRole === 'admin' ? 'ADMIN CONSOLE' : 'STUDENT PORTAL'}
            </Text>
          </View>

          {/* Navigation Links */}
          <View style={styles.webNavLinks}>
            {tabs.map((tab, idx) => {
              const isActive = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.webNavLink, isActive && styles.webNavLinkActive]}
                  onPress={() => {
                    setActiveIndex(idx);
                    if (tab.name === 'Profile') {
                      setProfileSubView('profile');
                    }
                  }}
                >
                  <Ionicons
                    name={isActive ? (tab.iconActive as any) : (tab.iconInactive as any)}
                    size={20}
                    color={isActive ? "#FFFFFF" : "#9CA3AF"}
                  />
                  <Text style={[styles.webNavLinkLabel, isActive && styles.webNavLinkLabelActive]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Logout Button */}
          <TouchableOpacity style={styles.webLogoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.webLogoutLabel}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Right Main Content Panel */}
        <View style={styles.webMainPanel}>
          <View style={styles.webMainContent}>
            {renderScreen()}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SCREEN CONTAINER */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* BOTTOM TAB BAR — hidden when a profile sub-view is open */}
      {profileSubView === 'profile' && (
        <View style={styles.tabBar}>
          {tabs.map((tab, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  if (idx === activeIndex) {
                    setTabKeys(prev => ({ ...prev, [idx]: prev[idx] + 1 }));
                  } else {
                    setActiveIndex(idx);
                    if (tab.name === 'Profile') {
                      setProfileSubView('profile');
                    }
                  }
                }}
              >
                <Ionicons
                  name={isActive ? (tab.iconActive as any) : (tab.iconInactive as any)}
                  size={20}
                  color={isActive ? "#FFFFFF" : "#9CA3AF"}
                />
                <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  screenContainer: {
    flex: 1,
  },
  // Modern Floating Capsule Tab Bar
  tabBar: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: Platform.OS === 'web' ? '50%' : 20,
    right: Platform.OS === 'web' ? undefined : 20,
    width: Platform.OS === 'web' ? 760 : undefined,
    marginLeft: Platform.OS === 'web' ? -380 : undefined,
    elevation: 12,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    paddingHorizontal: 10,
    borderTopWidth: 0,
    zIndex: 100,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    flex: 1,
    paddingVertical: 6,
  },
  tabButtonActive: {
    backgroundColor: '#7B2CBF',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelInactive: {
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Web specific styles
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
  },
  webSidebar: {
    width: 260,
    backgroundColor: '#1E1B4B', // Deep indigo sidebar
    height: '100%',
    padding: 24,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  webLogoWrapper: {
    marginBottom: 40,
  },
  webLogoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  webLogoTextGold: {
    color: '#FFB703',
  },
  webLogoSubtext: {
    fontSize: 10,
    color: '#FFB703',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },
  webNavLinks: {
    flex: 1,
    gap: 8,
  },
  webNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  webNavLinkActive: {
    backgroundColor: '#7B2CBF', // Purple active link background
  },
  webNavLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  webNavLinkLabelActive: {
    color: '#FFFFFF',
  },
  webLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 'auto',
  },
  webLogoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  webMainPanel: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F9FAFB',
  },
  webMainContent: {
    flex: 1,
    height: '100%',
  },
});
