import CourseDetails, { CourseData } from '@/screens/courses/course-details';
import ExploreCourses, { ExploreCourseItem } from '@/screens/courses/explore-courses';
import ClassRecordingsScreen from '@/screens/home/class-recordings-screen';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const exploreCoursesList: ExploreCourseItem[] = [
  {
    id: '1',
    title: 'Full Stack Web Development',
    duration: '6 months',
    students: '2.5k',
    rating: '4.8',
    price: '₹15,999',
    key: 'Full Stack Web Development',
  },
  {
    id: '2',
    title: 'Java Full Stack Development',
    duration: '5 months',
    students: '2.5k',
    rating: '4.8',
    price: '₹15,999',
    key: 'Java Full Stack',
  },
  {
    id: '3',
    title: 'Node.js & Express',
    duration: '6 months',
    students: '2.5k',
    rating: '4.8',
    price: '₹15,999',
    key: 'Node js for AI',
  },
  {
    id: '4',
    title: 'Python Web Development',
    duration: '3 months',
    students: '2.5k',
    rating: '4.8',
    price: '₹15,999',
    key: 'Python for AI',
  },
  {
    id: '5',
    title: 'Data Science & Machine Learning',
    duration: '8 months',
    students: '1.8k',
    rating: '4.9',
    price: '₹18,999',
    key: 'Data Science & Machine Learning',
  },
];

