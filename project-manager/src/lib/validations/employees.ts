import { z } from "zod";

export const createEmployeeSchema = z.object({
    name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
    phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, "رقم الهاتف غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل"),
    role: z.enum(["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"]).default("USER"),
    jobTitle: z.string().optional(),
    salary: z.coerce.number().min(0, "الراتب يجب أن يكون رقماً موجباً").optional(),
});

