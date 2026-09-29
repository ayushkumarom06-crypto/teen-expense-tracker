import test from 'node:test';
import assert from 'node:assert/strict';
import { expenseSchema, parse, registerSchema } from '../src/utils/validation.js';

test('registration normalizes email and rejects weak passwords', () => {
  const result = parse(registerSchema, { fullName: 'Sam Patel', email: ' SAM@example.com ', password: 'student123' });
  assert.equal(result.email, 'sam@example.com');
  assert.throws(() => parse(registerSchema, { fullName: 'Sam Patel', email: 'sam@example.com', password: 'password' }), { status: 400 });
});

test('expense validation rejects non-positive amounts and malformed dates', () => {
  const expense = { amount: -5, category_id: 'b915147a-4bfd-4d4e-a562-113ef37bcdd8', description: 'Lunch', expense_date: '2026-02-30', payment_method: 'UPI' };
  assert.equal(expenseSchema.safeParse(expense).success, false);
  assert.equal(expenseSchema.safeParse({ ...expense, amount: 45, expense_date: '2026-09-29' }).success, true);
});