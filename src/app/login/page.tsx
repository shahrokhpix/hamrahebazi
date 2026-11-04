import { redirect } from "next/navigation";
import { DiceDoodle, StarDoodle } from "@/components/doodles";
import { PageHeader } from "@/components/ui";
import { LoginForm } from "@/components/forms";
import { currentAccount } from "@/server/auth";
import { getSiteContent } from "@/server/content";

export default async function LoginPage() {
  const account = await currentAccount();
  if (account) redirect("/");
  const site = await getSiteContent();
  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-[2rem] border-[3px] border-ink bg-card p-6 shadow-[6px_6px_0_#1c2430]">
        <div className="mb-2 flex items-center justify-between text-foreground">
          <StarDoodle className="h-12 w-12 text-sun" />
          <DiceDoodle className="h-14 w-14" />
        </div>
        <PageHeader brand={site.copy.brandName} title={site.copy.loginTitle} subtitle={site.copy.loginSubtitle} />
        <LoginForm phoneLabel={site.copy.phoneLabel} submitLabel={site.copy.loginSubmit} />
      </div>
    </main>
  );
}
