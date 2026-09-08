import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseMcqsFromText, parsePdfBuffer, McqQuestion } from '@/utils/pdf-mcq-parser';
import { api } from '../../services/api';

export const PUBLISHED_TESTS_KEY = 'NEXUS_PUBLISHED_TESTS';
export const TEST_SUBMISSIONS_KEY = 'NEXUS_TEST_SUBMISSIONS';

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
  questionsCount: number | string;
  duration: string;
  passScore: string;
  category: string;
  totalMarks?: number;
  testType?: 'MCQ' | 'PDF';
  pdfFileName?: string;
  pdfFileUri?: string;
  pdfInstructions?: string;
  questions?: any;
}

interface Submission {
  id: string;
  testId: string;
  testTitle: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  answersText?: string;
  solutionFileName?: string;
  solutionFileUri?: string;
  status: 'PENDING' | 'GRADED';
  obtainedMarks?: number;
  totalMarks?: number;
  feedback?: string;
}

function safeParseJson(json: any, fallback: any = undefined) {
  if (!json) return fallback;
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeQuestions(rawList: any, fallbackTitle: string): Question[] {
  if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
    const parsed = parseMcqsFromText('', fallbackTitle);
    return parsed.map((p, idx) => ({
      id: `q-${idx + 1}`,
      text: p.text || (p as any).question || `Question ${idx + 1}`,
      options: p.options,
      correctOption: p.correctOption,
    }));
  }

  return rawList.map((q: any, idx: number): Question => {
    let text = `Question ${idx + 1}`;
    if (typeof q === 'string') {
      text = q;
    } else if (q.question && typeof q.question === 'string') {
      text = q.question;
    } else if (q.text && typeof q.text === 'string') {
      text = q.text;
    } else if (typeof q.question === 'object' && q.question !== null) {
      text = q.question.text || q.question.title || JSON.stringify(q.question);
    } else if (typeof q.text === 'object' && q.text !== null) {
      text = q.text.text || q.text.title || JSON.stringify(q.text);
    }

    const options: { A: string; B: string; C: string; D: string } = {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D',
    };

    if (Array.isArray(q.options)) {
      if (q.options[0] !== undefined) options.A = String(typeof q.options[0] === 'object' ? q.options[0].text || q.options[0].value || JSON.stringify(q.options[0]) : q.options[0]);
      if (q.options[1] !== undefined) options.B = String(typeof q.options[1] === 'object' ? q.options[1].text || q.options[1].value || JSON.stringify(q.options[1]) : q.options[1]);
      if (q.options[2] !== undefined) options.C = String(typeof q.options[2] === 'object' ? q.options[2].text || q.options[2].value || JSON.stringify(q.options[2]) : q.options[2]);
      if (q.options[3] !== undefined) options.D = String(typeof q.options[3] === 'object' ? q.options[3].text || q.options[3].value || JSON.stringify(q.options[3]) : q.options[3]);
    } else if (q.options && typeof q.options === 'object') {
      if (q.options.A !== undefined) options.A = String(q.options.A);
      if (q.options.B !== undefined) options.B = String(q.options.B);
      if (q.options.C !== undefined) options.C = String(q.options.C);
      if (q.options.D !== undefined) options.D = String(q.options.D);
      if (q.options.a !== undefined) options.A = String(q.options.a);
      if (q.options.b !== undefined) options.B = String(q.options.b);
      if (q.options.c !== undefined) options.C = String(q.options.c);
      if (q.options.d !== undefined) options.D = String(q.options.d);
    }

    let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
    const rawCorrect = q.correctOption ?? q.correct_option ?? q.answer ?? q.correctAnswer;
    if (typeof rawCorrect === 'number') {
      const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      correctOption = letters[rawCorrect] || 'A';
    } else if (typeof rawCorrect === 'string') {
      const upper = rawCorrect.trim().toUpperCase();
      if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D') {
        correctOption = upper;
      } else if (upper.startsWith('OPT') && upper.length >= 7) {
        const char = upper.charAt(upper.length - 1);
        if (char === 'A' || char === 'B' || char === 'C' || char === 'D') correctOption = char;
      } else if (options.A.trim().toLowerCase() === rawCorrect.trim().toLowerCase()) {
        correctOption = 'A';
      } else if (options.B.trim().toLowerCase() === rawCorrect.trim().toLowerCase()) {
        correctOption = 'B';
      } else if (options.C.trim().toLowerCase() === rawCorrect.trim().toLowerCase()) {
        correctOption = 'C';
      } else if (options.D.trim().toLowerCase() === rawCorrect.trim().toLowerCase()) {
        correctOption = 'D';
      }
    }

    return {
      id: String(q.id || `q-${idx + 1}`),
      text,
      options,
      correctOption,
    };
  });
}

