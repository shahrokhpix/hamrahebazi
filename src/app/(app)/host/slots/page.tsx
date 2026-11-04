import { CafeForm, SlotForm, TableForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { currentAccount } from "@/server/auth";
import { formatWhen } from "@/server/catalog";
import { prisma } from "@/infrastructure/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HostSlotsPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (!account.host || account.host.status !== "approved") {
    return (
      <main>
        <PageHeader title="کافهٔ من" subtitle="اول از پروفایل درخواست کافه بده. بعد از تأیید ادمین، نام، میز و سانس را این‌جا می‌سازی." />
        <Link href="/me/profile" className="cursor-pointer text-sm font-bold text-primary">
          رفتن به پروفایل
        </Link>
      </main>
    );
  }
  const tables = await prisma.table.findMany({
    where: { hostId: account.host.id },
    include: { slots: { orderBy: { startsAt: "asc" } } },
  });
  return (
    <main className="space-y-10">
      <PageHeader title="کافهٔ من" subtitle="نام و آدرس را ذخیره کن، میز بساز، بعد سانس آزاد بگذار. مهمان قطعی را میزبان رد نمی‌کند." />
      <CafeForm displayName={account.host.displayName} address={account.host.address} latitude={account.host.latitude} longitude={account.host.longitude} />
      <section className="space-y-4">
        <h2 className="text-3xl">میز تازه</h2>
        <TableForm />
      </section>
      <section className="space-y-4">
        <h2 className="text-3xl">سانس آزاد</h2>
        <SlotForm tables={tables.map((table) => ({ id: table.id, name: table.name }))} />
      </section>
      <ul className="space-y-3">
        {tables.flatMap((table) =>
          table.slots.map((slot) => (
            <li key={slot.id} className="rounded-[1.2rem] border-[3px] border-ink bg-card p-4 text-sm shadow-[4px_4px_0_#1c2430]">
              {table.name} · {formatWhen(slot.startsAt)} تا {formatWhen(slot.endsAt)} · {slot.currentSessionId ? "در اختیار رویداد" : "آزاد"}
            </li>
          )),
        )}
      </ul>
    </main>
  );
}
