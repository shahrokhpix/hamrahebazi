import Image from "next/image";
import Link from "next/link";
import { DiceDoodle, FaceDoodle, StarDoodle, TicketDoodle } from "@/components/doodles";
import { buttonClass } from "@/components/ui";
import { getSiteContent } from "@/server/content";

export default async function HowPage() {
  const site = await getSiteContent();
  const copy = site.copy;
  const steps = [
    { title: copy.howStep1Title, text: copy.howStep1Text, Icon: FaceDoodle, tone: "bg-coral" },
    { title: copy.howStep2Title, text: copy.howStep2Text, Icon: DiceDoodle, tone: "bg-sky" },
    { title: copy.howStep3Title, text: copy.howStep3Text, Icon: TicketDoodle, tone: "bg-sun" },
    { title: copy.howStep4Title, text: copy.howStep4Text, Icon: StarDoodle, tone: "bg-leaf" },
  ];
  return (
    <main>
      <section className="border-b-[3px] border-ink bg-coral">
        <div className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-6 lg:grid-cols-2 lg:gap-8 lg:py-10">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl leading-none sm:text-5xl">{copy.howTitle}</h1>
            <p className="mt-3 text-sm leading-7 sm:text-base sm:leading-8">{copy.howBody}</p>
            <div className="mt-5 grid sm:inline-grid">
              <Link className={buttonClass} href="/games">
                {copy.howCta}
              </Link>
            </div>
          </div>
          <Image src={site.howImage} alt={copy.howAlt} width={640} height={480} className="order-1 h-auto w-full rounded-[1.4rem] border-[3px] border-ink shadow-[4px_4px_0_#1c2430] lg:order-2 lg:rounded-[1.8rem]" />
        </div>
      </section>
      <ol className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.title} className={`rounded-[1.5rem] border-[3px] border-ink p-5 shadow-[4px_4px_0_#1c2430] ${step.tone}`}>
            <step.Icon className="h-12 w-12" />
            <h2 className="mt-3 text-3xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-7">{step.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
