type DoodleProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HouseDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M10 30 L32 12 L54 31" {...stroke} />
      <path d="M16 28 V50 H48 V27" {...stroke} />
      <path d="M28 50 V38 H38 V50" {...stroke} />
      <circle cx="44" cy="36" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function DiceDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M16 14h30c3 0 6 3 6 7v26c0 4-3 7-7 7H18c-4 0-7-3-7-7V20c0-4 2-6 5-6z" {...stroke} />
      <circle cx="24" cy="26" r="2.4" fill="currentColor" />
      <circle cx="40" cy="26" r="2.4" fill="currentColor" />
      <circle cx="32" cy="36" r="2.4" fill="currentColor" />
      <circle cx="24" cy="46" r="2.4" fill="currentColor" />
      <circle cx="40" cy="46" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function TicketDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M12 22h40v7c-4 1-4 7 0 8v7H12v-7c4-1 4-7 0-8z" {...stroke} />
      <path d="M32 24 V46" {...stroke} strokeDasharray="3 4" />
    </svg>
  );
}

export function FaceDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M32 10c14 1 22 12 21 24-1 13-11 21-21 21S11 47 11 34C10 20 18 9 32 10z" {...stroke} />
      <circle cx="24" cy="30" r="2" fill="currentColor" />
      <circle cx="40" cy="30" r="2" fill="currentColor" />
      <path d="M24 40c3 5 13 5 17-1" {...stroke} />
    </svg>
  );
}

export function StarDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M32 8l6 16 17 1-13 11 4 17-14-9-15 8 5-17L8 25l17-1z" {...stroke} />
    </svg>
  );
}

export function MeepleDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="16" r="7" {...stroke} />
      <path d="M20 30c2-6 22-6 24 0 6 2 10 8 8 14H12c-2-6 2-12 8-14z" {...stroke} />
      <path d="M18 48h28l3 8H15z" {...stroke} />
    </svg>
  );
}

export function CheckDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="20" {...stroke} />
      <path d="M20 33 l8 8 16-18" {...stroke} />
    </svg>
  );
}

export function SearchDoodle({ className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="28" cy="28" r="14" {...stroke} />
      <path d="M38 39 L52 53" {...stroke} />
    </svg>
  );
}
