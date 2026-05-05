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

export const registerSchema = z
    .object({
        name: z.string().min(3, 'Name must be at least 3 characters'),
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN']),
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

export const requestSchema = z.object({
    description: z.string().min(3),
    value: z.coerce.number().positive(),
    expenseDate: z.string().min(1),
    categoryId: z.string().min(1),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type RequestSchema = z.infer<typeof requestSchema>;
