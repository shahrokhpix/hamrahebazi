import { describe, expect, it } from "vitest";
import {
  ageInYears,
  canConfirmHold,
  canCreateHold,
  canPlayerCancel,
  endSession,
  isEligible,
  mismatchLeavesSession,
  netPaidRial,
  normalizePhone,
  organizerPhoneVisible,
  paymentFailureReleasesHold,
  promotionStatus,
  releaseSlot,
  shouldExpireForQuorum,
  slotsOverlap,
} from "./decisions";

const now = new Date("2026-11-03T12:00:00.000Z");

describe("phone and eligibility", () => {
  it("normalizes Persian digits and rejects a public phone-shaped id", () => {
    expect(normalizePhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizePhone("+989123456789")).toBe("09123456789");
    expect(normalizePhone("12345")).toBeNull();
  });

  it("ignores school and applies age plus gender only", () => {
    const birth = new Date("2016-11-03T00:00:00.000Z");
    expect(ageInYears(birth, now)).toBe(10);
    expect(
      isEligible({
        birthDate: birth,
        gender: "female",
        at: now,
        ageMin: 8,
        ageMax: 12,
        genderConstraint: null,
      }),
    ).toBe(true);
    expect(
      isEligible({
        birthDate: birth,
        gender: "female",
        at: now,
        ageMin: 8,
        ageMax: null,
        genderConstraint: "male",
      }),
    ).toBe(false);
  });
});

describe("seat allocation", () => {
  it("refuses the second hold on the last seat", () => {
    expect(
      canCreateHold({
        sessionStatus: "open",
        reservedCount: 1,
        pendingUnexpired: 0,
        maxPlayers: 2,
        profileBlocked: false,
        eligible: true,
      }).ok,
    ).toBe(true);
    expect(
      canCreateHold({
        sessionStatus: "open",
        reservedCount: 1,
        pendingUnexpired: 1,
        maxPlayers: 2,
        profileBlocked: false,
        eligible: true,
      }),
    ).toEqual({ ok: false, reason: "full" });
  });

  it("refuses a second active seat for the same profile", () => {
    expect(
      canCreateHold({
        sessionStatus: "open",
        reservedCount: 0,
        pendingUnexpired: 0,
        maxPlayers: 4,
        profileBlocked: true,
        eligible: true,
      }),
    ).toEqual({ ok: false, reason: "duplicate_profile" });
  });

  it("does not reserve a seat when payment fails or the hold is expired", () => {
    expect(paymentFailureReleasesHold()).toBe(true);
    expect(
      canConfirmHold({
        bookingStatus: "pending_payment",
        holdExpiresAt: new Date(now.getTime() - 1),
        now,
        sessionStatus: "open",
        reservedCount: 0,
        maxPlayers: 2,
      }),
    ).toEqual({ ok: false, reason: "hold_expired" });
  });

  it("promotes only after the stored count reaches the quorum", () => {
    expect(promotionStatus(1, 2, "open")).toBe("open");
    expect(promotionStatus(2, 2, "open")).toBe("confirmed");
  });

  it("rejects the claim once reservedCount is already at max", () => {
    expect(
      canConfirmHold({
        bookingStatus: "pending_payment",
        holdExpiresAt: new Date(now.getTime() + 60_000),
        now,
        sessionStatus: "open",
        reservedCount: 2,
        maxPlayers: 2,
      }),
    ).toEqual({ ok: false, reason: "full" });
  });
});

describe("cancel, expiry, and slot release", () => {
  it("lets a player cancel only before confirmation and then releases nothing but the seat", () => {
    expect(canPlayerCancel("open", "reserved")).toEqual({ ok: true });
    expect(canPlayerCancel("confirmed", "reserved")).toEqual({
      ok: false,
      reason: "cancel_closed",
    });
  });

  it("cancels an under-quorum session at start and releases the slot", () => {
    expect(
      shouldExpireForQuorum({
        status: "open",
        reservedCount: 1,
        minPlayers: 2,
        startsAt: now,
        now,
      }),
    ).toBe(true);
    expect(
      shouldExpireForQuorum({
        status: "open",
        reservedCount: 2,
        minPlayers: 2,
        startsAt: now,
        now,
      }),
    ).toBe(false);
    expect(releaseSlot()).toEqual({ status: "open", currentSessionId: null });
  });

  it("refunds the full charge and does not bill other players", () => {
    expect(
      netPaidRial([
        { type: "charge", amountRial: 1500 },
        { type: "refund", amountRial: 1500 },
      ]),
    ).toBe(0);
  });

  it("treats overlapping table slots as a conflict", () => {
    const start = now;
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    expect(slotsOverlap(start, end, new Date(start.getTime() + 1000), end)).toBe(true);
    expect(slotsOverlap(start, end, end, new Date(end.getTime() + 1000))).toBe(false);
  });
});

describe("attendance and privacy", () => {
  it("hides the organizer phone until the session is confirmed for that account", () => {
    expect(
      organizerPhoneVisible({ sessionStatus: "open", viewerBookingStatus: "reserved" }),
    ).toBe(false);
    expect(
      organizerPhoneVisible({ sessionStatus: "confirmed", viewerBookingStatus: "reserved" }),
    ).toBe(true);
    expect(
      organizerPhoneVisible({ sessionStatus: "confirmed", viewerBookingStatus: null }),
    ).toBe(false);
  });

  it("records a mismatch without cancelling the session", () => {
    expect(mismatchLeavesSession("confirmed")).toBe("confirmed");
  });

  it("marks unchecked reserved players as no-show when the organizer ends", () => {
    expect(
      endSession({ status: "in_progress", bookings: ["checked_in", "reserved", "refunded"] }),
    ).toMatchObject({
      ok: true,
      nextStatus: "completed",
      bookings: ["completed", "no_show", "refunded"],
    });
  });
});
