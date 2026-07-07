import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useSiriEntryBootstrap } from './src/hooks/useSiriEntryBootstrap';
import { MainTabs } from './src/navigation/MainTabs';
import { linking } from './src/navigation/linking';
import { AuthStackParamList, RootStackParamList } from './src/navigation/types';
import { HouseholdOnboardingScreen } from './src/screens/HouseholdOnboardingScreen';
import { SetDisplayNameScreen } from './src/screens/SetDisplayNameScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { SiriConfirmScreen } from './src/screens/SiriConfirmScreen';
import { colors } from './src/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function MainAppNavigator({
  navigationRef,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  useSiriEntryBootstrap(navigationRef);

  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen
        name="SiriConfirm"
        component={SiriConfirmScreen}
        options={{ title: 'From Siri' }}
      />
    </RootStack.Navigator>
  );
}

function AppShell() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { loading, isCloudEnabled, isSignedIn, profile, needsProfileSetup, household } = useAuth();
  const mainAppReady =
    !loading &&
    (!isCloudEnabled ||
      (isSignedIn && profile !== null && !needsProfileSetup && household !== null));

  let content;
  if (loading) {
    content = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  } else if (isCloudEnabled && !isSignedIn) {
    content = (
      <AuthStack.Navigator>
        <AuthStack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
      </AuthStack.Navigator>
    );
  } else if (isCloudEnabled && isSignedIn && profile === null) {
    content = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  } else if (isCloudEnabled && isSignedIn && needsProfileSetup) {
    content = (
      <AuthStack.Navigator>
        <AuthStack.Screen
          name="SetDisplayName"
          component={SetDisplayNameScreen}
          options={{ title: 'Your name' }}
        />
      </AuthStack.Navigator>
    );
  } else if (isCloudEnabled && isSignedIn && !household) {
    content = (
      <AuthStack.Navigator>
        <AuthStack.Screen
          name="HouseholdOnboarding"
          component={HouseholdOnboardingScreen}
          options={{ title: 'Your household' }}
        />
      </AuthStack.Navigator>
    );
  } else {
    content = <MainAppNavigator navigationRef={navigationRef} />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={mainAppReady ? linking : undefined}>
      <StatusBar style="auto" />
      {content}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
