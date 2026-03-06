import { z } from "zod";

// Communications
export const sendMessageSchema = z.object({
    content: z.string().min(1, "لا يمكن إرسال رسالة فارغة").max(2000, "النص طويل جداً"),
    receiverId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
});

export const supportTicketSchema = z.object({
    type: z.string().min(1, "نوع التذكرة مطلوب"),
    priority: z.string().min(1, "الأولوية مطلوبة"),
    title: z.string().min(3, "عنوان التذكرة قصير جداً").max(100, "عنوان التذكرة طويل جداً"),
    description: z.string().min(10, "برجاء كتابة وصف أطول للمشكلة").max(5000, "الوصف طويل جداً"),
});

// Projects
export const createProjectSchema = z.object({
    name: z.string().min(2, "اسم المشروع قصير جداً").max(100, "اسم المشروع طويل جداً"),
    description: z.string().max(1000, "الوصف طويل جداً").optional().nullable(),
    budget: z.coerce.number().min(0, "الميزانية يجب أن تكون رقماً موجباً").optional().nullable(),
    custody: z.coerce.number().min(0, "رصيد العهدة يجب أن يكون رقماً موجباً").optional().nullable(),
    memberIds: z.string().optional().nullable(),
});


