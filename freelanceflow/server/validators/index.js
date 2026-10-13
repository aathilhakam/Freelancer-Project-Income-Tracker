import { z } from "zod";
const name = z.string().trim().min(2).max(120);
const optional = (max = 1000) =>
  z.string().trim().max(max).optional().default("");
const id = z.string().regex(/^[a-f\d]{24}$/i, "Select a valid record");
const date = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Enter a valid date",
  );
const money = z
  .number()
  .finite()
  .min(0)
  .max(1e10)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001,
    "Use at most two decimal places",
  );
export const password = z.string().min(8, "Use at least 8 characters").max(128);
export const register = z.object({
  name,
  email: z.string().trim().email().toLowerCase(),
  password,
});
export const login = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(128),
});
export const client = z.object({
  name,
  email: z
    .union([z.string().trim().email(), z.literal("")])
    .optional()
    .default(""),
  phone: optional(50),
  company: optional(120),
  address: optional(500),
  notes: optional(3000),
});
export const project = z
  .object({
    name,
    clientId: id,
    description: optional(3000),
    fee: money,
    startDate: date,
    deadline: date,
    status: z.enum([
      "Pending",
      "In Progress",
      "Completed",
      "On Hold",
      "Cancelled",
    ]),
    priority: z.enum(["Low", "Medium", "High"]),
  })
  .refine((v) => v.deadline >= v.startDate, {
    path: ["deadline"],
    message: "Deadline must be on or after start date",
  });
export const payment = z.object({
  projectId: id,
  amount: money.refine((v) => v > 0, "Amount must be positive"),
  paymentDate: date.refine(
    (v) => v <= new Date().toISOString().slice(0, 10),
    "Payment date cannot be in the future",
  ),
  paymentMethod: z.enum(["Bank Transfer", "Cash", "Card", "Other"]),
  reference: optional(120),
  notes: optional(3000),
});
export const profile = z.object({
  name,
  email: z.string().trim().email().toLowerCase(),
  preferredCurrency: z.enum(["USD", "LKR", "EUR", "GBP", "INR", "AUD", "CAD"]),
});
export const changePassword = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
export function parse(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = new Error(
      result.error.issues
        .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
        .join("; "),
    );
    error.status = 400;
    throw error;
  }
  return result.data;
}
