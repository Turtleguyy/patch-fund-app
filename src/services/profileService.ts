import * as AppleAuthentication from 'expo-apple-authentication';
import { getSupabase } from '../lib/supabase';
import { Profile, profileNeedsSetup } from '../models/Profile';
import { ProfileRow } from '../types/database';

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name?.trim() || 'Parent',
  };
}

export function formatAppleFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null {
  if (!fullName) return null;
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || null;
}

export const profileService = {
  profileNeedsSetup,

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: userData } = await getSupabase().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return null;

    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id, display_name, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapProfile(data as ProfileRow);
  },

  async updateDisplayName(displayName: string): Promise<Profile> {
    const { data: userData } = await getSupabase().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error('Not signed in.');

    const trimmed = displayName.trim();
    if (!trimmed) throw new Error('Enter your name.');

    const { data, error } = await getSupabase()
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', userId)
      .select('id, display_name, created_at')
      .single();

    if (error) throw error;
    return mapProfile(data as ProfileRow);
  },

  async getHouseholdMemberNames(householdId: string): Promise<Map<string, string>> {
    const supabase = getSupabase();

    const { data: members, error: memberError } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId);

    if (memberError) throw memberError;

    const userIds = (members ?? []).map((member) => member.user_id);
    if (userIds.length === 0) return new Map();

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, created_at')
      .in('id', userIds);

    if (profileError) throw profileError;

    return new Map(
      (profiles as ProfileRow[]).map((profile) => [
        profile.id,
        profile.display_name?.trim() || 'Parent',
      ]),
    );
  },
};
