import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/common/animated-icon';
import AppTabs from '@/components/layout/app-tabs';
import AuthFlow from '@/screens/auth/auth-flow';
import { api, clearToken, loadToken } from '@/services/api';

// ── Change back to 30 * 60 * 1000 for production ──
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [lastLogin, setLastLogin] = useState('');

  const [isInitializing, setIsInitializing] = useState(true);

  // Global reset: eliminate default browser blue focus outline from all web inputs
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'nexus-remove-focus-ring';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input, textarea, select, [contenteditable="true"], [tabindex] {
            outline: none !important;
            outline-width: 0 !important;
            outline-style: none !important;
            outline-color: transparent !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus, [tabindex]:focus {
            outline: none !important;
            outline-width: 0 !important;
            outline-style: none !important;
            outline-color: transparent !important;
            box-shadow: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Session timeout refs
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  const sessionEnabledRef = useRef(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = loadToken();
        if (token) {
          const res = await api.getMe();
          const user = res?.data ?? res;
          if (res && res.success !== false && user && user.email && user.role) {
            const role = String(user.role).toLowerCase() as 'student' | 'teacher' | 'admin';
            setUserRole(role);
            setUserName(user.name || user.firstName || 'User');
            setUserEmail(user.email);
            setUserId(user.userId || user.id || null);
            setLastLogin(user.lastLogin || '');
            setIsAuthenticated(true);
            if (role === 'student') {
              api.setActivityStatus(true).catch(() => {});
            }
          } else {
            clearToken();
          }
        }
      } catch (err) {
        console.log('Session restore error or expired token:', err);
        clearToken();
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  const doLogout = useCallback(() => {
    clearToken();
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    setIsAuthenticated(false);
  }, []);

  const resetSessionTimer = useCallback(() => {
    if (!sessionEnabledRef.current) return;
    lastActiveRef.current = Date.now();
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(doLogout, SESSION_TIMEOUT_MS);
  }, [doLogout]);

  // Poll security settings every time user is authenticated + is admin
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin' || !userId) return;

    let cancelled = false;

    const checkSettings = () => {
      api.getSecuritySettings(userId)
        .then((res: any) => {
          if (cancelled) return;
          const enabled = res?.data?.sessionTimeout === true;
          const wasEnabled = sessionEnabledRef.current;
          sessionEnabledRef.current = enabled;

          if (enabled && !wasEnabled) {
            // Just turned on — start timer
            resetSessionTimer();
          } else if (!enabled && wasEnabled) {
            // Just turned off — clear timer
            if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
          }
        })
        .catch(() => {});
    };

    checkSettings();
    // Re-check every 30s so toggle changes take effect quickly
    const interval = setInterval(checkSettings, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated, userRole, userId, resetSessionTimer]);

  // AppState listener — handles app going to background/foreground
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        if (sessionEnabledRef.current) {
          const elapsed = Date.now() - lastActiveRef.current;
          if (elapsed >= SESSION_TIMEOUT_MS) {
            doLogout();
          } else {
            resetSessionTimer();
          }
        }
      } else {
        // App went to background — record time, clear JS timer (it won't fire in background)
        lastActiveRef.current = Date.now();
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated, doLogout, resetSessionTimer]);

  // Clean up timer on logout
  useEffect(() => {
    if (!isAuthenticated) {
      sessionEnabledRef.current = false;
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    }
  }, [isAuthenticated]);

  console.log("ThemeProvider is:", ThemeProvider);
  console.log("AuthFlow is:", AuthFlow);
  console.log("AnimatedSplashOverlay is:", AnimatedSplashOverlay);
  console.log("AppTabs is:", AppTabs);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isInitializing ? (
        <AnimatedSplashOverlay />
      ) : isAuthenticated ? (
        <>
          <AnimatedSplashOverlay />
          <AppTabs
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
            onLogout={doLogout}
            lastLogin={lastLogin}
          />
        </>
      ) : (
        <AuthFlow onSignIn={(role, name, email, id, loginTime) => {
          setUserRole(role);
          setUserName(name);
          setUserEmail(email);
          setUserId(id ?? null);
          setLastLogin(loginTime ?? '');
          setIsAuthenticated(true);
          // Mark student as online after login
          if (role === 'student') {
            setTimeout(() => api.setActivityStatus(true).catch(() => {}), 500);
          }
        }} />
      )}
    </ThemeProvider>
  );
}
