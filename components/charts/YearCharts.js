'use client';

import React, { useMemo } from 'react';
import { CalendarCheck, BookOpen, Trophy } from 'lucide-react';
import BarChart from './BarChart';
import { useLanguage } from '../LanguageContext';

// Chart colours (validated as a pair for colour-blind safety): kesar = attendance, kumkum = gatha
export const ATTENDANCE_COLOR = '#ee6a0b';
export const GATHA_COLOR = '#d81b60';

const dateOf = (r) => String(r.date || r.created_at || '').slice(0, 10);

// Last 12 months of one student's attendance days and new gathas
export default function YearCharts({ attendanceHistory = [], gathaEntries = [] }) {
  const { t, lang } = useLanguage();
  const locale = lang === 'gu' ? 'gu-IN' : 'en-IN';

  const months = useMemo(() => {
    const now = new Date();
    const list = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push({
        key,
        label: d.toLocaleDateString(locale, { month: 'short' }),
        tooltipLabel: d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
        attendance: 0,
        gathas: 0,
      });
    }
    const byKey = Object.fromEntries(list.map((m) => [m.key, m]));
    const seenDays = new Set();
    attendanceHistory.forEach((r) => {
      const day = dateOf(r);
      if (!day || seenDays.has(day)) return;
      seenDays.add(day);
      const m = byKey[day.slice(0, 7)];
      if (m) m.attendance += 1;
    });
    gathaEntries.forEach((g) => {
      if (g.type !== 'new') return;
      const m = byKey[dateOf(g).slice(0, 7)];
      if (m) m.gathas += Number(g.total_gatha) || 0;
    });
    return list;
  }, [attendanceHistory, gathaEntries, locale]);

  const totalDays = months.reduce((s, m) => s + m.attendance, 0);
  const totalGathas = months.reduce((s, m) => s + m.gathas, 0);
  const best = months.reduce((b, m) => (m.attendance > (b?.attendance ?? -1) ? m : b), null);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-kumkum-900 flex items-center gap-2">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-kesar-500 to-kumkum-600" />
        {t('yr_title')}
      </h2>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: CalendarCheck, value: totalDays, label: t('yr_days'), accent: 'text-kesar-700' },
          { icon: BookOpen, value: totalGathas, label: t('yr_gathas'), accent: 'text-kumkum-700' },
          { icon: Trophy, value: best && best.attendance > 0 ? best.label : '–', label: t('yr_best_month'), accent: 'text-sona-600' },
        ].map(({ icon: Icon, value, label, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-chandan-300 p-3 text-center shadow-sm">
            <Icon className={`w-5 h-5 mx-auto ${accent}`} />
            <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
            <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <BarChart
        title={t('yr_att_chart')}
        subtitle={t('yr_last_12')}
        color={ATTENDANCE_COLOR}
        data={months.map((m) => ({ key: m.key, label: m.label, tooltipLabel: m.tooltipLabel, value: m.attendance, tooltip: `${m.attendance} ${t('yr_days_unit')}` }))}
        emptyText={t('yr_empty')}
        tableLabels={{ label: t('yr_month'), value: t('yr_days') }}
      />
      <BarChart
        title={t('yr_gatha_chart')}
        subtitle={t('yr_last_12')}
        color={GATHA_COLOR}
        data={months.map((m) => ({ key: m.key, label: m.label, tooltipLabel: m.tooltipLabel, value: m.gathas, tooltip: `${m.gathas} ${t('yr_gathas_unit')}` }))}
        emptyText={t('yr_empty')}
        tableLabels={{ label: t('yr_month'), value: t('yr_gathas') }}
      />
    </section>
  );
}
