import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { loadConfig } from "../config";

export default function UpdatePassword({ onSuccess }) {
  const { user } = useAuth0();
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // const domain = import.meta.env.VITE_AUTH0_DOMAIN;
      // const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
      const config = await loadConfig();
      const domain = config.auth0Domain;
      const clientId = config.auth0ClientId;
      const email = user?.email;
      if (!email) throw new Error('No email available for the current user.');

      // Call Auth0 change password endpoint which sends a reset email
      const res = await fetch(`https://${domain}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          email,
          connection: 'Username-Password-Authentication',
        }),
      });

      const text = await res.text();
      setMessage({ text: 'Password reset email sent. Check your inbox.', isError: false });
      onSuccess?.();
    } catch (error) {
      setMessage({ text: error.message || 'Failed to send reset email', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
      <p className="mb-4">A password reset email will be sent to your account email.</p>
      <form onSubmit={handleSendReset} className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className={`bg-gray-500 hover:bg-gray-600 disabled:opacity-50 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white`}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>
      {message.text && (
        <div className={`mt-4 p-3 rounded-md ${
          message.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
