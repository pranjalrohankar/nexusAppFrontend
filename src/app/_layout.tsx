import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/common/animated-icon';
import AppTabs from '@/components/layout/app-tabs';
import AuthFlow from '@/screens/auth/auth-flow';
import { loadToken } from '@/services/api';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => { loadToken(); }, []);

  console.log("ThemeProvider is:", ThemeProvider);
  console.log("AuthFlow is:", AuthFlow);
  console.log("AnimatedSplashOverlay is:", AnimatedSplashOverlay);
  console.log("AppTabs is:", AppTabs);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isAuthenticated ? (
        <>
          <AnimatedSplashOverlay />
          <AppTabs userRole={userRole} userName={userName} userEmail={userEmail} onLogout={() => setIsAuthenticated(false)} />
        </>
      ) : (
        <AuthFlow onSignIn={(role, name, email) => {
          setUserRole(role);
          setUserName(name);
          setUserEmail(email);
          setIsAuthenticated(true);
        }} />
      )}
    </ThemeProvider>
  );
}
