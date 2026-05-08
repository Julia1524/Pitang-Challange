import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import useSWR from 'swr';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import {requestSchema} from '@/zodSchemas';

type RequestSchema = z.infer<typeof requestSchema>;

export function NewReimbursementForm({ className }: { className?: string }) {
    const { data, isLoading } = useSWR('/categories', fetcher);
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit, formState, control } = useForm<RequestSchema>({
        resolver: zodResolver(requestSchema),
        mode: 'onChange',
    });

    const watchedValue = useWatch({ control, name: 'value' });
    const valueNum = Number(watchedValue);
    const isAttachmentRequired = valueNum > 500;
    const [fileError, setFileError] = useState('');

    const categories = data?.items ?? [];

    async function onSubmit(data: RequestSchema) {
        const file = fileInputRef.current?.files?.[0];

        if (Number(data.value) > 500 && !file) {
            setFileError('Attachment is required for values over R$ 500');
            return;
        }
        setFileError('');

        try {
            const request = await fetcher.post<{ id: string }>('/reimbursements', data);

            if (file) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', file);
                const token = document.cookie
                    .split('; ')
                    .find((c) => c.startsWith('@pitang/accessToken='))
                    ?.split('=')[1];
                await fetch(`http://localhost:3333/reimbursements/${request.id}/attachments`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
            }

            toast.success('Request created!');
            navigate({ to: '/dashboard' });
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        } finally {
            setUploading(false);
        }
    }

    if (isLoading) return <div className="p-4">Loading categories...</div>;

    return (
        <div className={`p-6 max-w-2xl mx-auto space-y-6 ${className || ''}`}>
            <h2 className="text-2xl font-bold tracking-tight">New Request</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-xl shadow-sm p-6 space-y-4">
                <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input {...register('description')} />
                    {formState.errors.description && (
                        <FieldDescription className="text-red-500">
                            {formState.errors.description.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Value (BRL)</FieldLabel>
                    <Input type="number" step="0.01" {...register('value')} />
                    {formState.errors.value && (
                        <FieldDescription className="text-red-500">
                            {formState.errors.value.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Expense Date</FieldLabel>
                    <Input type="date" max={new Date().toISOString().split('T')[0]} {...register('expenseDate')} />
                    {formState.errors.expenseDate && (
                        <FieldDescription className="text-red-500">
                            {formState.errors.expenseDate.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Category</FieldLabel>
                    <select className="w-full bg-background border rounded-lg px-3 py-2 text-sm" {...register('categoryId')}>
                        <option value="">Select...</option>
                        {categories
                            .filter((c: any) => c.active)
                            .map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                    </select>
                    {formState.errors.categoryId && (
                        <FieldDescription className="text-red-500">
                            {formState.errors.categoryId.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>
                        Attachment
                        {isAttachmentRequired ? ' (required)' : ' (Required above $500)'}
                    </FieldLabel>
                    <Input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png" />
                    {(fileError || (isAttachmentRequired && formState.isSubmitted && !fileInputRef.current?.files?.[0])) ? (
                        <FieldDescription className="text-red-500">
                            {fileError || 'Attachment is required for values over R$ 500'}
                        </FieldDescription>
                    ) : (
                        <FieldDescription>
                            PDF, JPG or PNG {!isAttachmentRequired && '— you can also add later'}
                        </FieldDescription>
                    )}
                </Field>

                <Button
                    disabled={!formState.isValid || formState.isSubmitting || uploading}
                    type="submit"
                >
                    {uploading ? 'Uploading...' : formState.isSubmitting ? 'Creating...' : 'Create Request'}
                </Button>
            </form>
        </div>
    );
}
