import { decideCafeImageAction } from "@/server/actions";
import { DecisionForm } from "@/components/decision-form";
import { AdminCafeForm } from "@/components/forms";
import { prisma } from "@/infrastructure/prisma";

export default async function AdminCafesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [accounts, hosts] = await Promise.all([
    prisma.account.findMany({ orderBy: { phone: "asc" }, select: { id: true, phone: true } }),
    prisma.host.findMany({ where: { OR: [{ pendingImagePath: { not: "" } }, { imagePath: { not: "" } }] }, orderBy: { displayName: "asc" } }),
  ]);
  return (
    <main className="space-y-6">
      <section className="max-w-xl rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
        <h2 className="mb-2 text-3xl">کافه تأییدشده</h2>
        <p className="mb-4 text-sm leading-7 text-muted">صاحب کافه باید قبلاً یک بار وارد شده باشد. با این فرم همان حساب میزبان تأییدشده می‌شود و میز اول ساخته می‌شود.</p>
        <AdminCafeForm accounts={accounts} />
      </section>
      {error ? <p className="rounded-2xl border-[3px] border-ink bg-coral px-4 py-3 text-sm">تصویر باید jpg، png، webp یا gif و حداکثر ۲ مگابایت باشد.</p> : null}
      <ul className="space-y-3">
        {hosts.map((host) => (
          <li key={host.id} className="space-y-3 rounded-[1.2rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
            <h3 className="font-display text-2xl">{host.displayName}</h3>
            {host.imagePath ? <img src={host.imagePath} alt="" className="h-28 w-full rounded-2xl border-[3px] border-ink object-cover" /> : null}
            {host.pendingImagePath ? <img src={host.pendingImagePath} alt="" className="h-28 w-full rounded-2xl border-[3px] border-ink object-cover" /> : null}
            {host.pendingImagePath ? <p className="text-sm font-semibold">تصویر در انتظار تأیید</p> : null}
            <DecisionForm action={decideCafeImageAction} fields={[{ name: "hostId", value: host.id }]} approveLabel="تأیید یا جایگزینی تصویر" rejectLabel={host.pendingImagePath ? "رد تصویر" : undefined}>
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full min-h-12 rounded-2xl border-[3px] border-ink bg-background px-4 py-2" />
            </DecisionForm>
          </li>
        ))}
      </ul>
    </main>
  );
}
