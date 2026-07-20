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
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    setT(diff(target));
    let prevSecs = diff(target).secs;
    const id = setInterval(() => {
      const next = diff(target);
      if (next.secs !== prevSecs) {
        setPulseKey((k) => k + 1);
        prevSecs = next.secs;
      }
      setT(next);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (mounted && t.done) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-card/60 px-6 py-4 backdrop-blur">
        <p className="font-serif text-xl font-bold text-gradient-gold sm:text-2xl">
          The night is here!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">See you at the celebration.</p>
      </div>
    );
  }

  const cells = mounted
    ? [
        { label: "Days", value: String(t.days).padStart(2, "0") },
        { label: "Hours", value: String(t.hours).padStart(2, "0") },
        { label: "Minutes", value: String(t.mins).padStart(2, "0") },
        { label: "Seconds", value: String(t.secs).padStart(2, "0"), pulse: true },
      ]
    : PLACEHOLDER.map((c) => ({ ...c, pulse: false }));

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-gold/30 bg-card/60 p-3 text-center shadow-gold/20 backdrop-blur sm:p-5"
        >
          <div
            key={c.pulse ? pulseKey : c.label}
            className={`font-serif text-2xl font-bold text-gradient-gold sm:text-5xl ${c.pulse ? "animate-gold-pulse" : ""}`}
          >
            {c.value}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
