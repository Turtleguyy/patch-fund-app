import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AddChildScreen } from '../screens/AddChildScreen';
import { AdjustmentScreen } from '../screens/AdjustmentScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ManageChildrenScreen } from '../screens/ManageChildrenScreen';
import { WeekHistoryDetailScreen } from '../screens/WeekHistoryDetailScreen';
import { colors } from '../theme';
import {
  HistoryStackParamList,
  HomeStackParamList,
  KidsStackParamList,
  MainTabParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const KidsStack = createNativeStackNavigator<KidsStackParamList>();

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(focusedName: IoniconName, outlineName: IoniconName) {
  return ({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: string;
    size: number;
  }) => <Ionicons name={focused ? focusedName : outlineName} size={size} color={color} />;
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Patch Fund' }} />
      <HomeStack.Screen
        name="Adjustment"
        component={AdjustmentScreen}
        options={({ route }) => ({
          title: route.params.entryId ? 'Edit entry' : 'Log entry',
        })}
      />
    </HomeStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="History" component={HistoryScreen} options={{ title: 'Past weeks' }} />
      <HistoryStack.Screen
        name="WeekHistoryDetail"
        component={WeekHistoryDetailScreen}
        options={{ title: 'Week details' }}
      />
      <HistoryStack.Screen
        name="EditEntry"
        component={AdjustmentScreen}
        options={{ title: 'Edit entry' }}
      />
    </HistoryStack.Navigator>
  );
}

function KidsStackNavigator() {
  return (
    <KidsStack.Navigator>
      <KidsStack.Screen
        name="ManageChildren"
        component={ManageChildrenScreen}
        options={{ title: 'Household' }}
      />
      <KidsStack.Screen
        name="AddChild"
        component={AddChildScreen}
        options={{ title: 'Add a child' }}
      />
    </KidsStack.Navigator>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: tabIcon('wallet', 'wallet-outline') }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackNavigator}
        options={{
          title: 'Past weeks',
          tabBarLabel: 'History',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tab.Screen
        name="KidsTab"
        component={KidsStackNavigator}
        options={{
          title: 'Household',
          tabBarLabel: 'Household',
          tabBarIcon: tabIcon('people', 'people-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
