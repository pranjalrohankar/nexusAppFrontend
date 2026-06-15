import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
}

interface Test {
  id: string;
  title: string;
  questionsCount: number;
  duration: string;
  passScore: string;
  category: string;
}

export default function TeacherAssessmentsScreen() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [tests, setTests] = useState<Test[]>([
    { id: '1', title: 'JavaScript ES6+ Assessment', questionsCount: 30, duration: '35 mins', passScore: '70%', category: 'Full Stack Development' },
    { id: '2', title: 'React Advanced Patterns Test', questionsCount: 40, duration: '45 mins', passScore: '75%', category: 'Full Stack Development' },
    { id: '3', title: 'UI/UX Design Fundamentals', questionsCount: 25, duration: '30 mins', passScore: '70%', category: 'UI/UX Design' },
  ]);

  // Wizard Fields
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [passScore, setPassScore] = useState('');
  const [category, setCategory] = useState('');
  
  // Single Question Fields
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const [wizardQuestions, setWizardQuestions] = useState<Question[]>([]);

  const handleAddQuestion = () => {
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      Alert.alert('Validation Error', 'Please enter question text and all four option values');
      return;
    }

    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: qText,
      options: {
        A: optA,
        B: optB,
        C: optC,
        D: optD,
      },
      correctOption: correctOpt,
    };

    setWizardQuestions([...wizardQuestions, newQ]);
    
    // Reset question inputs
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOpt('A');
    Alert.alert('Question Added', `Question ${wizardQuestions.length + 1} added to test template.`);
  };

  const handlePublishTest = () => {
    if (!title.trim() || !duration.trim() || !passScore.trim() || !category.trim()) {
      Alert.alert('Validation Error', 'Please complete all test metadata fields');
      return;
    }

    if (wizardQuestions.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one question to the test');
      return;
    }

    const newTest: Test = {
      id: `test-${Date.now()}`,
      title,
      questionsCount: wizardQuestions.length,
      duration: `${duration} mins`,
      passScore: `${passScore}%`,
      category,
    };

    setTests([newTest, ...tests]);

    // Reset Wizard
    setTitle('');
    setDuration('');
    setPassScore('');
    setCategory('');
    setWizardQuestions([]);
    setShowCreateWizard(false);

    Alert.alert('Test Published', `"${title}" has been successfully added to student active lists.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Assessments & Tests</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateWizard(!showCreateWizard)}
          >
            <Ionicons name={showCreateWizard ? "close-outline" : "add-outline"} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Publish mock exams, set timings, and manage questions</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CREATE TEST WIZARD */}
        {showCreateWizard ? (
          <View style={styles.wizardCard}>
            <Text style={styles.wizardHeader}>Create Test Wizard</Text>
            
            {/* Metadata inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Test Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. JavaScript ES6+ Assessment"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.rowBetween}>
              <View style={[styles.inputGroup, { flex: 0.48 }]}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 0.48 }]}>
                <Text style={styles.inputLabel}>Pass Score (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={passScore}
                  onChangeText={setPassScore}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Frontend Development"
                placeholderTextColor="#9CA3AF"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            {/* Questions count badge */}
            <View style={styles.questionBadgeRow}>
              <Ionicons name="help-circle" size={16} color="#7B2CBF" />
              <Text style={styles.questionBadgeText}>{wizardQuestions.length} Questions Added</Text>
            </View>

            {/* Questions list previews */}
            {wizardQuestions.map((q, idx) => (
              <View key={q.id} style={styles.previewQRow}>
                <Text style={styles.previewQIndex}>{idx + 1}.</Text>
                <Text style={styles.previewQText} numberOfLines={1}>{q.text}</Text>
                <Text style={styles.previewQAns}>({q.correctOption})</Text>
              </View>
            ))}

            {/* Add Question block */}
            <View style={styles.addQuestionBlock}>
              <Text style={styles.blockTitle}>Add Question Fields</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter question text here..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                value={qText}
                onChangeText={setQText}
              />

              {/* Options */}
              <View style={styles.optionsInputsGrid}>
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const val = opt === 'A' ? optA : opt === 'B' ? optB : opt === 'C' ? optC : optD;
                  const setVal = opt === 'A' ? setOptA : opt === 'B' ? setOptB : opt === 'C' ? setOptC : setOptD;
                  return (
                    <View key={opt} style={styles.optionInputRow}>
                      <View style={styles.optionMarker}>
                        <Text style={styles.optionMarkerText}>{opt}</Text>
                      </View>
                      <TextInput
                        style={styles.optionInput}
                        placeholder={`Option ${opt}`}
                        placeholderTextColor="#9CA3AF"
                        value={val}
                        onChangeText={setVal}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Correct option selector */}
              <Text style={styles.inputLabel}>Correct Option</Text>
              <View style={styles.optSelectorRow}>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isSel = correctOpt === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optSelBtn, isSel && styles.optSelBtnActive]}
                      onPress={() => setCorrectOpt(opt)}
                    >
                      <Text style={[styles.optSelText, isSel && styles.optSelTextActive]}>
                        Option {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.addQBtn} onPress={handleAddQuestion}>
                <Ionicons name="add-circle-outline" size={16} color="#7B2CBF" />
                <Text style={styles.addQBtnText}>Add Question to Test</Text>
              </TouchableOpacity>
            </View>

            {/* Action buttons */}
            <TouchableOpacity style={styles.publishBtn} onPress={handlePublishTest}>
              <Ionicons name="cloud-upload" size={16} color="#FFF" />
              <Text style={styles.publishBtnText}>Publish Test</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📚 Active Tests ({tests.length})</Text>
            </View>

            {tests.map((t) => (
              <View key={t.id} style={styles.testCard}>
                <View style={styles.testCardHeader}>
                  <View style={styles.testCardIcon}>
                    <Ionicons name="clipboard-outline" size={20} color="#7B2CBF" />
                  </View>
                  <View style={styles.testCardMeta}>
                    <Text style={styles.testCardTitle}>{t.title}</Text>
                    <Text style={styles.testCardCat}>{t.category}</Text>
                  </View>
                </View>

                {/* stats */}
                <View style={styles.testStatsRow}>
                  <View style={styles.testStatBox}>
                    <Ionicons name="help-circle-outline" size={12} color="#6B7280" />
                    <Text style={styles.testStatVal}>{t.questionsCount} Questions</Text>
                  </View>
                  <View style={styles.testStatBox}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <Text style={styles.testStatVal}>{t.duration}</Text>
                  </View>
                  <View style={styles.testStatBox}>
                    <Ionicons name="ribbon-outline" size={12} color="#16A34A" />
                    <Text style={[styles.testStatVal, { color: '#16A34A' }]}>{t.passScore} Pass</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  // Wizard Card
  wizardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  wizardHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#1F2937',
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Question badge
  questionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  questionBadgeText: {
    color: '#7B2CBF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewQIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginRight: 6,
  },
  previewQText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
  },
  previewQAns: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  // Add question block
  addQuestionBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  textArea: {
    height: 72,
    paddingTop: 12,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  optionsInputsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 44,
  },
  optionMarker: {
    width: 32,
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  optionMarkerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  optionInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2937',
  },
  optSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 16,
  },
  optSelBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optSelBtnActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  optSelText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  optSelTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addQBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7B2CBF',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addQBtnText: {
    color: '#7B2CBF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Publish
  publishBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B2CBF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Active list
  listContainer: {
    gap: 12,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testCardMeta: {
    flex: 1,
    paddingLeft: 12,
  },
  testCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  testCardCat: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  testStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  testStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testStatVal: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
});
