import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { formatDate, formatCurrency } from '@/lib/date-format';

export const Route = createFileRoute('/dashboard/users/$id')({
    component: RouteComponent,
});

const roles = ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'] as const;

function RouteComponent() {
    const { id } = useParams({ from: '/dashboard/users/$id' });
    const navigate = useNavigate();

    const { data: user, isLoading: loadingUser, mutate: mutateUser } = useSWR(`/users/${id}`, fetcher);
    const { data: requestsData, isLoading: loadingRequests } = useSWR(`/reimbursements/user/${id}`, fetcher);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const requests = requestsData?.items ?? [];

    if (loadingUser || loadingRequests) return <div className="p-4">Loading...</div>;
    if (!user) return <div className="p-4 text-red-500">User not found.</div>;

    async function handleSave() {
        if (!name.trim() || !email.trim() || !role) return;

        setIsSaving(true);
        try {
            await fetcher.patch(`/users/${id}`, { name: name.trim(), email: email.trim(), role });
            toast.success('User updated!');
            mutateUser();
            setIsEditing(false);
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            } else {
                toast.error('Failed to update user');
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        toast(`Are you sure you want to delete ${user.name}? This action cannot be undone.`, {
            action: {
                label: 'Yes, delete',
                onClick: async () => {
                    try {
                        await fetcher.delete(`/users/${id}`);
                        toast.success('User deleted!');
                        navigate({ to: '/dashboard/users' });
                    } catch (error) {
                        if (error instanceof FetcherError) {
                            toast.error(error.info.message);
                        }
                    }
                },
            },
            cancel: {
                label: 'No, keep',
            },
        });
    }

    function startEditing() {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setIsEditing(true);
    }

    if (isEditing) {
        return (
            <div className="p-4 space-y-6 max-w-4xl mx-auto">
                <div className="border p-6 rounded-lg space-y-4">
                    <h3 className="text-xl font-bold">Edit User</h3>

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
                        <select className="w-full p-2 border rounded" value={role} onChange={(e) => setRole(e.target.value)}>
                            {roles.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim() || !email.trim() || !role}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
            <div className="border p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                        {user.role}
                    </span>
                </div>
                <p><strong>Created:</strong> {formatDate(user.createdAt, 'full')}</p>

                <div className="flex gap-2 pt-2">
                    <Button onClick={startEditing}>Edit User</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold">Reimbursement Requests ({requests.length})</h3>

                {requests.length === 0 ? (
                    <div className="text-muted-foreground p-8 text-center border rounded-lg">
                        No requests from this user.
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-3 text-left">Description</th>
                                    <th className="p-3 text-left">Category</th>
                                    <th className="p-3 text-left">Value</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req: any) => (
                                    <tr
                                        key={req.id}
                                        className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => navigate({ to: `/dashboard/reimbursements/${req.id}` })}
                                    >
                                        <td className="p-3">{req.description}</td>
                                        <td className="p-3">{req.category?.name}</td>
                                        <td className="p-3">{formatCurrency(req.value)}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-3">{formatDate(req.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
