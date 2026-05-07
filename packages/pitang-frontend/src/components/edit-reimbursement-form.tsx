import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useEffect } from 'react';
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

export function EditReimbursementForm({ id, className }: { id: string; className?: string }) {
    const { data: categories, isLoading: loadingCategories } = useSWR('/categories', fetcher);
    const { data: request, isLoading: loadingRequest } = useSWR(`/reimbursements/${id}`, fetcher);
    const navigate = useNavigate();

    const { register, handleSubmit, formState, reset } = useForm<RequestSchema>({
        resolver: zodResolver(requestSchema),
        mode: 'onBlur',
    });

    useEffect(() => {
        if (request) {
            reset({
                description: request.description,
                value: Number(request.value),
                expenseDate: dayjs(request.expenseDate).format('YYYY-MM-DD'),
                categoryId: request.categoryId,
            });
        }
    }, [request, reset]);

    async function onSubmit(data: RequestSchema) {
        try {
            await fetcher.put(`/reimbursements/${id}`, data);
            toast.success('Request updated!');
            navigate({ to: `/dashboard/reimbursements/${id}` });
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    if (loadingCategories || loadingRequest) return <div className="p-4">Loading...</div>;

    const categoriesList = categories?.items ?? [];

    return (
        <div className={`p-4 max-w-2xl mx-auto space-y-6 ${className || ''}`}>
            <h2 className="text-2xl font-bold">Edit Request</h2>
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
                    <FieldLabel>Expense Date</FieldLabel>
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
                        {categoriesList
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

                <div className="flex gap-2">
                    <Button
                        disabled={!formState.isValid || formState.isSubmitting}
                        type="submit"
                    >
                        {formState.isSubmitting ? 'Updating...' : 'Update Request'}
                    </Button>
                    <Button variant="outline" type="button" onClick={() => navigate({ to: `/dashboard/reimbursements/${id}` })}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
