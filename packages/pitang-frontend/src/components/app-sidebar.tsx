import {
    ListIcon,
    PlusCircleIcon,
    SettingsIcon,
    TerminalIcon,
    UsersIcon,
    UserIcon,
} from 'lucide-react';
import { useContext } from 'react';

import { NavProjects } from '@/components/nav-projects';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { AppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/use-auth';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { handleLogout } = useAuth();
    const [{ loggedUser }] = useContext(AppContext);

    const role = loggedUser?.role;
    const isAdmin = role === 'ADMIN';
    const isManager = role === 'MANAGER';
    const isFinance = role === 'FINANCE';
    const isEmployee = role === 'EMPLOYEE';

    const projects = [
        {
            icon: <ListIcon />,
            name: 'Requests',
            url: '/dashboard',
        },
        {
            icon: <UserIcon />,
            name: 'My Profile',
            url: '/dashboard/profile',
        },
        ...(isEmployee? [
                  {
                      icon: <PlusCircleIcon />,
                      name: 'New Request',
                      url: '/dashboard/reimbursements/new',
                  },
              ]
            : []),
        ...(isAdmin? [
                  {
                      icon: <UsersIcon />,
                      name: 'Users',
                      url: '/dashboard/users',
                  },
                  {
                      icon: <SettingsIcon />,
                      name: 'Categories',
                      url: '/dashboard/categories',
                  },
              ]
            : []),
    ];

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton render={<a href="#" />} size="lg">
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <TerminalIcon className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {loggedUser?.name || 'Usuário'}
                                </span>
                                <span className="truncate text-xs">
                                    {role || 'N/A'}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavProjects projects={projects} />
                <NavSecondary className="mt-auto" items={[]} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    handleLogout={handleLogout}
                    user={{
                        avatar: '',
                        email: loggedUser?.email || '',
                        name: loggedUser?.name || '',
                    }}
                />
            </SidebarFooter>
        </Sidebar>
    );
}
