import { describe, expect, it } from "vitest";
import { contactSchema, eventSchema, loginSchema, registerSchema, teamRegisterSchema } from "@/lib/validators";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.edu", password: "secret1" }).success).toBe(true);
  });
  it("rejects bad email and short password", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "123" });
    expect(r.success).toBe(false);
  });
});

describe("registerSchema (student)", () => {
  const base = {
    name: "Aarav Kumar",
    usn: "1PI23CS099",
    email: "aarav@x.edu",
    phone: "9810020030",
    departmentId: "d_cse",
    semester: 5,
    password: "secret1",
    confirm: "secret1",
  };
  it("accepts a complete student registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });
  it("rejects malformed USN", () => {
    expect(registerSchema.safeParse({ ...base, usn: "1PI-XX" }).success).toBe(false);
  });
  it("rejects semester outside 1-8", () => {
    expect(registerSchema.safeParse({ ...base, semester: 9 }).success).toBe(false);
  });
  it("rejects a non-10-digit phone", () => {
    expect(registerSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
  });
});

describe("teamRegisterSchema", () => {
  it("rejects short team names", () => {
    expect(teamRegisterSchema.safeParse({ teamName: "AB", memberUsns: [] }).success).toBe(false);
  });
});

describe("eventSchema", () => {
  const base = {
    title: "Robo Night",
    category: "Technical",
    description: "A thirty-plus character description of the robotics night event.",
    poster: "grad:aurora",
    date: "2030-04-10",
    startTime: "09:00",
    endTime: "17:00",
    venueId: "v_aud",
    fee: 0,
    capacity: 100,
    regDeadline: "2030-04-08",
    eligibility: "All students",
    rules: ["Carry ID card"],
    facultyId: "u_fac1",
    teamSizeMin: 1,
    teamSizeMax: 4,
    featured: false,
  };
  it("accepts a coherent event", () => {
    expect(eventSchema.safeParse(base).success).toBe(true);
  });
  it("rejects max team size below min", () => {
    expect(eventSchema.safeParse({ ...base, teamSizeMin: 4, teamSizeMax: 2 }).success).toBe(false);
  });
  it("rejects deadline after event date", () => {
    expect(eventSchema.safeParse({ ...base, regDeadline: "2030-04-11" }).success).toBe(false);
  });
  it("rejects empty rules", () => {
    expect(eventSchema.safeParse({ ...base, rules: [] }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("requires a 20+ char message", () => {
    const r = contactSchema.safeParse({ name: "Diya Patel", email: "d@x.edu", subject: "Hello", message: "too short" });
    expect(r.success).toBe(false);
  });
});
