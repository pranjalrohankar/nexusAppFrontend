import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyllabusModule } from '../../../utils/syllabus-parser';

interface CourseSyllabusBuilderProps {
  modules: SyllabusModule[];
  onChange: (modules: SyllabusModule[]) => void;
}

export const CourseSyllabusBuilder = React.memo(({ modules, onChange }: CourseSyllabusBuilderProps) => {
  const handleUpdateTitle = (modIdx: number, text: string) => {
    onChange(modules.map((m, i) => (i === modIdx ? { ...m, title: text } : m)));
  };

  const handleUpdateTopic = (modIdx: number, topIdx: number, text: string) => {
    onChange(
      modules.map((m, i) =>
        i === modIdx
          ? {
              ...m,
              topics: m.topics.map((t, ti) => (ti === topIdx ? text : t)),
            }
          : m
      )
    );
  };

  const handleRemoveTopic = (modIdx: number, topIdx: number) => {
    onChange(
      modules.map((m, i) =>
        i === modIdx
          ? { ...m, topics: m.topics.filter((_, ti) => ti !== topIdx) }
          : m
      )
    );
  };

  const handleAddTopic = (modIdx: number) => {
    onChange(
      modules.map((m, i) => (i === modIdx ? { ...m, topics: [...m.topics, ''] } : m))
    );
  };

  const handleRemoveModule = (modIdx: number) => {
    onChange(modules.filter((_, i) => i !== modIdx));
  };

  const handleAddModule = () => {
    onChange([
      ...modules,
      {
        title: `Module ${modules.length + 1} – Advanced Topics`,
        topics: [''],
      },
    ]);
  };

  return (
    <View style={styles.builderContainer}>
      {modules.map((mod, modIdx) => (
        <View key={modIdx} style={styles.moduleCard}>
          <View style={styles.moduleCardHeader}>
            <Text style={styles.moduleCardIndex}>Module {modIdx + 1}</Text>
            {modules.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveModule(modIdx)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Module Title Input */}
          <TextInput
            style={styles.moduleTitleInput}
            value={mod.title}
            onChangeText={(text) => handleUpdateTitle(modIdx, text)}
            placeholder="e.g. Module 1 – Networking Protocols & Packet Analysis"
            placeholderTextColor="#9CA3AF"
          />

          {/* Topics List */}
          <Text style={styles.subTopicsLabel}>Sub-Topics / Lessons</Text>
          {mod.topics.map((topic, topIdx) => (
            <View key={topIdx} style={styles.topicInputRow}>
              <Text style={styles.topicInputBullet}>{topIdx + 1}.</Text>
              <TextInput
                style={styles.topicInput}
                value={topic}
                onChangeText={(text) => handleUpdateTopic(modIdx, topIdx, text)}
                placeholder="e.g. OSI model and TCP/IP protocol suite structures"
                placeholderTextColor="#9CA3AF"
              />
              {mod.topics.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveTopic(modIdx, topIdx)}>
                  <Ionicons name="close-circle-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add Topic Button */}
          <TouchableOpacity style={styles.addTopicBtn} onPress={() => handleAddTopic(modIdx)}>
            <Ionicons name="add" size={16} color="#7B2CBF" />
            <Text style={styles.addTopicBtnText}>Add Sub-Topic</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Module Button */}
      <TouchableOpacity style={styles.addModuleBtn} onPress={handleAddModule}>
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.addModuleBtnText}>Add Module</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  builderContainer: {
    gap: 12,
    marginTop: 6,
  },
  moduleCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleCardIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B2CBF',
    textTransform: 'uppercase',
  },
  moduleTitleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  subTopicsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  topicInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  topicInputBullet: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 18,
    textAlign: 'right',
  },
  topicInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1F2937',
  },
  addTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  addTopicBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  addModuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7B2CBF',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  addModuleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

CourseSyllabusBuilder.displayName = 'CourseSyllabusBuilder';
