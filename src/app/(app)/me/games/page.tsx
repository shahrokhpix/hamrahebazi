import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { reasonText } from "@/domain/messages";
import { organizerPhoneVisible, type BookingStatus, type SessionStatus } from "@/domain/decisions";
import { currentAccount } from "@/server/auth";
import { expireDueSessions, formatWhen, statusLabel } from "@/server/catalog";
import { prisma } from "@/infrastructure/prisma";
import { RankForm } from "@/components/reward-forms";
import { cancelAction, arriveAction } from "@/server/actions";
import { RESERVATION_POINTS } from "@/server/points";

export default async function MyGamesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.profiles.length === 0) redirect("/onboarding");
  await expireDueSessions();
  const { error } = await searchParams;
  const bookings = await prisma.booking.findMany({
    where: { accountId: account.id, status: { not: "pending_payment" } },
    include: {
      playerProfile: true,
      session: {
        include: {
          game: true,
          organizer: true,
          slot: { include: { table: { include: { host: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const rankable = new Set(["reserved", "checked_in", "completed"]);
  const shared = bookings.filter((booking) => rankable.has(booking.status));
  const mates = shared.length
    ? await prisma.booking.findMany({
        where: { sessionId: { in: shared.map((booking) => booking.sessionId) }, status: { in: [...rankable] } },
        include: { playerProfile: true, session: { include: { game: true } } },
      })
    : [];
  const given = account.profiles[0]
    ? await prisma.peerRank.findMany({ where: { fromProfileId: account.profiles[0].id } })
    : [];
  const givenKey = new Set(given.map((rank) => `${rank.sessionId}:${rank.toProfileId}`));
  const pending = await prisma.booking.findMany({
    where: { accountId: account.id, status: "pending_payment" },
    include: { session: { include: { game: true } } },
  });
  const openRanks = shared.flatMap((booking) =>
    mates
      .filter((mate) => mate.sessionId === booking.sessionId && mate.playerProfileId !== booking.playerProfileId && !givenKey.has(`${booking.sessionId}:${mate.playerProfileId}`))
      .map((mate) => (
        <RankForm key={`${booking.id}-${mate.id}`} sessionId={booking.sessionId} toProfileId={mate.playerProfileId} name={mate.playerProfile.displayName} game={mate.session.game.name} />
      )),
  );

  return (
    <main className="space-y-6">
      <PageHeader title="بازی‌های من" subtitle="رزرو، لغو، و ستاره دادن به هم‌بازی‌های همان میز." />
      {error ? <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{reasonText[error] ?? "این کار انجام نشد."}</p> : null}
      {pending.length > 0 ? (
        <ul className="space-y-3">
          {pending.map((booking) => (
            <li key={booking.id} className="rounded-xl border border-line bg-card p-4 text-sm">
              <p>{booking.session.game.name} هنوز پرداخت نشده است.</p>
              <Link className="mt-2 inline-flex cursor-pointer text-primary" href={`/checkout/${booking.id}`}>
                ادامه پرداخت
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {bookings.length === 0 ? <p className="rounded-xl border border-line bg-card p-6 text-sm text-muted">هنوز رزرو قطعی ندارید.</p> : null}
      <section className="space-y-3 rounded-[1.5rem] border-[3px] border-ink bg-sun/50 p-5 shadow-[4px_4px_0_#1c2430]">
        <h2 className="font-display text-3xl">ستاره به هم‌بازی‌ها</h2>
        <p className="text-sm leading-7">بعد از رزرو قطعی، از ۱ تا ۵ به بازیکن‌های همان میز ستاره بدهید. هر ستاره ۴ امتیاز برای اوست.</p>
        {openRanks}
        {openRanks.length === 0 ? (
          <p className="text-sm leading-7">
            {shared.some((booking) => mates.some((mate) => mate.sessionId === booking.sessionId && mate.playerProfileId !== booking.playerProfileId))
              ? "رأی هم‌بازی‌های این میزها ثبت شده است."
              : "هنوز هم‌بازی‌ای برای رأی نمانده. وقتی صندلی شما و یک بازیکن دیگر روی یک بازی قطعی باشد، ستاره‌ها اینجا دیده می‌شوند."}
          </p>
        ) : null}
      </section>
      <ul className="space-y-4">
        {bookings.map((booking) => {
          const visible = organizerPhoneVisible({
            sessionStatus: booking.session.status as SessionStatus,
            viewerBookingStatus: booking.status as BookingStatus,
          });
          return (
            <li key={booking.id} className="space-y-3 rounded-xl border border-line bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold">{booking.session.game.name}</h2>
                <span className="rounded-full bg-background px-3 py-1 text-xs">{statusLabel(booking.session.status)}</span>
              </div>
              <p className="text-sm text-muted">{booking.playerProfile.displayName}</p>
              <p className="text-sm">{formatWhen(booking.session.slot.startsAt)}</p>
              <p className="text-sm text-muted">
                {booking.session.slot.table.host.displayName} · {booking.session.slot.table.host.address}
              </p>
              {booking.playerProfile.schoolName ? (
                <p className="text-sm text-muted">مدرسه اظهارشده، تأییدنشده: {booking.playerProfile.schoolName}</p>
              ) : null}
              <p className="text-sm">صندلی: {statusLabel(booking.status)}</p>
              {["reserved", "checked_in", "completed", "no_show"].includes(booking.status) ? (
                <p className="text-sm font-semibold">امتیاز رزرو موفق: {RESERVATION_POINTS.toLocaleString("fa-IR")}</p>
              ) : null}
              {visible ? (
                <p className="text-sm">
                  برگزارکننده: {booking.session.organizer.displayName} · {booking.session.organizer.phone}
                </p>
              ) : null}
              {booking.attendanceCode ? <p className="text-sm">کد حضور: <span dir="ltr">{booking.attendanceCode}</span></p> : null}
              <div className="flex flex-wrap gap-3">
                {booking.session.status === "open" && booking.status === "reserved" ? (
                  <form action={cancelAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border-2 border-primary px-4 text-sm font-semibold text-primary" type="submit">
                      لغو و استرداد کامل
                    </button>
                  </form>
                ) : null}
                {(booking.session.status === "confirmed" || booking.session.status === "in_progress") && booking.status === "reserved" ? (
                  <form action={arriveAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent" type="submit">
                      رسیدم
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
