import Image from "next/image";
import Link from "next/link";

const artByName: Record<string, string> = {
  "شهر و جاده": "/art/city-road.jpg",
  "تاس و ستاره": "/art/dice-party.jpg",
  "کافه کارت": "/art/cafe-table.jpg",
};

export function artFor(name: string): string {
  return artByName[name] ?? "/art/dice-party.jpg";
}

export function GameCard({
  href,
  name,
  host,
  when,
  price,
  seats,
  age,
  status,
  fits,
  image,
}: {
  href: string;
  name: string;
  host: string;
  when: string;
  price: string;
  seats: string;
  age: string;
  status: string;
  fits?: boolean;
  image?: string;
}) {
  return (
    <Link
      href={href}
      className="block cursor-pointer overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-card text-foreground shadow-[5px_5px_0_#1c2430] transition-transform duration-200 motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative">
        <Image src={image || artFor(name)} alt="" width={640} height={480} className="h-40 w-full object-cover sm:h-44" />
        <span className="absolute start-3 top-3 rounded-full border-[3px] border-ink bg-card px-3 py-1 text-xs font-bold">{status}</span>
        {fits ? <span className="absolute end-3 top-3 rounded-full border-[3px] border-ink bg-leaf px-3 py-1 text-xs font-bold">مناسب شما</span> : null}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-display text-2xl leading-tight">{name}</h3>
        <p className="line-clamp-2 text-sm leading-6 text-muted">{host}</p>
        <p className="text-sm text-muted">{when}</p>
        <p className="flex flex-wrap gap-2 pt-1 text-xs font-semibold">
          <span className="rounded-full bg-sun px-3 py-1">{price}</span>
          <span className="rounded-full bg-leaf px-3 py-1">{seats}</span>
          <span className="rounded-full bg-sky px-3 py-1">{age}</span>
        </p>
      </div>
    </Link>
  );
}
