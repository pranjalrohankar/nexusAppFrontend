import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
StyleSheet,
Text,
View,
TextInput,
TouchableOpacity,
ScrollView,
KeyboardAvoidingView,
Platform,
Animated,
StatusBar,
Alert,
ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, setToken } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ScreenType = 'LOGO' | 'SPLASH' | 'SIGN_IN' | 'SIGN_UP';

interface AuthFlowProps {
onSignIn: (role: 'student' | 'teacher' | 'admin', name: string, email: string, userId?: number, lastLogin?: string) => void;
}

export default function AuthFlow({ onSignIn }: AuthFlowProps) {
const [screen, setScreen] = useState<ScreenType>('LOGO');
const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin'>('student');

// Sign In Form States
const [signInEmail, setSignInEmail] = useState('');
const [signInPassword, setSignInPassword] = useState('');
const [signInShowPassword, setSignInShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false);

// Sign Up Form States
const [signUpName, setSignUpName] = useState('');
const [signUpEmail, setSignUpEmail] = useState('');
const [signUpPhone, setSignUpPhone] = useState('');
const [signUpMessage, setSignUpMessage] = useState('');
const [signUpCourse, setSignUpCourse] = useState('');
const [signUpSource, setSignUpSource] = useState('');
const [showSourceModal, setShowSourceModal] = useState(false);
const [showCourseModal, setShowCourseModal] = useState(false);
const [courses, setCourses] = useState<string[]>([]);
const [agreeTerms, setAgreeTerms] = useState(false);
const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
const [showSourceDrop, setShowSourceDrop] = useState(false);
const [showCourseDrop, setShowCourseDrop] = useState(false);
const toastAnim = useRef(new Animated.Value(0)).current;

const showToast = (msg: string, type: 'error' | 'success') => {
  setToast({ msg, type });
  toastAnim.setValue(0);
  Animated.sequence([
    Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    Animated.delay(2500),
    Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
  ]).start(() => setToast(null));
};

useEffect(() => {
  api.getAllCourses()
    .then((res: any) => {
      if (Array.isArray(res?.data)) {
        setCourses(res.data.map((c: any) => c.title));
      }
    })
    .catch(() => {});
}, []);

// Animation values
const fadeAnim = useRef(new Animated.Value(1)).current;
const contentTranslateY = useRef(new Animated.Value((Platform.OS as string) === 'web' ? 0 : 30)).current;

// Screen transition handler
const transitionTo = useCallback((nextScreen: ScreenType) => {
if ((Platform.OS as string) === 'web') {
setScreen(nextScreen);
fadeAnim.setValue(1);
contentTranslateY.setValue(0);
return;
}

Animated.timing(fadeAnim, {
toValue: 0,
duration: 300,
useNativeDriver: (Platform.OS as string) !== 'web',
}).start(() => {
setScreen(nextScreen);
// Reset animations
contentTranslateY.setValue(30);
Animated.parallel([
Animated.timing(fadeAnim, {
toValue: 1,
duration: 400,
useNativeDriver: (Platform.OS as string) !== 'web',
}),
Animated.timing(contentTranslateY, {
toValue: 0,
duration: 500,
useNativeDriver: (Platform.OS as string) !== 'web',
}),
]).start();
});
}, [fadeAnim, contentTranslateY]);

// Auto transition for LOGO and SPLASH
useEffect(() => {
if (screen === 'LOGO') {
const timer = setTimeout(() => {
transitionTo('SPLASH');
}, 1500);
return () => clearTimeout(timer);
} else if (screen === 'SPLASH') {
const timer = setTimeout(() => {
transitionTo('SIGN_IN');
}, 1800);
return () => clearTimeout(timer);
}
}, [screen, transitionTo]);

const [loading, setLoading] = useState(false);

// Handle SignIn action
  const handleSignInSubmit = async () => {
    const email = signInEmail.trim();
    const password = signInPassword.trim();

    if (!email || !password) {
      showToast('Please enter email and password.', 'error');
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      // Get or create a persistent device fingerprint
      let deviceFingerprint: string | null = null;
      try {
        const DEVICE_ID_KEY = 'nexus_device_id';
        let stored = Platform.OS === 'web'
          ? localStorage.getItem(DEVICE_ID_KEY)
          : await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!stored) {
          stored = 'dev-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
          if (Platform.OS === 'web') localStorage.setItem(DEVICE_ID_KEY, stored);
          else await AsyncStorage.setItem(DEVICE_ID_KEY, stored);
        }
        deviceFingerprint = stored;
      } catch {}
      const res = await api.login(email, password, selectedRole, deviceFingerprint ?? undefined);
      if (res.success) {
        setToken(res.data.token);
        onSignIn(selectedRole, res.data.name ?? '', res.data.email ?? '', res.data.userId, res.data.lastLogin);
      } else {
        const errorMsg = res.message || 'Invalid credentials';
        showToast(errorMsg, 'error');
        Alert.alert('Login Failed', errorMsg);
      }
    } catch {
      showToast('Could not connect to server.', 'error');
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

// Handle SignUp action (enquiry only, no login)
const handleSignUpSubmit = async () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;
  const errors: Record<string, boolean> = {};

  if (!signUpName.trim()) errors.name = true;
  if (!signUpEmail.trim()) errors.email = true;
  else if (!emailRegex.test(signUpEmail.trim())) errors.emailInvalid = true;
  if (!signUpPhone.trim()) errors.phone = true;
  else if (signUpPhone.length !== 10) errors.phoneInvalid = true;
  if (!signUpMessage.trim()) errors.message = true;
  if (!signUpSource) errors.source = true;
  if (!signUpCourse) errors.course = true;
  if (!agreeTerms) errors.terms = true;

  setFieldErrors(errors);

  if (errors.name) { showToast('Full name is required', 'error'); return; }
  if (errors.email) { showToast('Email address is required', 'error'); return; }
  if (errors.emailInvalid) { showToast('Please enter a valid email address', 'error'); return; }
  if (errors.phone) { showToast('Phone number is required', 'error'); return; }
  if (errors.phoneInvalid) { showToast('Please enter a valid 10-digit phone number', 'error'); return; }
  if (errors.message) { showToast('Please write a message', 'error'); return; }
  if (errors.source) { showToast('Please select how you heard about us', 'error'); return; }
  if (errors.course) { showToast('Please select a course', 'error'); return; }
  if (errors.terms) { showToast('Please accept Terms & Conditions', 'error'); return; }

  try {
    await api.submitEnquiry({
      fullName: signUpName.trim(),
      email: signUpEmail.trim(),
      phoneNumber: signUpPhone.trim(),
      message: signUpMessage.trim(),
      course: signUpCourse,
      source: signUpSource,
      termsAccepted: agreeTerms,
    });
    showToast('Enquiry submitted! We will contact you soon.', 'success');
    setTimeout(() => transitionTo('SIGN_IN'), 2000);
  } catch {
    showToast('Could not submit enquiry. Please try again.', 'error');
  }
};

// Custom Logo Component
const Logo = ({ size = 'large' }: { size?: 'small' | 'large' }) => {
const isSmall = size === 'small';
return (
<View style={[styles.logoContainer, isSmall && styles.logoContainerSmall]}>
<Text style={[styles.logoText, isSmall && styles.logoTextSmall]}>
NE<Text style={styles.logoTextGold}>X</Text>US
</Text>
<Text style={[styles.logoSubtext, isSmall && styles.logoSubtextSmall]}>
{selectedRole === 'teacher' ? 'TEACHER PORTAL' : selectedRole === 'admin' ? 'ADMIN CONSOLE' : 'CORPORATE TRAINING CENTER LLP'}
</Text>
</View>
);
};

return (
<KeyboardAvoidingView
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
style={styles.keyboardContainer}
>
<StatusBar barStyle="light-content" backgroundColor="#7B2CBF" />
<View style={styles.container}>

{/* LOGO SCREEN (Solid Purple) */}
{screen === 'LOGO' && (
<Animated.View style={[styles.fullscreenCenter, { opacity: fadeAnim }]}>
{/* Just solid color, transition automatically */}
</Animated.View>
)}

{/* SPLASH SCREEN (Purple + Logo) */}
{screen === 'SPLASH' && (
<Animated.View style={[styles.fullscreenCenter, { opacity: fadeAnim }]}>
<Logo size="large" />
</Animated.View>
)}

{/* SIGN IN SCREEN */}
{screen === 'SIGN_IN' && (
<Animated.View style={[styles.scrollContainer, { opacity: fadeAnim }]}>
<ScrollView
contentContainerStyle={styles.scrollContent}
keyboardShouldPersistTaps="handled"
showsVerticalScrollIndicator={false}
>
<View style={styles.headerSpacer} />

<Logo size="small" />

<Animated.View
style={[
styles.card,
{ transform: [{ translateY: contentTranslateY }] }
]}
>
{/* Form Container */}
<View style={styles.formContainer}>

{/* Form Header */}
<View style={styles.cardHeader}>
<View style={styles.signInBadgeCircle}>
<Ionicons
name={
selectedRole === 'student'
? 'school-outline'
: selectedRole === 'teacher'
? 'briefcase-outline'
: 'shield-checkmark-outline'
}
size={20}
color="#7B2CBF"
/>
</View>
<Text style={styles.cardTitle}>
{selectedRole === 'teacher' ? 'Teacher Sign In' : selectedRole === 'admin' ? 'Admin Sign In' : 'Student Sign In'}
</Text>
<Text style={styles.cardSubtitle}>Welcome back! Please sign in to continue.</Text>
</View>

{/* Role Selector Container */}
<View style={styles.roleSelectorContainer}>
<Text style={styles.roleSelectorLabel}>I am signing in as:</Text>
<View style={styles.roleSelectorPills}>
{(['student', 'teacher', 'admin'] as const).map((role) => {
const isActive = selectedRole === role;
return (
<TouchableOpacity
key={role}
style={[
styles.rolePill,
isActive && styles.rolePillActive
]}
onPress={() => setSelectedRole(role)}
>
<Ionicons
name={
role === 'student'
? 'school-outline'
: role === 'teacher'
? 'briefcase-outline'
: 'shield-checkmark-outline'
}
size={14}
color={isActive ? '#FFFFFF' : '#6B7280'}
/>
<Text style={[
styles.rolePillText,
isActive && styles.rolePillTextActive
]}>
{role.charAt(0).toUpperCase() + role.slice(1)}
</Text>
</TouchableOpacity>
);
})}
</View>
</View>

{/* Email Input */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Email Address</Text>
<View style={styles.inputWrapper}>
<Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
<TextInput
style={styles.input}
placeholder="your@email.com"
placeholderTextColor="#9CA3AF"
keyboardType="email-address"
autoCapitalize="none"
value={signInEmail}
onChangeText={setSignInEmail}
/>
</View>
</View>

{/* Password Input */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Password</Text>
<View style={styles.inputWrapper}>
<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
<TextInput
style={styles.input}
placeholder="••••••••"
placeholderTextColor="#9CA3AF"
secureTextEntry={!signInShowPassword}
value={signInPassword}
onChangeText={setSignInPassword}
/>
<TouchableOpacity
onPress={() => setSignInShowPassword(!signInShowPassword)}
style={styles.eyeIcon}
>
<Ionicons
name={signInShowPassword ? "eye-off-outline" : "eye-outline"}
size={20}
color="#9CA3AF"
/>
</TouchableOpacity>
</View>
</View>

{/* Remember Me & Forgot Password */}
<View style={styles.rowBetween}>
<TouchableOpacity
style={styles.checkboxRow}
onPress={() => setRememberMe(!rememberMe)}
>
<View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
{rememberMe && <Ionicons name="checkmark" size={12} color="#FFF" />}
</View>
<Text style={styles.checkboxLabel}>Remember me</Text>
</TouchableOpacity>
<TouchableOpacity>
<Text style={styles.forgotPasswordText}>Forgot Password?</Text>
</TouchableOpacity>
</View>

{/* Sign In Button */}
<TouchableOpacity
style={styles.primaryButton}
onPress={handleSignInSubmit}
disabled={loading}
>
{loading
? <ActivityIndicator color="#FFF" />
: <Text style={styles.primaryButtonText}>Sign In</Text>}
</TouchableOpacity>

{/* Footer */}
<View style={styles.footerRow}>
<Text style={styles.footerText}>
Want to start learning?{' '}
<Text
style={styles.footerLinkText}
onPress={() => transitionTo('SIGN_UP')}
>
Enquiry Form
</Text>
</Text>
</View>

</View>
</Animated.View>

{/* Demo Credentials Box */}
<View style={styles.demoBox}>
<Ionicons name="information-circle-outline" size={14} color="#FFB703" />
<Text style={styles.demoBoxText}>
{selectedRole === 'teacher'
? 'Demo: priya.sharma@nexus.com / teacher123'
: selectedRole === 'admin'
? 'Demo: admin@nexus.com / admin123'
: 'Demo: student@nexus.com / student123'}
</Text>
</View>

<View style={styles.footerSpacer} />
</ScrollView>
</Animated.View>
)}

{/* SIGN UP SCREEN */}
{screen === 'SIGN_UP' && (
<Animated.View style={[styles.scrollContainer, { opacity: fadeAnim }]}>
<ScrollView
contentContainerStyle={styles.scrollContent}
keyboardShouldPersistTaps="handled"
showsVerticalScrollIndicator={false}
>
<View style={styles.headerSpacer} />
<Logo size="small" />

<Animated.View style={[styles.card, { transform: [{ translateY: contentTranslateY }] }]}>

{/* TOAST — inside card, above title */}
{toast && (
  <Animated.View style={[styles.toastBox, toast.type === 'success' ? styles.toastSuccess : styles.toastError, { opacity: toastAnim }]}>
    <Ionicons name={toast.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={16} color="#FFF" />
    <Text style={styles.toastText}>{toast.msg}</Text>
  </Animated.View>
)}

<View style={styles.cardHeader}>
<Text style={styles.cardTitle}>Enquiry Form</Text>
<Text style={styles.cardSubtitle}>Start your learning journey today</Text>
</View>

<View style={styles.formContainer}>

{/* Full Name */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Full Name <Text style={styles.required}>*</Text></Text>
<View style={[styles.inputWrapper, fieldErrors.name && styles.inputError]}>
<Ionicons name="person-outline" size={20} color={fieldErrors.name ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
<TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#9CA3AF" value={signUpName} onChangeText={v => { setSignUpName(v); setFieldErrors(p => ({ ...p, name: false })); }} />
</View>
</View>

{/* Email */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Email Address <Text style={styles.required}>*</Text></Text>
<View style={[styles.inputWrapper, (fieldErrors.email || fieldErrors.emailInvalid) && styles.inputError]}>
<Ionicons name="mail-outline" size={20} color={(fieldErrors.email || fieldErrors.emailInvalid) ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
<TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={signUpEmail} onChangeText={v => { setSignUpEmail(v); setFieldErrors(p => ({ ...p, email: false, emailInvalid: false })); }} />
</View>
</View>

{/* Phone */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Phone Number <Text style={styles.required}>*</Text></Text>
<View style={[styles.inputWrapper, (fieldErrors.phone || fieldErrors.phoneInvalid) && styles.inputError]}>
<Ionicons name="call-outline" size={20} color={(fieldErrors.phone || fieldErrors.phoneInvalid) ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
<TextInput style={styles.input} placeholder="9876543210" placeholderTextColor="#9CA3AF" keyboardType="number-pad" maxLength={10} value={signUpPhone} onChangeText={v => { setSignUpPhone(v.replace(/\D/g, '')); setFieldErrors(p => ({ ...p, phone: false, phoneInvalid: false })); }} />
</View>
</View>

{/* Message */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Message <Text style={styles.required}>*</Text></Text>
<View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start', paddingVertical: 12 }, fieldErrors.message && styles.inputError]}>
<TextInput style={[styles.input, { height: 56, textAlignVertical: 'top' }]} placeholder="Write your message..." placeholderTextColor="#9CA3AF" multiline value={signUpMessage} onChangeText={v => { setSignUpMessage(v); setFieldErrors(p => ({ ...p, message: false })); }} />
</View>
</View>

{/* Source inline dropdown */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>How did you know about us? <Text style={styles.required}>*</Text></Text>
<TouchableOpacity style={[styles.inputWrapper, fieldErrors.source && styles.inputError]} activeOpacity={0.8} onPress={() => { setShowSourceDrop(p => !p); setShowCourseDrop(false); }}>
<Ionicons name={signUpSource === 'whatsapp' ? 'logo-whatsapp' : signUpSource === 'referral' ? 'people-outline' : 'globe-outline'} size={20} color={fieldErrors.source ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
<Text style={[styles.courseText, !signUpSource && styles.placeholderText]}>{signUpSource ? signUpSource.charAt(0).toUpperCase() + signUpSource.slice(1) : 'Select Source'}</Text>
<Ionicons name={showSourceDrop ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#9CA3AF" />
</TouchableOpacity>
{showSourceDrop && (
  <View style={styles.inlineDrop}>
    {['website', 'whatsapp', 'referral'].map(src => (
      <TouchableOpacity key={src} style={[styles.dropItem, signUpSource === src && styles.dropItemActive]} onPress={() => { setSignUpSource(src); setShowSourceDrop(false); setFieldErrors(p => ({ ...p, source: false })); }}>
        <Ionicons name={src === 'whatsapp' ? 'logo-whatsapp' : src === 'referral' ? 'people-outline' : 'globe-outline'} size={16} color={signUpSource === src ? '#7B2CBF' : '#6B7280'} />
        <Text style={[styles.dropItemText, signUpSource === src && styles.dropItemTextActive]}>{src.charAt(0).toUpperCase() + src.slice(1)}</Text>
        {signUpSource === src && <Ionicons name="checkmark" size={16} color="#7B2CBF" />}
      </TouchableOpacity>
    ))}
  </View>
)}
</View>

{/* Course inline dropdown */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Course <Text style={styles.required}>*</Text></Text>
<TouchableOpacity style={[styles.inputWrapper, fieldErrors.course && styles.inputError]} activeOpacity={0.8} onPress={() => { setShowCourseDrop(p => !p); setShowSourceDrop(false); }}>
<Ionicons name="book-outline" size={20} color={fieldErrors.course ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
<Text style={[styles.courseText, !signUpCourse && styles.placeholderText]} numberOfLines={1}>{signUpCourse || 'Select Course'}</Text>
<Ionicons name={showCourseDrop ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#9CA3AF" />
</TouchableOpacity>
{showCourseDrop && (
  <View style={[styles.inlineDrop, { maxHeight: 180 }]}>
    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
      {courses.map(course => (
        <TouchableOpacity key={course} style={[styles.dropItem, signUpCourse === course && styles.dropItemActive]} onPress={() => { setSignUpCourse(course); setShowCourseDrop(false); setFieldErrors(p => ({ ...p, course: false })); }}>
          <Text style={[styles.dropItemText, signUpCourse === course && styles.dropItemTextActive]} numberOfLines={1}>{course}</Text>
          {signUpCourse === course && <Ionicons name="checkmark" size={16} color="#7B2CBF" />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
</View>

{/* Terms */}
<TouchableOpacity style={[styles.checkboxRow, styles.alignItemsStart, { marginBottom: 4 }]} onPress={() => { setAgreeTerms(!agreeTerms); setFieldErrors(p => ({ ...p, terms: false })); }}>
<View style={[styles.checkbox, styles.checkboxMarginTop, agreeTerms && styles.checkboxChecked, fieldErrors.terms && styles.checkboxError]}>
{agreeTerms && <Ionicons name="checkmark" size={12} color="#FFF" />}
</View>
<Text style={styles.termsLabel}>I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text></Text>
</TouchableOpacity>

{/* Submit */}
<TouchableOpacity style={styles.primaryButton} onPress={handleSignUpSubmit}>
<Text style={styles.primaryButtonText}>Send Enquiry</Text>
</TouchableOpacity>

<View style={styles.footerRow}>
<Text style={styles.footerText}>Already have an account?{' '}
<Text style={styles.footerLinkText} onPress={() => transitionTo('SIGN_IN')}>Sign In</Text>
</Text>
</View>

</View>
</Animated.View>
<View style={styles.footerSpacer} />
</ScrollView>
</Animated.View>
)}

</View>
</KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
keyboardContainer: {
flex: 1,
},
container: {
flex: 1,
backgroundColor: '#7B2CBF', // Rich purple background
},
fullscreenCenter: {
flex: 1,
backgroundColor: '#7B2CBF',
justifyContent: 'center',
alignItems: 'center',
},
scrollContainer: {
flex: 1,
},
scrollContent: {
flexGrow: 1,
alignItems: 'center',
paddingHorizontal: 20,
width: '100%',
maxWidth: (Platform.OS as string) === 'web' ? 480 : undefined,
alignSelf: 'center',
},
headerSpacer: {
height: Platform.OS === 'ios' ? 60 : 40,
},
footerSpacer: {
height: 40,
},
// Logo Styles
logoContainer: {
alignItems: 'center',
marginVertical: 40,
},
logoContainerSmall: {
marginVertical: 20,
},
logoText: {
fontSize: 42,
fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
fontWeight: 'bold',
color: '#FFFFFF',
letterSpacing: 2,
},
logoTextSmall: {
fontSize: 32,
},
logoTextGold: {
color: '#FFB703', // Yellow/Gold
},
logoSubtext: {
fontSize: 11,
color: '#FFB703',
fontWeight: '600',
letterSpacing: 1,
marginTop: 6,
textAlign: 'center',
},
logoSubtextSmall: {
fontSize: 9,
marginTop: 4,
},
// Card Container
card: {
width: '100%',
maxWidth: (Platform.OS as string) === 'web' ? 480 : undefined,
alignSelf: 'center',
backgroundColor: '#FFFFFF',
borderRadius: 24,
paddingVertical: 30,
paddingHorizontal: 24,
shadowColor: '#000',
shadowOffset: { width: 0, height: 10 },
shadowOpacity: 0.15,
shadowRadius: 15,
elevation: 8,
},
cardHeader: {
alignItems: 'center',
marginBottom: 20,
},
cardTitle: {
fontSize: 24,
fontWeight: 'bold',
color: '#1F2937',
textAlign: 'center',
},
cardSubtitle: {
fontSize: 12,
color: '#6B7280',
marginTop: 6,
textAlign: 'center',
},
formContainer: {
width: '100%',
},
// Form elements
inputGroup: {
marginBottom: 16,
},
inputLabel: {
fontSize: 12,
fontWeight: '600',
color: '#374151',
marginBottom: 6,
},
inputWrapper: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#F9FAFB',
borderWidth: 1,
borderColor: '#E5E7EB',
borderRadius: 14,
height: 52,
paddingHorizontal: 16,
},
inputIcon: {
marginRight: 12,
},
input: {
flex: 1,
color: '#1F2937',
fontSize: 14,
height: '100%',
},
eyeIcon: {
padding: 4,
},
// Layout utilities
rowBetween: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginVertical: 8,
},
checkboxRow: {
flexDirection: 'row',
alignItems: 'center',
},
alignItemsStart: {
alignItems: 'flex-start',
},
checkbox: {
width: 20,
height: 20,
borderRadius: 6,
borderWidth: 1.5,
borderColor: '#D1D5DB',
backgroundColor: '#FFF',
justifyContent: 'center',
alignItems: 'center',
marginRight: 8,
},
checkboxChecked: {
backgroundColor: '#7B2CBF',
borderColor: '#7B2CBF',
},
checkboxMarginTop: {
marginTop: 2,
},
checkboxLabel: {
fontSize: 13,
color: '#4B5563',
},
forgotPasswordText: {
fontSize: 13,
color: '#7B2CBF',
fontWeight: '600',
},
termsLabel: {
flex: 1,
fontSize: 12,
color: '#4B5563',
lineHeight: 18,
},
termsLink: {
color: '#7B2CBF',
fontWeight: '600',
},
// Buttons
primaryButton: {
backgroundColor: '#7B2CBF',
borderRadius: 14,
height: 52,
justifyContent: 'center',
alignItems: 'center',
marginTop: 20,
shadowColor: '#7B2CBF',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.25,
shadowRadius: 5,
elevation: 4,
},
primaryButtonText: {
color: '#FFFFFF',
fontSize: 16,
fontWeight: '700',
},
// Divider
dividerContainer: {
flexDirection: 'row',
alignItems: 'center',
marginVertical: 24,
},
dividerLine: {
flex: 1,
height: 1,
backgroundColor: '#E5E7EB',
},
dividerText: {
fontSize: 12,
color: '#9CA3AF',
paddingHorizontal: 12,
},
// Social buttons
socialButton: {
flex: 0.47,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#FFF',
borderWidth: 1,
borderColor: '#E5E7EB',
borderRadius: 14,
height: 48,
gap: 8,
},
socialButtonText: {
fontSize: 13,
fontWeight: '600',
color: '#374151',
},
// Footer
footerRow: {
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
marginTop: 24,
},
footerText: {
fontSize: 13,
color: '#4B5563',
},
footerLinkText: {
fontSize: 13,
color: '#7B2CBF',
fontWeight: '700',
},
roleSelectorContainer: {
marginBottom: 20,
},
roleSelectorLabel: {
fontSize: 12,
fontWeight: '600',
color: '#374151',
marginBottom: 8,
},
roleSelectorPills: {
flexDirection: 'row',
backgroundColor: '#F3F4F6',
borderRadius: 14,
padding: 4,
gap: 4,
},
rolePill: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 6,
paddingVertical: 10,
borderRadius: 10,
},
rolePillActive: {
backgroundColor: '#7B2CBF',
},
rolePillText: {
fontSize: 12,
fontWeight: '600',
color: '#6B7280',
},
rolePillTextActive: {
color: '#FFFFFF',
fontWeight: 'bold',
},
signInBadgeCircle: {
width: 44,
height: 44,
borderRadius: 22,
backgroundColor: '#F3E8FF',
justifyContent: 'center',
alignItems: 'center',
marginBottom: 10,
alignSelf: 'center',
},
demoBox: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 6,
marginTop: 20,
backgroundColor: 'rgba(255, 255, 255, 0.15)',
paddingVertical: 10,
paddingHorizontal: 16,
borderRadius: 12,
borderWidth: 1,
borderColor: 'rgba(255, 255, 255, 0.2)',
alignSelf: 'center',
},
demoBoxText: {
color: '#E9D5FF',
fontSize: 12,
fontWeight: '500',
},

// MOdal / Dropdown
courseText: {
flex: 1,
fontSize: 14,
color: '#1F2937',
},
placeholderText: {
color: '#9CA3AF',
},
required: {
color: '#EF4444',
},
inputError: {
borderColor: '#EF4444',
borderWidth: 1.5,
backgroundColor: '#FFF5F5',
},
checkboxError: {
borderColor: '#EF4444',
},
inlineDrop: {
backgroundColor: '#FFF',
borderWidth: 1,
borderColor: '#E5E7EB',
borderRadius: 12,
marginTop: 4,
overflow: 'hidden',
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 6,
elevation: 4,
},
dropItem: {
flexDirection: 'row',
alignItems: 'center',
gap: 10,
paddingVertical: 13,
paddingHorizontal: 16,
borderBottomWidth: 1,
borderBottomColor: '#F3F4F6',
},
dropItemActive: {
backgroundColor: '#F3E8FF',
},
dropItemText: {
flex: 1,
fontSize: 14,
color: '#374151',
},
dropItemTextActive: {
color: '#7B2CBF',
fontWeight: '600',
},
toastBox: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
borderRadius: 12,
paddingVertical: 12,
paddingHorizontal: 16,
marginBottom: 16,
},
toast: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
width: '100%',
borderRadius: 12,
paddingVertical: 12,
paddingHorizontal: 16,
marginBottom: 12,
},
toastSuccess: {
backgroundColor: '#10B981',
},
toastError: {
backgroundColor: '#EF4444',
},
toastText: {
flex: 1,
color: '#FFF',
fontSize: 13,
fontWeight: '600',
},
});