export const coursesData: Record<string, CourseData> = {
  'Full Stack Web Development': {
    title: 'Full Stack Web Development',
    subtitle: 'Master modern web development from scratch',
    rating: '4.9',
    students: '2,500+ students',
    duration: '12 weeks',
    classesCount: '45',
    level: 'Beginner',
    skills: [
      'Live Interactive Classes',
      'Recorded Video Access',
      'Real-world Projects',
      'Lifetime Access',
      'Certificate of Completion',
      'Job Placement Support',
    ],
    teacher: {
      name: 'Rajesh Kumar',
      role: 'Senior Full Stack Developer',
      bio: 'Rajesh is a full-stack engineer with 10+ years of experience teaching web technologies and building robust scalable backends.',
      avatar: 'RK',
      emoji: '👨‍💻',
      experience: '10+ years in Full Stack Development',
      expertise: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
      studentsCount: '15,000+',
    },
    syllabus: [
      { moduleNumber: '5', title: 'MongoDB & Database Design', lessons: '5', weeks: '2' },
      { moduleNumber: '4', title: 'Node.js & Express', lessons: '10', weeks: '2' },
      { moduleNumber: '2', title: 'JavaScript & ES6+', lessons: '10', weeks: '3' },
      { moduleNumber: '3', title: 'React.js & State Management', lessons: '12', weeks: '3' },
    ],
  },
  'Data Science & Machine Learning': {
    title: 'Data Science & Machine Learning',
    subtitle: 'Learn Python, SQL, Tableau, Pandas, Scikit-Learn & Deep Learning',
    rating: '4.9',
    students: '1,800+ students',
    duration: '16 weeks',
    classesCount: '60',
    level: 'Intermediate',
    skills: [
      'Python & SQL Foundations',
      'Data Analysis & Visualization',
      'Supervised & Unsupervised ML',
      'Neural Networks & Deep Learning',
      'Industry Capstone Projects',
      '1-on-1 Mentorship Sessions',
    ],
    teacher: {
      name: 'Priya Sharma',
      role: 'Data Science Lead & AI Researcher',
      bio: 'Priya is a researcher and practitioner in AI with 8+ years of industry experience at top tech giants.',
      avatar: 'PS',
      emoji: '👩‍💻',
      experience: '8+ years in Data Science & Machine Learning',
      expertise: ['Python', 'SQL', 'TensorFlow', 'Pandas', 'Scikit-Learn'],
      studentsCount: '12,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Python Programming Foundations', lessons: '12', weeks: '3' },
      { moduleNumber: '2', title: 'Data Cleaning & SQL Databases', lessons: '10', weeks: '3' },
      { moduleNumber: '3', title: 'Exploratory Data Analysis & Math', lessons: '10', weeks: '3' },
      { moduleNumber: '4', title: 'Machine Learning Algorithms', lessons: '16', weeks: '4' },
      { moduleNumber: '5', title: 'Deep Learning & Projects', lessons: '12', weeks: '3' },
    ],
  },
  'Java Full Stack': {
    title: 'Java Full Stack Development',
    subtitle: 'Spring Boot, Hibernate, React, and Microservices architecture',
    rating: '4.9',
    students: '2,200+ students',
    duration: '14 weeks',
    classesCount: '52',
    level: 'Intermediate',
    skills: [
      'Core & Advanced Java',
      'Spring Framework & Spring Boot',
      'Hibernate & Database Systems',
      'Microservices & REST APIs',
      'React Frontend Integration',
      'Docker & AWS Deployment',
    ],
    teacher: {
      name: 'Amit Patel',
      role: 'Enterprise Solutions Architect',
      bio: 'Amit has over 12 years of architecting scalable enterprise solutions using Java and cloud technologies.',
      avatar: 'AP',
      emoji: '👨‍💻',
      experience: '12+ years in Enterprise Java Systems',
      expertise: ['Java', 'Spring Boot', 'Hibernate', 'REST APIs', 'AWS'],
      studentsCount: '10,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Java Programming Core', lessons: '12', weeks: '3' },
      { moduleNumber: '2', title: 'Spring Framework & Spring Boot', lessons: '14', weeks: '3' },
      { moduleNumber: '3', title: 'Hibernate ORM & Databases', lessons: '8', weeks: '2' },
      { moduleNumber: '4', title: 'Microservices & REST Services', lessons: '12', weeks: '3' },
      { moduleNumber: '5', title: 'Frontend Integration with React', lessons: '6', weeks: '3' },
    ],
  },
  'Node js for AI': {
    title: 'Node js for AI & Web Integration',
    subtitle: 'Learn to build and scale backend AI agents, LLM integrations and APIs',
    rating: '4.8',
    students: '1,500+ students',
    duration: '8 weeks',
    classesCount: '30',
    level: 'Advanced',
    skills: [
      'Node.js Core & Event Loop',
      'API Development with Express',
      'Vector Databases & LangChain',
      'Integrating OpenAI & Gemini APIs',
      'Real-time Streaming WebSockets',
      'Optimizing Node.js Performance',
    ],
    teacher: {
      name: 'Sanjay Mehta',
      role: 'Principal Systems Backend Engineer',
      bio: 'Sanjay is an open-source contributor and backend specialist focused on high-performance Node.js engines.',
      avatar: 'SM',
      emoji: '👨‍💻',
      experience: '9+ years in Node.js & Streaming Backends',
      expertise: ['Node.js', 'Express', 'Gemini APIs', 'Pinecone', 'WebSockets'],
      studentsCount: '8,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Node.js Internals & Events', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'Express.js Rest API Design', lessons: '10', weeks: '2' },
      { moduleNumber: '3', title: 'Integrations with OpenAI & Gemini APIs', lessons: '12', weeks: '2' },
      { moduleNumber: '4', title: 'Vector DBs & Semantic Caching', lessons: '8', weeks: '2' },
    ],
  },
  'React Native Bootcamp': {
    title: 'React Native Bootcamp',
    subtitle: 'Build high-performance native iOS and Android apps with JavaScript',
    rating: '4.9',
    students: '3,000+ students',
    duration: '10 weeks',
    classesCount: '40',
    level: 'Beginner',
    skills: [
      'React Native Core Components',
      'Expo SDK & Workflow CLI',
      'State Management (Redux/Zustand)',
      'Native Device APIs & Sensors',
      'App Store & Play Store Publishing',
      'Performance Optimization & Styling',
    ],
    teacher: {
      name: 'Vikram Rao',
      role: 'Lead Mobile Architect',
      bio: 'Vikram has built and shipped over 15 React Native applications to production for clients worldwide.',
      avatar: 'VR',
      emoji: '📱',
      experience: '7+ years in Mobile App Development',
      expertise: ['React Native', 'TypeScript', 'Expo', 'Zustand', 'App Store'],
      studentsCount: '18,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'React Native Core Architecture', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'Navigation & File Router', lessons: '10', weeks: '2' },
      { moduleNumber: '3', title: 'State Management & Storage', lessons: '8', weeks: '2' },
      { moduleNumber: '4', title: 'Device Features & Permissions', lessons: '10', weeks: '2' },
      { moduleNumber: '5', title: 'Store Deployment & Releases', lessons: '4', weeks: '2' },
    ],
  },
  'Python for AI': {
    title: 'Python for AI & Scripting',
    subtitle: 'Foundations of Python programming for analytics and intelligence engines',
    rating: '4.8',
    students: '4,000+ students',
    duration: '8 weeks',
    classesCount: '32',
    level: 'Beginner',
    skills: [
      'Python Syntax & Data Structures',
      'Object Oriented Programming',
      'Numpy & Pandas for Data Manipulation',
      'Scraping & Automation Scripts',
      'Machine Learning Libraries Foundations',
      'API Development with FastAPI',
    ],
    teacher: {
      name: 'Neha Gupta',
      role: 'AI Practitioner & Systems Lead',
      bio: 'Neha holds a Masters in Computer Science and specializes in creating Pythonic educational courses for machine learning.',
      avatar: 'NG',
      emoji: '👩‍🏫',
      experience: '6+ years in Python Analytics & Teaching',
      expertise: ['Python', 'FastAPI', 'Pandas', 'NumPy', 'Matplotlib'],
      studentsCount: '20,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Python Syntax & Data Structures', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'Numpy, Pandas & Matplotlib', lessons: '8', weeks: '2' },
      { moduleNumber: '3', title: 'Intro to Machine Learning Libs', lessons: '8', weeks: '2' },
      { moduleNumber: '4', title: 'FastAPI REST Deployments', lessons: '8', weeks: '2' },
    ],
  },
  'UI/UX Design Mastery': {
    title: 'UI/UX Design Mastery',
    subtitle: 'Master Figma, design systems, wireframing and user research',
    rating: '4.8',
    students: '1,900+ students',
    duration: '12 weeks',
    classesCount: '36',
    level: 'Beginner',
    skills: [
      'User Research & Persona Building',
      'Information Architecture & Wireframes',
      'Advanced Figma Techniques',
      'Creating Scalable Design Systems',
      'Interactive Prototyping & Testing',
      'UI Design Patterns & Typography',
    ],
    teacher: {
      name: 'Karan Malhotra',
      role: 'Product Designer',
      bio: 'Karan is a lead designer who has shaped products for multiple high-growth startups over the last 7 years.',
      avatar: 'KM',
      emoji: '🎨',
      experience: '7+ years in UX Research & Product UI',
      expertise: ['Figma', 'User Research', 'Wireframes', 'Design Systems'],
      studentsCount: '9,500+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Design Principles & Typography', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'User Research & Wireframing', lessons: '10', weeks: '3' },
      { moduleNumber: '3', title: 'Interface Design with Figma', lessons: '12', weeks: '3' },
      { moduleNumber: '4', title: 'Design Systems & Interactive Prototypes', lessons: '8', weeks: '4' },
    ],
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'JOIN_CLASS' | 'UPCOMING';

