import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { Fragment } from 'react/jsx-runtime';

import { AppSidebar } from '@/components/app-sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { getCookie } from '@/hooks/use-auth';

export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
    beforeLoad: () => {
        const token = getCookie('@pitang/accessToken');
        if (!token) {
            throw redirect({ to: '/login' });
        }
    },
});

function RouteComponent() {
    const location = useLocation();

                    const paths = location.pathname.split('/').filter(Boolean);

                    const labelMap: Record<string, string> = {
                        dashboard: 'Dashboard',
                        reimbursements: 'Requests',
                        users: 'Users',
                        categories: 'Categories',
                        profile: 'Profile',
                        new: 'New',
                        edit: 'Edit',
                    };

                    const filtered = paths.filter(p => labelMap[p] !== undefined);

                    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            className="mr-2 data-[orientation=vertical]:h-4"
                            orientation="vertical"
                        />

                        <Breadcrumb>
                            <BreadcrumbList>
                                {filtered.map((path, index) => {
                                    const lastPath = index + 1 === filtered.length;
                                    const label = labelMap[path] || path;

                                    return (
                                        <Fragment key={path}>
                                            <BreadcrumbItem>
                                                <BreadcrumbPage
                                                    className={`capitalize ${lastPath ? 'font-bold' : ''}`}
                                                >
                                                    {label}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>

                                            {!lastPath && (
                                                <BreadcrumbSeparator className="hidden md:block" />
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
