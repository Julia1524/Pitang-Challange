import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
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

    const { register, handleSubmit, formState } = useForm<RequestSchema>({
        resolver: zodResolver(requestSchema),
        mode: 'onChange',
    });

    const categories = data?.items ?? [];

    async function onSubmit(data: RequestSchema) {
        try {
            await fetcher.post('/reimbursements', data);
            toast.success('Request created!');
            navigate({ to: '/dashboard' });
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    if (isLoading) return <div className="p-4">Loading categories...</div>;

    return (
        <div className={`p-4 max-w-2xl mx-auto space-y-6 ${className || ''}`}>
            <h2 className="text-2xl font-bold">New Request</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <FieldLabel>Date</FieldLabel>
                    <Input type="date" {...register('expenseDate')} />
                    {formState.errors.expenseDate && (
                        <FieldDescription className="text-red-500">
                            {formState.errors.expenseDate.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Category</FieldLabel>
                    <select className="w-full p-2 border rounded" {...register('categoryId')}>
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

                <Button
                    disabled={!formState.isValid || formState.isSubmitting}
                    type="submit"
                >
                    {formState.isSubmitting ? 'Creating request...' : 'Create Request'}
                </Button>
            </form>
        </div>
    );
}
