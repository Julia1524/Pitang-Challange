import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SearchX } from 'lucide-react';
import { useContext, useState } from 'react';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { formatDate } from '@/lib/date-format';
import { AppContext } from '@/context/AppContext';

export const Route = createFileRoute('/dashboard/users/')({
    component: RouteComponent,
});

const ROLES = ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'] as const;

function RouteComponent() {
    const { data, isLoading, error } = useSWR('/users', fetcher);
    const navigate = useNavigate();
    const [{ loggedUser }] = useContext(AppContext);
    const [roleFilter, setRoleFilter] = useState('');

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">Error loading users.</div>;

    const users = (data ?? []).filter((u: any) => u.id !== loggedUser?.id);
    const filtered = roleFilter ? users.filter((u: any) => u.role === roleFilter) : users;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                <select
                    className="border rounded-lg px-3 py-1.5 text-sm bg-zinc-800 border-zinc-700 shadow-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All roles</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <SearchX className="size-10 mb-3" />
                    <p className="text-lg font-medium">No users found</p>
                </div>
            ) : (
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-3.5 text-left font-semibold text-muted-foreground">Name</th>
                                <th className="p-3.5 text-left font-semibold text-muted-foreground">Email</th>
                                <th className="p-3.5 text-left font-semibold text-muted-foreground">Role</th>
                                <th className="p-3.5 text-left font-semibold text-muted-foreground">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user: any) => (
                                <tr
                                    key={user.id}
                                    className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => navigate({ to: `/dashboard/users/${user.id}` })}
                                >
                                    <td className="p-3.5 font-medium">{user.name}</td>
                                    <td className="p-3.5 text-muted-foreground">{user.email}</td>
                                    <td className="p-3.5">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-muted-foreground">{formatDate(user.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-3.5 py-2.5 text-xs text-muted-foreground border-t bg-muted/20">
                        {filtered.length} user{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>
            )}
        </div>
    );
}
