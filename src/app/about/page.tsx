import { getSiteContent } from "@/server/content";

export default async function AboutPage() {
  const site = await getSiteContent();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <p className="font-display text-lg text-primary">{site.copy.brandName}</p>
      <h1 className="mt-2 text-4xl leading-none sm:text-5xl">{site.copy.aboutTitle}</h1>
      <div className="mt-6 whitespace-pre-wrap rounded-[1.5rem] border-[3px] border-ink bg-card p-5 text-sm leading-8 shadow-[4px_4px_0_#1c2430]">
        {site.copy.aboutBody}
      </div>
    </main>
  );
}
