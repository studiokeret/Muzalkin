// Supabase Edge Function: search-chords
// Searches for chords by query, checking cache first, then scraping.
//
// Deploy: supabase functions deploy search-chords
// Invoke: supabase.functions.invoke('search-chords', { body: { query, language } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TAB4U_BASE = 'https://www.tab4u.com';
const TAB4U_SEARCH = `${TAB4U_BASE}/results?tab=songs&q=`;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
};

// Simple chord detection regex
const CHORD_RE = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M)?[0-9]*(sus[0-9])?(\/[A-G][#b]?)?$/;

interface ChordPosition {
  chord: string;
  position: number;
}

interface ChordDataEntry {
  type: 'line' | 'section';
  lyrics?: string;
  chords?: ChordPosition[];
  content?: string;
}

function isChord(text: string): boolean {
  return CHORD_RE.test(text.trim());
}

function lineIsAllChords(line: string): boolean {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChord).length;
  return chordCount >= tokens.length * 0.7 && chordCount > 0;
}

function parseChordPositions(line: string): ChordPosition[] {
  const chords: ChordPosition[] = [];
  const re = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:sus[0-9])?(?:\/[A-G][#b]?)?/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    chords.push({ chord: m[0], position: m.index });
  }
  return chords;
}

function isSectionHeader(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[\[\]():]/g, '');
  return /^(פזמון|בית|קודה|גשר|אינטרו|סיום|verse|chorus|bridge|intro|outro|pre-chorus)/i.test(t);
}

function parseRawText(text: string): ChordDataEntry[] {
  const lines = text.split('\n');
  const result: ChordDataEntry[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (isSectionHeader(line.trim())) {
      result.push({ type: 'section', content: line.trim().replace(/^\[|\]$/g, '') });
      i++;
      continue;
    }

    if (lineIsAllChords(line)) {
      const chords = parseChordPositions(line);
      const lyricsLine = i + 1 < lines.length && !lineIsAllChords(lines[i + 1]) && !isSectionHeader(lines[i + 1].trim())
        ? lines[i + 1]
        : '';
      result.push({ type: 'line', lyrics: lyricsLine, chords });
      i += lyricsLine ? 2 : 1;
      continue;
    }

    result.push({ type: 'line', lyrics: line, chords: [] });
    i++;
  }
  return result;
}

async function fetchHTML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Simple HTML text extractor (no full DOM parser in Edge Functions)
function extractTextFromHTML(html: string, startMarker: string, endMarker: string): string {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = html.indexOf(endMarker, startIdx);
  const segment = endIdx === -1 ? html.slice(startIdx) : html.slice(startIdx, endIdx);
  // Strip HTML tags, decode basic entities
  return segment
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(div|p|span|td|tr|table|tbody|a|b|strong|em|i|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

async function searchTab4U(query: string): Promise<{ title: string; artist: string; url: string }[]> {
  const html = await fetchHTML(TAB4U_SEARCH + encodeURIComponent(query));
  if (!html) return [];

  const results: { title: string; artist: string; url: string }[] = [];
  // Extract song links from search results
  const linkRe = /href="(\/tabs\/songs\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const url = TAB4U_BASE + m[1];
    const title = m[2].trim();
    results.push({ title, artist: '', url });
    if (results.length >= 5) break;
  }
  return results;
}

async function scrapeTab4USong(url: string): Promise<ChordDataEntry[] | null> {
  const html = await fetchHTML(url);
  if (!html) return null;

  // Try to extract the song content area
  const contentMarkers = ['songContentTPpowerful', 'song_content', 'songContent'];
  let rawText = '';
  for (const marker of contentMarkers) {
    rawText = extractTextFromHTML(html, marker, '</div>');
    if (rawText.trim()) break;
  }

  if (!rawText.trim()) {
    // Fallback: extract everything between common boundaries
    rawText = extractTextFromHTML(html, '<div class="song', '<!-- end song');
  }

  if (!rawText.trim()) return null;
  return parseRawText(rawText);
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { query, language } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });
    }

    const lang = language ?? 'he';

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('cached_chords')
      .select('*')
      .ilike('song_title', `%${query}%`)
      .eq('language', lang)
      .limit(10);

    if (cached && cached.length > 0) {
      const results = cached.map((c: Record<string, unknown>) => ({
        id: c.id,
        title: c.song_title,
        artist: c.artist,
        language: c.language,
        chordsData: c.chords_data,
      }));
      return new Response(JSON.stringify({ results, source: 'cache' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 2. Search Tab4U (Hebrew) or return empty for English (no scraper yet)
    if (lang === 'en') {
      return new Response(JSON.stringify({ results: [], source: 'none' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const searchResults = await searchTab4U(query);
    if (searchResults.length === 0) {
      return new Response(JSON.stringify({ results: [], source: 'none' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 3. Scrape first result
    const firstResult = searchResults[0];
    const chordsData = await scrapeTab4USong(firstResult.url);
    if (!chordsData) {
      return new Response(JSON.stringify({ results: [], source: 'scrape_failed' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 4. Cache the result
    const { data: inserted } = await supabase
      .from('cached_chords')
      .insert({
        song_title: firstResult.title,
        artist: firstResult.artist,
        language: lang,
        source: 'tab4u',
        chords_data: chordsData,
        raw_url: firstResult.url,
      })
      .select()
      .single();

    const song = {
      id: inserted?.id ?? crypto.randomUUID(),
      title: firstResult.title,
      artist: firstResult.artist,
      language: lang,
      chordsData,
    };

    return new Response(JSON.stringify({ results: [song], source: 'tab4u' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
