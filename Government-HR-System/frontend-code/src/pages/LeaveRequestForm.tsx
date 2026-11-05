import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import HijriDatePicker from '../components/HijriDatePicker';
import { useI18n } from '../lib/i18n';
import { submitLeave, clearLeaveError } from '../store/leaveSlice';
import type { RootState, AppDispatch } from '../store/store';

const translations = {
  ar: {
    pageTitle: 'نموذج طلب إجازة',
    leaveType: 'نوع الإجازة',
    startDate: 'تاريخ البداية (هجري)',
    endDate: 'تاريخ النهاية (هجري)',
    comments: 'ملاحظات (اختياري)',
    cancel: 'إلغاء',
    submit: 'تقديم الطلب',
    selectLeaveType: 'اختر نوع الإجازة',
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
    commentsPlaceholder: 'أدخل ملاحظاتك هنا...',
    startDatePlaceholder: '1448-04-15',
    endDatePlaceholder: '1448-04-20',
    errorLeaveType: 'يرجى اختيار نوع الإجازة',
    errorStartDate: 'يرجى اختيار تاريخ البداية',
    errorEndDate: 'يرجى اختيار تاريخ النهاية',
    errorDateRange: 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية أو مساوياً له',
    successMessage: 'تم تقديم طلب الإجازة بنجاح',
    submitting: 'جاري التقديم...',
  },
  en: {
    pageTitle: 'Leave Request Form',
    leaveType: 'Leave Type',
    startDate: 'Start Date (Hijri)',
    endDate: 'End Date (Hijri)',
    comments: 'Comments (Optional)',
    cancel: 'Cancel',
    submit: 'Submit Request',
    selectLeaveType: 'Select leave type',
    annual: 'Annual',
    sick: 'Sick',
    emergency: 'Emergency',
    commentsPlaceholder: 'Enter your comments here...',
    startDatePlaceholder: '1448-04-15',
    endDatePlaceholder: '1448-04-20',
    errorLeaveType: 'Please select a leave type',
    errorStartDate: 'Please select a start date',
    errorEndDate: 'Please select an end date',
    errorDateRange: 'End date must be on or after start date',
    successMessage: 'Leave request submitted successfully',
    submitting: 'Submitting...',
  },
};

export function LeaveRequestForm() {
  const { language } = useI18n();
  const t = translations[language as keyof typeof translations] ?? translations.ar;
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.leave);

  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleStartDateChange = useCallback((hijriISO: string) => {
    setStartDate(hijriISO);
    setFieldErrors((prev) => ({ ...prev, startDate: undefined, dateRange: undefined }));
    setSuccessMessage('');
  }, []);

  const handleEndDateChange = useCallback((hijriISO: string) => {
    setEndDate(hijriISO);
    setFieldErrors((prev) => ({ ...prev, endDate: undefined, dateRange: undefined }));
    setSuccessMessage('');
  }, []);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!leaveType) errors.leaveType = t.errorLeaveType;
    if (!startDate) errors.startDate = t.errorStartDate;
    if (!endDate) errors.endDate = t.errorEndDate;
    if (startDate && endDate && endDate < startDate) {
      errors.dateRange = t.errorDateRange;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearLeaveError());
    setSuccessMessage('');
    if (!validate()) return;

    const payload = {
      LeaveType: leaveType,
      StartDate: startDate,
      EndDate: endDate,
      Comments: comments || undefined,
    };

    const result = await dispatch(submitLeave(payload));
    if (submitLeave.fulfilled.match(result)) {
      setSuccessMessage(t.successMessage);
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setComments('');
      setFieldErrors({});
    }
  };

  const handleCancel = () => {
    dispatch(clearLeaveError());
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-start">
          {t.pageTitle}
        </h1>

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-300 text-green-800 px-4 py-3 text-sm text-start">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-sm text-start">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Leave Type */}
          <div className="mb-5">
            <label
              htmlFor="leaveType"
              className="block text-sm font-medium text-gray-700 mb-1 text-start"
            >
              {t.leaveType}
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => {
                setLeaveType(e.target.value);
                setFieldErrors((prev) => ({ ...prev, leaveType: undefined }));
                setSuccessMessage('');
              }}
              disabled={loading}
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-white text-start focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.leaveType ? 'border-red-500' : 'border-gray-300'
              } disabled:opacity-60`}
            >
              <option value="">{t.selectLeaveType}</option>
              <option value="Annual">{t.annual}</option>
              <option value="Sick">{t.sick}</option>
              <option value="Emergency">{t.emergency}</option>
            </select>
            {fieldErrors.leaveType && (
              <p className="mt-1 text-xs text-red-600 text-start">{fieldErrors.leaveType}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="mb-5">
            <HijriDatePicker
              id="startDate"
              label={t.startDate}
              value={startDate}
              onChange={handleStartDateChange}
              disabled={loading}
              error={fieldErrors.startDate}
            />
          </div>

          {/* End Date */}
          <div className="mb-5">
            <HijriDatePicker
              id="endDate"
              label={t.endDate}
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate || undefined}
              disabled={loading}
              error={fieldErrors.endDate}
            />
          </div>

          {fieldErrors.dateRange && (
            <p className="mb-4 text-xs text-red-600 text-start">{fieldErrors.dateRange}</p>
          )}

          {/* Comments */}
          <div className="mb-6">
            <label
              htmlFor="comments"
              className="block text-sm font-medium text-gray-700 mb-1 text-start"
            >
              {t.comments}
            </label>
            <textarea
              id="comments"
              rows={4}
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                setSuccessMessage('');
              }}
              disabled={loading}
              placeholder={t.commentsPlaceholder}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-start disabled:opacity-60"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-row-reverse gap-3 justify-start">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t.submitting : t.submit}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveRequestForm;