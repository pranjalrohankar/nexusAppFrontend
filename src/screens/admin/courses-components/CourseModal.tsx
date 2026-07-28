import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Course, Teacher, CourseFormData } from './types';
import { CourseSyllabusBuilder } from './CourseSyllabusBuilder';

interface CourseModalProps {
  isVisible: boolean;
  selectedCourse: Course | null;
  teachers: Teacher[];
  formData: CourseFormData;
  showInstructorDropdown: boolean;
  onClose: () => void;
  onUpdateField: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void;
  onToggleDropdown: () => void;
  onSubmit: () => void;
}

export const CourseModal = React.memo(({
  isVisible,
  selectedCourse,
  teachers,
  formData,
  showInstructorDropdown,
  onClose,
  onUpdateField,
  onToggleDropdown,
  onSubmit,
}: CourseModalProps) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedCourse ? 'Edit Course Details' : 'Add New Course'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <Text style={styles.formSectionTitle}>Basic Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Course Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.title}
                onChangeText={(v) => onUpdateField('title', v)}
                placeholder="e.g. Full Stack Web Development"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Instructor *</Text>
              <TouchableOpacity style={styles.dropdown} onPress={onToggleDropdown}>
                <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !formData.instructor && styles.dropdownPlaceholder]}>
                  {formData.instructor || 'Select Instructor'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showInstructorDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {teachers.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={{ color: '#9CA3AF' }}>No teachers available</Text>
                      </View>
                    ) : (
                      teachers.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            onUpdateField('instructor', t.name);
                            onToggleDropdown();
                          }}
                        >
                          <Text>{t.name}</Text>
                          {formData.instructor === t.name && (
                            <Ionicons name="checkmark" size={18} color="#7B2CBF" />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Course Overview *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.description}
                onChangeText={(v) => onUpdateField('description', v)}
                multiline={true}
                placeholder="Brief overview of the course..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Additional Details */}
            <Text style={styles.formSectionTitle}>Additional Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Total Sessions</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.totalSessions}
                onChangeText={(v) => onUpdateField('totalSessions', v)}
                keyboardType="number-pad"
                placeholder="48"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.fieldLabel}>Course Syllabus & Modules *</Text>
                <TouchableOpacity
                  style={styles.modeToggleBtn}
                  onPress={() =>
                    onUpdateField('syllabusMode', formData.syllabusMode === 'builder' ? 'text' : 'builder')
                  }
                >
                  <Ionicons
                    name={formData.syllabusMode === 'builder' ? 'document-text-outline' : 'grid-outline'}
                    size={14}
                    color="#7B2CBF"
                  />
                  <Text style={styles.modeToggleText}>
                    {formData.syllabusMode === 'builder'
                      ? 'Switch to Raw Text'
                      : 'Switch to Module Builder'}
                  </Text>
                </TouchableOpacity>
              </View>

              {formData.syllabusMode === 'text' ? (
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={formData.syllabusTopics}
                  onChangeText={(v) => onUpdateField('syllabusTopics', v)}
                  multiline={true}
                  placeholder="List main topics covered in the course..."
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <CourseSyllabusBuilder
                  modules={formData.syllabusModules}
                  onChange={(modules) => onUpdateField('syllabusModules', modules)}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>What you will learn</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.whatYouWillLearn}
                onChangeText={(v) => onUpdateField('whatYouWillLearn', v)}
                multiline={true}
                placeholder="Enter the pointers..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Max Capacity *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formData.capacity}
                  onChangeText={(v) => onUpdateField('capacity', v)}
                  keyboardType="number-pad"
                  placeholder="50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formData.price}
                  onChangeText={(v) => onUpdateField('price', v)}
                  keyboardType="number-pad"
                  placeholder="25000"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Google Meet Link</Text>
              <View style={styles.meetInputRow}>
                <Ionicons name="videocam-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.modalInput, { flex: 1, height: 42 }]}
                  value={formData.googleMeetLink}
                  onChangeText={(v) => onUpdateField('googleMeetLink', v)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <Text style={styles.checkboxSubtext}>
                Paste your Google Meet link here. It will be visible to the assigned teacher.
              </Text>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={onSubmit}>
                <Text style={styles.modalSubmitBtnText}>
                  {selectedCourse ? 'Save Changes' : 'Create Course'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 20,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7B2CBF',
    marginTop: 10,
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  meetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  checkboxSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
