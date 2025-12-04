import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function InviteUser() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email }
      });

      if (error) throw error;

      setMessage({ 
        text: `Invite sent to ${email} successfully!`,
        isError: false 
      });
      setEmail('');
    } catch (error) {
      setMessage({ 
        text: error.message || 'Failed to send invite',
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Invite User</h2>
      <form onSubmit={handleInvite}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
      {message.text && (
        <div className={`mt-4 p-3 rounded-md ${message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
