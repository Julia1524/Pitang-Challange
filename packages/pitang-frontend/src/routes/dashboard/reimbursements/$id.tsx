import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useContext, useRef, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';

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
    const canApprove = (userRole === 'MANAGER') && status === 'SUBMITTED';
    const canReject = (userRole === 'MANAGER') && status === 'SUBMITTED';
    const canPay = (userRole === 'FINANCE') && status === 'APPROVED';

    async function doAction(action: string) {
        setLoadingAction(action);
        try {
            await fetcher.post(`/reimbursements/${id}/${action}`, action === 'reject' ? { rejectionJustification: justification } : {});
            toast.success('Action executed successfully!');
            mutate();
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        } finally {
            setLoadingAction(null);
        }
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
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
            <div className="border p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Request Details</h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                        {status}
                    </span>
                </div>
                <p><strong>Description:</strong> {description}</p>
                <p><strong>Value:</strong> {formatCurrency(value)}</p>
                <p><strong>Category:</strong> {category?.name}</p>
                <p><strong>Date:</strong> {formatDate(createdAt)}</p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Attachments</h3>
                    {canUpload && (
                        <>
                            <Button
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
                    <p className="p-4 text-muted-foreground text-sm border rounded-lg">No attachments.</p>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-3 text-left">File</th>
                                    <th className="p-3 text-left">Type</th>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attachments?.map((att: any) => (
                                    <tr key={att.id} className="border-t">
                                        <td className="p-3">{att.fileName}</td>
                                        <td className="p-3 text-muted-foreground">{att.fileType}</td>
                                        <td className="p-3">{formatDate(att.createdAt, 'full')}</td>
                                        <td className="p-3 text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(`http://localhost:3333${att.fileUrl}`, '_blank')}
                                            >
                                                View
                                            </Button>
                                            {canDeleteAttachment && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteAttachment(att.id)}
                                                >
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

            {(canEdit || canCancel || canSubmit) && (
                <div className="border p-4 rounded-lg bg-yellow-50 flex gap-2 flex-wrap">
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
                                action: {
                                    label: 'Yes, cancel',
                                    onClick: () => doAction('cancel'),
                                },
                                cancel: {
                                    label: 'No',
                                },
                            });
                        }} disabled={loadingAction !== null}>
                            Cancel Request
                        </Button>
                    )}
                </div>
            )}

            {canPay && (
                <div className="border p-4 rounded-lg bg-green-50 space-x-2">
                    <Button onClick={() => doAction('pay')} disabled={loadingAction !== null}>
                        Mark as Paid
                    </Button>
                </div>
            )}

            {canApprove && (
                <div className="border p-4 rounded-lg bg-blue-50 space-x-2">
                    <Button onClick={() => doAction('approve')} disabled={loadingAction !== null}>
                        Approve
                    </Button>
                </div>
            )}

            {canReject && (
                <div className="border p-4 rounded-lg bg-red-50 space-y-2">
                    <Field>
                        <FieldLabel>Rejection Justification</FieldLabel>
                        <Input value={justification} onChange={(e) => setJustification(e.target.value)} />
                    </Field>
                    <Button variant="destructive" onClick={() => doAction('reject')} disabled={loadingAction !== null || !justification}>
                        Reject
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                <h3 className="text-xl font-bold">History</h3>
                <div className="border rounded-lg overflow-hidden">
                    {history.length === 0 ? (
                        <p className="p-4 text-muted-foreground">No history available.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-3 text-left">Action</th>
                                    <th className="p-3 text-left">User</th>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Obs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h: any) => (
                                    <tr key={h.id} className="border-t">
                                        <td className="p-3 font-medium">{h.action}</td>
                                        <td className="p-3">{h.user?.name}</td>
                                        <td className="p-3">{formatDate(h.createdAt, 'full')}</td>
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
