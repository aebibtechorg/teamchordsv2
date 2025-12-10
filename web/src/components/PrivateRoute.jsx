// PrivateRoute is deprecated — authentication is handled by Auth0 + Protected wrapper.
import { withAuthenticationRequired } from '@auth0/auth0-react';

const PrivateRoute = withAuthenticationRequired();

export default PrivateRoute;
