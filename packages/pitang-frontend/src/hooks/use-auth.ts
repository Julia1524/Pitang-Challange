import { toast } from 'sonner';

import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';

import type { LoginSchema } from '@/zodSchemas';

export function getCookie(cookieName: string) {
    return document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${cookieName}=`))
        ?.split('=')[1];
}

export function useAuth() {

    async function getAuthenticatedUser() {
        const token = getCookie('@pitang/accessToken');
        if (!token) return null;

        return fetcher('/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async function handleLogout() {
        document.cookie = '@pitang/accessToken=; path=/; Max-Age=0';
        localStorage.removeItem('@pitang/swr');
        window.location.href = '/login';
    }

    async function handleLogin(data: LoginSchema) {
        try {
            const response = await fetcher.post('/auth/login', {
                email: data.email,
                password: data.password,
            });

            toast.success('Welcome...');

            document.cookie = `@pitang/accessToken=${response.token}; path=/; Max-Age=86400`;

            window.location.href = '/dashboard';
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    return {
        getAuthenticatedUser,
        handleLogin,
        handleLogout,
    };
}
