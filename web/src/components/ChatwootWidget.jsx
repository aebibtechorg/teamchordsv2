import { useEffect } from 'react';
import { loadConfig } from '../config';

const CHATWOOT_SCRIPT_ID = 'teamchords-chatwoot-sdk';

const ChatwootWidget = () => {
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const config = await loadConfig();
      const chatwoot = config?.Chatwoot || config?.chatwoot;
      const enabled = Boolean(chatwoot?.Enabled ?? chatwoot?.enabled);
      const baseUrlValue = chatwoot?.BaseUrl || chatwoot?.baseUrl;
      const websiteTokenValue = chatwoot?.WebsiteToken || chatwoot?.websiteToken;

      if (
        cancelled ||
        !enabled ||
        !baseUrlValue ||
        !websiteTokenValue
      ) {
        return;
      }

      const baseUrl = String(baseUrlValue).replace(/\/$/, '');
      const websiteToken = String(websiteTokenValue);
      const position = chatwoot.Position || chatwoot.position || 'right';
      const locale = chatwoot.Locale || chatwoot.locale || 'en';
      const hideMessageBubble = Boolean(chatwoot.HideMessageBubble ?? chatwoot.hideMessageBubble);

      window.chatwootSettings = {
        hideMessageBubble,
        position,
        locale,
        launcherTitle: 'Chat with support',
      };

      const runChatwoot = () => {
        if (cancelled || !window.chatwootSDK?.run) return;
        window.chatwootSDK.run({ websiteToken, baseUrl });
      };

      if (window.chatwootSDK?.run) {
        runChatwoot();
        return;
      }

      const existingScript = document.getElementById(CHATWOOT_SCRIPT_ID);
      if (existingScript) {
        existingScript.addEventListener('load', runChatwoot, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = CHATWOOT_SCRIPT_ID;
      script.async = true;
      script.src = `${baseUrl}/packs/js/sdk.js`;
      script.onload = runChatwoot;
      document.body.appendChild(script);
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default ChatwootWidget;


