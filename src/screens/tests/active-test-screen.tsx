import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ActiveTestScreenProps {
  testInfo: {
    title: string;
    questions: string;
    duration: string;
    passScore: string;
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

const mockQuestions: Question[] = [
  {
    id: 1,
    text: 'Which file extension is used for Java files?',
    options: {
      A: '.js',
      B: '.jav',
      C: '.java',
      D: '.class',
    },
    correctOption: 'C',
  },
  {
    id: 2,
    text: 'What is the default value of a boolean variable in Java?',
    options: {
      A: 'true',
      B: 'false',
      C: 'null',
      D: '0',
    },
    correctOption: 'B',
  },
  {
    id: 3,
    text: 'Which keyword is used to create a class in Java?',
    options: {
      A: 'class',
      B: 'Class',
      C: 'define',
      D: 'create',
    },
    correctOption: 'A',
  },
  {
    id: 4,
    text: 'What is the size of int data type in Java?',
    options: {
      A: '8 bits',
      B: '16 bits',
      C: '32 bits',
      D: '84 bits',
    },
    correctOption: 'C',
  },
  {
    id: 5,
    text: 'Which method is the entry point of a Java program?',
    options: {
      A: 'start()',
      B: 'main()',
      C: 'run()',
      D: 'execute()',
    },
    correctOption: 'B',
  },
  {
    id: 6,
    text: 'Which of the following is not a Java feature?',
    options: {
      A: 'Dynamic',
      B: 'Architecture Neutral',
      C: 'Use of pointers',
      D: 'Object Oriented',
    },
    correctOption: 'C',
  },
  {
    id: 7,
    text: 'What is the default value of String variable in Java?',
    options: {
      A: '""',
      B: 'null',
      C: 'undefined',
      D: 'not defined',
    },
    correctOption: 'B',
  },
  {
    id: 8,
    text: 'Which package contains the Random class in Java?',
    options: {
      A: 'java.util',
      B: 'java.lang',
      C: 'java.io',
      D: 'java.awt',
    },
    correctOption: 'A',
  },
  {
    id: 9,
    text: 'An interface in Java contains only static constants and _____?',
    options: {
      A: 'concrete methods',
      B: 'abstract methods',
      C: 'non-static methods',
      D: 'constructors',
    },
    correctOption: 'B',
  },
  {
    id: 10,
    text: 'Which keyword is used to inherit a class in Java?',
    options: {
      A: 'implements',
      B: 'extends',
      C: 'inherits',
      D: 'exports',
    },
    correctOption: 'B',
  },
];

export default function ActiveTestScreen({ testInfo, onClose }: ActiveTestScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(1530); // 25 mins and 30 secs

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true); // Auto-submit when timer hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = mockQuestions[currentIdx];
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
    if (currentIdx < mockQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmitTest = (autoSubmit = false) => {
    // Calculate grade
    let score = 0;
    mockQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) {
        score += 1;
      }
    });

    const percentScore = (score / mockQuestions.length) * 100;
    const requiredPassPercent = parseFloat(testInfo.passScore);
    const passed = percentScore >= requiredPassPercent;

    const alertTitle = autoSubmit ? 'Time is Up!' : 'Test Completed';
    const alertMsg = `You scored ${score}/${mockQuestions.length} (${percentScore}%).\n` +
      `Required Passing Score: ${testInfo.passScore}.\n\n` +
      `Status: ${passed ? 'PASSED 🎉' : 'FAILED ❌'}`;

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER BANNER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitPress}>
          <Ionicons name="arrow-back" size={16} color="#FFF" style={styles.backIcon} />
          <Text style={styles.exitButtonText}>Exit Test</Text>
        </TouchableOpacity>
        
        {/* Timer */}
        <View style={styles.timerBox}>
          <Ionicons name="time" size={16} color="#FFF" />
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        </View>
      </View>

      {/* Progress header details */}
      <View style={styles.progressRow}>
        <Text style={styles.progressTitle}>Question {currentIdx + 1} of {mockQuestions.length}</Text>
        <Text style={styles.answeredCountText}>{totalAnswered} Answered</Text>
      </View>

      {/* Horizontal progress bar */}
      <View style={styles.headerProgressBarBg}>
        <View style={[styles.headerProgressBarFill, { width: `${((currentIdx + 1) / mockQuestions.length) * 100}%` }]} />
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
          <Text style={styles.questionText}>{currentQuestion.text}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {(Object.keys(currentQuestion.options) as ('A' | 'B' | 'C' | 'D')[]).map((key) => {
              const value = currentQuestion.options[key];
              const isSelected = answers[currentIdx] === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIndexCircle, isSelected && styles.optionIndexCircleSelected]}>
                    <Text style={[styles.optionIndexText, isSelected && styles.optionIndexTextSelected]}>
                      {key}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {value}
                  </Text>
                  {isSelected && (
                    <View style={styles.optionCheckCircle}>
                      <Ionicons name="checkmark" size={12} color="#7B2CBF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. NAVIGATION BUTTONS */}
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={[styles.navBtn, styles.prevBtn, currentIdx === 0 && styles.disabledBtn]}
            onPress={handlePrevious}
            disabled={currentIdx === 0}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={16} color={currentIdx === 0 ? "#9CA3AF" : "#4B5563"} />
            <Text style={[styles.prevBtnText, currentIdx === 0 && styles.disabledBtnText]}>Previous</Text>
          </TouchableOpacity>

          {currentIdx === mockQuestions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.submitBtn]}
              onPress={() => handleSubmitTest(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Submit Test</Text>
              <Ionicons name="checkmark-done" size={16} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, styles.nextBtn]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Save & Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. QUESTION NAVIGATOR */}
        <Text style={styles.navigatorTitle}>Question Navigator</Text>
        <View style={styles.navigatorCard}>
          <View style={styles.gridContainer}>
            {mockQuestions.map((q, idx) => {
              const qAnswered = answers[idx] !== undefined;
              const qFlagged = flagged[idx] === true;
              const isCurrent = idx === currentIdx;

              // Determine style
              let cellStyle: any = styles.gridCellNotAnswered;
              let textStyle: any = styles.gridCellTextNotAnswered;

              if (qAnswered) {
                cellStyle = styles.gridCellAnswered;
                textStyle = styles.gridCellTextAnswered;
              } else if (qFlagged) {
                cellStyle = styles.gridCellFlagged;
                textStyle = styles.gridCellTextFlagged;
              }

              if (isCurrent) {
                cellStyle = styles.gridCellCurrent;
                textStyle = styles.gridCellTextCurrent;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.gridCell, cellStyle]}
                  onPress={() => setCurrentIdx(idx)}
                >
                  <Text style={[styles.gridCellText, textStyle]}>{idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#7B2CBF' }]} />
              <Text style={styles.legendLabel}>Current</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendLabel}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#FF7A00' }]} />
              <Text style={styles.legendLabel}>Flagged</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: '#E5E7EB' }]} />
              <Text style={styles.legendLabel}>Not Answered</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacer */}
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  backIcon: {
    marginRight: 4,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#7B2CBF',
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  answeredCountText: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '500',
  },
  headerProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFB703', // Yellow progress bar
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  bottomSpacer: {
    height: 120, // Padding to avoid overlap with bottom navigation capsule
  },
  // Question detail card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 8,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  flagButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#7B2CBF',
    borderWidth: 1.5,
    backgroundColor: '#F9F5FF',
  },
  optionIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIndexCircleSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#7B2CBF',
  },
  optionIndexText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  optionIndexTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    color: '#7B2CBF',
    fontWeight: 'bold',
  },
  optionCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Navigation Buttons
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  navBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  prevBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  prevBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: '#7B2CBF',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#10B981',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  disabledBtnText: {
    color: '#9CA3AF',
  },
  // Question Navigator
  navigatorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  navigatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridCell: {
    width: '17%', // ~5 columns per row with spacing
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCellText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  gridCellNotAnswered: {
    backgroundColor: '#F3F4F6',
  },
  gridCellTextNotAnswered: {
    color: '#4B5563',
  },
  gridCellAnswered: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gridCellTextAnswered: {
    color: '#10B981',
  },
  gridCellFlagged: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFD7A3',
  },
  gridCellTextFlagged: {
    color: '#FF7A00',
  },
  gridCellCurrent: {
    backgroundColor: '#7B2CBF',
  },
  gridCellTextCurrent: {
    color: '#FFFFFF',
  },
  // Legend
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
