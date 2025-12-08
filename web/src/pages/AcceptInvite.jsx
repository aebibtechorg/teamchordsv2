import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

function AcceptInvitePage() {
    const { inviteId } = useParams();
    const [status, setStatus] = useState('Processing invite...');
    const [navigateUrl, setNavigateUrl] = useState(null);


    const handleInvite = async () => {
        let status = '';
        let navigateUrl = null;
        try {
            const res = await fetch(`/api/invites/${inviteId}/accept`);

            const result = await res.json();
            if (!res.ok) {
                status = result.message || 'Failed to accept invite';
            }

            if (result.used) {
                status = 'This invite has already been used.';
            }
            
            if (!result.isExisting) {
                status = 'Invite accepted! Redirecting to signup...';
                navigateUrl = `/signup?e=${encodeURIComponent(result.email)}&orgId=${result.organizationId}`;
            } else {
                status = 'Invite accepted! Redirecting to signin...';
                navigateUrl = '/signin';
            }
        } catch (error) {
            status = `Failed to accept invite: ${error.message}`;
        }
        return { status, navigateUrl };
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
