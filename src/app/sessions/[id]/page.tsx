import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { artFor } from "@/components/game-card";
import { ReserveForm } from "@/components/forms";
import { buttonClass } from "@/components/ui";
import { currentAccount } from "@/server/auth";
import { formatRial, formatWhen, profileAge, profileFits, remainingSeats, statusLabel } from "@/server/catalog";
import { prisma } from "@/infrastructure/prisma";
import { getSiteContent } from "@/server/content";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const [account, site] = await Promise.all([currentAccount(), getSiteContent()]);
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: { game: true, bookings: true, slot: { include: { table: { include: { host: true } } } } },
  });
  if (!session || session.status === "cancelled") notFound();
  const remaining = remainingSeats(session);
  const profiles =
    account?.profiles.map((profile) => ({
      id: profile.id,
      eligible: profileFits(profile, {
        startsAt: session.slot.startsAt,
        ageMin: session.game.ageMin,
        ageMax: session.game.ageMax,
        genderConstraint: session.genderConstraint,
      }),
      label: `${profile.displayName}، ${profileAge(profile.birthDate, session.slot.startsAt)} ساله`,
    })) ?? [];
  const canReserve = session.status === "open" && remaining > 0;

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:gap-6 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <Image src={session.game.imagePath || artFor(session.game.name)} alt="" width={960} height={720} priority className="h-56 w-full rounded-[1.4rem] border-[3px] border-ink object-cover shadow-[4px_4px_0_#1c2430] sm:h-72 sm:rounded-[1.8rem] lg:h-full" />
      <section className="space-y-4">
        <p className="font-display text-lg text-primary">{site.copy.brandName}</p>
        <h1 className="text-4xl leading-none sm:text-5xl">{session.game.name}</h1>
        <p className="text-sm text-muted">{statusLabel(session.status, remaining)} · {session.game.durationMinutes} دقیقه</p>
        <div className="space-y-1 rounded-[1.5rem] border-[3px] border-ink bg-card p-5 text-sm leading-7 shadow-[4px_4px_0_#1c2430]">
          <p className="font-semibold">{session.slot.table.host.displayName}</p>
          <p className="text-muted">{session.slot.table.host.address}</p>
          <p>{formatWhen(session.slot.startsAt)}</p>
          <p>{formatRial(session.priceRial)} برای هر صندلی</p>
          <p>{session.reservedCount} رزرو قطعی از {session.maxPlayers} · حداقل {session.minPlayers} نفر</p>
          <p>سختی {session.game.difficulty} · از {session.game.ageMin} سال</p>
          <p>{session.genderConstraint ? `فقط ${session.genderConstraint === "female" ? "زن" : "مرد"}` : "سانس مختلط"}</p>
        </div>
        {canReserve && account && profiles.length > 0 ? (
          <ReserveForm
            sessionId={session.id}
            profiles={profiles}
            submitLabel={site.copy.reserveButton}
            playerLegend={site.copy.playerLegend}
            ineligible={site.copy.ineligible}
          />
        ) : null}
        {canReserve && !account ? (
          <div className="grid sm:inline-grid">
            <Link className={buttonClass} href="/login">
              {site.copy.reserveLogin}
            </Link>
          </div>
        ) : null}
        {canReserve && account && profiles.length === 0 ? (
          <div className="grid sm:inline-grid">
            <Link className={buttonClass} href="/onboarding">
              {site.copy.reserveProfile}
            </Link>
          </div>
        ) : null}
        {!canReserve ? <p className="text-sm text-muted">{site.copy.reserveClosed}</p> : null}
      </section>
    </main>
  );
}
