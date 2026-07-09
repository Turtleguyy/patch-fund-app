import { PendingSiriEntry } from '../services/siriEntryService';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SetDisplayName: undefined;
  HouseholdOnboarding: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Adjustment: { childId: string; entryId?: string };
};

export type HistoryStackParamList = {
  History: undefined;
  WeekHistoryDetail: { childId: string; weekId: string };
  EditEntry: { childId: string; entryId: string };
};

export type KidsStackParamList = {
  ManageChildren: undefined;
  AddChild: { childId?: string } | undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList> | undefined;
  KidsTab: NavigatorScreenParams<KidsStackParamList> | undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SiriConfirm: { pending: PendingSiriEntry };
};
