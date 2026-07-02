import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View, Text, StyleSheet, Platform, Animated, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useApp } from '../context/AppContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, TAB_BAR } from '../constants/theme';
import { MainTabParamList } from '../types';

import HomeScreen from '../screens/HomeScreen';
import QuranHomeScreen from '../screens/QuranHomeScreen';
import QuranBrowserScreen from '../screens/QuranBrowserScreen';
import QuranReaderScreen from '../screens/QuranReaderScreen';
import QuranPageReaderScreen from '../screens/QuranPageReaderScreen';
import MemorizationScreen from '../screens/MemorizationScreen';
import QuranSearchScreen from '../screens/QuranSearchScreen';
import PrayerScreen from '../screens/PrayerScreen';
import AzkarHomeScreen from '../screens/AzkarHomeScreen';
import RecitersScreen from '../screens/RecitersScreen';
import AzkarDetailScreen from '../screens/AzkarDetailScreen';
import DuaHomeScreen from '../screens/DuaHomeScreen';
import DuaDetailScreen from '../screens/DuaDetailScreen';
import MoreScreen from '../screens/MoreScreen';
import QiblaScreen from '../screens/QiblaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import VideoGeneratorScreen from '../screens/VideoGeneratorScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import HijriCalendarScreen from '../screens/HijriCalendarScreen';
import RamadanModeScreen from '../screens/RamadanModeScreen';
import FastingTrackerScreen from '../screens/FastingTrackerScreen';
import ZakatCalculatorScreen from '../screens/ZakatCalculatorScreen';
import HifzCoachScreen from '../screens/HifzCoachScreen';
import PerformanceAnalyticsScreen from '../screens/PerformanceAnalyticsScreen';
import AiAssistantScreen from '../screens/AiAssistantScreen';
import CloudBackupScreen from '../screens/CloudBackupScreen';
import FridayRemindersScreen from '../screens/FridayRemindersScreen';
import IslamicEventsScreen from '../screens/IslamicEventsScreen';
import TimedMemorizationScreen from '../screens/TimedMemorizationScreen';
import TravelSupportScreen from '../screens/TravelSupportScreen';
import AdhanCustomizationScreen from '../screens/AdhanCustomizationScreen';
import ColorPickerScreen from '../screens/ColorPickerScreen';
import VoiceRecordingScreen from '../screens/VoiceRecordingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const QuranStack = createNativeStackNavigator();
const AzkarStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const INITIAL_SCREENS: Record<string, string> = {
  Quran: 'QuranHome',
  Azkar: 'AzkarHome',
  More: 'MoreHome',
};

function tabPressListener(tabName: string) {
  return ({ navigation }: { navigation: any }) => ({
    tabPress: (e: any) => {
      e.preventDefault();
      navigation.navigate(tabName, { screen: INITIAL_SCREENS[tabName] });
    },
  });
}

type IoniconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Quran: { active: 'book', inactive: 'book-outline' },
  Prayer: { active: 'time', inactive: 'time-outline' },
  Azkar: { active: 'star', inactive: 'star-outline' },
  More: { active: 'grid', inactive: 'grid-outline' },
};

function QuranStackNav() {
  return (
    <QuranStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <QuranStack.Screen name="QuranHome" component={QuranHomeScreen} />
      <QuranStack.Screen name="SurahList" component={QuranBrowserScreen} />
      <QuranStack.Screen name="SurahReader" component={QuranReaderScreen} />
      <QuranStack.Screen name="QuranPageReader" component={QuranPageReaderScreen} />
      <QuranStack.Screen name="Memorization" component={MemorizationScreen} />
      <QuranStack.Screen name="QuranSearch" component={QuranSearchScreen} />
      <QuranStack.Screen name="Reciters" component={RecitersScreen} />
    </QuranStack.Navigator>
  );
}

function AzkarStackNav() {
  return (
    <AzkarStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AzkarStack.Screen name="AzkarHome" component={AzkarHomeScreen} />
      <AzkarStack.Screen name="AzkarDetail" component={AzkarDetailScreen} />
      <AzkarStack.Screen name="DuaHome" component={DuaHomeScreen} />
      <AzkarStack.Screen name="DuaDetail" component={DuaDetailScreen} />
    </AzkarStack.Navigator>
  );
}

function MoreStackNav() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <MoreStack.Screen name="MoreHome" component={MoreScreen} />
      <MoreStack.Screen name="HifzCoach" component={HifzCoachScreen} />
      <MoreStack.Screen name="Qibla" component={QiblaScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
      <MoreStack.Screen name="ColorPicker" component={ColorPickerScreen} />
      <MoreStack.Screen name="Progress" component={ProgressScreen} />
      <MoreStack.Screen name="VideoGenerator" component={VideoGeneratorScreen} />
      <MoreStack.Screen name="Downloads" component={DownloadsScreen} />
      <MoreStack.Screen name="HijriCalendar" component={HijriCalendarScreen} />
      <MoreStack.Screen name="RamadanMode" component={RamadanModeScreen} />
      <MoreStack.Screen name="FastingTracker" component={FastingTrackerScreen} />
      <MoreStack.Screen name="ZakatCalculator" component={ZakatCalculatorScreen} />
      <MoreStack.Screen name="FridayReminders" component={FridayRemindersScreen} />
      <MoreStack.Screen name="IslamicEvents" component={IslamicEventsScreen} />
      <MoreStack.Screen name="PerformanceAnalytics" component={PerformanceAnalyticsScreen} />
      <MoreStack.Screen name="AiAssistant" component={AiAssistantScreen} />
      <MoreStack.Screen name="CloudBackup" component={CloudBackupScreen} />
      <MoreStack.Screen name="TimedMemorization" component={TimedMemorizationScreen} />
      <MoreStack.Screen name="TravelSupport" component={TravelSupportScreen} />
      <MoreStack.Screen name="AdhanCustomization" component={AdhanCustomizationScreen} />
      <MoreStack.Screen name="VoiceRecorder" component={VoiceRecordingScreen} />
    </MoreStack.Navigator>
  );
}

