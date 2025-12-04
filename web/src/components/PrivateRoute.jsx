// PrivateRoute is deprecated — authentication is handled by Auth0 + Protected wrapper.
const PrivateRoute = ({ children }) => {
  return children || null;
};

export default PrivateRoute;
