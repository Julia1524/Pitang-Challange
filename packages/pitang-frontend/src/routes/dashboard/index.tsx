import { createFileRoute, useNavigate } from '@tanstack/react-router';
import useSWR from 'swr';

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

    if (isLoading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading requests: {error.info?.message || error.message}</div>;

    const requests = data?.items ?? [];

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Reimbursement Requests</h2>
            
            {requests.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center border rounded-lg">
                    No requests found. Create a new one!
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
                            {requests.map((req: Reimbursement) => (
                                <tr
                                    key={req.id}
                                    className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => navigate({ to: `/dashboard/reimbursements/${req.id}` })}
                                >
                                    <td className="p-3">{req.description}</td>
                                    <td className="p-3">{req.category?.name}</td>
                                    <td className="p-3">
                                        {formatCurrency(req.value)}
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {formatDate(req.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
