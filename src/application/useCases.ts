import {
  canConfirmHold,
  canCreateHold,
  canIssueArrivalCode,
  canMatchArrivalCode,
  canPlayerCancel,
  endSession,
  HOLD_MS,
  mismatchLeavesSession,
  promotionStatus,
  shouldExpireForQuorum,
  statusAfterCheckIn,
} from "@/domain/decisions";
import type { AppStore, BookingRecord, SessionRecord, UnitOfWork } from "./store";

export type Outcome<T extends object | undefined = undefined> = [T] extends [undefined]
  ? { ok: true } | { ok: false; reason: string }
  : ({ ok: true } & T) | { ok: false; reason: string };

const PLAYER_CONFIRMED = "زمان برگزاری بازی شما با موفقیت تعیین شد.";
const HOST_CONFIRMED =
  "لطفا آماده پذیرایی از بازیکنان باشید. این پیام تخفیف ۱۰ درصد منو است و جابه‌جایی پول نیست.";
const ORGANIZER_CONFIRMED = "لطفا جهت برگزاری بازی اقدام نمایید.";

function seatKey(sessionId: string, profileId: string): string {
  return `${sessionId}:${profileId}`;
}

async function notifyConfirmed(
  tx: UnitOfWork,
  session: SessionRecord,
  reservedCount: number,
): Promise<void> {
  const reserved = (await tx.listBookings(session.id)).filter(
    (booking) => booking.status === "reserved" || booking.status === "checked_in",
  );
  for (const accountId of new Set(reserved.map((booking) => booking.accountId))) {
    await tx.addNotification({ accountId, sessionId: session.id, body: PLAYER_CONFIRMED });
  }
  await tx.addNotification({
    accountId: session.hostAccountId,
    sessionId: session.id,
    body: `${HOST_CONFIRMED} تعداد ${reservedCount} نفر.`,
  });
  await tx.addNotification({
    accountId: session.organizerAccountId,
    sessionId: session.id,
    body: ORGANIZER_CONFIRMED,
  });
}

export async function createHold(
  store: AppStore,
  input: {
    bookingId: string;
    sessionId: string;
    profileId: string;
    accountId: string;
    eligible: boolean;
    now: Date;
  },
): Promise<Outcome<{ bookingId: string }>> {
  return store.transaction(async (tx) => {
    const session = await tx.getSession(input.sessionId);
    if (!session) return { ok: false, reason: "missing" };
    const decision = canCreateHold({
      sessionStatus: session.status,
      reservedCount: session.reservedCount,
      pendingUnexpired: await tx.countPending(session.id, input.now),
      maxPlayers: session.maxPlayers,
      profileBlocked: await tx.hasActiveKey(seatKey(session.id, input.profileId)),
      eligible: input.eligible,
    });
    if (!decision.ok) return decision;
    await tx.insertBooking({
      id: input.bookingId,
      sessionId: session.id,
      playerProfileId: input.profileId,
      accountId: input.accountId,
      status: "pending_payment",
      amountRial: session.priceRial,
      holdExpiresAt: new Date(input.now.getTime() + HOLD_MS),
      attendanceCode: null,
      activeKey: seatKey(session.id, input.profileId),
    });
    return { ok: true, bookingId: input.bookingId };
  });
}

export async function settlePayment(
  store: AppStore,
  input: { bookingId: string; now: Date; paid: boolean },
): Promise<Outcome> {
  if (!input.paid) {
    await store.transaction(async (tx) => {
      const booking = await tx.getBooking(input.bookingId);
      if (booking?.status === "pending_payment") await tx.deleteBooking(booking.id);
    });
    return { ok: false, reason: "payment_failed" };
  }

  const result = await store.transaction(async (tx): Promise<Outcome> => {
    const booking = await tx.getBooking(input.bookingId);
    const session = booking ? await tx.getSession(booking.sessionId) : null;
    if (!booking || !session || !booking.holdExpiresAt) return { ok: false, reason: "missing" };
    const previousStatus = session.status;
    const decision = canConfirmHold({
      bookingStatus: booking.status,
      holdExpiresAt: booking.holdExpiresAt,
      now: input.now,
      sessionStatus: previousStatus,
      reservedCount: session.reservedCount,
      maxPlayers: session.maxPlayers,
    });
    if (!decision.ok) return decision;
    const claimed = await tx.claimSeat(session.id);
    if (!claimed) return { ok: false, reason: "full" };
    const nextStatus = promotionStatus(claimed.reservedCount, session.minPlayers, previousStatus);
    if (nextStatus !== previousStatus) await tx.setSessionStatus(session.id, nextStatus);
    await tx.updateBooking(booking.id, { status: "reserved", holdExpiresAt: null });
    await tx.addLedger({
      accountId: booking.accountId,
      bookingId: booking.id,
      type: "charge",
      amountRial: booking.amountRial,
    });
    if (nextStatus === "confirmed" && previousStatus !== "confirmed") {
      await notifyConfirmed(tx, session, claimed.reservedCount);
    }
    return { ok: true };
  });

  if (!result.ok && result.reason !== "missing") {
    await compensateFailedCapture(store, input.bookingId);
  }
  return result;
}

async function compensateFailedCapture(store: AppStore, bookingId: string): Promise<void> {
  await store.transaction(async (tx) => {
    const booking = await tx.getBooking(bookingId);
    if (!booking || booking.status !== "pending_payment") return;
    await tx.addLedger({
      accountId: booking.accountId,
      bookingId: booking.id,
      type: "charge",
      amountRial: booking.amountRial,
    });
    await tx.addLedger({
      accountId: booking.accountId,
      bookingId: booking.id,
      type: "refund",
      amountRial: booking.amountRial,
    });
    await tx.deleteBooking(booking.id);
  });
}

