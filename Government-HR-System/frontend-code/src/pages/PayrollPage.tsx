import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';

const translations = {
  en: {
    title: 'Payroll Management',
    description: 'Run the monthly payroll calculation engine for all employees.',
    runButton: 'Run Payroll',
    running: 'Running...',
    success: 'Payroll executed successfully.',
    error: 'Failed to run payroll. Please try again.',
    resultsTitle: 'Payroll Results',
    totalEmployees: 'Total Employees',
    totalAmount: 'Total Amount (SAR)',
    anomalies: 'Anomalies Detected',
    noData: 'No payroll data generated yet. Click the button above to run the calculation.',
  },
  ar: {
    title: 'إدارة مسيرات الرواتب',
    description: 'تشغيل محرك حساب مسيرات الرواتب الشهري لجميع الموظفين.',
    runButton: 'تشغيل مسير الرواتب',
    running: 'جاري التشغيل...',
    success: 'تم تنفيذ مسير الرواتب بنجاح.',
    error: 'فشل في تشغيل مسير الرواتب. يرجى المحاولة مرة أخرى.',
    resultsTitle: 'نتائج مسير الرواتب',
    totalEmployees: 'إجمالي الموظفين',
    totalAmount: 'المبلغ الإجمالي (ريال)',
    anomalies: 'الحالات الشاذة المكتشفة',
    noData: 'لم يتم إنشاء بيانات مسير الرواتب بعد. انقر على الزر أعلاه لتشغيل الحساب.',
  },
};

interface PayrollResult {
  TotalEmployees: number;
  TotalAmount: number;
  Anomalies: number;
}

export const PayrollPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const runPayrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ data: PayrollResult }>('/payroll/run');
      return response.data.data;
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{t.description}</p>
          </div>
          <button
            onClick={() => runPayrollMutation.mutate()}
            disabled={runPayrollMutation.isPending}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runPayrollMutation.isPending ? t.running : t.runButton}
          </button>
        </div>

        {runPayrollMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border-s-4 border-red-400 text-red-700">
            <p>{t.error}</p>
          </div>
        )}

        {runPayrollMutation.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 border-s-4 border-green-400 text-green-700">
            <p>{t.success}</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t.resultsTitle}</h2>
        
        {!runPayrollMutation.data ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            {t.noData}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <dt className="text-sm font-medium text-gray-500 truncate">{t.totalEmployees}</dt>
              <dd className="mt-2 text-3xl font-semibold text-gray-900">
                {runPayrollMutation.data.TotalEmployees.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </dd>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <dt className="text-sm font-medium text-gray-500 truncate">{t.totalAmount}</dt>
              <dd className="mt-2 text-3xl font-semibold text-gray-900">
                {runPayrollMutation.data.TotalAmount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </dd>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <dt className="text-sm font-medium text-gray-500 truncate">{t.anomalies}</dt>
              <dd className={`mt-2 text-3xl font-semibold ${runPayrollMutation.data.Anomalies > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {runPayrollMutation.data.Anomalies.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </dd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};