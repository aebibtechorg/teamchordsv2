import React, { useEffect, useState } from 'react';

export default function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [chatwoot, setChatwoot] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      try {
        // Try relative API first (production behind same origin or proxy)
        let res = await fetch('/api/config');
        if (!res.ok) {
          // fallback to local API during dev
          try { res = await fetch('http://localhost:5000/api/config'); } catch (e) { /* ignore */ }
        }
        const cfg = await res.json();
        const chat = cfg?.Chatwoot || cfg?.chatwoot;
        if (!cancelled) setChatwoot(chat);

        if (!cancelled && chat?.Enabled && chat?.BaseUrl && chat?.WebsiteToken) {
          const baseUrl = String(chat.BaseUrl).replace(/\/$/, '');
          const websiteToken = String(chat.WebsiteToken);

          // inject script if not present
          const existing = document.getElementById('teamchords-chatwoot-sdk');
          const runChatwoot = () => {
            if (window.chatwootSDK?.run) {
              try { window.chatwootSDK.run({ websiteToken, baseUrl }); } catch (e) { console.warn(e); }
            }
          };

          if (existing) {
            existing.addEventListener('load', runChatwoot, { once: true });
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void boot();
    return () => { cancelled = true; };
  }, []);

  const openChat = () => {
    try {
      if (window.chatwootSDK?.open) return window.chatwootSDK.open();
      if (window.chatwootSDK?.run) return window.chatwootSDK.run();
    } catch (e) { console.warn(e); }
    alert('Chat not available. You can email support@teamchords.com');
  };

  return (
    <main style={{ maxWidth: 900, margin: '32px auto', padding: 16 }}>
      <h1>Support</h1>
      <p className="paragraph">Start a chat with our support team or email us for escalations.</p>

      <section style={{ marginBottom: 16 }}>
        <h2>Live chat (recommended)</h2>
        <p>We recommend starting a chat so we can see your account context and help quickly.</p>
        <button className="button button--primary" onClick={openChat} disabled={loading}>
          {loading ? 'Loading…' : 'Open Chat'}
        </button>
      </section>

      <section>
        <h2>Email support</h2>
        <p>If you prefer email, contact <a href="mailto:support@teamchords.com">support@teamchords.com</a> with as much detail as possible.</p>
      </section>
    </main>
  );
}


