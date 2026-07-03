import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
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
    Inter_400Regular: require('./assets/fonts/Inter_400Regular.ttf'),
    Inter_500Medium: require('./assets/fonts/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('./assets/fonts/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('./assets/fonts/Inter_700Bold.ttf'),
    PlayfairDisplay_700Bold: require('./assets/fonts/PlayfairDisplay_700Bold.ttf'),
    PlayfairDisplay_700Bold_Italic: require('./assets/fonts/PlayfairDisplay_700Bold_Italic.ttf'),
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
