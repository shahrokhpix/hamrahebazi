import { DiceDoodle, FaceDoodle, TicketDoodle } from "@/components/doodles";
import { getSiteContent } from "@/server/content";

export default async function ServicesPage() {
  const site = await getSiteContent();
  const copy = site.copy;
  const services = [
    { title: copy.service1Title, text: copy.service1Text, Icon: TicketDoodle, tone: "bg-sun" },
    { title: copy.service2Title, text: copy.service2Text, Icon: DiceDoodle, tone: "bg-sky" },
    { title: copy.service3Title, text: copy.service3Text, Icon: FaceDoodle, tone: "bg-leaf" },
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="text-4xl leading-none sm:text-5xl">{copy.servicesTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{copy.servicesIntro}</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <li key={service.title} className={`rounded-[1.5rem] border-[3px] border-ink p-5 shadow-[4px_4px_0_#1c2430] ${service.tone}`}>
            <service.Icon className="h-12 w-12" />
            <h2 className="mt-3 text-3xl">{service.title}</h2>
            <p className="mt-2 text-sm leading-7">{service.text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
