import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

function AcceptInvitePage() {
    const { inviteId } = useParams();
    const [status, setStatus] = useState('Processing invite...');
    const [navigateUrl, setNavigateUrl] = useState(null);


    const handleInvite = async () => {
        let navigateUrl = null;
        try {
            const res = await fetch(`/api/invites/${inviteId}/accept`);

            const result = await res.json();
            if (!res.ok) {
                return { status: result.message || 'Failed to accept invite', navigateUrl: null };
            }

            if (result.used) {
                return { status: 'This invite has already been used.', navigateUrl: null };
            }
            
            if (!result.isExistingUser) {
                navigateUrl = `/signup?e=${encodeURIComponent(result.email)}&inviteId=${encodeURIComponent(inviteId)}`;
                return { status: 'Invite accepted! Redirecting to signup...', navigateUrl };
            } else {
                navigateUrl = `/signin?e=${encodeURIComponent(result.email)}&inviteId=${encodeURIComponent(inviteId)}`;
                return { status: 'Invite accepted! Redirecting to signin...', navigateUrl };
            }
        } catch (error) {
            return { status: `Failed to accept invite: ${error.message}`, navigateUrl: null };
        }
        return { status: '', navigateUrl };
    }

    useEffect(() => {
        handleInvite().then(({ status, navigateUrl }) => {
            setStatus(status);
            setNavigateUrl(navigateUrl);
        }).catch((error) => {
            setStatus(`Failed to accept invite: ${error.message}`);
        });
    }, []);

    if (navigateUrl) {
        return <Navigate to={navigateUrl} />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <Spinner />
            <p className="mt-4 text-lg text-gray-600">{status}</p>
        </div>
    );
}

export default AcceptInvitePage;
