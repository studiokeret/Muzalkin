import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle, signOut } from '../lib/supabase';

const navLinkStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontSize: 13,
  fontWeight: 500,
  textDecoration: 'none',
  padding: '4px 8px',
  borderRadius: 6,
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'he';

  return (
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        direction: isRTL ? 'rtl' : 'ltr',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {/* Left: Logo + nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎸</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-english)' }}>
            MuZalkin
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Link to="/" style={navLinkStyle}>{t('search')}</Link>
          {user && (
            <>
              <Link to="/my-songs" style={navLinkStyle}>{t('my_songs')}</Link>
              <Link to="/playlists" style={navLinkStyle}>{t('playlists')}</Link>
            </>
          )}
          <Link to="/settings" style={navLinkStyle}>{t('settings')}</Link>
        </nav>
      </div>

      {/* Right: Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {user.user_metadata?.full_name ?? user.email}
            </span>
            <button
              onClick={() => signOut()}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {t('logout')}
            </button>
          </>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              color: '#000',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t('login')}
          </button>
        )}
      </div>
    </header>
  );
}
