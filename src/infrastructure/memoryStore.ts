import type { BookingRecord, LedgerRecord, SessionRecord, SlotRecord } from "@/application/store";
import type { AppStore, UnitOfWork } from "@/application/store";

export type MemoryState = {
  sessions: SessionRecord[];
  bookings: BookingRecord[];
  ledger: LedgerRecord[];
  slots: SlotRecord[];
  notifications: { accountId: string; sessionId: string; body: string }[];
  tickets: { accountId: string; sessionId: string; bookingId: string; reason: string }[];
};

export class MemoryStore implements AppStore {
  constructor(readonly state: MemoryState) {}

  async transaction<T>(fn: (tx: UnitOfWork) => Promise<T>): Promise<T> {
    return fn(this.work());
  }

  private work(): UnitOfWork {
    const state = this.state;
    return {
      async getSession(id) {
        return state.sessions.find((session) => session.id === id) ?? null;
      },
      async getBooking(id) {
        return state.bookings.find((booking) => booking.id === id) ?? null;
      },
      async countPending(sessionId, now) {
        return state.bookings.filter(
          (booking) =>
            booking.sessionId === sessionId &&
            booking.status === "pending_payment" &&
            booking.holdExpiresAt !== null &&
            booking.holdExpiresAt.getTime() > now.getTime(),
        ).length;
      },
      async hasActiveKey(activeKey) {
        return state.bookings.some((booking) => booking.activeKey === activeKey);
      },
      async insertBooking(row) {
        if (state.bookings.some((booking) => booking.activeKey && booking.activeKey === row.activeKey)) {
          throw new Error("duplicate_profile");
        }
        state.bookings.push({ ...row });
      },
      async deleteBooking(id) {
        state.bookings = state.bookings.filter((booking) => booking.id !== id);
      },
      async claimSeat(sessionId) {
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session || session.status !== "open" || session.reservedCount >= session.maxPlayers) {
          return null;
        }
        session.reservedCount += 1;
        return { reservedCount: session.reservedCount };
      },
      async releaseSeat(sessionId) {
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session || session.status !== "open" || session.reservedCount < 1) return null;
        session.reservedCount -= 1;
        return { reservedCount: session.reservedCount };
      },
      async setReservedCount(sessionId, reservedCount) {
        const session = state.sessions.find((item) => item.id === sessionId);
        if (session) session.reservedCount = reservedCount;
      },
      async setSessionStatus(sessionId, status) {
        const session = state.sessions.find((item) => item.id === sessionId);
        if (session) session.status = status;
      },
      async updateBooking(id, patch) {
        const booking = state.bookings.find((item) => item.id === id);
        if (booking) Object.assign(booking, patch);
      },
      async addLedger(entry) {
        state.ledger.push({ ...entry });
      },
      async releaseSlot(slotId) {
        const slot = state.slots.find((item) => item.id === slotId);
        if (slot) slot.currentSessionId = null;
      },
      async listBookings(sessionId) {
        return state.bookings.filter((booking) => booking.sessionId === sessionId);
      },
      async addNotification(entry) {
        state.notifications.push({ ...entry });
      },
      async addTicket(entry) {
        state.tickets.push({ ...entry });
      },
    };
  }
}

export function seedSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "session-1",
    slotId: "slot-1",
    status: "open",
    minPlayers: 2,
    maxPlayers: 2,
    reservedCount: 0,
    startsAt: new Date("2026-11-04T12:00:00.000Z"),
    endsAt: new Date("2026-11-04T13:00:00.000Z"),
    priceRial: 1_500_000,
    genderConstraint: null,
    organizerAccountId: "organizer",
    hostAccountId: "host",
    ...overrides,
  };
}
