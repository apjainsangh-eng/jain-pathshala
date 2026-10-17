'use client';

import React, { useEffect, useState } from 'react';
import { User, Phone, Lock, Save, Eye, EyeOff, Users, Info, Loader } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const API_BASE = '/api';
const EMPTY = {
  firstName: '', lastName: '', email: '', dateOfBirth: '', gender: '', whatsappNumber: '', address: '',
  currentStatus: '', studyDetails: '', otherActivities: '', dharmicAbhyas: '', skills: '',
};
const STATUS_OPTIONS = ['school', 'college', 'working', 'business', 'homemaker', 'retired', 'other'];
// Must match REQUIRED_FIELDS on the server (lib/server/controllers/profileController.js)
const REQUIRED = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 'currentStatus'];
const REQUIRED_LABELS = { firstName: 'pf_first_name', lastName: 'pf_last_name', dateOfBirth: 'pf_dob', gender: 'pf_gender', address: 'pf_address', currentStatus: 'pf_status' };

const inputClass =
  'w-full px-4 py-3 bg-chandan-50 border-2 border-chandan-300 rounded-2xl focus:border-kesar-500 focus:bg-white focus:outline-none text-base text-gray-800 transition-colors';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-kumkum-900 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-white rounded-3xl border border-chandan-300 shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-kesar-500 to-kumkum-600 text-white flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-kumkum-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// My Profile: basic details of the student being viewed, plus the family login's password
