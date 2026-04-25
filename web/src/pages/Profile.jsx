import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useProfileStore } from "../store/useProfileStore";
import Modal from "../components/Modal";
import UpdatePassword from "./UpdatePassword";
import { updateMe, upsertProfile, getProfile } from '../utils/common';
import { Toaster, toast } from 'react-hot-toast';
import Select from 'react-select';
import { keys, INSTRUMENTS, MUSICAL_ROLES } from '../constants';
import {Link, useSearchParams} from 'react-router-dom';
import { apiFetch } from '../utils/api';
import ConfirmDialog from "../components/ConfirmDialog";

const Profile = () => {
    const { user } = useAuth0();
    const { profile, setUserProfile } = useProfileStore();
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            toast.success('Payment successful! Your plan has been upgraded.');
            // Refresh profile to get updated plan
            getProfile().then(setUserProfile);
        }
    }, [searchParams, setUserProfile]);

    // Local form state
    const [givenName, setGivenName] = useState(profile?.givenName || profile?.GivenName || '');
    const [familyName, setFamilyName] = useState(profile?.familyName || profile?.FamilyName || '');
    const [musicalRole, setMusicalRole] = useState(profile?.profile?.musicalRole || profile?.Profile?.MusicalRole || '');
    const [instruments, setInstruments] = useState(() => {
        const instr = profile?.profile?.instruments || profile?.Profile?.Instruments;
        if (typeof instr === 'string') {
            try {
                return JSON.parse(instr);
            } catch {
                return [];
            }
        }
        return Array.isArray(instr) ? instr : [];
    });
    const [preferredKey, setPreferredKey] = useState(profile?.profile?.preferredKey || profile?.Profile?.PreferredKey || '');
    const [bio, setBio] = useState(profile?.profile?.bio || profile?.Profile?.Bio || '');
    const [website, setWebsite] = useState(profile?.profile?.website || profile?.Profile?.Website || '');

    const orgs = profile?.organizations || profile?.Organizations || [];
    const activeOrgId = profile?.orgId || (orgs.length ? (orgs[0].id || orgs[0].Id) : null);
    const activeOrg = orgs.find(o => (o.id || o.Id) === activeOrgId);
    const activeOrgName = activeOrg ? (activeOrg.name || activeOrg.Name) : null;
    const activeOrgRole = activeOrg ? (activeOrg.role || activeOrg.Role) : null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const profileId = profile?.profile?.id || profile?.Profile?.Id;
            const userId = profile?.id || profile?.Id;
            const orgId = profile?.orgId || (orgs.length ? (orgs[0].id || orgs[0].Id) : null);

            const [userResult] = await Promise.all([
                updateMe({ givenName, familyName }),
                upsertProfile(profileId, userId, orgId, {
                    bio,
                    instruments,
                    musicalRole,
                    preferredKey,
                    website
                })
            ]);

            if (userResult) {
                // Refresh profile
                const refreshed = await getProfile();
                if (refreshed) {
                    setUserProfile(refreshed);
                    toast.success('Profile updated successfully!');
                }
            } else {
                toast.error('Failed to update profile.');
            }
        } catch (err) {
            toast.error('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = async () => {

        setIsCanceling(true);
        try {
            const res = await apiFetch('/api/billing/cancel', {
                method: 'POST',
                body: JSON.stringify({ orgId: activeOrgId })
            });
            if (res.ok) {
                // Refresh profile
                const refreshed = await getProfile();
                if (refreshed) {
                    setUserProfile(refreshed);
                    toast.success('Subscription cancelled. Your plan stays active until the end of the billing period.');
                }
            } else {
                toast.error('Failed to cancel subscription.');
            }
        } catch (err) {
            toast.error('An error occurred while canceling.');
        } finally {
            setIsCanceling(false);
        }
    };

    const instrumentOptions = INSTRUMENTS.map(i => ({ value: i, label: i }));
    const roleOptions = MUSICAL_ROLES.map(r => ({ value: r, label: r }));
    const keyOptions = keys.map(k => ({ value: k, label: k }));

    return (
        <>
            <Toaster />
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>

                {/* Identity */}
                <div className="flex items-center mb-6">
                    <img src={user?.picture} alt="Avatar" className="w-16 h-16 rounded-full mr-4" />
                    <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={givenName}
                                onChange={(e) => setGivenName(e.target.value)}
                                placeholder="First Name"
                                className="border border-gray-300 p-2 rounded flex-1"
                            />
                            <input
                                type="text"
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                                placeholder="Last Name"
                                className="border border-gray-300 p-2 rounded flex-1"
                            />
                        </div>
                        <p className="text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-500">
                            {activeOrgName ? `${activeOrgName} (${activeOrgRole})` : 'No organization'}
                        </p>
                    </div>
                </div>

                {/* Musician Details */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Musician Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Musical Role</label>
                            <Select
                                value={roleOptions.find(o => o.value === musicalRole)}
                                onChange={(opt) => setMusicalRole(opt?.value || '')}
                                options={roleOptions}
                                isClearable
                                placeholder="Select role"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instruments</label>
                            <Select
                                value={instruments.map(i => ({ value: i, label: i }))}
                                onChange={(opts) => setInstruments(opts ? opts.map(o => o.value) : [])}
                                options={instrumentOptions}
                                isMulti
                                placeholder="Select instruments"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Key</label>
                            <Select
                                value={keyOptions.find(o => o.value === preferredKey)}
                                onChange={(opt) => setPreferredKey(opt?.value || '')}
                                options={keyOptions}
                                isClearable
                                placeholder="Select key"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="border border-gray-300 p-2 rounded w-full"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={3}
                                className="border border-gray-300 p-2 rounded w-full bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Billing */}
                {/*{activeOrg && (*/}
                {/*    <div className="mb-6">*/}
                {/*        <h2 className="text-xl font-semibold mb-4">Billing</h2>*/}
                {/*        <div className="bg-gray-50 p-4 rounded">*/}
                {/*            <p className="text-sm text-gray-600 mb-2">Current Plan: <span className="font-semibold">{activeOrg.plan || 'Free'}</span></p>*/}
                {/*            <p className="text-sm text-gray-600 mb-4">Status: <span className="font-semibold">{activeOrg.subscriptionStatus || 'None'}</span></p>*/}
                {/*            {activeOrg.planExpiresAt && (*/}
                {/*                <p className="text-sm text-gray-600 mb-4">*/}
                {/*                    {new Date(activeOrg.planExpiresAt) < new Date() ? 'Expired on' : 'Expires on'}: <span className="font-semibold">{new Date(activeOrg.planExpiresAt).toLocaleDateString()}</span>*/}
                {/*                </p>*/}
                {/*            )}*/}
                {/*            {activeOrg.subscriptionStatus === 'Canceled' && activeOrg.planExpiresAt && (*/}
                {/*                <p className="text-sm text-orange-600 mb-4">*/}
                {/*                    Cancels on: <span className="font-semibold">{new Date(activeOrg.planExpiresAt).toLocaleDateString()}</span>*/}
                {/*                </p>*/}
                {/*            )}*/}
                {/*            <div className="flex gap-2">*/}
                {/*                {activeOrg.plan === 'Free' && (*/}
                {/*                    <Link to="/pricing" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">*/}
                {/*                        Upgrade Plan*/}
                {/*                    </Link>*/}
                {/*                )}*/}
                {/*                {activeOrg.plan !== 'Free' && activeOrgRole?.toLowerCase() === 'admin' && (*/}
                {/*                    <button*/}
                {/*                        onClick={() => setShowCancelConfirm(true)}*/}
                {/*                        disabled={isCanceling}*/}
                {/*                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"*/}
                {/*                    >*/}
                {/*                        {isCanceling ? 'Canceling...' : 'Cancel Subscription'}*/}
                {/*                    </button>*/}
                {/*                )}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*)}*/}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        Update Password
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-6 py-2 rounded"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <UpdatePassword />
                </Modal>
            )}
            {showCancelConfirm && (
                <ConfirmDialog
                    isOpen={showCancelConfirm}
                    onClose={() => setShowCancelConfirm(false)}
                    onConfirm={handleCancel}
                    title="Cancel Subscription"
                    message="Are you sure you want to cancel your subscription? This action cannot be undone."
                    confirmLabel="Yes, cancel it"
                    cancelLabel="No, keep it"
                />
            )}
        </>
    );
};

export default Profile;
