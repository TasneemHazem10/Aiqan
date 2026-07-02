import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

// Initialize notification handler early
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Keep splash visible while loading fonts
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
  });

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'friday') {
        // Notification tap handled by deep linking if needed
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  function InnerApp() {
    const { activeColors, theme } = useApp();
    return (
      <>
        <StatusBar
          barStyle={theme === 'dark' || theme === 'amoled' ? 'light-content' : 'dark-content'}
          backgroundColor={activeColors?.bg || '#FFFFFF'}
        />
        <AppNavigator />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <InnerApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}
