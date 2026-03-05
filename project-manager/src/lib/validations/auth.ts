import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
