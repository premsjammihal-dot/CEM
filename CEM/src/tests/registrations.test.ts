import { beforeEach, describe, expect, it } from "vitest";
import { db, mutateDb, resetDemo } from "@/services/db";
import {
  cancelRegistration,
  checkInByQr,
  isRegistered,
  myRegistrations,
  registerIndividual,
  registerTeam,
} from "@/services/registrations";
import { activeRegCount } from "@/services/lookups";

beforeEach(() => {
  localStorage.clear();
  resetDemo();
});

describe("individual registration", () => {
  it("registers a student and mints a payment for paid events", () => {
    const before = db().payments.length;
    const res = registerIndividual("u_stu8", "e_hack"); // wait: e_hack needs team of 2 -> expect failure
    expect(res.ok).toBe(false);

    const ok = registerIndividual("u_stu8", "e_sports"); // solo, paid ₹99
    expect(ok.ok).toBe(true);
    expect(isRegistered("u_stu8", "e_sports")).toBe(true);
    expect(db().payments.length).toBe(before + 1);
  });

  it("blocks duplicates (unique event_id, student_id)", () => {
    const first = registerIndividual("u_stu8", "e_sports");
    const second = registerIndividual("u_stu8", "e_sports");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already registered/i);
  });

  it("enforces capacity exactly", () => {
    // e_design has cap 60 with 2 seeded registrations; shrink cap to 2
    mutateDb((s) => {
      s.events = s.events.map((e) => (e.id === "e_design" ? { ...e, capacity: 2 } : e));
    });
    expect(activeRegCount("e_design")).toBe(2);
    const res = registerIndividual("u_stu8", "e_design");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/full capacity/i);
  });
});

describe("team registration", () => {
  it("enforces team size bounds", () => {
    // e_hack requires 2-4; stu8 leads with zero members -> rejected
    const res = registerTeam("u_stu8", "e_hack", "Solo Glow", []);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/at least 2/i);
  });

  it("registers a full team and notifies members", () => {
    const res = registerTeam("u_stu8", "e_game", "Lag Switches", ["1PI23AI019"]);
    expect(res.ok).toBe(true);
    expect(isRegistered("u_stu8", "e_game")).toBe(true);
    expect(isRegistered("u_stu10", "e_game")).toBe(true);
    const notes = db().notifications.filter((n) => n.userId === "u_stu10");
    expect(notes.some((n) => n.title === "Added to a team")).toBe(true);
  });

  it("rejects unknown USNs and duplicate team names per event", () => {
    const bad = registerTeam("u_stu8", "e_game", "Lag Switches2", ["9XX99ZZ999"]);
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/no student found/i);

    registerTeam("u_stu8", "e_game", "Lag Switches", ["1PI23AI019"]);
    const dup = registerTeam("u_stu6", "e_game", "Lag Switches", []);
    expect(dup.ok).toBe(false);
    expect(dup.error).toMatch(/name already exists/i);
  });
});

describe("QR attendance", () => {
  it("checks in once and blocks the duplicate", () => {
    const first = checkInByQr("CS-TODY-ATTND1");
    expect(first.ok).toBe(true);
    expect(first.data?.studentName).toBe("Aarav Kumar");

    const dup = checkInByQr("CS-TODY-ATTND1");
    expect(dup.ok).toBe(false);
    expect(dup.error).toMatch(/already checked in/i);
  });

  it("rejects unknown codes", () => {
    const res = checkInByQr("CS-NOPE-XXXXXX");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/invalid qr/i);
  });
});

describe("cancellation", () => {
  it("cancels a confirmed upcoming registration", () => {
    const mine = myRegistrations("u_stu1");
    const design = mine.find((m) => m.event.id === "e_design")!;
    const res = cancelRegistration(design.reg.id, "u_stu1");
    expect(res.ok).toBe(true);
    expect(isRegistered("u_stu1", "e_design")).toBe(false);
  });

  it("refuses to cancel an attended registration", () => {
    const mine = myRegistrations("u_stu1");
    const done = mine.find((m) => m.event.id === "e_done")!;
    const res = cancelRegistration(done.reg.id, "u_stu1");
    expect(res.ok).toBe(false);
  });
});
