import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import fetcher from '@/lib/fetcher';
import FetcherError from '@/lib/FetcherError';
import { registerSchema, type RegisterSchema } from '@/zodSchemas';

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<'form'>) {
    const { formState, handleSubmit, register } = useForm<RegisterSchema>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'EMPLOYEE',
        },
        mode: 'onBlur',
        resolver: zodResolver(registerSchema),
    });

    async function onSubmit(data: RegisterSchema) {
        try {
            await fetcher.post('/users', {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
            });

            toast.success('Account created! Please login.');

            window.location.href = '/login';
        } catch (error) {
            if (error instanceof FetcherError) {
                toast.error(error.info.message);
            }
        }
    }

    return (
        <form
            className={cn('flex flex-col gap-6', className)}
            onSubmit={handleSubmit(onSubmit)}
            {...props}
        >
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Create an account</h1>
                    <p className="text-muted-foreground text-balance text-sm">
                        Enter your details below to sign up
                    </p>
                </div>

                <Field data-invalid={!!formState.errors.name}>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                        aria-invalid={!!formState.errors.name}
                        id="name"
                        {...register('name')}
                    />
                    {formState.errors.name?.message && (
                        <FieldDescription>
                            {formState.errors.name?.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field data-invalid={!!formState.errors.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        aria-invalid={!!formState.errors.email}
                        id="email"
                        type="email"
                        {...register('email')}
                    />
                    {formState.errors.email?.message && (
                        <FieldDescription>
                            {formState.errors.email?.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field data-invalid={!!formState.errors.role}>
                    <FieldLabel htmlFor="role">Role</FieldLabel>
                    <select
                        id="role"
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        {...register('role')}
                    >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="FINANCE">Finance</option>
                        <option value="ADMIN">Administrator</option>
                    </select>
                    {formState.errors.role?.message && (
                        <FieldDescription>
                            {formState.errors.role?.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field data-invalid={!!formState.errors.password}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                        aria-invalid={!!formState.errors.password}
                        id="password"
                        type="password"
                        {...register('password')}
                    />
                    {formState.errors.password?.message && (
                        <FieldDescription>
                            {formState.errors.password?.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field data-invalid={!!formState.errors.confirmPassword}>
                    <FieldLabel htmlFor="confirmPassword">
                        Confirm Password
                    </FieldLabel>
                    <Input
                        aria-invalid={!!formState.errors.confirmPassword}
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword')}
                    />
                    {formState.errors.confirmPassword?.message && (
                        <FieldDescription>
                            {formState.errors.confirmPassword?.message}
                        </FieldDescription>
                    )}
                </Field>

                <Field>
                    <Button
                        disabled={!formState.isValid || formState.isSubmitting}
                        type="submit"
                    >
                        {formState.isSubmitting ? 'Creating...' : 'Sign Up'}
                    </Button>
                </Field>

                <Field>
                    <FieldDescription className="text-center">
                        Already have an account?{' '}
                        <Link
                            className="underline underline-offset-4"
                            to="/login"
                        >
                            Login
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
