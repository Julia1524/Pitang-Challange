export interface LoggedUser {
    id: string;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
}
