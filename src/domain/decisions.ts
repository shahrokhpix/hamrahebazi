export const HOLD_MS = 10 * 60 * 1000;
export const CHECK_IN_LEAD_MS = 30 * 60 * 1000;
export const OTP_TTL_MS = 2 * 60 * 1000;
export const OTP_WINDOW_MS = 10 * 60 * 1000;
export const OTP_MAX_REQUESTS = 5;
export const OTP_MAX_ATTEMPTS = 5;

export type SessionStatus =
  | "open"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BookingStatus =
  | "pending_payment"
  | "reserved"
  | "checked_in"
  | "completed"
  | "refunded"
  | "no_show";

export type Gender = "female" | "male";

export type Decision =
  | { ok: true }
  | { ok: false; reason: string };

const ACTIVE_BLOCKING: BookingStatus[] = [
  "pending_payment",
  "reserved",
  "checked_in",
  "completed",
  "no_show",
];

export function isBlockingStatus(status: BookingStatus): boolean {
  return ACTIVE_BLOCKING.includes(status);
}

export function normalizePhone(input: string): string | null {
  const digits = input
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
  const local = digits.startsWith("98") ? `0${digits.slice(2)}` : digits;
  return /^09\d{9}$/.test(local) ? local : null;
}

export function ageInYears(birthDate: Date, at: Date): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const monthDelta = at.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && at.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function isEligible(input: {
  birthDate: Date;
  gender: Gender;
  at: Date;
  ageMin: number;
  ageMax: number | null;
  genderConstraint: Gender | null;
}): boolean {
  const age = ageInYears(input.birthDate, input.at);
  if (age < input.ageMin) return false;
  if (input.ageMax !== null && age > input.ageMax) return false;
  if (input.genderConstraint && input.genderConstraint !== input.gender) return false;
  return true;
}

export function slotsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

export function canRequestOtp(recentCount: number): Decision {
  if (recentCount >= OTP_MAX_REQUESTS) return { ok: false, reason: "rate_limited" };
  return { ok: true };
}

export function canAttemptOtp(attempts: number, expired: boolean, consumed: boolean): Decision {
  if (consumed) return { ok: false, reason: "consumed" };
  if (expired) return { ok: false, reason: "expired" };
  if (attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "blocked" };
  return { ok: true };
}

export function canCreateHold(input: {
  sessionStatus: SessionStatus;
  reservedCount: number;
  pendingUnexpired: number;
  maxPlayers: number;
  profileBlocked: boolean;
  eligible: boolean;
}): Decision {
  if (!input.eligible) return { ok: false, reason: "ineligible" };
  if (input.sessionStatus !== "open") return { ok: false, reason: "not_open" };
  if (input.profileBlocked) return { ok: false, reason: "duplicate_profile" };
  if (input.reservedCount + input.pendingUnexpired >= input.maxPlayers) {
    return { ok: false, reason: "full" };
  }
  return { ok: true };
}

export function canConfirmHold(input: {
  bookingStatus: BookingStatus;
  holdExpiresAt: Date;
  now: Date;
  sessionStatus: SessionStatus;
  reservedCount: number;
  maxPlayers: number;
}): Decision {
  if (input.bookingStatus !== "pending_payment") return { ok: false, reason: "not_pending" };
  if (input.now.getTime() > input.holdExpiresAt.getTime()) {
    return { ok: false, reason: "hold_expired" };
  }
  if (input.reservedCount >= input.maxPlayers) return { ok: false, reason: "full" };
  if (input.sessionStatus !== "open") return { ok: false, reason: "session_not_open" };
  return { ok: true };
}

export function promotionStatus(
  reservedCount: number,
  minPlayers: number,
  current: SessionStatus,
): SessionStatus {
  if (current === "open" && reservedCount >= minPlayers) return "confirmed";
  return current;
}

export function paymentFailureReleasesHold(): true {
  return true;
}

export function canPlayerCancel(sessionStatus: SessionStatus, bookingStatus: BookingStatus): Decision {
  if (bookingStatus !== "reserved") return { ok: false, reason: "not_reserved" };
  if (sessionStatus !== "open") return { ok: false, reason: "cancel_closed" };
  return { ok: true };
}

