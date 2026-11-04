import Image from "next/image";
import Link from "next/link";
import { DiceDoodle, FaceDoodle, MeepleDoodle, StarDoodle, TicketDoodle } from "@/components/doodles";
import { GameCard } from "@/components/game-card";
import { buttonClass } from "@/components/ui";
import { prisma } from "@/infrastructure/prisma";
import { currentAccount } from "@/server/auth";
import { expireDueSessions, formatRial, formatWhen, openSessionQuery, profileFits, remainingSeats, statusLabel } from "@/server/catalog";
import { getSiteContent } from "@/server/content";

export default async function HomePage() {
  const account = await currentAccount();
  await expireDueSessions();
  const [sessions, cafes, site] = await Promise.all([
    prisma.session.findMany(openSessionQuery()),
    prisma.host.count({ where: { status: "approved" } }),
    getSiteContent(),
  ]);
  const copy = site.copy;
  const steps = [
    { title: copy.homeStep1Title, text: copy.homeStep1Text, Icon: FaceDoodle, tone: "bg-coral" },
    { title: copy.homeStep2Title, text: copy.homeStep2Text, Icon: DiceDoodle, tone: "bg-sky" },
    { title: copy.homeStep3Title, text: copy.homeStep3Text, Icon: TicketDoodle, tone: "bg-sun" },
    { title: copy.homeStep4Title, text: copy.homeStep4Text, Icon: StarDoodle, tone: "bg-leaf" },
  ];

  return (
    <main>
      <section className="border-b-[3px] border-ink bg-sky">
        <div className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-6 lg:grid-cols-2 lg:gap-8 lg:py-14">
          <div className="order-2 lg:order-1">
            <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-sun px-3 py-1 text-sm font-bold">
              <MeepleDoodle className="h-6 w-6" />
              {copy.heroBadge}
            </p>
            <h1 className="mt-3 text-4xl leading-none sm:text-6xl">{copy.heroTitle}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 sm:text-base sm:leading-8">{copy.heroBody}</p>
            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <Link className={buttonClass} href="/games">
                {copy.heroCta}
              </Link>
              <Link className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-ink bg-card px-6 font-display text-lg" href="/cafes">
                {copy.heroCafes}
              </Link>
            </div>
            <dl className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
              <div className="rounded-full border-[3px] border-ink bg-card px-4 py-2">{sessions.length} {copy.countGames}</div>
              <div className="rounded-full border-[3px] border-ink bg-leaf px-4 py-2">{cafes} {copy.countCafes}</div>
            </dl>
          </div>
          <div className="relative order-1 lg:order-2">
            <StarDoodle className="absolute top-2 start-2 z-10 h-10 w-10 text-sun sm:h-12 sm:w-12" />
            <DiceDoodle className="absolute end-2 bottom-2 z-10 h-12 w-12 text-foreground" />
            <Image
              src={site.heroImage}
              alt={copy.heroAlt}
              width={960}
              height={540}
              priority
              className="float-soft h-auto w-full rounded-[1.4rem] border-[3px] border-ink shadow-[4px_4px_0_#1c2430] sm:rounded-[1.8rem] sm:shadow-[8px_8px_0_#1c2430]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-6 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible md:py-8 lg:grid-cols-4">
        {steps.map((step) => (
          <article key={step.title} className={`w-[68vw] shrink-0 snap-start rounded-[1.4rem] border-[3px] border-ink p-4 shadow-[4px_4px_0_#1c2430] md:w-auto ${step.tone}`}>
            <step.Icon className="h-10 w-10" />
            <h2 className="mt-2 text-2xl">{step.title}</h2>
            <p className="mt-1 text-sm leading-6">{step.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-4xl">{copy.shelfTitle}</h2>
          <Link href="/games" className="cursor-pointer text-sm font-bold text-primary">
            {copy.shelfAll}
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm">{copy.shelfEmpty}</p>
        ) : (
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
            {sessions.slice(0, 6).map((session) => {
              const remaining = remainingSeats(session);
              const fits = account?.profiles.some((profile) =>
                profileFits(profile, {
                  startsAt: session.slot.startsAt,
                  ageMin: session.game.ageMin,
                  ageMax: session.game.ageMax,
                  genderConstraint: session.genderConstraint,
                }),
              );
              return (
                <li key={session.id} className="w-[82vw] shrink-0 snap-start md:w-auto">
                  <GameCard
                    href={`/sessions/${session.id}`}
                    name={session.game.name}
                    host={`${session.slot.table.host.displayName}، ${session.slot.table.host.address}`}
                    when={formatWhen(session.slot.startsAt)}
                    price={formatRial(session.priceRial)}
                    seats={`${session.reservedCount} از ${session.maxPlayers} صندلی`}
                    age={`از ${session.game.ageMin} سال`}
                    status={statusLabel(session.status, remaining)}
                    fits={Boolean(fits)}
                    image={session.game.imagePath}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
