// @ts-nocheck
const axios = require('axios');

exports.onExecutePostLogin = async (event, api) => {
  if (event.connection.strategy !== 'google-oauth2') {
    return;
  }

  if (!event.stats || event.stats.logins_count !== 1) {
    return;
  }

  const baseUrl = (event.secrets.TEAMCHORDS_API_BASE_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    console.log('Registration failed: TEAMCHORDS_API_BASE_URL secret is missing.');
    api.access.deny('Error creating user account.');
    return;
  }

  try {
    const registrationData = {
      id: null,
      email: event.user.email,
      emailVerified: event.user.email_verified,
      auth0UserId: event.user.user_id,
      name: event.user.name || [event.user.given_name, event.user.family_name].filter(Boolean).join(' ') || event.user.email,
      givenName: event.user.given_name || null,
      familyName: event.user.family_name || null,
      picture: event.user.picture || null,
      createdAt: null,
      updatedAt: null,
      password: null,
      inviteOrganizationId: null,
    };

    await axios.post(`${baseUrl}/api/users/googlesignin`, registrationData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    console.log(`Registration failed: ${message}`);
    api.access.deny('Error creating user account.');
  }
};

