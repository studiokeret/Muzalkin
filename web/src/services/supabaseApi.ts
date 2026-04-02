import { supabase } from '../lib/supabase';
import type { ChordDataEntry } from '../utils/chords';

// ---------------------------------------------------------------------------
// Types matching supabase/schema.sql
// ---------------------------------------------------------------------------

export interface DbSong {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  language: 'he' | 'en';
  chords_data: ChordDataEntry[];
  source_url: string | null;
  instrument: 'guitar' | 'piano';
  transpose: number;
  created_at: string;
}

export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface DbPlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
  song?: DbSong;
}

// ---------------------------------------------------------------------------
// Songs CRUD
// ---------------------------------------------------------------------------

export async function saveSong(song: {
  title: string;
  artist: string;
  language: 'he' | 'en';
  chords_data: ChordDataEntry[];
  source_url?: string;
  instrument?: 'guitar' | 'piano';
  transpose?: number;
}): Promise<DbSong> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('songs')
    .insert({
      user_id: user.id,
      title: song.title,
      artist: song.artist,
      language: song.language,
      chords_data: song.chords_data,
      source_url: song.source_url ?? null,
      instrument: song.instrument ?? 'guitar',
      transpose: song.transpose ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMySongs(): Promise<DbSong[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteSong(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Playlists CRUD
// ---------------------------------------------------------------------------

export async function createPlaylist(
  name: string,
  description?: string,
  isPublic = false,
): Promise<DbPlaylist> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: user.id,
      name,
      description: description ?? null,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMyPlaylists(): Promise<DbPlaylist[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deletePlaylist(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getPlaylistSongs(playlistId: string): Promise<DbPlaylistSong[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('playlist_songs')
    .select('*, song:songs(*)')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addSongToPlaylist(
  playlistId: string,
  songId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  // Get max position
  const { data: existing } = await supabase
    .from('playlist_songs')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from('playlist_songs')
    .insert({
      playlist_id: playlistId,
      song_id: songId,
      position: nextPosition,
    });

  if (error) throw error;
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('playlist_songs')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('song_id', songId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export async function updateUserLanguage(language: 'he' | 'en'): Promise<void> {
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('users')
    .update({ language })
    .eq('id', user.id);

  if (error) throw error;
}
