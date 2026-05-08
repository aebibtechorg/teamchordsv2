// @ts-nocheck
const axios = require('axios');

exports.onExecutePostLogin = async (event, api) => {
  if (!event.stats || event.stats.logins_count !== 1) {
    return;
  }

  const baseUrl = (event.secrets.TEAMCHORDS_API_BASE_URL || '').replace(/\/$/, '');
  const syncSecret = event.secrets.TEAMCHORDS_API_SYNC_SECRET || '';
  if (!baseUrl || !syncSecret) {
    console.log('Registration failed: TEAMCHORDS_API_BASE_URL or TEAMCHORDS_API_SYNC_SECRET secret is missing.');
    api.access.deny('Error creating user account.');
    return;
  }

  const inviteId = event.transaction?.request?.query?.inviteId || event.request?.query?.inviteId || null;

  try {
    const registrationData = {
      auth0UserId: event.user.user_id,
      email: event.user.email,
      emailVerified: event.user.email_verified,
      name: event.user.name || [event.user.given_name, event.user.family_name].filter(Boolean).join(' ') || event.user.email,
      givenName: event.user.given_name || null,
      familyName: event.user.family_name || null,
      picture: event.user.picture || null,
      inviteId,
    };

    await axios.post(`${baseUrl}/api/users/auth0-sync`, registrationData, {
      headers: {
        'Content-Type': 'application/json',
        'X-TeamChords-Sync-Secret': syncSecret,
      },
    });
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.log(`Registration failed: ${message}`);
    api.access.deny('Error creating user account.');
  }
};

