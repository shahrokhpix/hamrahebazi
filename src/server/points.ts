import { prisma } from "@/infrastructure/prisma";

export const RESERVATION_POINTS = 20;

const earnedStatuses = new Set(["reserved", "checked_in", "completed", "no_show"]);

export async function pointBalance(accountId: string): Promise<number> {
  const rows = await prisma.pointEntry.aggregate({ where: { accountId }, _sum: { amount: true } });
  return rows._sum.amount ?? 0;
}

export async function awardReservationPoints(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || !earnedStatuses.has(booking.status)) return;
  await prisma.pointEntry.create({
    data: {
      accountId: booking.accountId,
      amount: RESERVATION_POINTS,
      kind: "reservation",
      sourceKey: `reservation:${booking.id}`,
      note: "رزرو موفق",
    },
  }).catch(() => undefined);
}

export async function reverseReservationPoints(bookingId: string): Promise<void> {
  const earned = await prisma.pointEntry.findUnique({ where: { sourceKey: `reservation:${bookingId}` } });
  if (!earned) return;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking && booking.status !== "refunded") return;
  await prisma.pointEntry.create({
    data: {
      accountId: earned.accountId,
      amount: -earned.amount,
      kind: "reversal",
      sourceKey: `reversal:${bookingId}`,
      note: "بازگشت امتیاز رزرو لغوشده",
    },
  }).catch(() => undefined);
}

const sampleProducts = [
  { name: "استیکر میز", kind: "sticker", description: "برچسب بازی برای دفتر یا لیوان.", pointCost: 30, stock: 40, imagePath: "/art/shop-sticker.svg" },
  { name: "دفتر بازی", kind: "notebook", description: "دفتر یادداشت نوبت‌ها و امتیاز.", pointCost: 60, stock: 25, imagePath: "/art/shop-notebook.svg" },
  { name: "لیوان همراهِ بازی", kind: "mug", description: "لیوان فیزیکی با طرح میز بازی.", pointCost: 120, stock: 15, imagePath: "/art/shop-mug.svg" },
  { name: "اسباب‌بازی چوبی", kind: "toy", description: "مهرهٔ چوبی برای بازی در خانه.", pointCost: 200, stock: 10, imagePath: "/art/shop-toy.svg" },
];

export async function ensureShopCatalog(): Promise<void> {
  const count = await prisma.shopProduct.count();
  if (count === 0) {
    await prisma.shopProduct.createMany({ data: sampleProducts });
    return;
  }
  for (const sample of sampleProducts) {
    await prisma.shopProduct.updateMany({
      where: { name: sample.name, imagePath: "" },
      data: { imagePath: sample.imagePath },
    });
  }
}

export function rankTitle(average: number | null, votes: number): string {
  if (!votes || average === null) return "بدون رأی بازیکن‌ها";
  if (votes >= 3 && average >= 4.5) return "ستارهٔ میز";
  if (average >= 3.5) return "هم‌بازی خوب";
  return "در حال شناخته‌شدن";
}

export async function peerSummary(accountId: string): Promise<{ average: number | null; votes: number; peerPoints: number; place: number | null }> {
  const profile = await prisma.playerProfile.findUnique({ where: { accountId } });
  if (!profile) return { average: null, votes: 0, peerPoints: 0, place: null };
  const ranks = await prisma.peerRank.findMany({ where: { toProfileId: profile.id } });
  const votes = ranks.length;
  const average = votes ? ranks.reduce((sum, rank) => sum + rank.stars, 0) / votes : null;
  const peerPoints = (await prisma.pointEntry.aggregate({ where: { accountId, kind: "peer" }, _sum: { amount: true } }))._sum.amount ?? 0;
  const grouped = await prisma.pointEntry.groupBy({ by: ["accountId"], where: { kind: "peer" }, _sum: { amount: true } });
  const ordered = grouped
    .map((row) => ({ accountId: row.accountId, points: row._sum.amount ?? 0 }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points);
  const index = ordered.findIndex((row) => row.accountId === accountId);
  return { average, votes, peerPoints, place: index >= 0 ? index + 1 : null };
}
