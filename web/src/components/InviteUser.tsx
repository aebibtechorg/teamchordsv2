import { useState } from 'react';
import { inviteUser } from '../utils/common';
import { useProfileStore } from '../store/useProfileStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

export default function InviteUser() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const { profile } = useProfileStore();

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const result = await inviteUser(email, profile.orgId);
      if (!result) {
        throw new Error('Failed to send invite');
      }
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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Invite User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </form>
        {message.text && (
          <Alert variant={message.isError ? 'destructive' : 'default'} className="mt-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
