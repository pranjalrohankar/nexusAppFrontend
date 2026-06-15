import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/common/animated-icon';
import AppTabs from '@/components/layout/app-tabs';
import AuthFlow from '@/screens/auth/auth-flow';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin'>('student');

  console.log("ThemeProvider is:", ThemeProvider);
  console.log("AuthFlow is:", AuthFlow);
  console.log("AnimatedSplashOverlay is:", AnimatedSplashOverlay);
  console.log("AppTabs is:", AppTabs);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isAuthenticated ? (
        <>
          <AnimatedSplashOverlay />
          <AppTabs userRole={userRole} onLogout={() => setIsAuthenticated(false)} />
        </>
      ) : (
        <AuthFlow onSignIn={(role) => {
          setUserRole(role);
          setIsAuthenticated(true);
        }} />
      )}
    </ThemeProvider>
  );
}
