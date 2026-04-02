import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyPlaylists, addSongToPlaylist, type DbPlaylist } from '../services/supabaseApi';

interface Props {
  songId: string;
  onClose: () => void;
}

export default function AddToPlaylistModal({ songId, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [playlists, setPlaylists] = useState<DbPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    getMyPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(playlistId: string) {
    setAdding(playlistId);
    try {
      await addSongToPlaylist(playlistId, songId);
      onClose();
    } catch (err) {
      console.error(err);
      setAdding(null);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 24,
          width: '90%',
          maxWidth: 400,
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('add_to_playlist')}</h3>

        {loading && <p style={{ color: 'var(--color-text-secondary)' }}>{t('loading')}</p>}

        {!loading && playlists.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('no_playlists')}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleAdd(pl.id)}
              disabled={adding !== null}
              style={{
                background: adding === pl.id ? 'var(--color-accent)' : 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                color: adding === pl.id ? '#000' : 'var(--color-text)',
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 14,
                textAlign: isRTL ? 'right' : 'left',
                fontFamily: 'inherit',
              }}
            >
              {pl.name}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            padding: '10px',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {isRTL ? 'סגור' : 'Close'}
        </button>
      </div>
    </div>
  );
}
