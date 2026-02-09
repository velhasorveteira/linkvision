
import { createClient } from '@supabase/supabase-js';
import { AnalysisResult, CourtPlace, UserSettings, Tournament } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => supabase !== null;

export const signInWithGoogle = async () => {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const saveUserSettings = async (userId: string, settings: UserSettings) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      language: settings.language,
      video_quality: settings.videoQuality,
      auto_start: settings.autoStart,
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Error saving settings:', error);
};

export const fetchUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return {
    language: data.language,
    videoQuality: data.video_quality,
    autoStart: data.auto_start
  };
};

export const saveAnalysisToDb = async (userId: string, result: AnalysisResult) => {
  if (!supabase) return;
  await supabase.from('analysis_results').upsert({
    id: result.id,
    user_id: userId,
    data: result,
    created_at: new Date().toISOString()
  });
};

export const fetchAnalysisHistory = async (userId: string): Promise<AnalysisResult[]> => {
  if (!supabase) return [];
  const { data } = await supabase
    .from('analysis_results')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ? data.map(item => item.data) : [];
};

export const saveCourtPlace = async (userId: string, place: CourtPlace) => {
  if (!supabase) return;
  await supabase.from('saved_courts').upsert({
    id: place.id,
    user_id: userId,
    data: place,
    created_at: new Date().toISOString()
  });
};

export const fetchSavedCourts = async (userId: string): Promise<CourtPlace[]> => {
  if (!supabase) return [];
  const { data } = await supabase
    .from('saved_courts')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ? data.map(item => item.data) : [];
};

export const deleteSavedCourt = async (userId: string, placeId: string) => {
  if (!supabase) return;
  await supabase.from('saved_courts').delete().eq('user_id', userId).eq('id', placeId);
};

// Tournament Specific Mock Helpers (Simulating database interactions)
export const saveTournament = async (tournament: Tournament) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('tournaments')
    .upsert({
      id: tournament.id,
      creator_id: tournament.creatorId,
      data: tournament,
      status: tournament.status,
      created_at: new Date().toISOString()
    });
  return error;
};

export const registerToTournament = async (userId: string, tournamentId: string) => {
  if (!supabase) return;
  // This would normally be a join table
  await supabase.from('tournament_registrations').insert({
    user_id: userId,
    tournament_id: tournamentId,
    created_at: new Date().toISOString()
  });
};
