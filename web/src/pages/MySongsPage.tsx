import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getMySongs, deleteSong, type DbSong } from '../services/supabaseApi';

export default function MySongsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'he';
  const [songs, setSongs] = useState<DbSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getMySongs()
      .then(setSongs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await deleteSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
        <p>{t('login_required')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', direction: isRTL ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{t('my_songs')}</h1>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>{t('loading')}</p>}

      {!loading && songs.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 40 }}>
          {t('no_saved_songs')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {songs.map((song) => (
          <div
            key={song.id}
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
              onClick={() => handleDelete(song.id)}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: '#cc3333',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {t('delete')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
