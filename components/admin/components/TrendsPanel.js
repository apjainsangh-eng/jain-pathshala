'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, CalendarDays, BookOpen, RefreshCw } from 'lucide-react';
import BarChart from '../../charts/BarChart';
import { ATTENDANCE_COLOR, GATHA_COLOR } from '../../charts/YearCharts';
import { useLanguage } from '../../LanguageContext';

const API_BASE = '/api';
const RANGES = [7, 30, 90];

// Admin overview analytics: day-by-day attendance and new gathas, plus the weekday pattern
export default function TrendsPanel() {
  const { t, lang } = useLanguage();
  const locale = lang === 'gu' ? 'gu-IN' : 'en-IN';
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (range) => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`${API_BASE}/admin/trends?days=${range}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('jainPathshalaToken') },
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const fmt = useCallback((date, opts) => new Date(`${date}T00:00:00`).toLocaleDateString(locale, opts), [locale]);

  const charts = useMemo(() => {
    if (!data) return null;
    const short = days > 30 ? { day: 'numeric', month: 'short' } : { day: 'numeric' };
    const attendance = data.series.map((d) => ({
      key: d.date,
      label: fmt(d.date, short),
      tooltipLabel: fmt(d.date, { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.present,
      tooltip: `${d.present} / ${data.activeStudents} ${t('tr_present')}`,
    }));
    const gathas = data.series.map((d) => ({
      key: d.date,
      label: fmt(d.date, short),
      tooltipLabel: fmt(d.date, { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.newGathas,
      tooltip: `${d.newGathas} ${t('yr_gathas_unit')}`,
    }));

    // Average students present per pathshala day (days with any attendance), Monday first
    const sums = Array(7).fill(0);
    const counts = Array(7).fill(0);
    data.series.forEach((d) => {
      if (d.present === 0) return;
      const wd = (new Date(`${d.date}T00:00:00`).getDay() + 6) % 7;
      sums[wd] += d.present;
      counts[wd] += 1;
    });
    const monday = new Date(2024, 0, 1); // a Monday
    const weekday = sums.map((sum, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const avg = counts[i] ? Math.round(sum / counts[i]) : 0;
      return {
        key: String(i),
        label: day.toLocaleDateString(locale, { weekday: 'short' }),
        tooltipLabel: day.toLocaleDateString(locale, { weekday: 'long' }),
        value: avg,
        tooltip: `${avg} ${t('tr_avg_present')} (${counts[i]} ${t('tr_days')})`,
      };
    });
    return { attendance, gathas, weekday };
  }, [data, days, fmt, locale, t]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-kumkum-900 flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-kesar-500 to-kumkum-600" />
          {t('tr_title')}
        </h2>
        {/* Filters: one row above the charts */}
        <div className="flex items-center gap-1 bg-white border border-chandan-300 rounded-xl p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                days === r ? 'bg-kumkum-600 text-white' : 'text-kumkum-700 hover:bg-chandan-100'
              }`}
            >
              {r}{t('tr_days_short')}
            </button>
          ))}
          <button onClick={() => load(days)} className="p-1.5 text-kumkum-700" title={t('adm_refresh')}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {failed && <p className="text-sm text-red-600">{t('tr_failed')}</p>}

      {data && charts && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Users, value: data.summary.avgPresent, label: t('tr_avg_per_day'), accent: 'text-kesar-700' },
              { icon: CalendarDays, value: data.summary.heldDays, label: t('tr_held_days'), accent: 'text-sona-600' },
              { icon: BookOpen, value: data.summary.totalNewGathas, label: t('yr_gathas'), accent: 'text-kumkum-700' },
            ].map(({ icon: Icon, value, label, accent }) => (
              <div key={label} className="bg-white rounded-2xl border border-chandan-300 p-3 text-center shadow-sm">
                <Icon className={`w-5 h-5 mx-auto ${accent}`} />
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
                <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <BarChart
            title={t('tr_att_chart')}
            subtitle={`${t('tr_of')} ${data.activeStudents} ${t('tr_active_students')} · ${t('tr_tap')}`}
            color={ATTENDANCE_COLOR}
            data={charts.attendance}
            emptyText={t('yr_empty')}
            tableLabels={{ label: t('tr_date'), value: t('tr_present_col') }}
          />
          <BarChart
            title={t('tr_gatha_chart')}
            subtitle={t('tr_tap')}
            color={GATHA_COLOR}
            data={charts.gathas}
            emptyText={t('yr_empty')}
            tableLabels={{ label: t('tr_date'), value: t('yr_gathas') }}
          />
          <BarChart
            title={t('tr_weekday_chart')}
            subtitle={t('tr_weekday_sub')}
            color={ATTENDANCE_COLOR}
            height={150}
            data={charts.weekday}
            emptyText={t('yr_empty')}
            tableLabels={{ label: t('tr_weekday'), value: t('tr_avg_present') }}
          />
        </>
      )}
    </section>
  );
}
