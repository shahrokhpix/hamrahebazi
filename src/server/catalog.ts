import { expireDueSession } from "@/application/useCases";
import { ageInYears, isEligible, type Gender } from "@/domain/decisions";
import { prisma } from "@/infrastructure/prisma";
import { prismaStore } from "@/infrastructure/prismaStore";
import { reverseReservationPoints } from "@/server/points";

export function openSessionQuery() {
  return {
    where: { status: "open" as const },
    include: {
      game: true,
      bookings: true,
      slot: { include: { table: { include: { host: true } } } },
    },
    orderBy: { slot: { startsAt: "asc" as const } },
  };
}

export async function expireDueSessions(now = new Date()): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { status: "open", slot: { startsAt: { lte: now } } },
  });
  for (const session of sessions) {
    if (session.reservedCount < session.minPlayers) {
      const result = await expireDueSession(prismaStore(), { sessionId: session.id, now });
      if (result.ok) {
        const refunded = await prisma.booking.findMany({ where: { sessionId: session.id, status: "refunded" }, select: { id: true } });
        for (const booking of refunded) await reverseReservationPoints(booking.id);
      }
    }
  }
}

export function formatRial(amount: number): string {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ریال`;
}

export function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function tickLabel(status: string): string {
  if (status === "approved") return "تیک تأیید";
  if (status === "pending") return "تیک در انتظار تأیید";
  if (status === "rejected") return "تیک رد شده";
  return "بدون تیک";
}

export function genderLabel(gender: string): string {
  if (gender === "female") return "زن";
  if (gender === "male") return "مرد";
  return "نامشخص";
}

export function statusLabel(status: string, remaining: number | null = null): string {
  if (status === "open" && remaining === 0) return "تکمیل ظرفیت";
  if (status === "open" && remaining === 1) return "در آستانه تکمیل";
  if (status === "open") return "قابل رزرو";
  if (status === "confirmed") return "رویداد تایید و قطعی شد";
  if (status === "in_progress") return "در حال برگزاری";
  if (status === "completed") return "پایان یافته";
  if (status === "cancelled") return "لغو شده";
  if (status === "pending_payment") return "در انتظار پرداخت";
  if (status === "reserved") return "رزرو شده";
  if (status === "checked_in") return "حضور ثبت شد";
  if (status === "refunded") return "مسترد شد";
  if (status === "no_show") return "غیبت ثبت شد";
  return status;
}

export function remainingSeats(input: {
  maxPlayers: number;
  reservedCount: number;
  bookings: { status: string; holdExpiresAt: Date | null }[];
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const pending = input.bookings.filter(
    (booking) =>
      booking.status === "pending_payment" &&
      booking.holdExpiresAt !== null &&
      booking.holdExpiresAt.getTime() > now.getTime(),
  ).length;
  return input.maxPlayers - input.reservedCount - pending;
}

export function profileFits(
  profile: { birthDate: Date; gender: string },
  session: { startsAt: Date; ageMin: number; ageMax: number | null; genderConstraint: string | null },
): boolean {
  const gender = profile.gender === "female" || profile.gender === "male" ? profile.gender : null;
  if (!gender) return false;
  return isEligible({
    birthDate: profile.birthDate,
    gender: gender as Gender,
    at: session.startsAt,
    ageMin: session.ageMin,
    ageMax: session.ageMax,
    genderConstraint:
      session.genderConstraint === "female" || session.genderConstraint === "male"
        ? session.genderConstraint
        : null,
  });
}

export function profileAge(birthDate: Date, at = new Date()): number {
  return ageInYears(birthDate, at);
}
