import { z } from "zod";

export const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    role: z.enum(["EMPLOYEE", "MANAGER", "FINANCE", "ADMIN"]),
});

export const categorySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    active: z.coerce.boolean().default(true),
});

export const createRequestSchema = z.object({
    categoryId: z.string().min(1, "Categoria é obrigatória"),
    description: z.string().min(1, "Descrição é obrigatória"),
    value: z.coerce.number().positive("Valor deve ser maior que zero"),
    expenseDate: z.string().min(1, "Data da despesa é obrigatória"),
});

export const rejectRequestSchema = z.object({
    rejectionJustification: z.string().min(1, "Justificativa é obrigatória"),
});

export const attachmentSchema = z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string().refine(
        (type) => ["application/pdf", "image/jpeg", "image/png"].includes(type),
        "Tipos permitidos: PDF, JPG e PNG",
    ),
});

export const paginationQuery = z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().max(100).default(20),
    sort: z.enum(['asc', 'desc']).default('asc'),
});
