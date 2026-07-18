import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  const ms = Math.max(0, target - now);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return { days, hours, mins, secs, done: ms === 0 };
}

const PLACEHOLDER = [
  { label: "Days", value: "--" },
  { label: "Hours", value: "--" },
  { label: "Minutes", value: "--" },
  { label: "Seconds", value: "--" },
];

export function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  const [mounted, setMounted] = useState(false);
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    setMounted(true);
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells = mounted
    ? [
        { label: "Days", value: String(t.days).padStart(2, "0") },
        { label: "Hours", value: String(t.hours).padStart(2, "0") },
        { label: "Minutes", value: String(t.mins).padStart(2, "0") },
        { label: "Seconds", value: String(t.secs).padStart(2, "0") },
      ]
    : PLACEHOLDER;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {cells.map((c) => (
        <div key={c.label} className="rounded-xl border border-gold/30 bg-card/60 p-3 text-center backdrop-blur sm:p-5">
          <div className="font-serif text-2xl font-bold text-gradient-gold sm:text-5xl">
            {c.value}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
