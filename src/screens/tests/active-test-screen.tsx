import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { parseMcqsFromText } from '@/utils/pdf-mcq-parser';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const TEST_SUBMISSIONS_KEY = 'NEXUS_TEST_SUBMISSIONS';

interface ActiveTestScreenProps {
  testInfo: {
    id?: string;
    title: string;
    questions?: string;
    duration?: string;
    passScore?: string;
    totalMarks?: number;
    testType?: 'MCQ' | 'PDF';
    pdfFileUri?: string;
    pdfFileName?: string;
    pdfInstructions?: string;
  };
  onClose: () => void;
}

interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export default function ActiveTestScreen({ testInfo, onClose }: ActiveTestScreenProps) {
  // Parse Duration (default 45 mins), Pass Score (default 75%), Total Marks (default 100)
  const durationMins = parseInt(String(testInfo.duration || '45').replace(/\D/g, ''), 10) || 45;
  const passScorePercent = parseFloat(String(testInfo.passScore || '75').replace(/[^\d\.]/g, '')) || 75;
  const totalMarks = testInfo.totalMarks || 100;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMins * 60);

  // Anti-Cheating & Camera Proctoring State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const videoRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request Camera Access
  const requestCameraPermission = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setCameraActive(true);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera permission denied:', err);
        setCameraActive(false);
        setCameraError('Camera access required for proctored exam.');
      }
    } else {
      // Non-web or native fallback
      setCameraActive(true);
    }
  };

  useEffect(() => {
    requestCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Timer Effect (Auto-Submit on Expire)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true, 'Duration Expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const violationsRef = useRef(0);

  const handleProctorViolation = (reason: string) => {
    violationsRef.current += 1;
    const count = violationsRef.current;

    if (count >= 2) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          '🚨 EXAM AUTO-SUBMITTED (2/2 Violations Detected)!',
          `You exceeded the maximum allowed proctoring attempts (${reason}).\nYour test has been automatically submitted.`
        );
      }
      handleSubmitTest(true, `Proctoring Violation (2 attempts exceeded: ${reason})`);
    } else {
      if (Platform.OS === 'web') {
        try { window.alert(`⚠️ PROCTORING WARNING (Attempt 1/2)!\n\nSwitching tabs, leaving the window, or focus loss is strictly forbidden during the exam.\n\nYou have 1 warning remaining. A 2nd attempt will automatically submit your exam.`); } catch (_) { }
      } else {
        Alert.alert(
          '⚠️ PROCTORING WARNING (Attempt 1/2)!',
          'Switching tabs, leaving the window, or focus loss is strictly forbidden during the exam.\n\nYou have 1 warning remaining. A 2nd attempt will automatically submit your exam.'
        );
      }
    }
  };

  // Anti-Cheating: Copy/Paste & Tab Switch Monitoring
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const preventCopy = (e: Event) => {
      e.preventDefault();
      if (Platform.OS === 'web') {
        try { window.alert('⚠️ Copying or selecting text is strictly prohibited during the exam.'); } catch (_) { }
      } else {
        Alert.alert('Prohibited', '⚠️ Copying or selecting text is strictly prohibited during the exam.');
      }
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleProctorViolation('Tab Switch');
      }
    };

    const handleWindowBlur = () => {
      handleProctorViolation('Window Focus Loss');
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventCopy);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('contextmenu', preventCopy);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const questionsList: Question[] = (testInfo as any).questions && Array.isArray((testInfo as any).questions) && (testInfo as any).questions.length > 0
    ? (testInfo as any).questions
    : (parseMcqsFromText('', testInfo.pdfFileName || testInfo.title) as any);

  const currentQuestion = questionsList[currentIdx] || questionsList[0];
  const isAnswered = answers[currentIdx] !== undefined;
  const isFlagged = flagged[currentIdx] === true;

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: option,
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentIdx]: !prev[currentIdx],
    }));
  };

  const handleNext = () => {
    if (currentIdx < questionsList.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleManualSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questionsList.length - answeredCount;

    if (Platform.OS === 'web') {
      const msg = unansweredCount > 0 
        ? `You still have ${unansweredCount} unanswered questions.\nAre you sure you want to submit?`
        : 'Are you sure you want to submit your test?';
      if (window.confirm(msg)) {
        handleSubmitTest(false);
      }
    } else {
      Alert.alert(
        'Submit Test',
        unansweredCount > 0 
          ? `You still have ${unansweredCount} unanswered questions.\nAre you sure you want to submit?`
          : 'Are you sure you want to submit your test?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: () => handleSubmitTest(false) }
        ]
      );
    }
  };

  const handleSubmitTest = async (autoSubmit = false, reason = '') => {
    let score = 0;
    const currentAnswers = answersRef.current;
    questionsList.forEach((q, idx) => {
      if (currentAnswers[idx] === q.correctOption) {
        score += 1;
      }
    });

    const percentScore = Math.round((score / questionsList.length) * 100);
    const passed = percentScore >= passScorePercent;
    const obtainedMarks = Math.round((score / questionsList.length) * totalMarks);

    let studentName = 'Student User';
    let studentEmail = 'student@nexus.com';
    try {
      const pRes = await api.getStudentProfile().catch(() => null);
      const pData = pRes?.data ?? pRes;
      if (pData?.name && String(pData.name).trim()) {
        studentName = String(pData.name).trim();
      } else if (pData?.firstName) {
        studentName = `${pData.firstName} ${pData.lastName || ''}`.trim();
      }
      if (pData?.email) {
        studentEmail = pData.email;
      }
    } catch (_) {}

    try {
      const newSub = {
        id: `sub-${Date.now()}`,
        testId: testInfo.id || `test-${Date.now()}`,
        testTitle: testInfo.title || (testInfo as any).testName,
        studentName: studentName,
        studentEmail: studentEmail,
        submittedAt: new Date().toLocaleString(),
        status: 'GRADED',
        obtainedMarks: obtainedMarks,
        totalMarks: totalMarks,
        feedback: autoSubmit
          ? `Auto-submitted (${reason}): ${score}/${questionsList.length} correct (${percentScore}%).`
          : `Evaluated: ${score}/${questionsList.length} correct (${percentScore}%).`,
      };

      // 1. Submit to backend PostgreSQL API
      const numTestId = typeof testInfo.id === 'number' ? testInfo.id : parseInt(String(testInfo.id).replace(/\D/g, ''), 10) || undefined;
      api.submitTestAttempt({
        testId: numTestId,
        testTitle: testInfo.title || (testInfo as any).testName,
        studentName: studentName,
        studentEmail: studentEmail,
        marksObtained: obtainedMarks,
        totalMarks: totalMarks,
        status: 'GRADED',
        answersJson: JSON.stringify(currentAnswers),
        feedback: newSub.feedback,
      }).catch(err => console.log('Backend submission sync error:', err));

      // 2. Save to local AsyncStorage for instant UI responsiveness
      const existingSubsStr = await AsyncStorage.getItem(TEST_SUBMISSIONS_KEY);
      const existingSubs = existingSubsStr ? JSON.parse(existingSubsStr) : [];
      const updatedSubs = [newSub, ...existingSubs];
      await AsyncStorage.setItem(TEST_SUBMISSIONS_KEY, JSON.stringify(updatedSubs));
    } catch (_) { }

    const alertTitle = autoSubmit ? `Test Auto-Submitted (${reason})` : 'Test Completed';
    const alertMsg = `You scored ${score}/${questionsList.length} correct (${percentScore}%).\n` +
      `Obtained Marks: ${obtainedMarks} / ${totalMarks}\n` +
      `Pass Score Required: ${passScorePercent}%\n\n` +
      `Status: ${passed ? 'PASSED 🎉' : 'FAILED ❌'}`;

    if (Platform.OS === 'web' && autoSubmit) {
      try { window.alert(`${alertTitle}\n\n${alertMsg}`); } catch (_) { }
      onClose();
      return;
    }

    Alert.alert(alertTitle, alertMsg, [
      { text: 'View Results', onPress: onClose },
    ]);
  };

  const handleExitPress = () => {
    Alert.alert('Exit Test', 'Are you sure you want to exit? Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: onClose },
    ]);
  };

  const totalAnswered = Object.keys(answers).length;

  return (
    <SafeAreaView style={[styles.safeArea, { userSelect: 'none', WebkitUserSelect: 'none' } as any]} edges={['top']}>
      {/* CAMERA ACCESS BLOCKING OVERLAY IF CAMERA NOT GRANTED */}
      {!cameraActive && (
        <View style={styles.cameraBlockedOverlay}>
          <View style={styles.cameraBlockedCard}>
            <Ionicons name="videocam-off" size={48} color="#EF4444" />
            <Text style={styles.cameraBlockedTitle}>Camera Access Required</Text>
            <Text style={styles.cameraBlockedDesc}>
              This is a proctored exam. Compulsory webcam access is required to take this test.
            </Text>
            {cameraError ? <Text style={styles.cameraErrorText}>{cameraError}</Text> : null}
            <TouchableOpacity style={styles.retryCameraBtn} onPress={requestCameraPermission}>
              <Ionicons name="camera" size={18} color="#FFF" />
              <Text style={styles.retryCameraBtnText}>Allow Camera Access & Start Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FLOATING WEBCAM PROCTORING FEED */}
      {cameraActive && Platform.OS === 'web' && (
        <View style={styles.webcamFloatingBox}>
          <video
            ref={(ref) => {
              videoRef.current = ref;
              if (ref && streamRef.current && !ref.srcObject) {
                ref.srcObject = streamRef.current;
              }
            }}
            autoPlay
            playsInline
            muted
            style={{ width: 130, height: 95, borderRadius: 8, objectFit: 'cover' }}
          />
          <View style={styles.proctorBadge}>
            <View style={styles.proctorDot} />
            <Text style={styles.proctorText}>PROCTORING ACTIVE</Text>
          </View>
        </View>
      )}

      {/* 1. HEADER BANNER WITH TEST METADATA */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <Ionicons name="lock-closed" size={14} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>PROCTORED EXAM</Text>
        </View>

        {/* TEST METADATA CHIPS */}
        <View style={styles.metaChipsRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color="#FDE68A" />
            <Text style={styles.metaChipText}>Duration: {durationMins} mins</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="ribbon-outline" size={14} color="#86EFAC" />
            <Text style={styles.metaChipText}>Pass: {passScorePercent}%</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="school-outline" size={14} color="#C4B5FD" />
            <Text style={styles.metaChipText}>Total: {totalMarks} Marks</Text>
          </View>
        </View>

        {/* TIMER COUNTDOWN */}
        <View style={[styles.timerBox, secondsLeft <= 300 && { backgroundColor: '#DC2626' }]}>
          <Ionicons name="time" size={16} color="#FFF" />
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        </View>
      </View>

      {/* Progress header details */}
      <View style={styles.progressRow}>
        <Text style={styles.progressTitle}>Question {currentIdx + 1} of {questionsList.length}</Text>
        <Text style={styles.answeredCountText}>{totalAnswered} Answered</Text>
      </View>

      {/* Horizontal progress bar */}
      <View style={styles.headerProgressBarBg}>
        <View style={[styles.headerProgressBarFill, { width: `${((currentIdx + 1) / questionsList.length) * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. QUESTION DETAIL CARD */}
        <View style={styles.questionCard}>
          <View style={styles.cardTopRow}>
            {/* Answered badge */}
            <View style={[styles.statusBadge, { backgroundColor: isAnswered ? '#ECFDF5' : '#FAF5FF' }]}>
              <View style={[styles.badgeNumberCircle, { backgroundColor: isAnswered ? '#10B981' : '#7B2CBF' }]}>
                <Text style={styles.badgeNumberText}>{currentIdx + 1}</Text>
              </View>
              <Text style={[styles.statusBadgeText, { color: isAnswered ? '#10B981' : '#7B2CBF' }]}>
                {isAnswered ? 'Answered' : 'Not Answered'}
              </Text>
            </View>

            {/* Flag */}
            <TouchableOpacity onPress={toggleFlag} style={styles.flagButton} activeOpacity={0.7}>
              <Ionicons
                name={isFlagged ? "flag" : "flag-outline"}
                size={18}
                color={isFlagged ? "#FF7A00" : "#D1D5DB"}
              />
            </TouchableOpacity>
          </View>

          {/* Question Text */}
          <Text style={styles.questionTitle}>Question {currentIdx + 1}</Text>
          <Text style={styles.questionBody}>
            {typeof currentQuestion?.text === 'string'
              ? currentQuestion.text
              : typeof currentQuestion?.text === 'object' && currentQuestion.text !== null
                ? (currentQuestion.text as any).text || (currentQuestion.text as any).title || String(currentQuestion.text)
                : String(currentQuestion?.text || `Question ${currentIdx + 1}`)}
          </Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const rawOpt = currentQuestion?.options ? currentQuestion.options[opt] : '';
              const optText = typeof rawOpt === 'string'
                ? rawOpt
                : typeof rawOpt === 'object' && rawOpt !== null
                  ? (rawOpt as any).text || (rawOpt as any).value || (rawOpt as any).label || String(rawOpt)
                  : String(rawOpt || `Option ${opt}`);
              const isSelected = answers[currentIdx] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(opt)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    <Text style={[styles.radioLetter, isSelected && styles.radioLetterSelected]}>{opt}</Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{optText}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Previous / Next buttons */}
          <View style={styles.cardNavRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
              onPress={handlePrevious}
              disabled={currentIdx === 0}
            >
              <Ionicons name="arrow-back" size={16} color={currentIdx === 0 ? "#9CA3AF" : "#4B5563"} />
              <Text style={[styles.navBtnText, currentIdx === 0 && styles.navBtnTextDisabled]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnNext, currentIdx === questionsList.length - 1 && styles.navBtnDisabled]}
              onPress={handleNext}
              disabled={currentIdx === questionsList.length - 1}
            >
              <Text style={[styles.navBtnText, styles.navBtnTextNext, currentIdx === questionsList.length - 1 && styles.navBtnTextDisabled]}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={currentIdx === questionsList.length - 1 ? "#9CA3AF" : "#FFF"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. QUESTION PALETTE GRID */}
        <View style={styles.paletteContainer}>
          <Text style={styles.paletteTitle}>Question Palette ({questionsList.length} MCQs)</Text>
          <View style={styles.paletteGrid}>
            {questionsList.map((q, idx) => {
              const isAns = answers[idx] !== undefined;
              const isCurr = idx === currentIdx;
              const isFlg = flagged[idx] === true;

              let btnStyle: any = styles.paletteBtn;
              let textStyle: any = styles.paletteBtnText;

              if (isCurr) {
                btnStyle = [styles.paletteBtn, styles.paletteBtnCurrent];
                textStyle = [styles.paletteBtnText, styles.paletteBtnTextCurrent];
              } else if (isFlg) {
                btnStyle = [styles.paletteBtn, styles.paletteBtnFlagged];
                textStyle = [styles.paletteBtnText, styles.paletteBtnTextFlagged];
              } else if (isAns) {
                btnStyle = [styles.paletteBtn, styles.paletteBtnAnswered];
                textStyle = [styles.paletteBtnText, styles.paletteBtnTextAnswered];
              }

              return (
                <TouchableOpacity
                  key={q.id || idx}
                  style={btnStyle}
                  onPress={() => setCurrentIdx(idx)}
                >
                  <Text style={textStyle}>{idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Palette Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF7A00' }]} />
              <Text style={styles.legendText}>Flagged</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
              <Text style={styles.legendText}>Not Answered</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 4. BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.submitTestButton} onPress={handleManualSubmit}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.submitTestButtonText}>Submit Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web' ? {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw' as any,
      height: '100vh' as any,
      zIndex: 999999,
    } : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backIcon: {
    marginRight: 4,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  metaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaChipText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  answeredCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  headerProgressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  headerProgressBarFill: {
    height: '100%',
    backgroundColor: '#7B2CBF',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeNumberCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  flagButton: {
    padding: 6,
  },
  questionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B2CBF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questionBody: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  optionCardSelected: {
    backgroundColor: '#FAF5FF',
    borderColor: '#7B2CBF',
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  radioCircleSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  radioLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  radioLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#7B2CBF',
    fontWeight: '700',
  },
  cardNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  navBtnNext: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  navBtnTextNext: {
    color: '#FFFFFF',
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  paletteContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paletteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paletteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paletteBtnCurrent: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  paletteBtnAnswered: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  paletteBtnFlagged: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF7A00',
  },
  paletteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  paletteBtnTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paletteBtnTextAnswered: {
    color: '#10B981',
    fontWeight: '700',
  },
  paletteBtnTextFlagged: {
    color: '#FF7A00',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitTestButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitTestButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraBlockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cameraBlockedCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
  },
  cameraBlockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
  },
  cameraBlockedDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  cameraErrorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 16,
  },
  retryCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryCameraBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  webcamFloatingBox: {
    position: 'absolute',
    top: 70,
    right: 20,
    zIndex: 999,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  proctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  proctorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  proctorText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
