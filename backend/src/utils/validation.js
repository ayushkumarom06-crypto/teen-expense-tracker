import { z } from 'zod';

const date = z.iso.date();
const amount = z.coerce.number().finite().positive().max(100000000);
const optionalText = (max = 500) => z.string().trim().max(max).optional().default('');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()), password: z.string().min(1).max(72) });
export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  monthly_allowance: z.coerce.number().finite().min(0).max(100000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  budget_period: z.enum(['weekly', 'monthly']),
});
export const expenseSchema = z.object({
  amount,
  category_id: z.uuid(),
  description: z.string().trim().min(1).max(120),
  expense_date: date,
  payment_method: z.enum(['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other']),
  notes: optionalText(500),
});
export const budgetSchema = z.object({
  category_id: z.uuid(), amount,
  period: z.enum(['weekly', 'monthly']),
  start_date: date, end_date: date,
}).refine((value) => value.end_date >= value.start_date, { message: 'End date must be on or after the start date.' });
export const goalSchema = z.object({
  name: z.string().trim().min(1).max(100),
  target_amount: amount,
  current_amount: z.coerce.number().finite().min(0).max(100000000),
  target_date: date.nullable().optional(),
  description: optionalText(500),
}).refine((value) => value.current_amount <= value.target_amount, { message: 'Saved amount cannot be greater than the target.' });

export function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(' ');
    throw Object.assign(new Error(message), { status: 400 });
  }
  return result.data;
}