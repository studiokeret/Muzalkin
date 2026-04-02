import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChordDisplay from '../components/ChordDisplay';
import TransposeControls from '../components/TransposeControls';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { transposeSong } from '../utils/chords';
import { mockSongs } from '../data/mockSongs';
import { useAuth } from '../lib/AuthContext';
import { saveSong } from '../services/supabaseApi';
import { cacheSong, getCachedSong } from '../lib/offlineCache';

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [autoScroll, setAutoScroll] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [shared, setShared] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [offlineSong, setOfflineSong] = useState<typeof mockSongs[0] | null>(null);
  const scrollRef = useRef<number | null>(null);

  // Try mock first, then offline cache
  const song = mockSongs.find((s) => s.id === id) ?? offlineSong;

  useEffect(() => {
    if (!id || song) return;
    getCachedSong(id).then((cached) => {
      if (cached) {
        setOfflineSong({
          id: cached.id,
          title: cached.title,
          artist: cached.artist,
          language: cached.language,
          chordsData: cached.chordsData,
        });
      }
    });
  }, [id, song]);

  // Cache song for offline use
  useEffect(() => {
    if (!song) return;
    cacheSong({
      id: song.id,
      title: song.title,
      artist: song.artist,
      language: song.language,
      chordsData: song.chordsData,
      cachedAt: Date.now(),
    }).catch(() => { /* IndexedDB not available */ });
  }, [song]);

  const displayData = useMemo(
    () => (song ? transposeSong(song.chordsData, transpose) : []),
    [song, transpose],
  );

  const scrollTick = useCallback(() => {
    window.scrollBy(0, 1);
    scrollRef.current = requestAnimationFrame(scrollTick);
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollRef.current = requestAnimationFrame(scrollTick);
    }
    return () => {
      if (scrollRef.current !== null) cancelAnimationFrame(scrollRef.current);
    };
  }, [autoScroll, scrollTick]);

  async function handleSave() {
    if (!song || !user) return;
    setSaveStatus('saving');
    try {
      await saveSong({
        title: song.title,
        artist: song.artist,
        language: song.language,
        chords_data: song.chordsData,
        transpose,
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('idle');
    }
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  }

  if (!song) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ fontSize: 18, color: 'var(--color-text-secondary)' }}>{t('no_results')}</p>
        <Link to="/" style={{ color: 'var(--color-accent)', marginTop: 12, display: 'inline-block' }}>
          ← {t('search')}
        </Link>
      </div>
    );
  }

  const isRTL = song.language === 'he';

  const actionBtnStyle: React.CSSProperties = {
    background: 'var(--color-surface-hover)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
  };

  return (
    <div style={{ padding: '24px 0 80px', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Back link */}
      <Link
        to="/"
        style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'inline-block', marginBottom: 16 }}
      >
        {isRTL ? '→ חזרה' : '← Back'}
      </Link>

      {/* Song header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, fontFamily: isRTL ? 'var(--font-hebrew)' : 'var(--font-english)' }}>
            {song.title}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontFamily: isRTL ? 'var(--font-hebrew)' : 'var(--font-english)' }}>
            {song.artist}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {user && (
            <>
              <button
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                style={{
                  ...actionBtnStyle,
                  ...(saveStatus === 'saved' ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : {}),
                }}
              >
                {saveStatus === 'saving' ? t('loading') : saveStatus === 'saved' ? t('save_success') : t('save_song')}
              </button>
              <button onClick={() => setShowPlaylistModal(true)} style={actionBtnStyle}>
                {t('add_to_playlist')}
              </button>
            </>
          )}
          <button onClick={handleShare} style={actionBtnStyle}>
            {shared ? t('share_copied') : t('share')}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '8px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <TransposeControls
          transpose={transpose}
          onTransposeChange={setTranspose}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
        />
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{
            background: autoScroll ? 'var(--color-accent)' : 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            color: autoScroll ? '#000' : 'var(--color-text)',
            padding: '6px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {t('auto_scroll')} {autoScroll ? '⏸' : '▶'}
        </button>
      </div>

      {/* Chord sheet */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '16px 24px',
        }}
      >
        <ChordDisplay chordsData={displayData} language={song.language} fontSize={fontSize} />
      </div>

      {/* Playlist modal */}
      {showPlaylistModal && song && (
        <AddToPlaylistModal songId={song.id} onClose={() => setShowPlaylistModal(false)} />
      )}
    </div>
  );
}