export async function cancelReservedSeat(
  store: AppStore,
  input: { bookingId: string; accountId: string },
): Promise<Outcome> {
  return store.transaction(async (tx) => {
    const booking = await tx.getBooking(input.bookingId);
    const session = booking ? await tx.getSession(booking.sessionId) : null;
    if (!booking || !session || booking.accountId !== input.accountId) {
      return { ok: false, reason: "missing" };
    }
    const decision = canPlayerCancel(session.status, booking.status);
    if (!decision.ok) return decision;
    const released = await tx.releaseSeat(session.id);
    if (!released) return { ok: false, reason: "empty" };
    await tx.updateBooking(booking.id, { status: "refunded", activeKey: null, attendanceCode: null });
    await tx.addLedger({
      accountId: booking.accountId,
      bookingId: booking.id,
      type: "refund",
      amountRial: booking.amountRial,
    });
    return { ok: true };
  });
}

export async function expireDueSession(
  store: AppStore,
  input: { sessionId: string; now: Date },
): Promise<Outcome> {
  return store.transaction(async (tx) => {
    const session = await tx.getSession(input.sessionId);
    if (!session) return { ok: false, reason: "missing" };
    if (
      !shouldExpireForQuorum({
        status: session.status,
        reservedCount: session.reservedCount,
        minPlayers: session.minPlayers,
        startsAt: session.startsAt,
        now: input.now,
      })
    ) {
      return { ok: false, reason: "not_due" };
    }
    for (const booking of await tx.listBookings(session.id)) {
      if (booking.status !== "reserved") continue;
      await tx.updateBooking(booking.id, { status: "refunded", activeKey: null });
      await tx.addLedger({
        accountId: booking.accountId,
        bookingId: booking.id,
        type: "refund",
        amountRial: booking.amountRial,
      });
    }
    await tx.setReservedCount(session.id, 0);
    await tx.setSessionStatus(session.id, "cancelled");
    await tx.releaseSlot(session.slotId);
    return { ok: true };
  });
}

export async function issueCode(
  store: AppStore,
  input: { bookingId: string; accountId: string; now: Date; code: string },
): Promise<Outcome<{ code: string }>> {
  return store.transaction(async (tx) => {
    const booking = await tx.getBooking(input.bookingId);
    const session = booking ? await tx.getSession(booking.sessionId) : null;
    if (!booking || !session || booking.accountId !== input.accountId) {
      return { ok: false, reason: "missing" };
    }
    const decision = canIssueArrivalCode({
      sessionStatus: session.status,
      bookingStatus: booking.status,
      now: input.now,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    });
    if (!decision.ok) return decision;
    await tx.updateBooking(booking.id, { attendanceCode: input.code });
    return { ok: true, code: input.code };
  });
}

export async function matchCode(
  store: AppStore,
  input: { sessionId: string; code: string },
): Promise<Outcome> {
  return store.transaction(async (tx) => {
    const session = await tx.getSession(input.sessionId);
    if (!session) return { ok: false, reason: "missing" };
    const booking = (await tx.listBookings(session.id)).find((item) => item.attendanceCode === input.code);
    if (!booking) return { ok: false, reason: "bad_code" };
    const decision = canMatchArrivalCode({
      sessionStatus: session.status,
      bookingStatus: booking.status,
    });
    if (!decision.ok) return decision;
    await tx.updateBooking(booking.id, { status: "checked_in" });
    const next = statusAfterCheckIn(session.status);
    if (next !== session.status) await tx.setSessionStatus(session.id, next);
    return { ok: true };
  });
}

export async function recordMismatch(
  store: AppStore,
  input: { bookingId: string; organizerAccountId: string; reason: string },
): Promise<Outcome> {
  return store.transaction(async (tx) => {
    const booking = await tx.getBooking(input.bookingId);
    const session = booking ? await tx.getSession(booking.sessionId) : null;
    if (!booking || !session || session.organizerAccountId !== input.organizerAccountId) {
      return { ok: false, reason: "forbidden" };
    }
    await tx.setSessionStatus(session.id, mismatchLeavesSession(session.status));
    await tx.addTicket({
      accountId: input.organizerAccountId,
      sessionId: session.id,
      bookingId: booking.id,
      reason: input.reason,
    });
    return { ok: true };
  });
}

export async function finishSession(store: AppStore, sessionId: string): Promise<Outcome> {
  return store.transaction(async (tx) => {
    const session = await tx.getSession(sessionId);
    if (!session) return { ok: false, reason: "missing" };
    const bookings = (await tx.listBookings(session.id)).filter(
      (booking) => booking.status === "reserved" || booking.status === "checked_in",
    );
    const decision = endSession({
      status: session.status,
      bookings: bookings.map((booking) => booking.status),
    });
    if (!decision.ok || !decision.nextStatus || !decision.bookings) {
      return { ok: false, reason: "cannot_end" };
    }
    for (let index = 0; index < bookings.length; index += 1) {
      const next = decision.bookings[index];
      const booking = bookings[index];
      if (next && booking && next !== booking.status) {
        await tx.updateBooking(booking.id, { status: next });
      }
    }
    await tx.setSessionStatus(session.id, decision.nextStatus);
    return { ok: true };
  });
}

export type { BookingRecord };
