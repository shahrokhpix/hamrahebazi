import { GameCard } from "@/components/game-card";
import { SearchDoodle } from "@/components/doodles";
import { prisma } from "@/infrastructure/prisma";
import { currentAccount } from "@/server/auth";
import { expireDueSessions, formatRial, formatWhen, openSessionQuery, profileFits, remainingSeats, statusLabel } from "@/server/catalog";
import { getSiteContent } from "@/server/content";

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const account = await currentAccount();
  await expireDueSessions();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [sessions, site] = await Promise.all([
    prisma.session.findMany({
      ...openSessionQuery(),
      where: { status: "open", ...(query ? { game: { name: { contains: query } } } : {}) },
    }),
    getSiteContent(),
  ]);
  const copy = site.copy;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="text-4xl sm:text-5xl">{copy.gamesTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{copy.gamesIntro}</p>
      <form className="mt-6" action="/games" method="get">
        <label className="block text-sm font-semibold" htmlFor="q">
          {copy.gamesSearch}
          <span className="mt-2 flex items-center gap-2 rounded-full border-[3px] border-ink bg-card px-4 shadow-[4px_4px_0_#1c2430] focus-within:ring-4 focus-within:ring-sun/80">
            <SearchDoodle className="h-7 w-7 shrink-0" />
            <input id="q" name="q" defaultValue={query} placeholder={copy.gamesPlaceholder} className="min-h-12 w-full bg-transparent text-base outline-none" />
          </span>
        </label>
      </form>
      {sessions.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm">{copy.gamesEmpty}</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
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
              <li key={session.id}>
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
    </main>
  );
}
