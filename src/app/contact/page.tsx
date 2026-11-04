import { ContactForm } from "@/components/contact-form";
import { getSiteContent } from "@/server/content";
import { getIntegration } from "@/server/integrations";

export default async function ContactPage() {
  const [site, integration] = await Promise.all([getSiteContent(), getIntegration()]);
  const details = [
    integration.contactPhone ? `تلفن: ${integration.contactPhone}` : "",
    integration.contactEmail ? `ایمیل: ${integration.contactEmail}` : "",
    integration.contactAddress ? integration.contactAddress : "",
  ].filter(Boolean);
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:py-10 lg:grid-cols-2">
      <section>
        <h1 className="text-4xl leading-none sm:text-5xl">{site.copy.contactTitle}</h1>
        <p className="mt-3 text-sm leading-8 text-muted">{site.copy.contactIntro}</p>
        {details.length > 0 ? (
          <ul className="mt-4 space-y-2 rounded-[1.5rem] border-[3px] border-ink bg-sun p-4 text-sm leading-7">
            {details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
        <ContactForm />
      </section>
    </main>
  );
}
