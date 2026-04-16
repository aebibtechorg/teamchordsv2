import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useProfileStore } from "../store/useProfileStore";
import Modal from "../components/Modal";
import UpdatePassword from "./UpdatePassword";
import InviteUser from "../components/InviteUser";

const Profile = () => {
    const { user } = useAuth0();
    const { profile } = useProfileStore();
    const [showModal, setShowModal] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const orgs = profile?.organizations || profile?.Organizations || [];
    const activeOrgId = profile?.orgId || (orgs.length ? (orgs[0].id || orgs[0].Id) : null);
    const activeOrg = orgs.find(o => (o.id || o.Id) === activeOrgId);
    const activeOrgName = activeOrg ? (activeOrg.name || activeOrg.Name) : null;

    return (
        <>
            <div className="max-w-md mx-auto mt-10 p-6 bg-card rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-sm font-bold text-foreground">Email</label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <label className="text-sm font-bold text-foreground">Organization</label>
                    <p className="text-sm text-muted-foreground">{activeOrgName ?? 'No organization'}</p>
                </div>
                <button 
                    onClick={() =>setShowModal(true)}
                    className="bg-primary hover:opacity-90 disabled:opacity-50 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground"
                >
                    Update Password
                </button>

                {showModal && (
                    <Modal onClose={() => setShowModal(false)}>
                        <UpdatePassword />
                    </Modal>
                )}
            </div>
            <div className="max-w-md mx-auto mt-5 p-6 bg-card rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Actions</h1>
                <button 
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="bg-primary hover:opacity-90 disabled:opacity-50 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground"
                >
                    Invite User
                </button>

                {isInviteDialogOpen && (
                    <Modal onClose={() => setIsInviteDialogOpen(false)}>
                        <InviteUser close={() => setIsInviteDialogOpen(false)} />
                    </Modal>
                )}
            </div>
        </>
    )
};

export default Profile;
