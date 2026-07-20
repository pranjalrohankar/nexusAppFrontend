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
import TeacherAssessmentsScreen from '@/screens/teacher/teacher-assessments-screen';
import TeacherClassesScreen from '@/screens/teacher/teacher-classes-screen';
import TeacherDashboardScreen from '@/screens/teacher/teacher-dashboard-screen';
import TeacherScheduleScreen from '@/screens/teacher/teacher-schedule-screen';
import UploadRecordingScreen from '@/screens/teacher/upload-recording-screen';
import TestsScreen from '@/screens/tests/tests-screen';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Module-level cache so data survives tab switches
export const adminDataCache: {
  dashboard: any;
  students: any[];
  teachers: any[];
  courses: any[];
  batches: any[];
  enquiries: any[];
} = {
  dashboard: null,
  students: [],
  teachers: [],
  courses: [],
  batches: [],
  enquiries: [],
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Detect if running on web in a narrow (phone-sized) viewport
function useIsNarrowWeb() {
  const getIsNarrow = () =>
    Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth < 768;
  const [isNarrow, setIsNarrow] = useState(getIsNarrow);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = () => setIsNarrow(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    handler(); // sync on mount
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isNarrow;
}

type ProfileSubView = 'profile' | 'notifications' | 'privacy' | 'help' | 'account';

interface AppTabsProps {
  userRole: 'student' | 'teacher' | 'admin';
  userName: string;
  userEmail: string;
  onLogout: () => void;
  lastLogin?: string;
}

export default function AppTabs({ userRole, userName, userEmail, onLogout, lastLogin }: AppTabsProps) {
  const isNarrowWeb = useIsNarrowWeb();
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const [showUploadRecording, setShowUploadRecording] = useState(false);
  const [showStudyMaterials, setShowStudyMaterials] = useState(false);

  const [profileSubView, setProfileSubView] = useState<ProfileSubView>('profile');
  const [returnTabIndex, setReturnTabIndex] = useState<number | null>(null);
  const [tabKeys, setTabKeys] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  });

  // Pre-fetch all admin data immediately on login so screens load instantly
  // Also poll enquiries every 30s so badge count stays live
  useEffect(() => {
    if (userRole === 'admin') {
      Promise.all([
        api.getDashboard().catch(() => null),
        api.getStudents().catch(() => null),
        api.getTeachers().catch(() => null),
        api.getAllCourses().catch(() => null),
        api.getBatches().catch(() => null),
        api.getEnquiries().catch(() => null),
      ]).then(([dash, students, teachers, courses, batches, enquiries]) => {
        if (dash?.data) adminDataCache.dashboard = dash.data;
        if (students?.data) adminDataCache.students = students.data;
        if (teachers?.data) adminDataCache.teachers = teachers.data;
        if (courses?.data) adminDataCache.courses = courses.data;
        if (Array.isArray(batches)) adminDataCache.batches = batches;
        const enqList = Array.isArray(enquiries) ? enquiries : Array.isArray(enquiries?.data) ? enquiries.data : [];
        adminDataCache.enquiries = enqList;
      });

      // Poll enquiries every 30s to keep badge count live
      const interval = setInterval(() => {
        api.getEnquiries().catch(() => null).then((enquiries: any) => {
          if (!enquiries) return;
          const enqList = Array.isArray(enquiries) ? enquiries : Array.isArray(enquiries?.data) ? enquiries.data : [];
          if (enqList.length > 0) adminDataCache.enquiries = enqList;
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userRole]);

  // Tab details definition based on user role
  const getTabsConfig = () => {
    switch (userRole) {
      case 'teacher':
        return [
          { name: 'Dashboard', iconActive: 'home', iconInactive: 'home-outline' },
          { name: 'Classes', iconActive: 'book', iconInactive: 'book-outline' },
          { name: 'Schedule', iconActive: 'calendar', iconInactive: 'calendar-outline' },
          { name: 'Tests', iconActive: 'clipboard', iconInactive: 'clipboard-outline' },
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
        ];
    }
  };

  const tabs = getTabsConfig();

  const handleOpenNotifications = (fromTabIndex: number) => {
    setReturnTabIndex(fromTabIndex);
    setActiveIndex(userRole === 'teacher' ? 4 : 3);
    setProfileSubView('notifications');
  };

  const handleProfileSubViewChange = (subView: ProfileSubView) => {
    if (subView === 'profile' && returnTabIndex !== null) {
      const target = returnTabIndex;
      setReturnTabIndex(null);
      setProfileSubView('profile');
      setActiveIndex(target);
    } else {
      setProfileSubView(subView);
    }
  };

  const handleTabPress = (idx: number, tabName: string) => {
    setReturnTabIndex(null);
    if (showUploadRecording) {
      setShowUploadRecording(false);
    }
    if (showStudyMaterials) {
      setShowStudyMaterials(false);
    }

    if (idx === activeIndex) {
      setTabKeys(prev => ({ ...prev, [idx]: prev[idx] + 1 }));
    } else {
      setActiveIndex(idx);
      if (tabName === 'Profile') {
        setProfileSubView('profile');
      }
    }
  };

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
        case 0: return <TeacherDashboardScreen userName={userName}
          onUploadRecording={() => setShowUploadRecording(true)}
          onUploadStudyMaterial={() => setShowStudyMaterials(true)}
          onOpenNotifications={() => handleOpenNotifications(0)}
        />;
        case 1: return <TeacherClassesScreen onOpenNotifications={() => handleOpenNotifications(1)} />;
        case 2: return <TeacherScheduleScreen />;
        case 3: return <TeacherAssessmentsScreen />;
        case 4:
          return (
            <ProfileScreen
              onLogout={onLogout}
              currentSubView={profileSubView}
              onChangeSubView={handleProfileSubViewChange}
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
              lastLogin={lastLogin}
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
              lastLogin={lastLogin}
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
              userName={userName}
              onOpenNotifications={() => handleOpenNotifications(0)}
            />
          );
        case 1:
          return (
            <BatchesScreen
              key={tabKeys[1]}
              onOpenNotifications={() => handleOpenNotifications(1)}
            />
          );
        case 2: return <TestsScreen key={tabKeys[2]} />;
        case 3:
          return (
            <ProfileScreen
              key={tabKeys[3]}
              onLogout={onLogout}
              currentSubView={profileSubView}
              onChangeSubView={handleProfileSubViewChange}
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
            />
          );
        default:
          return (
            <HomeScreen
              userName={userName}
              onOpenNotifications={() => handleOpenNotifications(0)}
            />
          );
      }
    }
  };

  if (Platform.OS === 'web') {
    // Narrow web (phone-sized) → same floating bottom tab bar as native
    if (isNarrowWeb) {
      return (
        <View style={styles.container}>
          <View style={[styles.screenContainer, profileSubView === 'profile' && styles.screenWithTabBar]}>{renderScreen()}</View>
          {profileSubView === 'profile' && (
          <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              {tabs.map((tab, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => handleTabPress(idx, tab.name)}
                  >
                    <Ionicons
                      name={isActive ? (tab.iconActive as any) : (tab.iconInactive as any)}
                      size={20}
                      color={isActive ? '#FFFFFF' : '#374151'}
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

    // Wide web → sidebar layout
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
                  onPress={() => handleTabPress(idx, tab.name)}
                >
                  <Ionicons
                    name={isActive ? (tab.iconActive as any) : (tab.iconInactive as any)}
                    size={20}
                    color={isActive ? '#FFFFFF' : '#9CA3AF'}
                  />
                  <Text style={[styles.webNavLinkLabel, isActive && styles.webNavLinkLabelActive]}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Logout Button */}
          <TouchableOpacity style={styles.webLogoutButton} onPress={async () => {
            if (userRole === 'student') {
              try { await api.setActivityStatus(false); } catch {}
            }
            onLogout();
          }}>
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
      <View style={[styles.screenContainer, profileSubView === 'profile' && styles.screenWithTabBar]}>{renderScreen()}</View>

      {/* BOTTOM TAB BAR — hidden when a profile sub-view is open */}
      {profileSubView === 'profile' && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {tabs.map((tab, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabPress(idx, tab.name)}
              >
                <Ionicons
                  name={isActive ? (tab.iconActive as any) : (tab.iconInactive as any)}
                  size={20}
                  color={isActive ? "#FFFFFF" : "#374151"}
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
  screenWithTabBar: {
    paddingBottom: 80,
  },
  // Tab Bar — flat bottom bar matching UI screenshot
  tabBar: {
    flexDirection: 'row',
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    zIndex: 100,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 14,
    paddingBottom: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    marginTop: 6,
    marginBottom: 2,
  },
  tabButtonActive: {
    backgroundColor: '#7B2CBF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelInactive: {
    color: '#374151',
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
