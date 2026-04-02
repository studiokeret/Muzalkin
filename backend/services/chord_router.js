// chord_router.js — Smart source picker
//
// This logic has been moved to a Supabase Edge Function for serverless deployment.
// See: supabase/functions/search-chords/index.ts
//
// Routing rules:
//   Hebrew  → Tab4U → Nagnu → Negina
//   English → Ultimate Guitar → Chordify → Tab4U (English section)
//
// Flow:
//   1. Always check `cached_chords` table BEFORE hitting any external source
//   2. If not cached, scrape from the appropriate source chain
//   3. Always save results to `cached_chords` after fetching
//   4. Add 1 second delay between requests to external sites
//
// The web client calls this via:
//   supabase.functions.invoke('search-chords', { body: { query, language } })
//
// For local development, you can run the Edge Function locally:
//   supabase functions serve search-chords
