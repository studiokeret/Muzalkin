import { supabase } from '../lib/supabase';
import { mockSongs } from '../data/mockSongs';
import type { Song } from '../utils/chords';

/**
 * Search songs. Tries Supabase Edge Function first, then mock data.
 */
export async function searchSongs(
  query: string,
  language?: 'he' | 'en',
): Promise<Song[]> {
  // Try Supabase Edge Function
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('search-chords', {
        body: { query, language },
      });
      if (!error && data?.results) return data.results;
    } catch {
      // fall through to mock
    }
  }

  // Fallback to mock data
  const q = query.toLowerCase();
  return mockSongs.filter((s) => {
    const matchesQuery =
      !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    const matchesLang = !language || s.language === language;
    return matchesQuery && matchesLang;
  });
}

/**
 * Get a single song's chord data by ID.
 */
export async function getSongChords(songId: string): Promise<Song | null> {
  // Try Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cached_chords')
        .select('*')
        .eq('id', songId)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          title: data.song_title,
          artist: data.artist,
          language: data.language,
          chordsData: data.chords_data,
        };
      }
    } catch {
      // fall through
    }
  }

  return mockSongs.find((s) => s.id === songId) ?? null;
}
