import { createFileRoute, useParams } from '@tanstack/react-router';

import { EditReimbursementForm } from '@/components/edit-reimbursement-form';

export const Route = createFileRoute('/dashboard/reimbursements/edit/$id')({
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = useParams({ from: '/dashboard/reimbursements/edit/$id' });
    return <EditReimbursementForm id={id} />;
}
