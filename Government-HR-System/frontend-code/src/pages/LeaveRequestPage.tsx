import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { HijriDatePicker } from '../components/HijriDatePicker';
import { useLanguage } from '../i18n/LanguageContext';

const translations = {
  en: {
    pageTitle: 'Leave Request',
    balanceTitle: 'Leave Balance',
    annualBalance: 'Annual Leave Balance: 20 Days',
    requestFormTitle: 'Submit New Request',
    leaveType: 'Leave Type',
    annual: 'Annual',
    sick: 'Sick',
    unpaid: 'Unpaid',
    startDate: 'Start Date',
    endDate: 'End Date',
    comments: 'Comments',
    submit: 'Submit Request',
    submitting: 'Submitting...',
    successMessage: 'Leave request submitted successfully.',
    errorMessage: 'Failed to submit leave request. Please try again.',
    validationError: 'Please fill in all required fields.',
  },
  ar: {
    pageTitle: 'طلب إجازة',
    balanceTitle: 'رصيد الإجازات',
    annualBalance: 'رصيد الإجازة السنوية: 20 يوم',
    requestFormTitle: 'تقديم طلب جديد',
    leaveType: 'نوع الإجازة',
    annual: 'سنوية',
    sick: 'مرضية',
    unpaid: 'غير مدفوعة',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    comments: 'ملاحظات',
    submit: 'تقديم الطلب',
    submitting: 'جاري التقديم...',
    successMessage: 'تم تقديم طلب الإجازة بنجاح.',
    errorMessage: 'فشل في تقديم طلب الإجازة. يرجى المحاولة مرة أخرى.',
    validationError: 'يرجى تعبئة جميع الحقول المطلوبة.',
  }
};

export const LeaveRequestPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [validationError, setValidationError] = useState('');

  const mutation = useMutation({
    mutationFn: async (newLeave: { LeaveType: string; StartDate: string; EndDate: string; Comments: string }) => {
      const response = await apiClient.post('/api/v1/leaves', newLeave);
      return response.data;
    },
    onSuccess: () => {
      setLeaveType('Annual');
      setStartDate('');
      setEndDate('');
      setComments('');
      setValidationError('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!startDate || !endDate) {
      setValidationError(t.validationError);
      return;
    }

    mutation.mutate({
      LeaveType: leaveType,
      StartDate: startDate,
      EndDate: endDate,
      Comments: comments
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 text-start">{t.pageTitle}</h1>

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-start">{t.balanceTitle}</h2>
        <p className="text-gray-600 text-start">{t.annualBalance}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-start">{t.requestFormTitle}</h2>
        
        {mutation.isSuccess && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-md text-start">
            {t.successMessage}
          </div>
        )}

        {mutation.isError && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md text-start">
            {t.errorMessage}
          </div>
        )}

        {validationError && (
          <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-start">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-start">
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
              {t.leaveType}
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="Annual">{t.annual}</option>
              <option value="Sick">{t.sick}</option>
              <option value="Unpaid">{t.unpaid}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-start">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.startDate}
              </label>
              <HijriDatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            <div className="flex flex-col items-start">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.endDate}
              </label>
              <HijriDatePicker
                value={endDate}
                onChange={setEndDate}
              />
            </div>
          </div>

          <div className="flex flex-col items-start">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              {t.comments}
            </label>
            <textarea
              id="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {mutation.isPending ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};