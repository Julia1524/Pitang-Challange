const statusColors: Record<string, string> = {
    DRAFT: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    SUBMITTED: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-300 border-red-500/30',
    PAID: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    CANCELLED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

export default function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {status}
        </span>
    );
}