export function shouldExpireForQuorum(input: {
  status: SessionStatus;
  reservedCount: number;
  minPlayers: number;
  startsAt: Date;
  now: Date;
}): boolean {
  return (
    input.status === "open" &&
    input.now.getTime() >= input.startsAt.getTime() &&
    input.reservedCount < input.minPlayers
  );
}

export function releaseSlot(): { status: "open"; currentSessionId: null } {
  return { status: "open", currentSessionId: null };
}

export function withinCheckInWindow(now: Date, startsAt: Date, endsAt: Date): boolean {
  return (
    now.getTime() >= startsAt.getTime() - CHECK_IN_LEAD_MS &&
    now.getTime() <= endsAt.getTime()
  );
}

export function canIssueArrivalCode(input: {
  sessionStatus: SessionStatus;
  bookingStatus: BookingStatus;
  now: Date;
  startsAt: Date;
  endsAt: Date;
}): Decision {
  if (input.bookingStatus !== "reserved" && input.bookingStatus !== "checked_in") {
    return { ok: false, reason: "not_reserved" };
  }
  if (input.sessionStatus !== "confirmed" && input.sessionStatus !== "in_progress") {
    return { ok: false, reason: "not_confirmed" };
  }
  if (!withinCheckInWindow(input.now, input.startsAt, input.endsAt)) {
    return { ok: false, reason: "outside_window" };
  }
  return { ok: true };
}

export function canMatchArrivalCode(input: {
  sessionStatus: SessionStatus;
  bookingStatus: BookingStatus;
}): Decision {
  if (input.bookingStatus !== "reserved") return { ok: false, reason: "not_reserved" };
  if (input.sessionStatus !== "confirmed" && input.sessionStatus !== "in_progress") {
    return { ok: false, reason: "not_confirmed" };
  }
  return { ok: true };
}

export function statusAfterCheckIn(current: SessionStatus): SessionStatus {
  if (current === "confirmed") return "in_progress";
  return current;
}

export function mismatchLeavesSession(status: SessionStatus): SessionStatus {
  return status;
}

export function endSession(input: {
  status: SessionStatus;
  bookings: BookingStatus[];
}): Decision & { nextStatus?: SessionStatus; bookings?: BookingStatus[] } {
  if (input.status !== "in_progress" && input.status !== "confirmed") {
    return { ok: false, reason: "cannot_end" };
  }
  return {
    ok: true,
    nextStatus: "completed",
    bookings: input.bookings.map((status) => {
      if (status === "checked_in") return "completed";
      if (status === "reserved") return "no_show";
      return status;
    }),
  };
}

export function organizerPhoneVisible(input: {
  sessionStatus: SessionStatus;
  viewerBookingStatus: BookingStatus | null;
}): boolean {
  const shown =
    input.sessionStatus === "confirmed" ||
    input.sessionStatus === "in_progress" ||
    input.sessionStatus === "completed";
  if (!shown || !input.viewerBookingStatus) return false;
  return input.viewerBookingStatus !== "pending_payment" && input.viewerBookingStatus !== "refunded";
}

export function netPaidRial(entries: { type: "charge" | "refund"; amountRial: number }[]): number {
  return entries.reduce((sum, entry) => {
    return sum + (entry.type === "charge" ? entry.amountRial : -entry.amountRial);
  }, 0);
}

export function sessionBoundsValid(input: {
  minPlayers: number;
  maxPlayers: number;
  gameMin: number;
  gameMax: number;
  tableCapacity: number;
}): Decision {
  if (input.minPlayers < input.gameMin) return { ok: false, reason: "below_game_min" };
  if (input.maxPlayers > input.gameMax || input.maxPlayers > input.tableCapacity) {
    return { ok: false, reason: "above_capacity" };
  }
  if (input.minPlayers > input.maxPlayers || input.minPlayers < 1) {
    return { ok: false, reason: "invalid_bounds" };
  }
  return { ok: true };
}

export function almostFull(reservedCount: number, maxPlayers: number): boolean {
  return maxPlayers - reservedCount === 1;
}
