import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface HijriDatePickerProps {
  value?: string; // Format: YYYY-MM-DD (Hijri)
  onChange: (date: string) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

const DICTIONARY = {
  en: {
    day: 'Day',
    month: 'Month',
    year: 'Year',
    selectDay: 'Select Day',
    selectMonth: 'Select Month',
    selectYear: 'Select Year',
    months: [
      'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
      'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
    ]
  },
  ar: {
    day: 'اليوم',
    month: 'الشهر',
    year: 'السنة',
    selectDay: 'اختر اليوم',
    selectMonth: 'اختر الشهر',
    selectYear: 'اختر السنة',
    months: [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
      'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ]
  }
};

const CURRENT_HIJRI_YEAR = 1445;
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_HIJRI_YEAR - 10 + i);
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export function HijriDatePicker({ value, onChange, disabled = false, label, required = false }: HijriDatePickerProps) {
  const { language } = useLanguage();
  const t = DICTIONARY[language as keyof typeof DICTIONARY] || DICTIONARY.en;

  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    }
  }, [value]);

  const handleDateChange = (newYear: string, newMonth: string, newDay: string) => {
    if (newYear && newMonth && newDay) {
      const formattedMonth = newMonth.padStart(2, '0');
      const formattedDay = newDay.padStart(2, '0');
      onChange(`${newYear}-${formattedMonth}-${formattedDay}`);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700 text-start">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2 w-full">
        <select
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            handleDateChange(year, month, e.target.value);
          }}
          disabled={disabled}
          className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
          aria-label={t.day}
        >
          <option value="" disabled>{t.day}</option>
          {DAYS.map(d => (
            <option key={d} value={d.toString()}>{d}</option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            handleDateChange(year, e.target.value, day);
          }}
          disabled={disabled}
          className="flex-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
          aria-label={t.month}
        >
          <option value="" disabled>{t.month}</option>
          {t.months.map((m, i) => (
            <option key={i} value={(i + 1).toString()}>{m}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            handleDateChange(e.target.value, month, day);
          }}
          disabled={disabled}
          className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
          aria-label={t.year}
        >
          <option value="" disabled>{t.year}</option>
          {YEARS.map(y => (
            <option key={y} value={y.toString()}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}