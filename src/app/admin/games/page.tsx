import { decideGameImageAction } from "@/server/actions";
import { DecisionForm } from "@/components/decision-form";
import { GameForm } from "@/components/forms";
import { prisma } from "@/infrastructure/prisma";

export default async function AdminGamesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
        <h2 className="mb-4 text-3xl">بازی تازه</h2>
        <GameForm />
      </section>
      <ul className="space-y-3">
        {error ? <li className="rounded-2xl border-[3px] border-ink bg-coral px-4 py-3 text-sm">تصویر باید jpg، png، webp یا gif و حداکثر ۲ مگابایت باشد.</li> : null}
        {games.map((game) => (
          <li key={game.id} className="space-y-3 rounded-[1.2rem] border-[3px] border-ink bg-card p-4 text-sm shadow-[4px_4px_0_#1c2430]">
            <p className="font-display text-2xl">{game.name}</p>
            <p className="mt-1 text-muted">
              از {game.ageMin} سال · {game.difficulty} · {game.durationMinutes} دقیقه · {game.minPlayers} تا {game.maxPlayers} نفر
            </p>
            {game.imagePath ? <img src={game.imagePath} alt="" className="h-28 w-full rounded-2xl border-[3px] border-ink object-cover" /> : null}
            {game.pendingImagePath ? <img src={game.pendingImagePath} alt="" className="h-28 w-full rounded-2xl border-[3px] border-ink object-cover" /> : null}
            {game.pendingImagePath ? <p className="font-semibold">تصویر در انتظار تأیید</p> : null}
            <DecisionForm action={decideGameImageAction} fields={[{ name: "gameId", value: game.id }]} approveLabel="تأیید یا جایگزینی تصویر" rejectLabel={game.pendingImagePath ? "رد تصویر" : undefined}>
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full min-h-12 rounded-2xl border-[3px] border-ink bg-background px-4 py-2" />
            </DecisionForm>
          </li>
        ))}
      </ul>
    </main>
  );
}
