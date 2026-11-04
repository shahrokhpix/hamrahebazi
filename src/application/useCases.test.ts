import { describe, expect, it } from "vitest";
import { cancelReservedSeat, createHold, expireDueSession, recordMismatch, settlePayment } from "@/application/useCases";
import { netPaidRial } from "@/domain/decisions";
import { MemoryStore, seedSession, type MemoryState } from "@/infrastructure/memoryStore";

const now = new Date("2026-11-03T12:00:00.000Z");

function storeWith(session = seedSession()): { store: MemoryStore; state: MemoryState } {
  const state: MemoryState = {
    sessions: [session],
    bookings: [],
    ledger: [],
    slots: [
      {
        id: session.slotId,
        currentSessionId: session.id,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        tableId: "table-1",
      },
    ],
    notifications: [],
    tickets: [],
  };
  return { store: new MemoryStore(state), state };
}

async function hold(
  store: MemoryStore,
  id: string,
  profileId: string,
): Promise<void> {
  const created = await createHold(store, {
    bookingId: id,
    sessionId: "session-1",
    profileId,
    accountId: profileId,
    eligible: true,
    now,
  });
  expect(created.ok).toBe(true);
}

describe("reservation use cases", () => {
  it("gives the last seat to the first payment and refunds the second capture", async () => {
    const { store, state } = storeWith(seedSession({ maxPlayers: 2, minPlayers: 2, reservedCount: 1 }));
    state.bookings.push({
      id: "already",
      sessionId: "session-1",
      playerProfileId: "p0",
      accountId: "p0",
      status: "reserved",
      amountRial: 1_500_000,
      holdExpiresAt: null,
      attendanceCode: null,
      activeKey: "session-1:p0",
    });
    const pending = {
      status: "pending_payment" as const,
      amountRial: 1_500_000,
      holdExpiresAt: new Date(now.getTime() + 60_000),
      attendanceCode: null,
    };
    state.bookings.push(
      { ...pending, id: "b1", sessionId: "session-1", playerProfileId: "p1", accountId: "p1", activeKey: "session-1:p1" },
      { ...pending, id: "b2", sessionId: "session-1", playerProfileId: "p2", accountId: "p2", activeKey: "session-1:p2" },
    );
    expect((await settlePayment(store, { bookingId: "b1", now, paid: true })).ok).toBe(true);
    expect(await settlePayment(store, { bookingId: "b2", now, paid: true })).toEqual({
      ok: false,
      reason: "full",
    });
    expect(state.sessions[0]?.reservedCount).toBe(2);
    expect(state.bookings.map((booking) => booking.id).sort()).toEqual(["already", "b1"]);
    expect(netPaidRial(state.ledger.filter((entry) => entry.accountId === "p2"))).toBe(0);
    expect(state.sessions[0]?.status).toBe("confirmed");
  });

  it("does not reserve or charge when payment fails", async () => {
    const { store, state } = storeWith();
    await hold(store, "b1", "p1");
    expect(await settlePayment(store, { bookingId: "b1", now, paid: false })).toEqual({
      ok: false,
      reason: "payment_failed",
    });
    expect(state.bookings).toHaveLength(0);
    expect(state.ledger).toHaveLength(0);
    expect(state.sessions[0]?.reservedCount).toBe(0);
  });

  it("lets the same profile book again only after a full refund", async () => {
    const session = seedSession({ maxPlayers: 4, minPlayers: 2 });
    const { store, state } = storeWith(session);
    await hold(store, "b1", "p1");
    await settlePayment(store, { bookingId: "b1", now, paid: true });
    const duplicate = await createHold(store, {
      bookingId: "b2",
      sessionId: "session-1",
      profileId: "p1",
      accountId: "p1",
      eligible: true,
      now,
    });
    expect(duplicate).toEqual({ ok: false, reason: "duplicate_profile" });
    expect((await cancelReservedSeat(store, { bookingId: "b1", accountId: "p1" })).ok).toBe(true);
    expect(state.sessions[0]?.reservedCount).toBe(0);
    expect(netPaidRial(state.ledger)).toBe(0);
    expect(state.slots[0]?.currentSessionId).toBe("session-1");
    const again = await createHold(store, {
      bookingId: "b3",
      sessionId: "session-1",
      profileId: "p1",
      accountId: "p1",
      eligible: true,
      now,
    });
    expect(again.ok).toBe(true);
  });

  it("refunds every reserved seat and frees the slot when quorum is missed", async () => {
    const session = seedSession({
      maxPlayers: 4,
      minPlayers: 2,
      reservedCount: 0,
      startsAt: now,
    });
    const { store, state } = storeWith(session);
    await hold(store, "b1", "p1");
    await settlePayment(store, { bookingId: "b1", now, paid: true });
    expect((await expireDueSession(store, { sessionId: "session-1", now })).ok).toBe(true);
    expect(state.sessions[0]?.status).toBe("cancelled");
    expect(state.sessions[0]?.reservedCount).toBe(0);
    expect(state.slots[0]?.currentSessionId).toBeNull();
    expect(netPaidRial(state.ledger)).toBe(0);
    expect(state.bookings[0]?.status).toBe("refunded");
  });

  it("confirms on the second reserved seat and keeps a mismatch from cancelling it", async () => {
    const { store, state } = storeWith(seedSession({ maxPlayers: 4, minPlayers: 2 }));
    await hold(store, "b1", "p1");
    await hold(store, "b2", "p2");
    await settlePayment(store, { bookingId: "b1", now, paid: true });
    expect(state.sessions[0]?.status).toBe("open");
    await settlePayment(store, { bookingId: "b2", now, paid: true });
    expect(state.sessions[0]?.status).toBe("confirmed");
    expect(state.notifications.some((item) => item.body.includes("۱۰ درصد"))).toBe(true);
    const closed = await cancelReservedSeat(store, { bookingId: "b1", accountId: "p1" });
    expect(closed).toEqual({ ok: false, reason: "cancel_closed" });
    expect((await recordMismatch(store, { bookingId: "b1", organizerAccountId: "organizer", reason: "سن نمی‌خواند" })).ok).toBe(true);
    expect(state.sessions[0]?.status).toBe("confirmed");
    expect(state.tickets).toHaveLength(1);
  });
});