export default function MainTabNavigator() {
  const { t, language, theme, setTheme, toggleLanguage, activeColors } = useApp();
  const insets = useSafeAreaInsets();
  const isRtl = language === 'ar';
  const isDark = theme === 'dark' || theme === 'amoled';

  const tabBarHeight = Platform.OS === 'ios' ? 56 + insets.bottom : 48 + Math.max(insets.bottom, 4);

  const styles = useThemedStyles((colors) => ({
    tabBar: {
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.tabBar,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: tabBarHeight,
      paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : Math.max(insets.bottom, 4),
      paddingTop: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.15 : 0.06,
      shadowRadius: 8,
      elevation: 6,
    },
    tabBarSolidBg: {
      backgroundColor: colors.tabBar,
    },
    tabActiveDot: {
      position: 'absolute',
      bottom: 0,
      width: 20,
      height: 2.5,
      borderRadius: 1.25,
    },
    tabLabel: {
      fontSize: TAB_BAR.labelSize,
      fontFamily: FONTS.bodyMed,
      fontWeight: '600',
      marginTop: 0,
      letterSpacing: 0.3,
    },
    langToggle: {
      position: 'absolute',
      bottom: tabBarHeight + 8,
      left: 24,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 6,
      elevation: 4,
      zIndex: 100,
    },
    themeToggle: {
      position: 'absolute',
      bottom: tabBarHeight + 8,
      left: 68,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 6,
      elevation: 4,
      zIndex: 100,
    },
    outerContainer: {
      flex: 1,
      backgroundColor: colors.bg,
    },
  }));

  function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
    const scale = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const dotOpacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      if (focused) {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.15, damping: 12, stiffness: 200, mass: 0.5, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: -3, damping: 14, stiffness: 180, mass: 0.5, useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 180, mass: 0.6, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 180, mass: 0.6, useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    }, [focused]);

    const icons = TAB_ICONS[name] || { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal-outline' };
    const iconName = focused ? icons.active : icons.inactive;

    return (
      <Animated.View style={{ transform: [{ scale }, { translateY }], alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Ionicons name={iconName} size={21} color={color} />
        <Animated.View style={[styles.tabActiveDot, { backgroundColor: color, opacity: dotOpacity }]} />
      </Animated.View>
    );
  }

  const tabLabels: Record<string, string> = {
    Home: isRtl ? 'الرئيسية' : 'Home',
    Quran: t('quran.title'),
    Prayer: t('prayer.title'),
    Azkar: t('azkar.title'),
    More: t('more.title'),
  };

  return (
    <View style={styles.outerContainer}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: activeColors.tabBarActive || activeColors.gold,
          tabBarInactiveTintColor: activeColors.tabBarInactive,
          tabBarLabelStyle: styles.tabLabel,
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView intensity={isDark ? 80 : 95} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.tabBarSolidBg]} />
            )
          ),
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused, color }) => <TabIcon name="Home" focused={focused} color={color} />,
            tabBarLabel: tabLabels.Home,
          }}
        />
        <Tab.Screen
          name="Quran"
          component={QuranStackNav}
          listeners={tabPressListener('Quran')}
          options={{
            tabBarIcon: ({ focused, color }) => <TabIcon name="Quran" focused={focused} color={color} />,
            tabBarLabel: tabLabels.Quran,
          }}
        />
        <Tab.Screen
          name="Prayer"
          component={PrayerScreen}
          options={{
            tabBarIcon: ({ focused, color }) => <TabIcon name="Prayer" focused={focused} color={color} />,
            tabBarLabel: tabLabels.Prayer,
          }}
        />
        <Tab.Screen
          name="Azkar"
          component={AzkarStackNav}
          listeners={tabPressListener('Azkar')}
          options={{
            tabBarIcon: ({ focused, color }) => <TabIcon name="Azkar" focused={focused} color={color} />,
            tabBarLabel: tabLabels.Azkar,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStackNav}
          listeners={tabPressListener('More')}
          options={{
            tabBarIcon: ({ focused, color }) => <TabIcon name="More" focused={focused} color={color} />,
            tabBarLabel: tabLabels.More,
          }}
        />
      </Tab.Navigator>
      <TouchableOpacity
        style={styles.themeToggle}
        onPress={() => setTheme(isDark ? 'light' : 'dark')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={15}
          color={activeColors.tabBarActive || activeColors.gold}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.langToggle}
        onPress={toggleLanguage}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: activeColors.tabBarActive || activeColors.gold }}>
          {language === 'ar' ? 'EN' : 'AR'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


