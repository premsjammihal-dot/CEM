import { z } from "zod";

export const expenseSchema = z.object({
  kind: z.enum(["income", "expense"]),
  category: z.string().trim().min(2, "Category required"),
  label: z.string().trim().min(3, "Description required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string().min(1, "Date required"),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
