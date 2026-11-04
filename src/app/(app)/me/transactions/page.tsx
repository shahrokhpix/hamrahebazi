import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { currentAccount } from "@/server/auth";
import { formatRial, formatWhen } from "@/server/catalog";
import { netPaidRial } from "@/domain/decisions";
import { prisma } from "@/infrastructure/prisma";

export default async function TransactionsPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
  });
  const net = netPaidRial(entries.map((entry) => ({ type: entry.type as "charge" | "refund", amountRial: entry.amountRial })));
  return (
    <main className="space-y-6">
      <PageHeader title="تراکنش‌ها" subtitle="فقط پرداخت صندلی و استرداد همین جریان. برداشت و شارژ آزاد اینجا نیست." />
      <p className="rounded-xl border border-line bg-card p-5">
        خالص پرداخت‌شده: <strong>{formatRial(net)}</strong>
      </p>
      {entries.length === 0 ? <p className="text-sm text-muted">تراکنشی ثبت نشده است.</p> : null}
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
            <span>{entry.type === "charge" ? "پرداخت" : "استرداد"}</span>
            <span>{formatRial(entry.amountRial)}</span>
            <time className="text-muted">{formatWhen(entry.createdAt)}</time>
          </li>
        ))}
      </ul>
    </main>
  );
}
