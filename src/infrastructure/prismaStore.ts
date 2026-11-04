import type { Prisma } from "@prisma/client";
import type { AppStore, BookingRecord, SessionRecord, UnitOfWork } from "@/application/store";
import type { BookingStatus, SessionStatus } from "@/domain/decisions";
import { prisma } from "./prisma";

const sessionInclude = {
  organizer: true,
  slot: { include: { table: { include: { host: true } } } },
} satisfies Prisma.SessionInclude;

type SessionRow = Prisma.SessionGetPayload<{ include: typeof sessionInclude }>;
type Db = Prisma.TransactionClient;

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    slotId: row.slotId,
    status: row.status as SessionStatus,
    minPlayers: row.minPlayers,
    maxPlayers: row.maxPlayers,
    reservedCount: row.reservedCount,
    startsAt: row.slot.startsAt,
    endsAt: row.slot.endsAt,
    priceRial: row.priceRial,
    genderConstraint: row.genderConstraint === "female" || row.genderConstraint === "male" ? row.genderConstraint : null,
    organizerAccountId: row.organizer.accountId,
    hostAccountId: row.slot.table.host.accountId,
  };
}

function mapBooking(row: {
  id: string;
  sessionId: string;
  playerProfileId: string;
  accountId: string;
  status: string;
  amountRial: number;
  holdExpiresAt: Date | null;
  attendanceCode: string | null;
  activeKey: string | null;
}): BookingRecord {
  return { ...row, status: row.status as BookingStatus };
}

function work(db: Db): UnitOfWork {
  return {
    async getSession(id) {
      const row = await db.session.findUnique({ where: { id }, include: sessionInclude });
      return row ? mapSession(row) : null;
    },
    async getBooking(id) {
      const row = await db.booking.findUnique({ where: { id } });
      return row ? mapBooking(row) : null;
    },
    async countPending(sessionId, now) {
      return db.booking.count({
        where: { sessionId, status: "pending_payment", holdExpiresAt: { gt: now } },
      });
    },
    async hasActiveKey(activeKey) {
      const found = await db.booking.findUnique({ where: { activeKey } });
      return found !== null;
    },
    async insertBooking(row) {
      await db.booking.create({ data: row });
    },
    async deleteBooking(id) {
      await db.booking.delete({ where: { id } });
    },
    async claimSeat(sessionId) {
      const session = await db.session.findUnique({ where: { id: sessionId } });
      if (!session || session.status !== "open") return null;
      const updated = await db.session.updateMany({
        where: { id: sessionId, status: "open", reservedCount: { lt: session.maxPlayers } },
        data: { reservedCount: { increment: 1 } },
      });
      if (updated.count !== 1) return null;
      const next = await db.session.findUnique({ where: { id: sessionId } });
      return next ? { reservedCount: next.reservedCount } : null;
    },
    async releaseSeat(sessionId) {
      const session = await db.session.findUnique({ where: { id: sessionId } });
      if (!session || session.status !== "open" || session.reservedCount < 1) return null;
      const updated = await db.session.updateMany({
        where: { id: sessionId, status: "open", reservedCount: { gt: 0 } },
        data: { reservedCount: { decrement: 1 } },
      });
      if (updated.count !== 1) return null;
      const next = await db.session.findUnique({ where: { id: sessionId } });
      return next ? { reservedCount: next.reservedCount } : null;
    },
    async setReservedCount(sessionId, reservedCount) {
      await db.session.update({ where: { id: sessionId }, data: { reservedCount } });
    },
    async setSessionStatus(sessionId, status) {
      await db.session.update({ where: { id: sessionId }, data: { status } });
    },
    async updateBooking(id, patch) {
      await db.booking.update({ where: { id }, data: patch });
    },
    async addLedger(entry) {
      await db.ledgerEntry.create({ data: entry });
    },
    async releaseSlot(slotId) {
      await db.slot.update({ where: { id: slotId }, data: { currentSessionId: null } });
    },
    async listBookings(sessionId) {
      const rows = await db.booking.findMany({ where: { sessionId } });
      return rows.map(mapBooking);
    },
    async addNotification(entry) {
      await db.notification.create({ data: entry });
    },
    async addTicket(entry) {
      await db.supportTicket.create({ data: entry });
    },
  };
}

export function prismaStore(): AppStore {
  return {
    transaction(fn) {
      return prisma.$transaction((tx) => fn(work(tx)));
    },
  };
}
