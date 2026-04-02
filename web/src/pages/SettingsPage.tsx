import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { updateUserLanguage } from '../services/supabaseApi';
import { signInWithGoogle, signOut } from '../lib/supabase';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'he';

  async function handleLanguageChange(lang: 'he' | 'en') {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (user) {
      try {
        await updateUserLanguage(lang);
      } catch (err) {
        console.error(err);
      }
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 10,
    display: 'block',
  };

  return (
    <div style={{ padding: '24px 0', direction: isRTL ? 'rtl' : 'ltr', maxWidth: 500 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{t('settings')}</h1>

      {/* Account */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{isRTL ? 'חשבון' : 'Account'}</span>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{user.user_metadata?.full_name ?? user.email}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{user.email}</div>
            </div>
            <button
              onClick={() => signOut()}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: '#cc3333',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {t('logout')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            style={{
              background: 'var(--color-accent)',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              width: '100%',
            }}
          >
            {t('login')}
          </button>
        )}
      </div>

      {/* Language */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{t('language')}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['he', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: i18n.language === lang ? 'var(--color-accent)' : 'var(--color-border)',
                background: i18n.language === lang ? 'var(--color-accent)' : 'var(--color-surface-hover)',
                color: i18n.language === lang ? '#000' : 'var(--color-text)',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: lang === 'he' ? 'var(--font-hebrew)' : 'var(--font-english)',
              }}
            >
              {lang === 'he' ? '🇮🇱 עברית' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </div>

      {/* Instrument */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{isRTL ? 'כלי נגינה' : 'Instrument'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['guitar', 'piano'] as const).map((instr) => {
            const stored = localStorage.getItem('muzalkin_instrument') ?? 'guitar';
            return (
              <button
                key={instr}
                onClick={() => localStorage.setItem('muzalkin_instrument', instr)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: stored === instr ? 'var(--color-accent)' : 'var(--color-border)',
                  background: stored === instr ? 'var(--color-accent)' : 'var(--color-surface-hover)',
                  color: stored === instr ? '#000' : 'var(--color-text)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {instr === 'guitar' ? '🎸 ' : '🎹 '}
                {t(instr === 'guitar' ? 'instrument_guitar' : 'instrument_piano')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
