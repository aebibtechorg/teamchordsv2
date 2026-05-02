import React, { useEffect, useMemo, useState } from 'react';

const SUPPORT_EMAIL = 'support@teamchords.com';

function Section({ title, children }) {
  return (
    <section
      style={{
        marginBottom: 24,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ paddingLeft: 20, margin: 0 }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [chatwoot, setChatwoot] = useState(null);
  const [chatReady, setChatReady] = useState(false);
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      setConfigError('');

      try {
        let res = await fetch('/api/config');

        if (!res.ok) {
          try {
            res = await fetch('http://localhost:5000/api/config');
          } catch {
            // ignore fallback failure here
          }
        }

        if (!res.ok) {
          throw new Error('Could not load support configuration.');
        }

        const cfg = await res.json();
        const chat = cfg?.Chatwoot || cfg?.chatwoot;

        if (!cancelled) {
          setChatwoot(chat);
        }

        if (!cancelled && chat?.Enabled && chat?.BaseUrl && chat?.WebsiteToken) {
          const baseUrl = String(chat.BaseUrl).replace(/\/$/, '');
          const websiteToken = String(chat.WebsiteToken);

          window.chatwootSettings = {
            hideMessageBubble: Boolean(chat.HideMessageBubble ?? chat.hideMessageBubble),
            position: chat.Position || chat.position || 'right',
            locale: chat.Locale || chat.locale || 'en',
            launcherTitle: 'Chat with support',
          };

          const existing = document.getElementById('teamchords-chatwoot-sdk');

          const runChatwoot = () => {
            if (!window.chatwootSDK?.run) return;
            try {
              window.chatwootSDK.run({ websiteToken, baseUrl });
              setChatReady(true);
            } catch (e) {
              console.warn(e);
            }
          };

          if (existing) {
            if (window.chatwootSDK?.run) {
              runChatwoot();
            } else {
              existing.addEventListener('load', runChatwoot, { once: true });
            }
          } else {
            const script = document.createElement('script');
            script.id = 'teamchords-chatwoot-sdk';
            script.async = true;
            script.src = `${baseUrl}/packs/js/sdk.js`;
            script.onload = runChatwoot;
            document.body.appendChild(script);
          }
        }
      } catch (e) {
        console.warn('Failed to load config for support', e);
        if (!cancelled) {
          setConfigError('Live chat is temporarily unavailable. You can still email support.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const canChat = useMemo(() => {
    return Boolean(
      chatwoot?.Enabled &&
      chatwoot?.BaseUrl &&
      chatwoot?.WebsiteToken
    );
  }, [chatwoot]);

  const openChat = () => {
    try {
      if (window.$chatwoot?.toggle) {
        window.$chatwoot.toggle('open');
        return;
      }

      if (window.chatwootSDK?.popup) {
        window.chatwootSDK.popup('open');
        return;
      }

      if (window.chatwootSDK?.open) {
        window.chatwootSDK.open();
        return;
      }

      if (window.chatwootSDK?.run) {
        window.chatwootSDK.run();
        return;
      }
    } catch (e) {
      console.warn(e);
    }

    window.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: '0 16px 40px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Support</h1>
        <p style={{ color: '#4b5563', margin: 0 }}>
          Need help with Team Chords? Start a live chat for the fastest response, or email us if chat is unavailable.
        </p>
      </header>

      <Section title="Start live chat">
        <p style={{ marginTop: 0 }}>
          Live chat is the fastest way to get help because it lets us guide you while you are in the product.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <button
            className="button button--primary"
            onClick={openChat}
            disabled={loading || !canChat}
            style={{ minWidth: 160 }}
          >
            {loading ? 'Loading…' : chatReady ? 'Open Chat' : 'Launch Support Chat'}
          </button>

          <a
            className="button button--secondary"
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{ textDecoration: 'none' }}
          >
            Email Support
          </a>
        </div>

        {configError && (
          <p style={{ marginTop: 12, color: '#b45309' }}>
            {configError}
          </p>
        )}

        {!loading && !canChat && !configError && (
          <p style={{ marginTop: 12, color: '#6b7280' }}>
            Chat is not enabled in this environment. Please use email support instead.
          </p>
        )}
      </Section>

      <Section title="Before you contact support">
        <p>Including the right details helps us resolve issues much faster.</p>
        <BulletList
          items={[
            'Your organization name',
            'The page or feature you were using',
            'What you expected to happen',
            'What actually happened',
            'Any exact error message you saw',
            'Whether the issue affects one user or the whole team',
          ]}
        />
      </Section>

      <Section title="Common topics we can help with">
        <BulletList
          items={[
            'Trouble creating or joining an organization',
            'Chord sheet import and conversion problems',
            'Set list sharing or preview issues',
            'Live output or print layout questions',
            'Billing, upgrades, or cancellations',
            'Invite, access, or account problems',
          ]}
        />
      </Section>

      <Section title="Email support">
        <p style={{ marginTop: 0 }}>
          If live chat is unavailable or you prefer email, contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p style={{ marginBottom: 0, color: '#4b5563' }}>
          For the fastest reply, include the support checklist above and, if possible, a short description of the exact steps that caused the issue.
        </p>
      </Section>
    </main>
  );
}


