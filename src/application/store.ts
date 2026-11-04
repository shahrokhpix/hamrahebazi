import type { BookingStatus, Gender, SessionStatus } from "@/domain/decisions";

export type SessionRecord = {
  id: string;
  slotId: string;
  status: SessionStatus;
  minPlayers: number;
  maxPlayers: number;
  reservedCount: number;
  startsAt: Date;
  endsAt: Date;
  priceRial: number;
  genderConstraint: Gender | null;
  organizerAccountId: string;
  hostAccountId: string;
};

export type BookingRecord = {
  id: string;
  sessionId: string;
  playerProfileId: string;
  accountId: string;
  status: BookingStatus;
  amountRial: number;
  holdExpiresAt: Date | null;
  attendanceCode: string | null;
  activeKey: string | null;
};

export type LedgerRecord = {
  accountId: string;
  bookingId: string;
  type: "charge" | "refund";
  amountRial: number;
};

export type SlotRecord = {
  id: string;
  currentSessionId: string | null;
  startsAt: Date;
  endsAt: Date;
  tableId: string;
};

export interface UnitOfWork {
  getSession(id: string): Promise<SessionRecord | null>;
  getBooking(id: string): Promise<BookingRecord | null>;
  countPending(sessionId: string, now: Date): Promise<number>;
  hasActiveKey(activeKey: string): Promise<boolean>;
  insertBooking(row: BookingRecord): Promise<void>;
  deleteBooking(id: string): Promise<void>;
  claimSeat(sessionId: string): Promise<{ reservedCount: number } | null>;
  releaseSeat(sessionId: string): Promise<{ reservedCount: number } | null>;
  setReservedCount(sessionId: string, reservedCount: number): Promise<void>;
  setSessionStatus(sessionId: string, status: SessionStatus): Promise<void>;
  updateBooking(id: string, patch: Partial<BookingRecord>): Promise<void>;
  addLedger(entry: LedgerRecord): Promise<void>;
  releaseSlot(slotId: string): Promise<void>;
  listBookings(sessionId: string): Promise<BookingRecord[]>;
  addNotification(entry: { accountId: string; sessionId: string; body: string }): Promise<void>;
  addTicket(entry: {
    accountId: string;
    sessionId: string;
    bookingId: string;
    reason: string;
  }): Promise<void>;
}

export interface AppStore {
  transaction<T>(fn: (tx: UnitOfWork) => Promise<T>): Promise<T>;
}
