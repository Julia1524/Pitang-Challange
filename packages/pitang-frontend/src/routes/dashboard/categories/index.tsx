import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { formatDate } from '@/lib/date-format';

export const Route = createFileRoute('/dashboard/categories/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data, error, mutate } = useSWR('/categories', fetcher);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const categories = data?.items ?? [];

    async function createCategory() {
        try {
            await fetcher.post('/categories', { name, active: true });
            toast.success('Category created!');
            setName('');
            mutate();
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    async function toggleStatus(category: any) {
        try {
            await fetcher.put(`/categories/${category.id}`, { active: !category.active });
            mutate();
        } catch (error) {
            if (error instanceof FetcherError) toast.error(error.info.message);
        }
    }

    function startEdit(category: any) {
        setEditingId(category.id);
        setEditName(category.name);
    }

    async function saveEdit(id: string) {
        if (!editName.trim()) return;

        try {
            await fetcher.put(`/categories/${id}`, { name: editName.trim() });
            toast.success('Category updated!');
            setEditingId(null);
            mutate();
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    async function deleteCategory(id: string) {
        toast('Are you sure you want to delete this category?', {
            action: {
                label: 'Yes, delete',
                onClick: async () => {
                    try {
                        await fetcher.delete(`/categories/${id}`);
                        toast.success('Category deleted!');
                        mutate();
                    } catch (error) {
                        if (error instanceof FetcherError) {
                            toast.error(error.info.message);
                        }
                    }
                },
            },
            cancel: {
                label: 'Cancel',
            },
        });
    }

    if (error) return <div className="p-6 text-red-500">Error loading categories.</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>

            <div className="bg-card border rounded-xl shadow-sm p-5 space-y-3">
                <Field>
                    <FieldLabel>New Category</FieldLabel>
                    <div className="flex gap-2">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
                        <Button onClick={createCategory} disabled={!name}>Add</Button>
                    </div>
                </Field>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="p-3.5 text-left font-semibold text-muted-foreground">Name</th>
                            <th className="p-3.5 text-center font-semibold text-muted-foreground">Status</th>
                            <th className="p-3.5 text-center font-semibold text-muted-foreground">Created</th>
                            <th className="p-3.5 text-right font-semibold text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat: any) => (
                            <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                {editingId === cat.id ? (
                                    <>
                                        <td className="p-3.5">
                                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {cat.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center text-muted-foreground">{formatDate(cat.createdAt)}</td>
                                        <td className="p-3.5 text-right space-x-1">
                                            <Button size="sm" onClick={() => saveEdit(cat.id)} disabled={!editName.trim()}>Save</Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-3.5 font-medium">{cat.name}</td>
                                        <td className="p-3.5 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {cat.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center text-muted-foreground">{formatDate(cat.createdAt)}</td>
                                        <td className="p-3.5 text-right space-x-1">
                                            <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>Edit</Button>
                                            <Button size="sm" variant="outline" onClick={() => toggleStatus(cat)}>
                                                {cat.active ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => deleteCategory(cat.id)}>Delete</Button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-3.5 py-2.5 text-xs text-muted-foreground border-t bg-muted/20">
                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                </div>
            </div>
        </div>
    );
}
