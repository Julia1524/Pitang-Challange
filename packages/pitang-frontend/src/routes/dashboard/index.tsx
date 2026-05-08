import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SearchX } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import StatusBadge from '@/components/status-badge';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { formatDate, formatCurrency } from '@/lib/date-format';

interface Reimbursement {
    id: string;
    status: string;
    value: number;
    description: string;
    category: { name: string };
    createdAt: string;
}

export const Route = createFileRoute('/dashboard/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data, isLoading, error } = useSWR('/reimbursements', fetcher);
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading requests: {error.info?.message || error.message}</div>;

    const requests = data?.items ?? [];
    const filtered = requests.filter((r: any) => {
        if (statusFilter && r.status !== statusFilter) return false;
        if (categoryFilter && r.category.id !== categoryFilter) return false;
        return true;
    });

    const statuses = [...new Set(requests.map((r: any) => r.status))];
    const categories = [...new Map(requests.map((r: any) => [r.category.id, r.category])).values()];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Reimbursement Requests</h2>
                <div className="flex gap-2">
                    <select
                        className="border rounded-lg px-3 py-1.5 text-sm bg-zinc-800 border-zinc-700 shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All statuses</option>
                        {statuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <select
                        className="border rounded-lg px-3 py-1.5 text-sm bg-zinc-800 border-zinc-700 shadow-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All categories</option>
                        {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <SearchX className="size-10 mb-3" />
                    <p className="text-lg font-medium">No requests found</p>
                    <p className="text-sm">Try adjusting the filters or create a new one.</p>
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
                            {filtered.map((req: Reimbursement) => (
                                <tr
                                    key={req.id}
                                    className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => navigate({ to: `/dashboard/reimbursements/${req.id}` })}
                                >
                                    <td className="p-3.5 font-medium">{req.description}</td>
                                    <td className="p-3.5 text-muted-foreground">{req.category?.name}</td>
                                    <td className="p-3.5 font-medium">{formatCurrency(req.value)}</td>
                                    <td className="p-3.5"><StatusBadge status={req.status} /></td>
                                    <td className="p-3.5 text-muted-foreground">{formatDate(req.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-3.5 py-2.5 text-xs text-muted-foreground border-t bg-muted/20">
                        Showing {filtered.length} of {requests.length} requests
                    </div>
                </div>
            )}
        </div>
    );
}
