'use client';

import React from 'react';
import { UserPen, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { IconBubble } from '../Decor';

// Popup asking a student to complete their profile; "Fill details now" opens My Profile
export default function ProfileReminder({ name, missing, onFill, onLater }) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[55] bg-gray-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="profile-reminder-title" className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <IconBubble icon={UserPen} tone="kesar" size="lg" />
          <div className="min-w-0">
            <h2 id="profile-reminder-title" className="font-display text-xl font-bold text-gray-900 leading-tight">
              {t('pr_title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{t('pr_desc').replace('{name}', name)}</p>
          </div>
        </div>

        <div className="mt-4 bg-chandan-100 rounded-2xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">{t('pr_missing')}</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((f) => (
              <span key={f} className="text-xs font-semibold bg-white text-kumkum-700 rounded-full px-2.5 py-1">
                {t(FIELD_LABELS[f] || f)}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onFill}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kesar-500 to-kumkum-500 text-white font-bold py-3.5 rounded-2xl"
        >
          {t('pr_fill_now')} <ArrowRight className="w-5 h-5" />
        </button>
        <button onClick={onLater} className="mt-2 w-full py-2.5 text-sm font-semibold text-gray-500 rounded-2xl">
          {t('pr_later')}
        </button>
      </div>
    </div>
  );
}

const FIELD_LABELS = {
  firstName: 'pf_first_name',
  lastName: 'pf_last_name',
  dateOfBirth: 'pf_dob',
  gender: 'pf_gender',
  address: 'pf_address',
  currentStatus: 'pf_status',
};
