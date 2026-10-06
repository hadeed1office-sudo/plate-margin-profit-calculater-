"use client";

import { formatPct } from "@/lib/format";

export function PlateGauge({ margin, target }: { margin: number | null; target: number }) {
  const size = 220;
  const stroke = 16;
  const radius = 86;
  const circ = 2 * Math.PI * radius;
  const value = margin == null ? 0 : Math.max(0, Math.min(100, margin));
  const dash = (value / 100) * circ;
  const tone = margin == null ? "#8D6E32" : margin >= target ? "#246246" : margin >= target - 6 ? "#8D6E32" : "#9E342C";
  const angle = ((target / 100) * 360 - 90) * (Math.PI / 180);
  const cx = size / 2;
  const cy = size / 2;
  const tickA = { x: cx + Math.cos(angle) * (radius - 14), y: cy + Math.sin(angle) * (radius - 14) };
  const tickB = { x: cx + Math.cos(angle) * (radius + 14), y: cy + Math.sin(angle) * (radius + 14) };

  return (
    <div className="relative" role="img" aria-label={margin == null ? "No blended margin yet" : `Blended margin ${formatPct(margin)}, floor ${formatPct(target, 0)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius + 24} fill="#FFFCF7" stroke="#E4D8C6" />
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#EFE6D8" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <line x1={tickA.x} y1={tickA.y} x2={tickB.x} y2={tickB.y} stroke="#1C1712" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Blended</p>
        <p className="num mt-1 text-4xl text-ink">{margin == null ? "—" : formatPct(margin)}</p>
        <p className="mt-1 text-xs text-ink-soft">Floor {formatPct(target, 0)}</p>
      </div>
    </div>
  );
}

export function Sparkline({ values, tone = "#246246" }: { values: number[]; tone?: string }) {
  if (values.length < 2) return <span className="text-xs text-ink-soft">No trail yet</span>;
  const width = 112;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * (width - 4) + 2;
      const y = max === min ? height / 2 : height - 4 - ((value - min) / (max - min)) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-28" aria-hidden="true">
      <polyline fill="none" stroke={tone} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}

export function MarginTrack({ margin, target }: { margin: number | null; target: number }) {
  const left = margin == null ? 0 : Math.max(0, Math.min(100, margin));
  const tone = margin == null ? "bg-ink-soft" : margin >= target ? "bg-sage" : margin >= target - 6 ? "bg-brass" : "bg-chili";
  return (
    <div className="relative h-2 rounded-full bg-[#efe6d8]" aria-hidden="true">
      <div className={`absolute inset-y-0 left-0 rounded-full ${tone}`} style={{ width: `${left}%` }} />
      <div className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-ink" style={{ left: `${Math.max(0, Math.min(100, target))}%` }} />
    </div>
  );
}
