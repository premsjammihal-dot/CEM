import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Enter your full name"),
  usn: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,15}$/, "USN must be 6–15 alphanumeric characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Enter a 10-digit phone number"),
  departmentId: z.string().min(1, "Select a department"),
  semester: z.coerce.number().int().min(1, "Semester 1–8").max(8, "Semester 1–8"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
});

export const passwordChangeSchema = z.object({
  current: z.string().min(6, "Enter your current password"),
  next: z.string().min(6, "New password must be at least 6 characters"),
  confirm: z.string(),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(4, "Title must be at least 4 characters").max(80),
    category: z.string().min(1, "Select a category"),
    description: z.string().trim().min(30, "Description must be at least 30 characters"),
    poster: z.string().min(1),
    date: z.string().min(1, "Pick an event date"),
    startTime: z.string().min(1, "Start time required"),
    endTime: z.string().min(1, "End time required"),
    venueId: z.string().min(1, "Select a venue"),
    fee: z.coerce.number().int().min(0, "Fee cannot be negative").max(100000),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(5000),
    regDeadline: z.string().min(1, "Registration deadline required"),
    eligibility: z.string().trim().min(3, "Describe eligibility"),
    rules: z.array(z.string().trim().min(3, "Rule too short")).min(1, "Add at least one rule"),
    facultyId: z.string().min(1, "Assign a faculty judge"),
    teamSizeMin: z.coerce.number().int().min(1).max(12),
    teamSizeMax: z.coerce.number().int().min(1).max(12),
    featured: z.boolean(),
  })
  .refine((v) => v.teamSizeMax >= v.teamSizeMin, {
    message: "Max team size must be ≥ min",
    path: ["teamSizeMax"],
  })
  .refine((v) => new Date(v.regDeadline) <= new Date(v.date + "T23:59:59"), {
    message: "Deadline must be on or before the event date",
    path: ["regDeadline"],
  });

export type EventFormValues = z.infer<typeof eventSchema>;

export const teamRegisterSchema = z.object({
  teamName: z.string().trim().min(3, "Team name must be at least 3 characters").max(30),
  memberUsns: z.array(z.string().trim().min(3, "Enter a valid USN")),
});

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  comment: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(500),
});

export const scoreSchema = z.object({
  innovation: z.coerce.number().min(0).max(10),
  execution: z.coerce.number().min(0).max(10),
  presentation: z.coerce.number().min(0).max(10),
});

export const contactSchema = z.object({
  name: z.string().trim().min(3, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  subject: z.string().trim().min(3, "Subject required"),
  message: z.string().trim().min(20, "Message must be at least 20 characters"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(3, "Enter your full name"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Enter a 10-digit phone number"),
  semester: z.coerce.number().int().min(1).max(8),
});

export const venueSchema = z.object({
  name: z.string().trim().min(3, "Venue name required"),
  location: z.string().trim().min(3, "Location required"),
  capacity: z.coerce.number().int().min(10, "Capacity must be at least 10"),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(3, "Department name required"),
  code: z.string().trim().regex(/^[A-Z]{2,6}$/, "Code: 2–6 uppercase letters"),
});

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(3, "Enter full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Enter a 10-digit phone number"),
  role: z.enum(["coordinator", "faculty"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type FieldErrors = Record<string, string>;

/** Converts a ZodError into { field: message } for form display. */
export function zodErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