export default function ProfilePage({ username, isViewingOther, onSaved, onError, onSuccess }) {
  const { t } = useLanguage();
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  // "Currently attending other classes?" — Yes shows the details box
  const [hasOther, setHasOther] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const token = () => localStorage.getItem('jainPathshalaToken');

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    fetch(`${API_BASE}/student/profile?username=${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('pf_load_fail'));
        if (cancelled) return;
        setInfo(data);
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] || ''])));
        setHasOther(!!data.otherActivities);
      })
      .catch((err) => { if (!cancelled) onError(err.message); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) return onError(t('pf_first_name_err'));
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/student/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ username, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('pf_save_fail'));
      onSuccess(t('pf_saved'));
      onSaved?.(username, data.name);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) return onError(t('pf_pw_short'));
    if (pw.next !== pw.confirm) return onError(t('pf_pw_mismatch'));
    setChangingPw(true);
    try {
      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error(t('pf_pw_wrong'));
      if (!res.ok) throw new Error(data.error || t('pf_pw_fail'));
      setPw({ current: '', next: '', confirm: '' });
      onSuccess(t('pf_pw_changed'));
    } catch (err) {
      onError(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  if (!info) {
    return (
      <div className="bg-white rounded-3xl border border-chandan-300 p-8 text-center">
        <Loader className="w-7 h-7 animate-spin text-kesar-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Who */}
      <div className="relative overflow-hidden bg-gradient-to-br from-kesar-500 via-kesar-600 to-kumkum-600 rounded-3xl p-5 text-white shadow-temple">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-chandan-100 text-kumkum-700 font-display text-3xl font-bold flex items-center justify-center ring-4 ring-sona-400/60 flex-shrink-0">
            {(info.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold truncate">{info.name}</h2>
            {info.loginMobile && (
              <p className="text-sm text-chandan-200 flex items-center gap-1.5"><Phone className="w-4 h-4" /> {info.loginMobile}</p>
            )}
            {info.familyGroup && (
              <p className="text-xs text-chandan-200 flex items-center gap-1.5 mt-0.5"><Users className="w-3.5 h-3.5" /> {info.familyGroup}</p>
            )}
          </div>
        </div>
        {isViewingOther && (
          <p className="mt-3 text-xs bg-white/15 rounded-xl px-3 py-2">{t('pf_editing_member')}</p>
        )}
      </div>

      {/* Still to fill (same list the reminder popup uses); updates as they type */}
      {(() => {
        const missing = REQUIRED.filter((k) => !String(form[k] || '').trim());
        if (missing.length === 0) return null;
        return (
          <div className="bg-kesar-50 rounded-3xl p-4">
            <p className="text-sm font-bold text-kesar-800">{t('pr_banner')}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {missing.map((k) => (
                <span key={k} className="text-xs font-semibold bg-white text-kumkum-700 rounded-full px-2.5 py-1">{t(REQUIRED_LABELS[k])}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Student details (same fields as the pathshala registration form) */}
      <Card icon={User} title={t('pf_details_title')} subtitle={t('pf_details_sub')}>
        <form onSubmit={saveDetails} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('pf_first_name')}>
              <input className={inputClass} value={form.firstName} onChange={set('firstName')} maxLength={40} autoComplete="given-name" />
            </Field>
            <Field label={t('pf_last_name')}>
              <input className={inputClass} value={form.lastName} onChange={set('lastName')} maxLength={40} autoComplete="family-name" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('pf_dob')}>
              <input type="date" className={inputClass} value={form.dateOfBirth} onChange={set('dateOfBirth')} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label={t('pf_gender')}>
              <div className="grid grid-cols-2 gap-1.5 h-[52px]">
                {['male', 'female'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gender: f.gender === g ? '' : g }))}
                    className={`rounded-2xl border-2 text-sm font-semibold transition-colors ${
                      form.gender === g ? 'bg-kumkum-600 border-kumkum-600 text-white' : 'bg-chandan-50 border-chandan-300 text-gray-700'
                    }`}
                  >
                    {t(g === 'male' ? 'pf_male' : 'pf_female')}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label={t('pf_email')}>
            <input type="email" inputMode="email" className={inputClass} value={form.email} onChange={set('email')} maxLength={80} autoComplete="email" placeholder="name@gmail.com" />
          </Field>

          {/* Locked: only the pathshala admin can change the mobile number */}
          <Field label={t('pf_whatsapp')} hint={t('pf_whatsapp_locked')}>
            <div className="relative">
              <input
                type="tel"
                className={`${inputClass} pr-11 text-gray-500 cursor-not-allowed`}
                value={form.whatsappNumber || '—'}
                readOnly
                disabled
                aria-readonly="true"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </Field>

          <Field label={t('pf_address')}>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.address} onChange={set('address')} maxLength={300} />
          </Field>

          <Field label={t('pf_status')}>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, currentStatus: f.currentStatus === s ? '' : s }))}
                  className={`px-3.5 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                    form.currentStatus === s ? 'bg-kesar-600 border-kesar-600 text-white' : 'bg-chandan-50 border-chandan-300 text-gray-700'
                  }`}
                >
                  {t(`pf_status_${s}`)}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('pf_study')} hint={t('pf_study_hint')}>
            <input className={inputClass} value={form.studyDetails} onChange={set('studyDetails')} maxLength={200} placeholder={t('pf_study_ph')} />
          </Field>

          <Field label={t('pf_other_activities')}>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[true, false].map((yes) => (
                <button
                  key={String(yes)}
                  type="button"
                  onClick={() => { setHasOther(yes); if (!yes) setForm((f) => ({ ...f, otherActivities: '' })); }}
                  className={`py-2.5 rounded-2xl border-2 text-sm font-semibold transition-colors ${
                    hasOther === yes ? 'bg-kumkum-600 border-kumkum-600 text-white' : 'bg-chandan-50 border-chandan-300 text-gray-700'
                  }`}
                >
                  {t(yes ? 'pf_yes' : 'pf_no')}
                </button>
              ))}
            </div>
            {hasOther && (
              <textarea className={`${inputClass} resize-none`} rows={2} value={form.otherActivities} onChange={set('otherActivities')} maxLength={300} placeholder={t('pf_other_ph')} />
            )}
          </Field>

          <Field label={t('pf_dharmic')} hint={t('pf_dharmic_hint')}>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.dharmicAbhyas} onChange={set('dharmicAbhyas')} maxLength={500} placeholder={t('pf_dharmic_ph')} />
          </Field>

          <Field label={t('pf_skills')}>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.skills} onChange={set('skills')} maxLength={300} placeholder={t('pf_skills_ph')} />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kesar-600 to-kumkum-600 text-white font-bold py-3.5 rounded-2xl shadow-temple disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {t('pf_save')}
          </button>
        </form>
      </Card>

      {/* Login */}
      <Card icon={Lock} title={t('pf_login_title')} subtitle={t('pf_login_sub')}>
        <div className="flex items-start gap-2 bg-chandan-100 border border-chandan-300 rounded-2xl p-3 mb-4 text-xs text-gray-700">
          <Info className="w-4 h-4 text-kesar-700 flex-shrink-0 mt-0.5" />
          <span>
            {t('pf_login_number')}: <b className="tabular-nums">{info.loginMobile || '—'}</b>. {t('pf_mobile_admin')}
          </span>
        </div>

        <form onSubmit={changePassword} className="space-y-3">
          <Field label={t('pf_pw_current')}>
            <input type={showPw ? 'text' : 'password'} className={inputClass} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
          </Field>
          <Field label={t('pf_pw_new')} hint={t('pf_pw_hint')}>
            <input type={showPw ? 'text' : 'password'} className={inputClass} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label={t('pf_pw_confirm')}>
            <input type={showPw ? 'text' : 'password'} className={inputClass} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
          </Field>
          <button type="button" onClick={() => setShowPw((v) => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-kumkum-700">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPw ? t('pf_hide_pw') : t('pf_show_pw')}
          </button>
          <button
            type="submit"
            disabled={changingPw || !pw.current || !pw.next || !pw.confirm}
            className="w-full flex items-center justify-center gap-2 bg-kumkum-700 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50 active:scale-[0.98]"
          >
            {changingPw ? <Loader className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {t('pf_pw_change_btn')}
          </button>
        </form>
      </Card>
    </div>
  );
}
