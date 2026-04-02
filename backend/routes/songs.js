// songs.js — REST routes for /songs (save, fetch, delete)
//
// These operations are performed directly via the Supabase JS client
// from the web app, using Row Level Security (RLS) to enforce access control.
// No separate backend route is needed.
//
// See: web/src/services/supabaseApi.ts
//
// Operations:
//   - saveSong()    → supabase.from('songs').insert(...)
//   - getMySongs()  → supabase.from('songs').select('*')
//   - deleteSong()  → supabase.from('songs').delete().eq('id', id)
//
// RLS policies (defined in supabase/schema.sql):
//   - Users can only read/write/delete their own songs
//   - user_id is set to auth.uid() on insert
