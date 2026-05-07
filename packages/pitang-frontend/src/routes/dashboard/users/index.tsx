import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useContext } from 'react';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { formatDate } from '@/lib/date-format';
import { AppContext } from '@/context/AppContext';

export const Route = createFileRoute('/dashboard/users/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data, isLoading, error } = useSWR('/users', fetcher);
    const navigate = useNavigate();
    const [{ loggedUser }] = useContext(AppContext);

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading users.</div>;

    const users = (data ?? []).filter((u: any) => u.id !== loggedUser?.id);

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Users</h2>

            {users.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center border rounded-lg">
                    No users found.
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">Role</th>
                                <th className="p-3 text-left">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any) => (
                                <tr
                                    key={user.id}
                                    className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => navigate({ to: `/dashboard/users/${user.id}` })}
                                >
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3">{formatDate(user.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
