import { redirect } from "next/navigation";
import { StarDoodle } from "@/components/doodles";
import { PageHeader } from "@/components/ui";
import { VerifyForm } from "@/components/forms";
import { currentAccount, devOtpPreview } from "@/server/auth";
import { getSiteContent } from "@/server/content";

export default async function VerifyPage() {
  const account = await currentAccount();
  if (account) redirect("/");
  const [devCode, site] = await Promise.all([devOtpPreview(), getSiteContent()]);
  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-[2rem] border-[3px] border-ink bg-card p-6 shadow-[6px_6px_0_#1c2430]">
        <StarDoodle className="mb-2 h-12 w-12 text-sun" />
        <PageHeader brand={site.copy.brandName} title={site.copy.verifyTitle} subtitle={site.copy.verifySubtitle} />
        <VerifyForm devCode={devCode} />
      </div>
    </main>
  );
}
