import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSiriEntryBootstrap } from './src/hooks/useSiriEntryBootstrap';
import { MainTabs } from './src/navigation/MainTabs';
import { linking } from './src/navigation/linking';
import { RootStackParamList } from './src/navigation/types';
import { SiriConfirmScreen } from './src/screens/SiriConfirmScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  useSiriEntryBootstrap(navigationRef);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <StatusBar style="auto" />
        <Stack.Navigator>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="SiriConfirm"
            component={SiriConfirmScreen}
            options={{ title: 'From Siri' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
