import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AdminStudentsScreen from './admin-students-screen';
import AdminTeachersScreen from './admin-teachers-screen';

type UserTab = 'Students' | 'Teachers';

export default function AdminUsersScreen() {
  const [activeTab, setActiveTab] = useState<UserTab>('Students');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>Manage students & teachers</Text>

        {/* NEW SEGMENTED TABS - Matching your image */}
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
        {activeTab === 'Students' ? (
          <AdminStudentsScreen />
        ) : (
          <AdminTeachersScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7B2CBF' },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    //  marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 4,
    marginBottom: 16,
  },

  /* New Segmented Tab Style */
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
    borderRadius: 15,
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