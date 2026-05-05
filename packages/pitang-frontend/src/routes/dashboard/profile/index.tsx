import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useContext, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { AppContext } from '@/context/AppContext';
import { getCookie, useAuth } from '@/hooks/use-auth';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';

export const Route = createFileRoute('/dashboard/profile/')({
    component: RouteComponent,
});

function RouteComponent() {
    const [{ loggedUser }, dispatch] = useContext(AppContext);
    const navigate = useNavigate();
    const { handleLogout } = useAuth();

    const [name, setName] = useState(loggedUser?.name || '');
    const [email, setEmail] = useState(loggedUser?.email || '');
    const [isSaving, setIsSaving] = useState(false);

    if (!loggedUser) return <div className="p-4">Loading...</div>;

    async function handleSave() {
        if (!name.trim() || !email.trim()) return;

        setIsSaving(true);
        try {
            const updated = await fetcher.patch(`/users/${loggedUser.id}`, { name: name.trim(), email: email.trim() });
            dispatch({ type: 'SET_LOGGED_USER', payload: { ...loggedUser, ...updated } });
            setName(updated.name);
            setEmail(updated.email);
            toast.success('Profile updated!');
            window.location.href = '/dashboard';
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        toast('Are you sure you want to delete your account? This action cannot be undone.', {
            action: {
                label: 'Yes, delete',
                onClick: async () => {
                    try {
                        await fetcher.delete(`/users/${loggedUser.id}`);
                        toast.success('Account deleted.');
                        handleLogout();
                    } catch (error) {
                        if (error instanceof FetcherError) {
                            toast.error(error.info.message);
                        }
                    }
                },
            },
            cancel: {
                label: 'Cancel',
            },
        });
    }

    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
            <div className="border p-6 rounded-lg space-y-4">
                <h2 className="text-2xl font-bold">My Profile</h2>

                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                    {!name.trim() && (
                        <FieldDescription className="text-red-500">Name is required</FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    {!email.trim() && (
                        <FieldDescription className="text-red-500">Email is required</FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Input value={loggedUser.role} disabled />
                    <FieldDescription>Role can only be changed by an admin.</FieldDescription>
                </Field>

                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim() || !email.trim()}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="border p-6 rounded-lg space-y-4 border-red-200 bg-red-50">
                <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                    Once you delete your account, all your requests and data will be permanently removed.
                </p>
                <Button variant="destructive" onClick={handleDelete}>
                    Delete My Account
                </Button>
            </div>
        </div>
    );
}
