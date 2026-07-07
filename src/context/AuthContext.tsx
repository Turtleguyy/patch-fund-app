import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../models/Profile';
import { authService } from '../services/authService';
import { cloudSyncService } from '../services/cloudSyncService';
import { Household, householdService, setActiveHouseholdId } from '../services/householdService';
import { profileService } from '../services/profileService';

interface AuthContextValue {
  loading: boolean;
  isCloudEnabled: boolean;
  isSignedIn: boolean;
  profile: Profile | null;
  needsProfileSetup: boolean;
  household: Household | null;
  refreshProfile: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
  setHousehold: (household: Household | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHouseholdState] = useState<Household | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured() || !isSignedIn) {
      setProfile(null);
      return;
    }
    const current = await profileService.getCurrentProfile();
    setProfile(current);
  }, [isSignedIn]);

  const refreshHousehold = useCallback(async () => {
    if (!isSupabaseConfigured() || !isSignedIn) {
      setHouseholdState(null);
      setActiveHouseholdId(null);
      return;
    }
    const current = await householdService.getCurrentHousehold();
    setHouseholdState(current);
  }, [isSignedIn]);

  const setHousehold = useCallback((next: Household | null) => {
    setHouseholdState(next);
    setActiveHouseholdId(next?.id ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let active = true;

    (async () => {
      const session = await authService.getSession();
      if (!active) return;
      setIsSignedIn(Boolean(session));
      if (session) {
        const [currentProfile, currentHousehold] = await Promise.all([
          profileService.getCurrentProfile(),
          householdService.getCurrentHousehold(),
        ]);
        if (active) {
          setProfile(currentProfile);
          setHouseholdState(currentHousehold);
        }
      }
      if (active) setLoading(false);
    })();

    const unsubscribe = authService.onAuthStateChange((signedIn) => {
      setIsSignedIn(signedIn);
      if (!signedIn) {
        setProfile(null);
        setHouseholdState(null);
        setActiveHouseholdId(null);
        cloudSyncService.clear();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      void refreshProfile();
      void refreshHousehold();
    }
  }, [isSignedIn, refreshProfile, refreshHousehold]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setProfile(null);
    setHouseholdState(null);
    setActiveHouseholdId(null);
    setIsSignedIn(false);
    cloudSyncService.clear();
  }, []);

  const needsProfileSetup = profileService.profileNeedsSetup(profile?.displayName);

  const value = useMemo(
    () => ({
      loading,
      isCloudEnabled: isSupabaseConfigured(),
      isSignedIn,
      profile,
      needsProfileSetup,
      household,
      refreshProfile,
      refreshHousehold,
      setHousehold,
      signOut,
    }),
    [
      loading,
      isSignedIn,
      profile,
      needsProfileSetup,
      household,
      refreshProfile,
      refreshHousehold,
      setHousehold,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
