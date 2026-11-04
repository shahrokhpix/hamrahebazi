import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/server/auth";
import { getSiteContent } from "@/server/content";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const site = await getSiteContent();
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 pb-28 md:pb-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-lg text-primary">{site.copy.brandName}</p>
          <h1 className="text-4xl">پنل ادمین</h1>
        </div>
        <Link className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-sun px-4 font-semibold" href="/">
          بازگشت به خانه
        </Link>
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
