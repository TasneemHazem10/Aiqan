import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from '../types';
import BrandedLoading from '../components/BrandedLoading';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useApp();

  if (isLoading) {
    return <BrandedLoading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
