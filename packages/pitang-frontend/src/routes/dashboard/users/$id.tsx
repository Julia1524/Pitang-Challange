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
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
                    <h3 className="text-xl font-bold tracking-tight">Edit User</h3>

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
                        <select className="w-full bg-background border rounded-lg px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
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
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
                        {user.role}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Created:</strong> {formatDate(user.createdAt, 'full')}</p>

                <div className="flex gap-2 pt-2">
                    <Button onClick={startEditing}>Edit User</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Reimbursement Requests ({requests.length})</h3>

                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <p className="text-lg font-medium">No requests from this user.</p>
                    </div>
                ) : (
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="p-3.5 text-left font-semibold text-muted-foreground">Description</th>
                                    <th className="p-3.5 text-left font-semibold text-muted-foreground">Category</th>
                                    <th className="p-3.5 text-left font-semibold text-muted-foreground">Value</th>
                                    <th className="p-3.5 text-left font-semibold text-muted-foreground">Status</th>
                                    <th className="p-3.5 text-left font-semibold text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req: any) => (
                                    <tr
                                        key={req.id}
                                        className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => navigate({ to: `/dashboard/reimbursements/${req.id}` })}
                                    >
                                        <td className="p-3.5 font-medium">{req.description}</td>
                                        <td className="p-3.5 text-muted-foreground">{req.category?.name}</td>
                                        <td className="p-3.5 font-medium">{formatCurrency(req.value)}</td>
                                        <td className="p-3.5">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-muted-foreground">{formatDate(req.createdAt)}</td>
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
