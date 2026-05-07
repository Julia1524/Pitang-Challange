import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { loginSchema, type LoginSchema } from '@/zodSchemas';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'form'>) {
    const { handleLogin } = useAuth();

    const { formState, handleSubmit, register } = useForm<LoginSchema>({
        defaultValues: {
            password: '',
            email: '',
        },
        mode: 'onBlur',
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginSchema) {
        await handleLogin(data);
    }

    return (
        <form
            className={cn('flex flex-col gap-6', className)}
            onSubmit={handleSubmit(onSubmit)}
            {...props}
        >
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">
                        Login 
                    </h1>
                    <p className="text-muted-foreground text-balance text-sm">
                        Sign in to your account to access the dashboard
                    </p>
                </div>

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

                <Field data-invalid={!!formState.errors.password}>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                    </div>
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

                <Field>
                    <Button
                        disabled={!formState.isValid || formState.isSubmitting}
                        type="submit"
                    >
                        {formState.isSubmitting ? 'Logging in...' : 'Login'}
                    </Button>
                </Field>
                <FieldSeparator></FieldSeparator>
                <Field>
                    
                    <FieldDescription className="text-center">
                        Don&apos;t have an account?{' '}
                        <Link
                            className="underline underline-offset-4"
                            to="/register"
                        >
                            Sign up
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
