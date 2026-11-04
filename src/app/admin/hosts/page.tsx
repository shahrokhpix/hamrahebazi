import { setHostStatusAction } from "@/server/actions";
import { prisma } from "@/infrastructure/prisma";

function hostLabel(status: string): string {
  if (status === "approved") return "تأییدشده";
  if (status === "suspended") return "معلق";
  return status;
}

export default async function AdminHostsPage() {
  const hosts = await prisma.host.findMany({ include: { account: true, tables: true }, orderBy: { displayName: "asc" } });
  return (
    <main className="space-y-4">
      {hosts.map((host) => (
        <article key={host.id} className="rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl">{host.displayName}</h2>
              <p className="mt-1 text-sm text-muted">{host.address}</p>
              <p className="mt-1 text-sm" dir="ltr">
                {host.account.phone}
              </p>
              <p className="mt-2 text-sm">
                {hostLabel(host.status)} · {host.tables.length} میز
              </p>
            </div>
            <form action={setHostStatusAction} className="flex gap-2">
              <input type="hidden" name="hostId" value={host.id} />
              <button className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-leaf px-4 font-semibold" name="status" value="approved" type="submit">
                تأیید
              </button>
              <button className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-coral px-4 font-semibold" name="status" value="suspended" type="submit">
                تعلیق
              </button>
            </form>
          </div>
        </article>
      ))}
    </main>
  );
}
