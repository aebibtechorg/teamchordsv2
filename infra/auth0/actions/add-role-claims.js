exports.onExecutePostLogin = async (event, api) => {
  const namespace = event.secrets.ROLES_NAMESPACE || 'https://teamchordsapp.io';

  if (!event.authorization || !event.authorization.roles) {
    return;
  }

  const roles = event.authorization.roles;

  api.idToken.setCustomClaim(`${namespace}/roles`, roles);
  api.idToken.setCustomClaim('roles', roles);

  api.accessToken.setCustomClaim(`${namespace}/roles`, roles);
  api.accessToken.setCustomClaim('roles', roles);
};