export default function TeacherAssessmentsScreen() {
  const [activeTab, setActiveTab] = useState<'MANAGE_TESTS' | 'CHECK_SUBMISSIONS'>('MANAGE_TESTS');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedTestForView, setSelectedTestForView] = useState<Test | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const defaultTests: Test[] = [
    { id: '1', title: 'JavaScript ES6+ Assessment', questionsCount: 5, duration: '35 mins', passScore: '70%', category: 'Full Stack Development', testType: 'MCQ', totalMarks: 100 },
    { id: '2', title: 'React Advanced Patterns Test', questionsCount: 5, duration: '45 mins', passScore: '75%', category: 'Full Stack Development', testType: 'MCQ', totalMarks: 100 },
    { id: '3', title: 'UI/UX Design Fundamentals', questionsCount: 5, duration: '30 mins', passScore: '70%', category: 'UI/UX Design', testType: 'MCQ', totalMarks: 100 },
    { id: '4', title: 'Data Science Foundations', questionsCount: 5, duration: '40 mins', passScore: '70%', category: 'Data Science & Machine Learning', testType: 'MCQ', totalMarks: 100 },
    { id: '5', title: 'Java Full Stack & Spring Boot Assessment', questionsCount: 5, duration: '45 mins', passScore: '75%', category: 'Java Full Stack', testType: 'MCQ', totalMarks: 100 },
  ];

  const [tests, setTests] = useState<Test[]>(defaultTests);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Wizard Fields
  const [testType, setTestType] = useState<'MCQ' | 'PDF'>('PDF');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('45');
  const [passScore, setPassScore] = useState('75');
  const [totalMarks, setTotalMarks] = useState('100');
  const [category, setCategory] = useState('Full Stack Development');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileUri, setPdfFileUri] = useState('');
  const [pdfInstructions, setPdfInstructions] = useState('');
  const [extractedMcqs, setExtractedMcqs] = useState<McqQuestion[]>([]);

  // MCQ Question Fields
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [wizardQuestions, setWizardQuestions] = useState<Question[]>([]);

  // Grading state for submissions
  const [gradingMarks, setGradingMarks] = useState<Record<string, string>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTestsAndSubmissions();
  }, []);

  const loadTestsAndSubmissions = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch tests from backend API + AsyncStorage
      let apiTests: any[] = [];
      try {
        const res = await api.getAllTests();
        apiTests = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
      } catch (_) {}

      const storedTests = await AsyncStorage.getItem(PUBLISHED_TESTS_KEY);
      let localTests: any[] = [];
      if (storedTests) {
        const parsed = safeParseJson(storedTests, []);
        if (Array.isArray(parsed)) localTests = parsed;
      }

      // Merge backend and local tests
      const mergedTestsMap = new Map<string, Test>();
      apiTests.forEach((t: any) => {
        const tid = String(t.id);
        const parsedQ = safeParseJson(t.questionsJson, undefined);
        mergedTestsMap.set(tid, {
          id: tid,
          title: t.title || t.testName,
          questionsCount: t.questionsCount || (Array.isArray(parsedQ) ? parsedQ.length : 0),
          duration: t.duration || '45 mins',
          passScore: t.passScore || '75%',
          category: t.category || t.courseTitle || 'Full Stack Development',
          totalMarks: t.totalMarks || 100,
          testType: t.testType || 'MCQ',
          pdfFileName: t.pdfFileName,
          pdfFileUri: t.pdfFileUri,
          pdfInstructions: t.pdfInstructions,
          questions: parsedQ,
        });
      });
      localTests.forEach((t: any) => {
        if (!mergedTestsMap.has(String(t.id))) {
          mergedTestsMap.set(String(t.id), t);
        }
      });
      defaultTests.forEach((dt) => {
        if (!mergedTestsMap.has(String(dt.id))) {
          mergedTestsMap.set(String(dt.id), dt);
        }
      });
      setTests(Array.from(mergedTestsMap.values()));

      // 2. Fetch submissions from backend API + AsyncStorage
      let apiSubs: any[] = [];
      try {
        const subRes = await api.getTestSubmissions();
        apiSubs = Array.isArray(subRes) ? subRes : Array.isArray((subRes as any)?.data) ? (subRes as any).data : [];
      } catch (_) {}

      const storedSubs = await AsyncStorage.getItem(TEST_SUBMISSIONS_KEY);
      let localSubs: any[] = [];
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs);
        if (Array.isArray(parsed)) localSubs = parsed;
      }

      const mergedSubsMap = new Map<string, Submission>();
      apiSubs.forEach((s: any) => {
        const sid = String(s.id);
        mergedSubsMap.set(sid, {
          id: sid,
          testId: String(s.test?.id || s.testId || ''),
          testTitle: s.testTitle || s.test?.testName || 'Assessment',
          studentName: s.studentName || s.student?.name || 'Student',
          studentEmail: s.studentEmail || s.student?.email || '',
          submittedAt: s.submittedAt || s.attemptDate || new Date().toLocaleDateString(),
          answersText: s.answersText,
          solutionFileName: s.solutionFileName,
          solutionFileUri: s.solutionFileUri,
          status: s.status === 'GRADED' ? 'GRADED' : 'PENDING',
          obtainedMarks: s.marksObtained,
          totalMarks: s.totalMarks,
          feedback: s.feedback,
        });
      });
      localSubs.forEach((s: any) => {
        if (!mergedSubsMap.has(String(s.id))) {
          mergedSubsMap.set(String(s.id), s);
        }
      });

      const allSubmissions = Array.from(mergedSubsMap.values());
      setSubmissions(allSubmissions);

      const initialMarks: Record<string, string> = {};
      const initialFeedback: Record<string, string> = {};
      allSubmissions.forEach((s: Submission) => {
        if (s.obtainedMarks !== undefined) initialMarks[s.id] = String(s.obtainedMarks);
        if (s.feedback) initialFeedback[s.id] = s.feedback;
      });
      setGradingMarks(initialMarks);
      setGradingFeedback(initialFeedback);
    } catch (_) { } finally {
      setIsRefreshing(false);
    }
  };

  const onPdfFileSelected = (fileName: string, fileUri: string, rawText = '') => {
    setPdfFileName(fileName);
    setPdfFileUri(fileUri);
    const parsed = parseMcqsFromText(rawText, fileName);
    setExtractedMcqs(parsed);
    const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    if (!title) setTitle(cleanTitle);

    if (parsed.length > 0) {
      Alert.alert(
        '🎉 Document Parsed & Questions Extracted!',
        `Successfully extracted ${parsed.length} questions, options (A, B, C, D), and answer keys directly from "${fileName}".`
      );
    } else {
      Alert.alert(
        '⚠️ PDF Text Extraction Notice',
        `Unable to extract selectable text from "${fileName}". If this PDF is a scanned image or encrypted, please upload an unencrypted PDF with selectable text, a Word (.docx) document, or a plain text (.txt) file.`
      );
    }
  };

  const handleDeleteTest = async (testId: string) => {
    const confirmDelete = async () => {
      try {
        const updatedTests = tests.filter(t => t.id !== testId);
        setTests(updatedTests);
        await AsyncStorage.setItem(PUBLISHED_TESTS_KEY, JSON.stringify(updatedTests));
        Alert.alert('Success', 'Test deleted successfully');
      } catch (err) {
        console.error('Failed to delete test:', err);
        Alert.alert('Error', 'Failed to delete test');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this test?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Test',
        'Are you sure you want to delete this test?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handlePickPdf = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.docx,.doc,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          try {
            if (file.name.endsWith('.txt')) {
              const text = await file.text();
              onPdfFileSelected(file.name, url, text);
            } else {
              const buffer = await file.arrayBuffer();
              const extractedText = await parsePdfBuffer(buffer);
              onPdfFileSelected(file.name, url, extractedText);
            }
          } catch (_) {
            onPdfFileSelected(file.name, url, '');
          }
        }
      };
      input.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const res = await fetch(asset.uri);
          const buffer = await res.arrayBuffer();
          const extractedText = await parsePdfBuffer(buffer);
          onPdfFileSelected(asset.name || 'Question_Paper_Doc.pdf', asset.uri, extractedText);
        } catch (_) {
          onPdfFileSelected(asset.name || 'Question_Paper_Doc.pdf', asset.uri, '');
        }
      }
    } catch (err) {
      console.warn('Failed to pick document:', err);
    }
  };

  const handleAddQuestion = () => {
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      Alert.alert('Validation Error', 'Please enter question text and all four option values');
      return;
    }

    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: qText,
      options: { A: optA, B: optB, C: optC, D: optD },
      correctOption: correctOpt,
    };

    setWizardQuestions([...wizardQuestions, newQ]);
    setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrectOpt('A');
    Alert.alert('Question Added', `Question ${wizardQuestions.length + 1} added to test template.`);
  };

  const handlePublishTest = async () => {
    if (!title.trim() || !duration.trim() || !category.trim()) {
      Alert.alert('Validation Error', 'Please complete test title, category, and duration');
      return;
    }

    if (testType === 'MCQ' && wizardQuestions.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one question to MCQ test');
      return;
    }

    const finalQuestions = testType === 'PDF'
      ? extractedMcqs
      : wizardQuestions;

    const newTest: Test = {
      id: `test-${Date.now()}`,
      title: title.trim(),
      questionsCount: finalQuestions.length,
      duration: `${duration} mins`,
      passScore: `${passScore}%`,
      category: category.trim(),
      totalMarks: parseInt(totalMarks) || 100,
      testType: testType,
      pdfFileName: pdfFileName || 'Data_Science_20_MCQs_with_Answers.pdf',
      pdfFileUri: pdfFileUri || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pdfInstructions: pdfInstructions || 'Select the correct option for each question.',
      questions: finalQuestions as any,
    };

    // 1. Persist to backend database via API
    api.createTest({
      title: newTest.title,
      courseTitle: newTest.category,
      category: newTest.category,
      duration: newTest.duration,
      passScore: newTest.passScore,
      totalMarks: newTest.totalMarks,
      testType: newTest.testType,
      questionsCount: newTest.questionsCount,
      pdfFileName: newTest.pdfFileName,
      pdfFileUri: newTest.pdfFileUri,
      pdfInstructions: newTest.pdfInstructions,
      questionsJson: JSON.stringify(finalQuestions),
    }).then((created: any) => {
      if (created?.data?.id) {
        newTest.id = String(created.data.id);
      }
    }).catch(err => console.log('Backend test creation error:', err));

    const updatedTests = [newTest, ...tests];
    setTests(updatedTests);
    await AsyncStorage.setItem(PUBLISHED_TESTS_KEY, JSON.stringify(updatedTests));

    // Reset Wizard
    setTitle(''); setDuration('45'); setPassScore('75'); setTotalMarks('100');
    setCategory('Full Stack Development'); setPdfFileName(''); setPdfFileUri('');
    setPdfInstructions(''); setWizardQuestions([]); setExtractedMcqs([]); setShowCreateWizard(false);

    Alert.alert('Test Published! 🎉', `"${newTest.title}" with ${finalQuestions.length} interactive MCQs has been successfully added to student active test list.`);
  };

  const handleSaveGrade = async (submissionId: string) => {
    const marksStr = gradingMarks[submissionId];
    const feedbackStr = gradingFeedback[submissionId] || '';
    const marksVal = parseInt(marksStr, 10);

    if (isNaN(marksVal) || marksVal < 0) {
      Alert.alert('Invalid Marks', 'Please enter a valid marks value.');
      return;
    }

    const numSubId = parseInt(submissionId.replace(/\D/g, ''), 10);
    if (!isNaN(numSubId)) {
      api.gradeTestSubmission(numSubId, {
        marks: marksVal,
        feedback: feedbackStr,
        status: 'GRADED',
      }).catch(err => console.log('Backend grading error:', err));
    }

    const updatedSubs = submissions.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          status: 'GRADED' as const,
          obtainedMarks: marksVal,
          feedback: feedbackStr,
        };
      }
      return s;
    });

    setSubmissions(updatedSubs);
    await AsyncStorage.setItem(TEST_SUBMISSIONS_KEY, JSON.stringify(updatedSubs));
    Alert.alert('Grade Saved', 'Student marks and feedback updated successfully!');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)', 'rgba(9,2,0,0.14)', 'rgba(41,18,1,0.286)',
            'rgba(78,39,5,0.427)', 'rgba(118,62,11,0.573)', 'rgba(160,86,19,0.714)',
            'rgba(205,112,27,0.86)', '#FB8B24', 'rgba(205,112,27,0.86)',
            'rgba(160,86,19,0.714)', 'rgba(118,62,11,0.573)', 'rgba(78,39,5,0.427)',
            'rgba(41,18,1,0.286)', 'rgba(9,2,0,0.14)', 'rgba(0,0,0,0)',
          ]}
          locations={[0, 0.0714, 0.1429, 0.2143, 0.2857, 0.3571, 0.4286, 0.5, 0.5714, 0.6429, 0.7143, 0.7857, 0.8571, 0.9286, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.headerAccentLine}
        />
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Assessments & Tests</Text>
          {activeTab === 'MANAGE_TESTS' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateWizard(!showCreateWizard)}
            >
              <Ionicons name={showCreateWizard ? "close-outline" : "add-outline"} size={22} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Publish PDF tests, evaluate answers, and record student marks</Text>
      </View>

      {/* SUB TABS */}
      <View style={styles.topTabsRow}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'MANAGE_TESTS' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('MANAGE_TESTS')}
        >
          <Ionicons name="document-text-outline" size={16} color={activeTab === 'MANAGE_TESTS' ? '#FFF' : '#4B5563'} />
          <Text style={[styles.topTabText, activeTab === 'MANAGE_TESTS' && styles.topTabTextActive]}>Manage Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'CHECK_SUBMISSIONS' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('CHECK_SUBMISSIONS')}
        >
          <Ionicons name="checkmark-done-circle-outline" size={16} color={activeTab === 'CHECK_SUBMISSIONS' ? '#FFF' : '#4B5563'} />
          <Text style={[styles.topTabText, activeTab === 'CHECK_SUBMISSIONS' && styles.topTabTextActive]}>
            Check Student Tests ({submissions.filter(s => s.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'MANAGE_TESTS' ? (
          showCreateWizard ? (
            <View style={styles.wizardCard}>
              <Text style={styles.wizardHeader}>Create New Test</Text>

              {/* Test Type Selector */}
              <Text style={styles.inputLabel}>Test Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, testType === 'PDF' && styles.typeBtnActive]}
                  onPress={() => setTestType('PDF')}
                >
                  <Ionicons name="document-attach-outline" size={18} color={testType === 'PDF' ? '#FFF' : '#7B2CBF'} />
                  <Text style={[styles.typeBtnText, testType === 'PDF' && styles.typeBtnTextActive]}>PDF Question Paper</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, testType === 'MCQ' && styles.typeBtnActive]}
                  onPress={() => setTestType('MCQ')}
                >
                  <Ionicons name="list-outline" size={18} color={testType === 'MCQ' ? '#FFF' : '#7B2CBF'} />
                  <Text style={[styles.typeBtnText, testType === 'MCQ' && styles.typeBtnTextActive]}>MCQ Questions</Text>
                </TouchableOpacity>
              </View>

              {/* Metadata inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Test Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Full Stack Development Mid-Term PDF Exam"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.rowBetween}>
                <View style={[styles.inputGroup, { flex: 0.31 }]}>
                  <Text style={styles.inputLabel}>Duration (mins)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="45"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 0.31 }]}>
                  <Text style={styles.inputLabel}>Pass Score (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="75"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={passScore}
                    onChangeText={setPassScore}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 0.31 }]}>
                  <Text style={styles.inputLabel}>Total Marks</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={totalMarks}
                    onChangeText={setTotalMarks}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course / Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Full Stack Development"
                  placeholderTextColor="#9CA3AF"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              {/* PDF File Upload Section */}
              {testType === 'PDF' ? (
                <View style={styles.pdfSectionCard}>
                  <Text style={styles.blockTitle}>📄 Upload MCQ Question Paper PDF</Text>
                  <TouchableOpacity style={styles.uploadPdfBtn} onPress={handlePickPdf}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#7B2CBF" />
                    <Text style={styles.uploadPdfBtnText}>
                      {pdfFileName ? `Selected: ${pdfFileName}` : 'Choose MCQ PDF File (e.g. Data_Science_20_MCQs_with_Answers.pdf)'}
                    </Text>
                  </TouchableOpacity>

                  {extractedMcqs.length > 0 ? (
                    <View style={{ marginTop: 14, backgroundColor: '#FAF0FD', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E9D5FF' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Ionicons name="sparkles" size={18} color="#7B2CBF" />
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#7B2CBF' }}>
                          Extracted {extractedMcqs.length} Questions & Options from PDF:
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#4B5563', marginBottom: 10 }}>
                        ✨ An interactive test with these exact questions & options will be generated for students, and automatically graded against the PDF answer key!
                      </Text>

                      {extractedMcqs.slice(0, 5).map((q, idx) => (
                        <View key={q.id || idx} style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#F3E8FF' }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937' }}>
                            Q{idx + 1}. {q.text}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                            A) {q.options.A} | B) {q.options.B}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#16A34A', marginTop: 2 }}>
                            Correct Answer: Option {q.correctOption}
                          </Text>
                        </View>
                      ))}
                      {extractedMcqs.length > 5 ? (
                        <Text style={{ fontSize: 11, fontStyle: 'italic', color: '#7B2CBF', textAlign: 'center', marginTop: 4 }}>
                          ...and {extractedMcqs.length - 5} more extracted questions!
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Instructions for Students</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. Select the best option for each question. Test will be auto-evaluated."
                    placeholderTextColor="#9CA3AF"
                    multiline={true}
                    value={pdfInstructions}
                    onChangeText={setPdfInstructions}
                  />
                </View>
              ) : (
                /* MCQ Questions Section */
                <View style={styles.addQuestionBlock}>
                  <Text style={styles.blockTitle}>Add MCQ Question</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter question text here..."
                    placeholderTextColor="#9CA3AF"
                    multiline={true}
                    value={qText}
                    onChangeText={setQText}
                  />

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
                    <Text style={styles.addQBtnText}>Add Question ({wizardQuestions.length})</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action buttons */}
              <TouchableOpacity style={styles.publishBtn} onPress={handlePublishTest}>
                <Ionicons name="cloud-upload" size={16} color="#FFF" />
                <Text style={styles.publishBtnText}>Publish Test for Students</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📚 Published Active Tests ({tests.length})</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                  onPress={loadTestsAndSubmissions}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#7B2CBF" />
                  ) : (
                    <Ionicons name="refresh-outline" size={14} color="#7B2CBF" />
                  )}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#7B2CBF' }}>Refresh</Text>
                </TouchableOpacity>
              </View>

              {tests.map((t) => (
                <View key={t.id} style={styles.testCard}>
                  <View style={styles.testCardHeader}>
                    <View style={[styles.testCardIcon, t.testType === 'PDF' && { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons
                        name={t.testType === 'PDF' ? "document-text-outline" : "clipboard-outline"}
                        size={20}
                        color={t.testType === 'PDF' ? "#EF4444" : "#7B2CBF"}
                      />
                    </View>
                    <View style={styles.testCardMeta}>
                      <View style={styles.titleRow}>
                        <Text style={styles.testCardTitle}>{t.title}</Text>
                        <View style={[styles.typeTag, t.testType === 'PDF' ? styles.tagPdf : styles.tagMcq]}>
                          <Text style={[styles.typeTagText, t.testType === 'PDF' ? styles.tagPdfText : styles.tagMcqText]}>
                            {t.testType === 'PDF' ? 'PDF Exam' : 'MCQ Test'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.testCardCat}>{t.category}</Text>
                    </View>
                  </View>

                  <View style={styles.testStatsRow}>
                    <View style={styles.testStatBox}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.testStatVal}>{t.duration}</Text>
                    </View>
                    <View style={styles.testStatBox}>
                      <Ionicons name="ribbon-outline" size={12} color="#16A34A" />
                      <Text style={[styles.testStatVal, { color: '#16A34A' }]}>{t.totalMarks || 100} Marks</Text>
                    </View>
                    <View style={styles.testStatBox}>
                      <Ionicons name="help-circle-outline" size={12} color="#7B2CBF" />
                      <Text style={[styles.testStatVal, { color: '#7B2CBF' }]}>
                        {t.questionsCount || (Array.isArray(t.questions) ? t.questions.length : 5)} Qs
                      </Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#7B2CBF',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                      }}
                      onPress={() => setSelectedTestForView(t)}
                    >
                      <Ionicons name="eye-outline" size={14} color="#FFF" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>View Questions & Answers</Text>
                    </TouchableOpacity>

                    {t.testType === 'PDF' && (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: '#EFF6FF',
                          borderWidth: 1,
                          borderColor: '#BFDBFE',
                        }}
                        onPress={() => {
                          const uri = t.pdfFileUri || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                          Linking.openURL(uri).catch(() => Alert.alert('Error', 'Could not open PDF file'));
                        }}
                      >
                        <Ionicons name="download-outline" size={14} color="#2563EB" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>Paper</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: '#FEE2E2',
                        borderWidth: 1,
                        borderColor: '#FCA5A5',
                      }}
                      onPress={() => handleDeleteTest(t.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          /* CHECK SUBMISSIONS & GRADE PANEL */
          <View style={styles.listContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✍️ Student Submissions ({submissions.length})</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                onPress={loadTestsAndSubmissions}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#7B2CBF" />
                ) : (
                  <Ionicons name="refresh-outline" size={14} color="#7B2CBF" />
                )}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#7B2CBF' }}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {submissions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="file-tray-outline" size={36} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                <Text style={styles.emptySubtitle}>Student test submissions will appear here for grading.</Text>
              </View>
            ) : (
              submissions.map((sub) => (
                <View key={sub.id} style={styles.subCard}>
                  <View style={styles.subHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subStudentName}>
                        {(sub.studentName && sub.studentName.trim()) ? sub.studentName : (sub.studentEmail || 'Student')}
                      </Text>
                      <Text style={styles.subTestTitle}>{sub.testTitle}</Text>
                      <Text style={styles.subDate}>Submitted: {sub.submittedAt}</Text>
                    </View>
                    <View style={[styles.statusBadge, sub.status === 'GRADED' ? styles.badgeGraded : styles.badgePending]}>
                      <Text style={[styles.statusBadgeText, sub.status === 'GRADED' ? styles.badgeTextGraded : styles.badgeTextPending]}>
                        {sub.status === 'GRADED' ? 'GRADED' : 'PENDING EVALUATION'}
                      </Text>
                    </View>
                  </View>

                  {/* Answers view */}
                  <View style={styles.answersBox}>
                    <Text style={styles.answersBoxTitle}>Student Answer Solution:</Text>
                    <Text style={styles.answersBoxText}>
                      {sub.answersText ? sub.answersText : 'No text answer provided.'}
                    </Text>
                    {sub.solutionFileUri ? (
                      <TouchableOpacity
                        style={styles.viewSolutionBtn}
                        onPress={() => Linking.openURL(sub.solutionFileUri!)}
                      >
                        <Ionicons name="document-attach" size={16} color="#7B2CBF" />
                        <Text style={styles.viewSolutionText}>
                          View / Download Student Solution File ({sub.solutionFileName || 'Solution.pdf'})
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Grading & Feedback form — non-editable once graded */}
                  {sub.status === 'GRADED' ? (
                    <View style={styles.gradedCompletedCard}>
                      <View style={styles.gradedCompletedHeader}>
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                        <Text style={styles.gradedCompletedTitle}>Test Evaluation Completed (Non-Editable)</Text>
                      </View>
                      <View style={styles.gradedScoreRow}>
                        <Text style={styles.gradedScoreLabel}>
                          Obtained Marks: <Text style={styles.gradedScoreValue}>{sub.obtainedMarks ?? gradingMarks[sub.id] ?? 0} / {sub.totalMarks || 100}</Text>
                        </Text>
                      </View>
                      {(sub.feedback || gradingFeedback[sub.id]) ? (
                        <Text style={styles.gradedFeedbackText}>
                          Teacher Feedback: "{sub.feedback || gradingFeedback[sub.id]}"
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.gradingForm}>
                      <Text style={styles.gradingTitle}>Enter Marks & Evaluation:</Text>
                      <View style={styles.rowBetween}>
                        <View style={{ flex: 0.45 }}>
                          <Text style={styles.inputLabel}>Obtained Marks (out of {sub.totalMarks || 100})</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. 85"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={gradingMarks[sub.id] || ''}
                            onChangeText={(val) => setGradingMarks(prev => ({ ...prev, [sub.id]: val }))}
                          />
                        </View>
                        <View style={{ flex: 0.52 }}>
                          <Text style={styles.inputLabel}>Teacher Feedback</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. Excellent solution!"
                            placeholderTextColor="#9CA3AF"
                            value={gradingFeedback[sub.id] || ''}
                            onChangeText={(val) => setGradingFeedback(prev => ({ ...prev, [sub.id]: val }))}
                          />
                        </View>
                      </View>
                      <TouchableOpacity style={styles.saveGradeBtn} onPress={() => handleSaveGrade(sub.id)}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                        <Text style={styles.saveGradeBtnText}>Save Grade & Submit Marks</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── TEST QUESTIONS & ANSWER KEY MODAL ── */}
      <Modal
        visible={!!selectedTestForView}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTestForView(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFF',
            borderRadius: 20,
            width: '100%',
            maxWidth: 720,
            maxHeight: '90%',
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }} numberOfLines={1}>
                    {selectedTestForView?.title}
                  </Text>
                  <View style={[styles.typeTag, selectedTestForView?.testType === 'PDF' ? styles.tagPdf : styles.tagMcq]}>
                    <Text style={[styles.typeTagText, selectedTestForView?.testType === 'PDF' ? styles.tagPdfText : styles.tagMcqText]}>
                      {selectedTestForView?.testType === 'PDF' ? 'PDF Exam' : 'MCQ Test'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#7B2CBF', fontWeight: '600' }}>
                  {selectedTestForView?.category} • {selectedTestForView?.duration} • {selectedTestForView?.totalMarks || 100} Marks • Pass: {selectedTestForView?.passScore}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTestForView(null)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Questions List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {selectedTestForView && (() => {
                const qs = normalizeQuestions(selectedTestForView.questions, selectedTestForView.title || selectedTestForView.category);

                return (
                  <View style={{ gap: 14 }}>
                    {selectedTestForView.testType === 'PDF' && (
                      <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E40AF' }}>
                              📄 {selectedTestForView.pdfFileName || 'Question_Paper.pdf'}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>
                              {selectedTestForView.pdfInstructions || 'Complete all questions in the question paper.'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{ backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            onPress={() => {
                              const uri = selectedTestForView.pdfFileUri || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                              Linking.openURL(uri).catch(() => Alert.alert('Error', 'Could not open PDF file'));
                            }}
                          >
                            <Ionicons name="download-outline" size={14} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Download PDF</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>
                        Questions & Correct Answer Keys ({qs.length})
                      </Text>
                      <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>
                        ✓ Correct option marked in green
                      </Text>
                    </View>

                    {qs.map((q, idx) => (
                      <View key={q.id || idx} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#7B2CBF', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFF' }}>{idx + 1}</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937', lineHeight: 20 }}>
                            {q.text}
                          </Text>
                        </View>

                        {/* Options */}
                        <View style={{ gap: 6, marginLeft: 32 }}>
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const isCorrect = q.correctOption === opt;
                            const optVal = q.options[opt];
                            return (
                              <View
                                key={opt}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  borderRadius: 8,
                                  backgroundColor: isCorrect ? '#DCFCE7' : '#FFFFFF',
                                  borderWidth: 1,
                                  borderColor: isCorrect ? '#86EFAC' : '#E5E7EB',
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: isCorrect ? '#16A34A' : '#6B7280' }}>
                                    {opt}.
                                  </Text>
                                  <Text style={{ fontSize: 13, color: isCorrect ? '#15803D' : '#374151', fontWeight: isCorrect ? '600' : '400', flex: 1 }}>
                                    {optVal}
                                  </Text>
                                </View>
                                {isCorrect && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16A34A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                    <Ionicons name="checkmark" size={12} color="#FFF" />
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFF' }}>CORRECT</Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>

            {/* Modal Footer */}
            <TouchableOpacity
              style={{ backgroundColor: '#7B2CBF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}
              onPress={() => setSelectedTestForView(null)}
            >
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerAccentLine: { height: 3, borderRadius: 2, marginBottom: 6 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  topTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  topTabBtnActive: {
    backgroundColor: '#7B2CBF',
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  topTabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  wizardCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  wizardHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    backgroundColor: '#FAF0FD',
  },
  typeBtnActive: {
    backgroundColor: '#7B2CBF',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1F2937',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pdfSectionCard: {
    backgroundColor: '#FAF0FD',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 10,
  },
  uploadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
  },
  uploadPdfBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  addQuestionBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionsInputsGrid: {
    gap: 8,
    marginVertical: 10,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionMarkerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  optSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  optSelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  optSelBtnActive: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  optSelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  optSelTextActive: {
    color: '#FFF',
  },
  addQBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FAF0FD',
    borderWidth: 1,
    borderColor: '#7B2CBF',
  },
  addQBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7B2CBF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 14,
  },
  sectionHeader: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  testCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  testCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FAF0FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testCardMeta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  testCardCat: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPdf: { backgroundColor: '#FEE2E2' },
  tagMcq: { backgroundColor: '#FAF0FD' },
  typeTagText: { fontSize: 10, fontWeight: 'bold' },
  tagPdfText: { color: '#DC2626' },
  tagMcqText: { color: '#7B2CBF' },
  testStatsRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  subCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subStudentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subTestTitle: {
    fontSize: 13,
    color: '#7B2CBF',
    fontWeight: '600',
    marginTop: 2,
  },
  subDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGraded: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextGraded: { color: '#15803D' },
  badgeTextPending: { color: '#B45309' },
  answersBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  answersBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  answersBoxText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  viewSolutionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewSolutionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  gradingForm: {
    backgroundColor: '#FAF0FD',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  gradingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  saveGradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7B2CBF',
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveGradeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 100,
  },
  gradedCompletedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  gradedCompletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gradedCompletedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  gradedScoreRow: {
    marginBottom: 4,
  },
  gradedScoreLabel: {
    fontSize: 13,
    color: '#374151',
  },
  gradedScoreValue: {
    fontWeight: 'bold',
    color: '#111827',
  },
  gradedFeedbackText: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
