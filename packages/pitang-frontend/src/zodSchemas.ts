import z from 'zod';

const passwordSchema = z
    .string()
    .min(8, { message: 'Password should have minimum length of 8' })
    .max(15, 'Password is too long')
    .regex(/^(?=.*[A-Z]).{8,}$/, {
        message:
            'Should Contain at least one uppercase letter and have a minimum length of 8 characters.',
    });

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string(),
});

export const registerSchema = loginSchema
    .extend({
        confirmPassword: passwordSchema,
        email: z.email().refine((email) => !email.includes('@gmail.com'), {
            error: 'Gmail is banned',
        }),
        password: passwordSchema,
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: 'custom',
                message: 'Passwords do not match',
                path: ['confirmPassword'],
            });
        }
    });

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
