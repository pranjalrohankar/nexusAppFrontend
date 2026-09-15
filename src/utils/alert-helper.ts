import { Alert, Platform } from 'react-native';

/**
 * Displays an explicit popup error alert explaining why an action (such as saving a form) failed.
 * Works seamlessly across React Native Web (via window.alert) and iOS/Android (via Alert.alert).
 */
export const showFormErrorPopup = (title: string, message: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};
