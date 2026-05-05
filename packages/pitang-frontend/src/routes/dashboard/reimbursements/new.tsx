import { createFileRoute } from '@tanstack/react-router';

import { NewReimbursementForm } from '@/components/new-reimbursement-form';

export const Route = createFileRoute('/dashboard/reimbursements/new')({
    component: RouteComponent,
});

function RouteComponent() {
    return <NewReimbursementForm />;
}
