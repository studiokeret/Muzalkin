import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPlaylistSongs, removeSongFromPlaylist, type DbPlaylistSong } from '../services/supabaseApi';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [songs, setSongs] = useState<DbPlaylistSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getPlaylistSongs(id)
      .then(setSongs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRemove(songId: string) {
    if (!id) return;
    try {
      await removeSongFromPlaylist(id, songId);
      setSongs((prev) => prev.filter((ps) => ps.song_id !== songId));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ padding: '24px 0', direction: isRTL ? 'rtl' : 'ltr' }}>
      <Link
        to="/playlists"
        style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'inline-block', marginBottom: 16 }}
      >
        {isRTL ? '→ ' : '← '}{t('playlists')}
      </Link>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>{t('loading')}</p>}

      {!loading && songs.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 40 }}>
          {t('no_results')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {songs.map((ps) => {
          const song = ps.song;
          if (!song) return null;
          return (
            <div
              key={ps.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <Link
                to={`/song/${song.id}`}
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  fontFamily: song.language === 'he' ? 'var(--font-hebrew)' : 'var(--font-english)',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                  {song.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {song.artist}
                </div>
              </Link>
              <button
                onClick={() => handleRemove(ps.song_id)}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  color: '#cc3333',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                {t('remove')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
