// chords.js — REST route for /chords
//
// This has been replaced by a Supabase Edge Function.
// See: supabase/functions/search-chords/index.ts
//
// The Edge Function handles:
//   - Checking cached_chords table
//   - Scraping Tab4U for Hebrew songs
//   - Caching results
//
// Web client usage:
//   import { supabase } from '../lib/supabase';
//   const { data } = await supabase.functions.invoke('search-chords', {
//     body: { query: 'הללויה', language: 'he' }
//   });
