import React, { useState, useCallback, useMemo } from 'react';
import { useI18n } from '../lib/i18n';

// ─── Umm al-Qura approximation ───────────────────────────────────────────────
// We use the standard algorithmic Hijri calendar (Umm al-Qura approximation)
// based on the Kuwaiti algorithm which is a common approximation used widely.

function gregorianToJD(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdToGregorian(jd: number): { year: number; month: number; day: number } {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function hijriToJD(hYear: number, hMonth: number, hDay: number): number {
  return (
    Math.floor((11 * hYear + 3) / 30) +
    354 * hYear +
    30 * hMonth -
    Math.floor((hMonth - 1) / 2) +
    hDay +
    1948440 -
    385
  );
}

function jdToHijri(jd: number): { year: number; month: number; day: number } {
  const z = Math.floor(jd) + 0.5;
  const a = Math.floor((z - 1948440 + 385) / 10631);
  // year
  const year = a;
  // recalculate
  const r = z - Math.floor((11 * a + 3) / 30) - 354 * a - 1948440 + 385;
  const month = Math.min(12, Math.ceil((r + Math.floor((r - 1) / 59)) / 29.5 + 1));
  const startJD = hijriToJD(a, month, 1);
  const day = Math.floor(z - startJD) + 1;
  return { year, month, day };
}

function gregorianToHijri(gYear: number, gMonth: number, gDay: number) {
  const jd = gregorianToJD(gYear, gMonth, gDay);
  return jdToHijri(jd);
}

function hijriToGregorian(hYear: number, hMonth: number, hDay: number) {
  const jd = hijriToJD(hYear, hMonth, hDay);
  return jdToGregorian(jd);
}

function daysInHijriMonth(hYear: number, hMonth: number): number {
  const startJD = hijriToJD(hYear, hMonth, 1);
  const nextMonth = hMonth === 12 ? 1 : hMonth + 1;
  const nextYear = hMonth === 12 ? hYear + 1 : hYear;
  const endJD = hijriToJD(nextYear, nextMonth, 1);
  return Math.round(endJD - startJD);
}

function firstWeekdayOfHijriMonth(hYear: number, hMonth: number): number {
  // 0=Sunday
  const jd = hijriToJD(hYear, hMonth, 1);
  return Math.floor(jd + 1.5) % 7;
}

function toHijriISOString(hYear: number, hMonth: number, hDay: number): string {
  return `${String(hYear).padStart(4, '0')}-${String(hMonth).padStart(2, '0')}-${String(hDay).padStart(2, '0')}`;
}

function hijriToGregorianISO(hYear: number, hMonth: number, hDay: number): string {
  const { year, month, day } = hijriToGregorian(hYear, hMonth, hDay);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  ar: {
    hijriMonths: [
      'محرم',
      'صفر',
      'ربيع الأول',
      'ربيع الآخر',
      'جمادى الأولى',
      'جمادى الآخرة',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذو القعدة',
      'ذو الحجة',
    ],
    weekdays: ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'],
    prevMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    prevYear: 'السنة السابقة',
    nextYear: 'السنة التالية',
    selectDate: 'اختر التاريخ',
    today: 'اليوم',
    clear: 'مسح',
    gregorianEquiv: 'الموافق',
    year: 'السنة',
    month: 'الشهر',
    placeholder: 'اختر تاريخاً هجرياً',
    close: 'إغلاق',
  },
  en: {
    hijriMonths: [
      'Muharram',
      'Safar',
      "Rabi' al-Awwal",
      "Rabi' al-Thani",
      'Jumada al-Ula',
      'Jumada al-Akhirah',
      'Rajab',
      "Sha'ban",
      'Ramadan',
      'Shawwal',
      "Dhu al-Qi'dah",
      'Dhu al-Hijjah',
    ],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    prevYear: 'Previous year',
    nextYear: 'Next year',
    selectDate: 'Select date',
    today: 'Today',
    clear: 'Clear',
    gregorianEquiv: 'Gregorian',
    year: 'Year',
    month: 'Month',
    placeholder: 'Select Hijri date',
    close: 'Close',
  },
};

type Lang = 'ar' | 'en';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HijriDatePickerProps {
  /** Controlled value: Hijri date string "YYYY-MM-DD" */
  value?: string;
  /** Called with Hijri date string "YYYY-MM-DD" and Gregorian ISO string */
  onChange?: (hijriISO: string, gregorianISO: string) => void;
  /** Minimum selectable date (Hijri ISO string) */
  minDate?: string;
  /** Maximum selectable date (Hijri ISO string) */
  maxDate?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
  error?: string;
}

interface HijriDate {
  year: number;
  month: number;
  day: number;
}

function parseHijriISO(iso: string): HijriDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { year: +m[1], month: +m[2], day: +m[3] };
}

function todayHijri(): HijriDate {
  const now = new Date();
  return gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HijriDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  label,
  id = 'hijri-date-picker',
  error,
}: HijriDatePickerProps) {
  const { language } = useI18n();
  const lang = (language === 'ar' ? 'ar' : 'en') as Lang;
  const tr = translations[lang];
  const isRTL = lang === 'ar';

  const today = useMemo(() => todayHijri(), []);

  const selectedDate = useMemo<HijriDate | null>(() => {
    if (!value) return null;
    return parseHijriISO(value);
  }, [value]);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => selectedDate?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState<number>(() => selectedDate?.month ?? today.month);

  const minParsed = useMemo(() => (minDate ? parseHijriISO(minDate) : null), [minDate]);
  const maxParsed = useMemo(() => (maxDate ? parseHijriISO(maxDate) : null), [maxDate]);

  const isDateDisabled = useCallback(
    (hYear: number, hMonth: number, hDay: number): boolean => {
      const val = hYear * 10000 + hMonth * 100 + hDay;
      if (minParsed) {
        const minVal = minParsed.year * 10000 + minParsed.month * 100 + minParsed.day;
        if (val < minVal) return true;
      }
      if (maxParsed) {
        const maxVal = maxParsed.year * 10000 + maxParsed.month * 100 + maxParsed.day;
        if (val > maxVal) return true;
      }
      return false;
    },
    [minParsed, maxParsed],
  );

  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, []);

  const goToPrevYear = useCallback(() => setViewYear((y) => y - 1), []);
  const goToNextYear = useCallback(() => setViewYear((y) => y + 1), []);

  const selectDay = useCallback(
    (day: number) => {
      if (isDateDisabled(viewYear, viewMonth, day)) return;
      const hijriISO = toHijriISOString(viewYear, viewMonth, day);
      const gregorianISO = hijriToGregorianISO(viewYear, viewMonth, day);
      onChange?.(hijriISO, gregorianISO);
      setOpen(false);
    },
    [viewYear, viewMonth, isDateDisabled, onChange],
  );

  const goToToday = useCallback(() => {
    setViewYear(today.year);
    setViewMonth(today.month);
  }, [today]);

  const clearSelection = useCallback(() => {
    onChange?.('', '');
  }, [onChange]);

  const daysCount = useMemo(() => daysInHijriMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstWeekday = useMemo(
    () => firstWeekdayOfHijriMonth(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // Grid cells: leading empty + day numbers
  const gridCells = useMemo(() => {
    const cells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ type: 'empty' });
    }
    for (let d = 1; d <= daysCount; d++) {
      cells.push({ type: 'day', day: d });
    }
    return cells;
  }, [firstWeekday, daysCount]);

  const gregorianEquivStr = useMemo(() => {
    if (!selectedDate) return '';
    const { year, month, day } = hijriToGregorian(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
    );
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [selectedDate]);

  const displayValue = useMemo(() => {
    if (!selectedDate) return '';
    return `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')} ${tr.hijriMonths[selectedDate.month - 1]}`;
  }, [selectedDate, tr]);

  // Year select options  — reasonable range around current hijri year
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = today.year - 50; y <= today.year + 10; y++) {
      years.push(y);
    }
    return years;
  }, [today.year]);

  return (
    <div
      className="relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      id={id}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={`${id}-input`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      {/* Input trigger */}
      <button
        type="button"
        id={`${id}-input`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full border rounded-lg px-3 py-2 text-start flex items-center justify-between',
          'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-blue-400',
        ].join(' ')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || tr.placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Gregorian equivalent */}
      {selectedDate && gregorianEquivStr && (
        <p className="mt-1 text-xs text-gray-500">
          {tr.gregorianEquiv}: {gregorianEquivStr}
        </p>
      )}

      {/* Calendar popup */}
      {open && !disabled && (
        <div
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-72"
          role="dialog"
          aria-label={tr.selectDate}
        >
          {/* Navigation header */}
          <div className="flex items-center justify-between mb-2 gap-1">
            {/* Prev year */}
            <button
              type="button"
              onClick={isRTL ? goToNextYear : goToPrevYear}
              className="p-1 rounded hover:bg-gray-100 text-gray-600"
              aria-label={isRTL ? tr.nextYear : tr.prevYear}
              title={isRTL ? tr.nextYear : tr.prevYear}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Prev month */}
            <button
              type="button"
              onClick={isRTL ? goToNextMonth : goToPrevMonth}
              className="p-1 rounded hover:bg-gray-100 text-gray-600"
              aria-label={isRTL ? tr.nextMonth : tr.prevMonth}
              title={isRTL ? tr.nextMonth : tr.prevMonth}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Month/Year selectors */}
            <div className="flex items-center gap-1 flex-1 justify-center">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm font-semibold text-gray-800 border-none bg-transparent focus:outline-none cursor-pointer"
                aria-label={tr.month}
              >
                {tr.hijriMonths.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-sm font-semibold text-gray-800 border-none bg-transparent focus:outline-none cursor-pointer"
                aria-label={tr.year}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Next month */}
            <button
              type="button"
              onClick={isRTL ? goToPrevMonth : goToNextMonth}
              className="p-1 rounded hover:bg-gray-100 text-gray-600"
              aria-label={isRTL ? tr.prevMonth : tr.nextMonth}
              title={isRTL ? tr.prevMonth : tr.nextMonth}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Next year */}
            <button
              type="button"
              onClick={isRTL ? goToPrevYear : goToNextYear}
              className="p-1 rounded hover:bg-gray-100 text-gray-600"
              aria-label={isRTL ? tr.prevYear : tr.nextYear}
              title={isRTL ? tr.prevYear : tr.nextYear}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {tr.weekdays.map((wd, i) => (
              <div
                key={i}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {gridCells.map((cell, idx) => {
              if (cell.type === 'empty') {
                return <div key={`e-${idx}`} />;
              }
              const { day } = cell;
              const isToday =
                viewYear === today.year && viewMonth === today.month && day === today.day;
              const isSelected =
                selectedDate &&
                viewYear === selectedDate.year &&
                viewMonth === selectedDate.month &&
                day === selectedDate.day;
              const isDisabled = isDateDisabled(viewYear, viewMonth, day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={[
                    'w-8 h-8 mx-auto rounded-full text-xs flex items-center justify-center transition-colors',
                    isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-blue-100',
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold'
                      : isToday
                      ? 'border border-blue-500 text-blue-700 font-semibold'
                      : 'text-gray-800',
                  ].join(' ')}
                  aria-label={`${day} ${tr.hijriMonths[viewMonth - 1]} ${viewYear}`}
                  aria-pressed={!!isSelected}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {tr.today}
            </button>
            <div className="flex gap-2">
              {selectedDate && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-red-500 hover:underline"
                >
                  {tr.clear}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:underline"
              >
                {tr.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HijriDatePicker;