'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

// Single-series bar chart (SVG). One colour per chart; the title names the series, so no legend.
// Hover/tap a column for its tooltip; the highest bar is labelled directly; "Table" shows the numbers.
//
// data: [{ key, label, value, tooltip? }]  label = short x-axis text, tooltip = full line for the tooltip

const INK = { primary: '#3b1a12', secondary: '#7c5a4a', muted: '#a8907f', grid: '#efe3cc', surface: '#ffffff' };

function niceMax(max) {
  if (max <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * pow * 4 >= max) * pow;
  return step * 4;
}

export default function BarChart({
  title,
  subtitle,
  data = [],
  color = '#d9600f',
  height = 170,
  unit = '',
  emptyText = 'No data yet',
  tableLabels = { label: 'Day', value: 'Value' },
}) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(320);
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [showTable, data.length]);

  const pad = { top: 18, right: 4, bottom: 22, left: 28 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const slot = data.length ? plotW / data.length : plotW;
  const gap = 2;
  const barW = Math.max(2, Math.min(28, slot - gap));
  const maxIndex = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const hasData = data.some((d) => d.value > 0);
  // Show at most ~8 x-axis labels so they never collide
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 42))));

  const y = (v) => pad.top + plotH - (v / max) * plotH;
  const barPath = (x, top, w, h) => {
    const r = Math.min(4, w / 2, h);
    return `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${top + h} Z`;
  };

  const hovered = hover != null ? data[hover] : null;
  const tipX = hover != null ? pad.left + hover * slot + slot / 2 : 0;

  return (
    <div className="bg-white rounded-2xl border border-chandan-300 shadow-sm p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-kumkum-900 text-base leading-tight">{title}</h3>
          {subtitle && <p className="text-xs" style={{ color: INK.secondary }}>{subtitle}</p>}
        </div>
        {hasData && (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-chandan-300 text-kumkum-700 hover:bg-chandan-100 flex-shrink-0"
          >
            {showTable ? 'Chart' : 'Table'}
          </button>
        )}
      </div>

      {!hasData ? (
        <p className="text-sm text-center py-8" style={{ color: INK.muted }}>{emptyText}</p>
      ) : showTable ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ color: INK.secondary }}>
                <th className="py-1 font-semibold">{tableLabels.label}</th>
                <th className="py-1 font-semibold text-right">{tableLabels.value}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key} className="border-t border-chandan-200">
                  <td className="py-1" style={{ color: INK.primary }}>{d.tooltipLabel || d.label}</td>
                  <td className="py-1 text-right font-semibold tabular-nums" style={{ color: INK.primary }}>{d.value}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative select-none" onMouseLeave={() => setHover(null)}>
          <svg width={width} height={height} role="img" aria-label={title}>
            {/* gridlines + y labels */}
            {ticks.map((tv, i) => (
              <g key={i}>
                <line x1={pad.left} x2={width - pad.right} y1={y(tv)} y2={y(tv)} stroke={i === 0 ? INK.muted : INK.grid} strokeWidth="1" />
                {(i === 0 || i === 2 || i === 4) && (
                  <text x={pad.left - 6} y={y(tv) + 3} textAnchor="end" fontSize="10" fill={INK.muted}>
                    {Number.isInteger(tv) ? tv : tv.toFixed(1)}
                  </text>
                )}
              </g>
            ))}

            {data.map((d, i) => {
              const x = pad.left + i * slot + (slot - barW) / 2;
              const h = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * plotH);
              const dim = hover != null && hover !== i;
              return (
                <g key={d.key}>
                  {h > 0 && <path d={barPath(x, y(0) - h, barW, h)} fill={color} opacity={dim ? 0.45 : 1} />}
                  {i % labelEvery === 0 && (
                    <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="10" fill={INK.muted}>{d.label}</text>
                  )}
                  {/* direct label on the best bar only */}
                  {i === maxIndex && d.value > 0 && hover == null && (
                    <text x={x + barW / 2} y={y(0) - h - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={INK.primary}>
                      {d.value}{unit}
                    </text>
                  )}
                  {/* hit area larger than the bar */}
                  <rect
                    x={pad.left + i * slot}
                    y={pad.top}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setHover(hover === i ? null : i)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
              style={{
                left: Math.min(Math.max(tipX, 60), width - 60),
                background: INK.primary,
                color: '#fff',
              }}
            >
              <span className="font-semibold">{hovered.tooltipLabel || hovered.label}</span>
              <span className="opacity-80"> · </span>
              <span className="font-bold">{hovered.tooltip || `${hovered.value}${unit}`}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