interface HomeScreenProps {
  onOpenNotifications?: () => void;
}

export default function HomeScreen({ onOpenNotifications }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('JOIN_CLASS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [isViewingRecordings, setIsViewingRecordings] = useState(false);

  if (isViewingRecordings) {
    return (
      <ClassRecordingsScreen
        onBack={() => setIsViewingRecordings(false)}
      />
    );
  }

  if (isExploring) {
    return (
      <ExploreCourses
        coursesList={exploreCoursesList}
        onBack={() => setIsExploring(false)}
        onSelectCourse={(courseKey: string) => {
          setIsExploring(false);
          setSelectedCourse(coursesData[courseKey]);
        }}
      />
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  // Custom User Avatar Placeholder Component
  const InstructorAvatar = ({ name, courseKey }: { name: string, courseKey?: string }) => {
    const emoji = courseKey ? coursesData[courseKey]?.teacher?.emoji : null;
    if (emoji) {
      return (
        <View style={styles.avatar}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
      );
    }
    // Generate initials
    const initials = name.split(' ').map(n => n[0]).join('');
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <View style={{ width: '100%', maxWidth: Platform.OS === 'web' ? 800 : undefined, alignSelf: 'center' }}>
          <View style={styles.logoRow}>
            <View>
              <Text style={styles.logoText}>
                NE<Text style={styles.logoTextGold}>X</Text>US
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setIsViewingRecordings(true)}
              >
                <View style={{ justifyContent: 'center', alignItems: 'center', width: 22, height: 22 }}>
                  <Ionicons name="videocam" size={22} color="#FFF" />
                  <View style={{ position: 'absolute', left: 6, top: 6 }}>
                    <Ionicons name="play" size={9} color="#7B2CBF" />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={onOpenNotifications}>
                <Ionicons name="notifications-outline" size={22} color="#FFF" />
                <View style={styles.badgeDot} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 3. WELCOME CARD */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeaderRow}>
            <Text style={[styles.welcomeTitle, { fontSize: 18, fontWeight: 'bold', fontFamily: undefined }]}>Master Skills, Achieve More</Text>
          </View>
          <Text style={[styles.welcomeSubtitle, { fontSize: 11, lineHeight: 16 }]}>Access live classes, study materials, assignments, and recorded sessions —all in one seamless learning platform designed to help you stay ahead.</Text>

          <View style={styles.statsRow}>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Courses Enrolled</Text>
              <Text style={styles.statsValue}>3</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Hours Learned</Text>
              <Text style={styles.statsValue}>24</Text>
            </View>
          </View>
        </View>

        {/* 4. TAB TOGGLE BUTTONS */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'JOIN_CLASS' && styles.toggleTabActive]}
            onPress={() => setActiveTab('JOIN_CLASS')}
          >
            <Ionicons
              name="videocam-outline"
              size={18}
              color={activeTab === 'JOIN_CLASS' ? '#FFF' : '#4B5563'}
              style={styles.tabIcon}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.toggleTabText, activeTab === 'JOIN_CLASS' && styles.toggleTabTextActive]}>
                Join Class
              </Text>
              {activeTab === 'JOIN_CLASS' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'UPCOMING' && styles.toggleTabActive]}
            onPress={() => setActiveTab('UPCOMING')}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={activeTab === 'UPCOMING' ? '#FFF' : '#4B5563'}
              style={styles.tabIcon}
            />
            <Text style={[styles.toggleTabText, activeTab === 'UPCOMING' && styles.toggleTabTextActive]}>
              Upcoming
            </Text>
            {activeTab === 'UPCOMING' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* 5. DYNAMIC CLASSES VIEW */}
        {activeTab === 'JOIN_CLASS' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join Classes</Text>

            {/* Live Class Card */}
            <TouchableOpacity
              style={[styles.classCard, { padding: 0, overflow: 'hidden' }]}
              onPress={() => setSelectedCourse(coursesData['Data Science & Machine Learning'])}
              activeOpacity={0.8}
            >
              {/* Purple Header */}
              <View style={{ backgroundColor: '#7B2CBF', padding: 20 }}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.classTitle, { color: '#FFFFFF' }]}>Data Science & Machine Learning</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>● LIVE</Text>
                  </View>
                </View>

                <View style={styles.classTimeRow}>
                  <Ionicons name="time-outline" size={16} color="#E9D5FF" />
                  <Text style={[styles.classTimeText, { color: '#E9D5FF' }]}>Tue, Thu, Sat - 8:00 PM</Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                {/* Instructor */}
                <View style={styles.instructorRow}>
                  <InstructorAvatar name="Priya Sharma" courseKey="Data Science & Machine Learning" />
                  <View>
                    <Text style={styles.instructorLabel}>Instructor</Text>
                    <Text style={styles.instructorName}>Priya Sharma</Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={[styles.progressValue, { color: '#7B2CBF' }]}>8/50 Classes</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '16%', backgroundColor: '#FFB703' }]} />
                  </View>
                </View>

                {/* Footer */}
                <View style={[styles.rowBetween, styles.cardFooter, { marginTop: 16 }]}>
                  <View style={styles.classTimeRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.liveNowText}>Live Now</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.joinNowButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => setSelectedCourse(coursesData['Data Science & Machine Learning'])}
                  >
                    <Ionicons name="play" size={14} color="#FFF" style={styles.playIcon} />
                    <Text style={styles.joinNowText}>Join Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Classes</Text>

            {/* Upcoming Class Card 1 */}
            <TouchableOpacity
              style={styles.classCard}
              onPress={() => setSelectedCourse(coursesData['Full Stack Web Development'])}
              activeOpacity={0.8}
            >
              <Text style={styles.classTitle}>Full Stack Web Development</Text>

              <View style={styles.classTimeRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.classTimeText}>Mon, Wed, Fri - 7:00 PM</Text>
              </View>

              <View style={styles.instructorRow}>
                <InstructorAvatar name="Rajesh Kumar" />
                <View>
                  <Text style={styles.instructorLabel}>Instructor</Text>
                  <Text style={styles.instructorName}>Rajesh Kumar</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Upcoming Class Card 2 */}
            <TouchableOpacity
              style={[styles.classCard, styles.marginTop12]}
              onPress={() => setSelectedCourse(coursesData['UI/UX Design Mastery'])}
              activeOpacity={0.8}
            >
              <Text style={styles.classTitle}>UI/UX Design Mastery</Text>

              <View style={styles.classTimeRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.classTimeText}>Mon, Wed, Fri - 7:00 PM</Text>
              </View>

              <View style={styles.instructorRow}>
                <InstructorAvatar name="Rajesh Kumar" />
                <View>
                  <Text style={styles.instructorLabel}>Instructor</Text>
                  <Text style={styles.instructorName}>Rajesh Kumar</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. TRENDING COURSES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Trending Courses</Text>

          {activeTab === 'JOIN_CLASS' ? (
            <>
              {/* Java Card */}
              <TouchableOpacity
                style={styles.trendingCard}
                onPress={() => setSelectedCourse(coursesData['Java Full Stack'])}
              >
                <View style={styles.trendingTextCol}>
                  <View style={styles.trendingBadge}>
                    <Text style={styles.trendingBadgeText}>TRENDING</Text>
                  </View>
                  <Text style={styles.trendingCardTitle}>Java Full Stack</Text>
                  <View style={styles.trendingStatsRow}>
                    <Ionicons name="people-outline" size={14} color="#E9D5FF" />
                    <Text style={styles.trendingStatsText}>2.5k</Text>
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.marginLeft8} />
                    <Text style={styles.trendingStatsText}>4.9</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward-outline" size={20} color="#FFF" />
              </TouchableOpacity>

              {/* Node Card */}
              <TouchableOpacity
                style={[styles.trendingCard, styles.marginTop12]}
                onPress={() => setSelectedCourse(coursesData['Node js for AI'])}
              >
                <View style={styles.trendingTextCol}>
                  <View style={styles.trendingBadge}>
                    <Text style={styles.trendingBadgeText}>TRENDING</Text>
                  </View>
                  <Text style={styles.trendingCardTitle}>Node js for AI</Text>
                  <View style={styles.trendingStatsRow}>
                    <Ionicons name="people-outline" size={14} color="#E9D5FF" />
                    <Text style={styles.trendingStatsText}>3.2k</Text>
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.marginLeft8} />
                    <Text style={styles.trendingStatsText}>4.8</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* React Native Card */}
              <TouchableOpacity
                style={styles.trendingCard}
                onPress={() => setSelectedCourse(coursesData['React Native Bootcamp'])}
              >
                <View style={styles.trendingTextCol}>
                  <View style={styles.trendingBadge}>
                    <Text style={styles.trendingBadgeText}>TRENDING</Text>
                  </View>
                  <Text style={styles.trendingCardTitle}>React Native Bootcamp</Text>
                  <View style={styles.trendingStatsRow}>
                    <Ionicons name="people-outline" size={14} color="#E9D5FF" />
                    <Text style={styles.trendingStatsText}>2.5k</Text>
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.marginLeft8} />
                    <Text style={styles.trendingStatsText}>4.9</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward-outline" size={20} color="#FFF" />
              </TouchableOpacity>

              {/* Python Card */}
              <TouchableOpacity
                style={[styles.trendingCard, styles.marginTop12]}
                onPress={() => setSelectedCourse(coursesData['Python for AI'])}
              >
                <View style={styles.trendingTextCol}>
                  <View style={styles.trendingBadge}>
                    <Text style={styles.trendingBadgeText}>TRENDING</Text>
                  </View>
                  <Text style={styles.trendingCardTitle}>Python for AI</Text>
                  <View style={styles.trendingStatsRow}>
                    <Ionicons name="people-outline" size={14} color="#E9D5FF" />
                    <Text style={styles.trendingStatsText}>3.2k</Text>
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.marginLeft8} />
                    <Text style={styles.trendingStatsText}>4.8</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7B2CBF', // Rich purple header background
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light content background
  },
  scrollContent: {
    padding: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
  },
  bottomSpacer: {
    height: 100, // Safe padding for bottom tabs
  },
  // Header
  header: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoTextGold: {
    color: '#FFB703',
  },
  logoSubtext: {
    fontSize: 7.5,
    color: '#FFB703',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  // Search
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFB703', // Orange/Gold action button
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Welcome Card
  welcomeCard: {
    backgroundColor: '#7B2CBF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFFFFF',
  },
  welcomeLogoText: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  welcomeLogoTextGold: {
    color: '#FFB703',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E9D5FF',
    marginTop: 4,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsBox: {
    flex: 0.48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
  },
  statsLabel: {
    fontSize: 14,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  // Toggle Tab Bar
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    position: 'relative',
  },
  toggleTabActive: {
    backgroundColor: '#7B2CBF',
  },
  tabIcon: {
    marginRight: 6,
  },
  toggleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  toggleTabTextActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  // Class Cards
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  marginTop12: {
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  classTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 22,
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  classTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  classTimeText: {
    fontSize: 13,
    color: '#6B7280',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructorLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  instructorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  // Progress bar
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7B2CBF',
    borderRadius: 3,
  },
  // Card Footer
  cardFooter: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  liveNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  joinNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  playIcon: {
    marginTop: 1,
  },
  joinNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Trending Courses
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7B2CBF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingTextCol: {
    flex: 1,
  },
  trendingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  trendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  trendingCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  trendingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingStatsText: {
    fontSize: 12,
    color: '#E9D5FF',
    marginLeft: 4,
    fontWeight: '500',
  },
  marginLeft8: {
    marginLeft: 8,
  },
});
