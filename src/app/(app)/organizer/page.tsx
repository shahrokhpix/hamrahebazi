import { redirect } from "next/navigation";
import { CheckInForm, GameForm, MismatchForm, PublishForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { currentAccount } from "@/server/auth";
import { endAction } from "@/server/actions";
import { formatWhen, genderLabel, profileAge } from "@/server/catalog";
import { prisma } from "@/infrastructure/prisma";

export default async function OrganizerPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (!account.organizer) {
    return (
      <main>
        <PageHeader title="برگزارکننده" subtitle="اول از پروفایل درخواست برگزارکننده بده. بعد از تأیید ادمین، بازی می‌سازی و روی سانس آزاد منتشر می‌کنی." />
      </main>
    );
  }
  const [slots, games, sessions] = await Promise.all([
    prisma.slot.findMany({
      where: { currentSessionId: null, startsAt: { gt: new Date() } },
      include: { table: { include: { host: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.session.findMany({
      where: { organizerId: account.organizer.id, status: { in: ["confirmed", "in_progress", "open"] } },
      include: {
        game: true,
        slot: true,
        bookings: { include: { playerProfile: true } },
      },
      orderBy: { slot: { startsAt: "asc" } },
    }),
  ]);

  return (
    <main className="space-y-10">
      <PageHeader title="برگزارکننده" subtitle="بازی تازه را به فهرست اضافه کن، بعد روی سانس آزاد منتشر کن." />
      <section className="space-y-4">
        <h2 className="text-3xl">بازی تازه</h2>
        <GameForm />
      </section>
      <PublishForm
        slots={slots.map((slot) => ({
          id: slot.id,
          label: `${slot.table.host.displayName} · ${slot.table.name} · ${formatWhen(slot.startsAt)}`,
        }))}
        games={games}
      />
      <ul className="space-y-6">
        {sessions.map((session) => (
          <li key={session.id} className="space-y-4 rounded-xl border border-line bg-card p-5">
            <h2 className="text-lg font-bold">
              {session.game.name} · {formatWhen(session.slot.startsAt)}
            </h2>
            <p className="text-sm text-muted">{session.status === "open" ? "هنوز قطعی نشده" : session.status === "confirmed" ? "قطعی" : "در حال برگزاری"}</p>
            <ul className="space-y-4">
              {session.bookings
                .filter((booking) => booking.status === "reserved" || booking.status === "checked_in")
                .map((booking) => (
                  <li key={booking.id} className="space-y-3 border-t border-line pt-3 text-sm">
                    <p>
                      {booking.playerProfile.displayName} · {profileAge(booking.playerProfile.birthDate, session.slot.startsAt)} ساله · {genderLabel(booking.playerProfile.gender)} · {booking.status === "checked_in" ? "حاضر" : "منتظر کد"}
                    </p>
                    <MismatchForm bookingId={booking.id} />
                  </li>
                ))}
            </ul>
            {session.status !== "open" ? <CheckInForm sessionId={session.id} /> : null}
            {session.status === "confirmed" || session.status === "in_progress" ? (
              <form action={endAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <button className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border-2 border-primary px-4 text-sm font-semibold text-primary" type="submit">
                  پایان بازی
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
