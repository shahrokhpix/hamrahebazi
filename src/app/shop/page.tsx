import Link from "next/link";
import { StarDoodle } from "@/components/doodles";
import { BuyForm } from "@/components/reward-forms";
import { prisma } from "@/infrastructure/prisma";
import { currentAccount } from "@/server/auth";
import { ensureShopCatalog, peerSummary, pointBalance, rankTitle } from "@/server/points";

const tones: Record<string, string> = {
  sticker: "bg-coral/40",
  notebook: "bg-sun",
  mug: "bg-sky/50",
  toy: "bg-leaf/50",
};

export default async function ShopPage() {
  await ensureShopCatalog();
  const account = await currentAccount();
  const [products, balance, summary, board] = await Promise.all([
    prisma.shopProduct.findMany({ orderBy: { pointCost: "asc" } }),
    account ? pointBalance(account.id) : Promise.resolve(0),
    account ? peerSummary(account.id) : Promise.resolve(null),
    prisma.pointEntry.groupBy({ by: ["accountId"], where: { kind: "peer" }, _sum: { amount: true } }),
  ]);
  const leaders = board
    .map((row) => ({ accountId: row.accountId, points: row._sum.amount ?? 0 }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
  const names = await prisma.playerProfile.findMany({
    where: { accountId: { in: leaders.map((row) => row.accountId) } },
    select: { accountId: true, displayName: true },
  });
  const nameOf = new Map(names.map((profile) => [profile.accountId, profile.displayName]));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="rounded-[2rem] border-[3px] border-ink bg-sun p-5 shadow-[6px_6px_0_#1c2430]">
        <p className="font-display text-lg text-primary">فروشگاه</p>
        <h1 className="font-display text-4xl">امتیاز را به کالای فیزیکی تبدیل کنید</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7">هر رزرو موفق ۲۰ امتیاز دارد. رتبهٔ بازیکن‌های هم‌میز هم امتیاز می‌آورد. استیکر، دفتر، لیوان و اسباب‌بازی با همین امتیاز خریده می‌شود.</p>
        {account && summary ? (
          <p className="mt-4 inline-flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full border-[3px] border-ink bg-card px-3 py-1">{balance.toLocaleString("fa-IR")} امتیاز</span>
            <span className="rounded-full border-[3px] border-ink bg-card px-3 py-1">
              {rankTitle(summary.average, summary.votes)}
              {summary.average !== null ? ` · ${summary.average.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} از ۵` : ""}
              {summary.place ? ` · رتبهٔ ${summary.place.toLocaleString("fa-IR")}` : ""}
            </span>
          </p>
        ) : (
          <Link href="/login" className="mt-4 inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary">
            برای خرید وارد شوید
          </Link>
        )}
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <li key={product.id} className={`overflow-hidden rounded-[1.75rem] border-[3px] border-ink shadow-[5px_5px_0_#1c2430] ${tones[product.kind] ?? "bg-card"}`}>
            {product.imagePath ? (
              <img src={product.imagePath} alt="" width={640} height={480} className="block h-52 w-full border-b-[3px] border-ink bg-white object-contain" />
            ) : (
              <div className="grid h-48 place-items-center border-b-[3px] border-ink"><StarDoodle className="h-16 w-16" /></div>
            )}
            <div className="space-y-3 p-5">
            <h2 className="font-display text-3xl">{product.name}</h2>
            <p className="text-sm leading-7">{product.description}</p>
            <p className="text-sm font-semibold">{product.pointCost.toLocaleString("fa-IR")} امتیاز · موجودی {product.stock.toLocaleString("fa-IR")}</p>
            {account ? (
              <BuyForm productId={product.id} label={balance >= product.pointCost && product.stock > 0 ? "خرید با امتیاز" : "امتیاز یا موجودی کافی نیست"} disabled={balance < product.pointCost || product.stock < 1} />
            ) : null}
            </div>
          </li>
        ))}
      </ul>
      <section className="rounded-[1.75rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
        <h2 className="font-display text-3xl">رتبه از رأی بازیکن‌ها</h2>
        {leaders.length === 0 ? <p className="mt-2 text-sm leading-7 text-muted">هنوز کسی از هم‌بازی‌هایش رتبه نگرفته است.</p> : null}
        <ol className="mt-3 space-y-2">
          {leaders.map((row, index) => (
            <li key={row.accountId} className="flex items-center justify-between rounded-2xl border-[3px] border-ink bg-background px-4 py-2 text-sm font-semibold">
              <span>{(index + 1).toLocaleString("fa-IR")}. {nameOf.get(row.accountId) ?? "بازیکن"}</span>
              <span>{row.points.toLocaleString("fa-IR")} امتیاز رأی</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
