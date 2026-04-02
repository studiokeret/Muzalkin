import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getMyPlaylists, createPlaylist, deletePlaylist, type DbPlaylist } from '../services/supabaseApi';

export default function PlaylistsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'he';
  const [playlists, setPlaylists] = useState<DbPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getMyPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const playlist = await createPlaylist(newName.trim());
      setPlaylists((prev) => [playlist, ...prev]);
      setNewName('');
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t('playlists')}</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            background: 'var(--color-accent)',
            color: '#000',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + {t('create_playlist')}
        </button>
      </div>

      {showCreate && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('playlist_name')}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            style={{
              background: newName.trim() ? 'var(--color-accent)' : 'var(--color-surface-hover)',
              color: newName.trim() ? '#000' : 'var(--color-text-secondary)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {t('save_song')}
          </button>
        </div>
      )}

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>{t('loading')}</p>}

      {!loading && playlists.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 40 }}>
          {t('no_playlists')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {playlists.map((pl) => (
          <div
            key={pl.id}
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
              to={`/playlist/${pl.id}`}
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                {pl.name}
              </div>
              {pl.description && (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {pl.description}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-accent)', marginTop: 4 }}>
                {pl.is_public ? '🌐' : '🔒'}
              </div>
            </Link>
            <button
              onClick={() => handleDelete(pl.id)}
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
