import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminStudentsScreen from './admin-students-screen';
import AdminTeachersScreen from './admin-teachers-screen';

type UserTab = 'Students' | 'Teachers';

export default function AdminUsersScreen() {
  const [activeTab, setActiveTab] = useState<UserTab>('Students');
  const [studentCount, setStudentCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);

  const [onStudentAddPress, setOnStudentAddPress] = useState<(() => void) | null>(null);
  const [onTeacherAddPress, setOnTeacherAddPress] = useState<(() => void) | null>(null);

  // Stable callbacks so child screens don't re-fetch when parent re-renders
  const handleStudentCountChange = useCallback((n: number) => setStudentCount(n), []);
  const handleTeacherCountChange = useCallback((n: number) => setTeacherCount(n), []);
  const handleStudentRegisterAdd = useCallback((fn: () => void) => setOnStudentAddPress(() => fn), []);
  const handleTeacherRegisterAdd = useCallback((fn: () => void) => setOnTeacherAddPress(() => fn), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)','rgba(9,2,0,0.14)','rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)','rgba(118,62,11,0.573)','rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)','#FB8B24','rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)','rgba(118,62,11,0.573)','rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)','rgba(9,2,0,0.14)','rgba(0,0,0,0)',
          ]}
          locations={[0,0.0714,0.1429,0.2143,0.2857,0.3571,0.4286,0.5,0.5714,0.6429,0.7143,0.7857,0.8571,0.9286,1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>User Management</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.headerCount}>
                {activeTab === 'Students' ? studentCount : teacherCount}
              </Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'Students' ? ' Total Students Registered' : ' Total Instructors Registered'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (activeTab === 'Students') onStudentAddPress && onStudentAddPress();
              else onTeacherAddPress && onTeacherAddPress();
            }}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Students' && styles.tabActive]}
            onPress={() => setActiveTab('Students')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'Students' ? '#7B2CBF' : '#E9D5FF'}
            />
            <Text style={[styles.tabLabel, activeTab === 'Students' && styles.tabLabelActive]}>
              Students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Teachers' && styles.tabActive]}
            onPress={() => setActiveTab('Teachers')}
          >
            <Ionicons
              name="school-outline"
              size={20}
              color={activeTab === 'Teachers' ? '#7B2CBF' : '#E9D5FF'}
            />
            <Text style={[styles.tabLabel, activeTab === 'Teachers' && styles.tabLabelActive]}>
              Teachers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Keep both screens mounted to preserve state — just hide the inactive one */}
        <View style={{ flex: 1, display: activeTab === 'Students' ? 'flex' : 'none' }}>
          <AdminStudentsScreen
            onRegisterAdd={handleStudentRegisterAdd}
            onCountChange={handleStudentCountChange}
          />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Teachers' ? 'flex' : 'none' }}>
          <AdminTeachersScreen
            onRegisterAdd={handleTeacherRegisterAdd}
            onCountChange={handleTeacherCountChange}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerAccentLine: {
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  headerCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E9D5FF',
    fontWeight: '600',
  },
  addBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#FF9500',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 13,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E9D5FF',
  },
  tabLabelActive: {
    color: '#7B2CBF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});