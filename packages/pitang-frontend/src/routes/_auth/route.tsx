import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Receipt } from 'lucide-react';

export const Route = createFileRoute('/_auth')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a className="flex items-center gap-2 font-medium" href="#">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <Receipt className="size-4" />
                        </div>
                        Pitang
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <Outlet />
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-emerald-600 to-cyan-700 p-10">
                <div className="max-w-md text-center text-white space-y-6">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                        <Receipt className="size-10" />
                    </div>
                    <h2 className="text-3xl font-bold">Pitang</h2>
                    <p className="text-white/80 text-lg leading-relaxed">
                        Manage your reimbursements easily and quickly.
                        Create requests, track status, and get paid without hassle.
                    </p>
                </div>
            </div>
        </div>
    );
}
