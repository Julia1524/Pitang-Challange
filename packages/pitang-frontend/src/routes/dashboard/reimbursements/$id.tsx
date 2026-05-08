import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Paperclip, HistoryIcon } from 'lucide-react';
import { useContext, useRef, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';

import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { formatDate, formatCurrency } from '@/lib/date-format';
import { AppContext } from '@/context/AppContext';

export const Route = createFileRoute('/dashboard/reimbursements/$id')({
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = useParams({ from: '/dashboard/reimbursements/$id' });
    const { data, error, mutate } = useSWR(`/reimbursements/${id}`, fetcher);
    const { data: attachments, mutate: mutateAttachments } = useSWR(`/reimbursements/${id}/attachments`, fetcher);
    const [{ loggedUser }] = useContext(AppContext);
    const navigate = useNavigate();
    const [justification, setJustification] = useState('');
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!data) return <div className="p-4">Loading...</div>;

    const { status, description, value, category, createdAt, history = [], requesterId } = data;
    const userRole = loggedUser?.role;
    const isOwner = loggedUser?.id === requesterId;
    const canUpload = isOwner && status === 'DRAFT';
    const canDeleteAttachment = (userRole === 'ADMIN' || isOwner) && status === 'DRAFT';

    const canSubmit = isOwner && status === 'DRAFT';
    const canEdit = (userRole === 'ADMIN' || isOwner) && status === 'DRAFT';
    const canCancel = isOwner && status === 'DRAFT';
    const canDelete = (userRole === 'ADMIN' || isOwner) && status === 'DRAFT';
    const canApprove = (userRole === 'MANAGER') && status === 'SUBMITTED';
    const canReject = (userRole === 'MANAGER') && status === 'SUBMITTED';
    const canPay = (userRole === 'FINANCE') && status === 'APPROVED';

    async function doAction(action: string) {
        setLoadingAction(action);
        try {
            await fetcher.post(`/reimbursements/${id}/${action}`, action === 'reject' ? { rejectionJustification: justification } : {});
            toast.success('Action executed successfully!');
            await mutate();
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        } finally {
            setLoadingAction(null);
        }
    }

    async function handleDelete() {
        toast('Are you sure you want to delete this request? This action cannot be undone.', {
            action: {
                label: 'Yes, delete',
                onClick: async () => {
                    setLoadingAction('delete');
                    try {
                        await fetcher.delete(`/reimbursements/${id}`);
                        toast.success('Request deleted!');
                        navigate({ to: '/dashboard' });
                    } catch (error) {
                        if (error instanceof FetcherError) {
                            toast.error(error.info.message);
                        }
                    } finally {
                        setLoadingAction(null);
                    }
                },
            },
            cancel: { label: 'No' },
        });
    }

    async function handleUpload(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        setUploadingFile(true);
        try {
            const token = document.cookie
                .split('; ')
                .find((c) => c.startsWith('@pitang/accessToken='))
                ?.split('=')[1];

            const response = await fetch(`http://localhost:3333/reimbursements/${id}/attachments`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.message);
                return;
            }

            toast.success('File uploaded!');
            mutateAttachments();
            mutate();
        } catch {
            toast.error('Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    }

    async function handleDeleteAttachment(attachmentId: string) {
        try {
            await fetcher.delete(`/reimbursements/attachments/${attachmentId}`);
            toast.success('Attachment deleted!');
            mutateAttachments();
            mutate();
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/dashboard' })} className="-ml-2">
                <ArrowLeft className="size-4 mr-1" />
                Back
            </Button>

            <div className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold tracking-tight">Request Details</h2>
                    <StatusBadge status={status} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Description</p>
                        <p>{description}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(value)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Category</p>
                        <p>{category?.name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Date</p>
                        <p>{formatDate(createdAt)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Paperclip className="size-4" />
                        Attachments
                    </h3>
                    {canUpload && (
                        <>
                            <Button
                                size="sm"
                                disabled={uploadingFile}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadingFile ? 'Uploading...' : 'Upload File'}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf,image/jpeg,image/png"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </>
                    )}
                </div>

                {attachments?.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No attachments yet.
                    </p>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">File</th>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">Type</th>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">Date</th>
                                    <th className="p-3 text-right font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attachments?.map((att: any) => (
                                    <tr key={att.id} className="border-t last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-medium">{att.fileName}</td>
                                        <td className="p-3 text-muted-foreground">{att.fileType}</td>
                                        <td className="p-3 text-muted-foreground">{formatDate(att.createdAt, 'full')}</td>
                                        <td className="p-3 text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => window.open(`http://localhost:3333${att.fileUrl}`, '_blank')}>
                                                View
                                            </Button>
                                            {canDeleteAttachment && (
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteAttachment(att.id)}>
                                                    Delete
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {(canEdit || canCancel || canSubmit || canDelete) && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex gap-2 flex-wrap">
                    {canEdit && (
                        <Button variant="secondary" onClick={() => navigate({ to: `/dashboard/reimbursements/edit/${id}` })} disabled={loadingAction !== null}>
                            Edit
                        </Button>
                    )}
                    {canSubmit && (
                        <Button onClick={() => doAction('submit')} disabled={loadingAction !== null}>
                            Submit Request
                        </Button>
                    )}
                    {canCancel && (
                        <Button variant="destructive" onClick={async () => {
                            toast('Are you sure you want to cancel this request?', {
                                action: { label: 'Yes, cancel', onClick: () => doAction('cancel') },
                                cancel: { label: 'No' },
                            });
                        }} disabled={loadingAction !== null}>
                            Cancel Request
                        </Button>
                    )}
                    {canDelete && (
                        <Button variant="destructive" onClick={handleDelete} disabled={loadingAction !== null}>
                            Delete Request
                        </Button>
                    )}
                </div>
            )}

            {canPay && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4">
                    <Button onClick={() => doAction('pay')} disabled={loadingAction !== null}>
                        Mark as Paid
                    </Button>
                </div>
            )}

            {canApprove && (
                <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
                    <Button onClick={() => doAction('approve')} disabled={loadingAction !== null}>
                        Approve
                    </Button>
                </div>
            )}

            {canReject && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-3">
                    <Field>
                        <FieldLabel>Rejection Justification</FieldLabel>
                        <Input value={justification} onChange={(e) => setJustification(e.target.value)} />
                    </Field>
                    <Button variant="destructive" onClick={() => doAction('reject')} disabled={loadingAction !== null || !justification}>
                        Reject
                    </Button>
                </div>
            )}

            <div className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <HistoryIcon className="size-4" />
                    History
                </h3>
                <div className="border rounded-lg overflow-hidden">
                    {history.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No history available.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">Action</th>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">User</th>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">Date</th>
                                    <th className="p-3 text-left font-semibold text-muted-foreground">Obs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h: any) => (
                                    <tr key={h.id} className="border-t last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="p-3"><StatusBadge status={h.action} /></td>
                                        <td className="p-3 font-medium">{h.user?.name}</td>
                                        <td className="p-3 text-muted-foreground">{formatDate(h.createdAt, 'full')}</td>
                                        <td className="p-3 text-muted-foreground">{h.observation || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
