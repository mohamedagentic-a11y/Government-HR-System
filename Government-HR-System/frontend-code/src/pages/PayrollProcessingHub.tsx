import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from '../lib/i18n';
import { runPayroll, fetchPayrollPreview, finalizePayroll } from '../store/payrollSlice';
import { clearPayrollError, clearDraftSummary } from '../store/payrollSlice';
import type { RootState, AppDispatch } from '../store/store';

const translations = {
  ar: {
    pageTitle: 'مركز معالجة الرواتب',
    draftHeading: 'مسودة رواتب شهر أكتوبر 2026',
    runPayroll: 'تشغيل محرك الرواتب',
    finalizePayroll: 'اعتماد الرواتب',
    totalEmployees: 'إجمالي الموظفين',
    totalAmount: 'إجمالي المبلغ',
    anomalies: 'الحالات الشاذة',
    currency: 'ريال سعودي',
    noData: 'لا توجد بيانات متاحة. يرجى تشغيل محرك الرواتب أولاً.',
    runningPayroll: 'جارٍ تشغيل محرك الرواتب...',
    finalizing: 'جارٍ اعتماد الرواتب...',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    finalizeSuccess: 'تم اعتماد الرواتب بنجاح',
    finalizedAt: 'تاريخ الاعتماد',
    runSuccess: 'تم تشغيل محرك الرواتب بنجاح',
    previewHeading: 'ملخص مسودة الرواتب',
    dismiss: 'إغلاق',
    anomaliesWarning: 'تحذير: يوجد حالات شاذة تستوجب المراجعة',
    cannotFinalizeNoData: 'لا يمكن الاعتماد قبل تشغيل محرك الرواتب',
    accessDenied: 'غير مصرح لك بالوصول إلى هذه الصفحة',
    roleRequired: 'هذه الصفحة مخصصة لموظفي الموارد البشرية فقط',
  },
  en: {
    pageTitle: 'Payroll Processing Hub',
    draftHeading: 'Draft Payroll for October 2026',
    runPayroll: 'Run Payroll Engine',
    finalizePayroll: 'Finalize Payroll',
    totalEmployees: 'Total Employees',
    totalAmount: 'Total Amount',
    anomalies: 'Anomalies',
    currency: 'SAR',
    noData: 'No data available. Please run the payroll engine first.',
    runningPayroll: 'Running payroll engine...',
    finalizing: 'Finalizing payroll...',
    loading: 'Loading...',
    error: 'An error occurred',
    finalizeSuccess: 'Payroll finalized successfully',
    finalizedAt: 'Finalized At',
    runSuccess: 'Payroll engine ran successfully',
    previewHeading: 'Payroll Draft Summary',
    dismiss: 'Dismiss',
    anomaliesWarning: 'Warning: Anomalies detected that require review',
    cannotFinalizeNoData: 'Cannot finalize before running payroll engine',
    accessDenied: 'Access Denied',
    roleRequired: 'This page is for HR Staff only',
  },
};

export function PayrollProcessingHub() {
  const { language } = useI18n();
  const t = translations[language as 'ar' | 'en'] ?? translations['ar'];
  const dispatch = useDispatch<AppDispatch>();

  const payrollState = useSelector((state: RootState) => state.payroll);
  const {
    draftSummary,
    preview,
    isRunning,
    isFinalizing,
    isLoadingPreview,
    runError,
    finalizeError,
    previewError,
    finalizeResult,
  } = payrollState as {
    draftSummary: { TotalEmployees: number; TotalAmount: number; Anomalies: number } | null;
    preview: { TotalEmployees: number; TotalAmount: number; Anomalies: number; Details?: unknown[] } | null;
    isRunning: boolean;
    isFinalizing: boolean;
    isLoadingPreview: boolean;
    runError: string | null;
    finalizeError: string | null;
    previewError: string | null;
    finalizeResult: { FinalizedAt: string; TotalEmployees: number; TotalAmount: number } | null;
  };

  const authState = useSelector((state: RootState) => state.auth as { user?: { Role?: string } } | null);
  const userRole = authState?.user?.Role;
  const isHRStaff = userRole === 'HR Staff';

  useEffect(() => {
    if (isHRStaff) {
      dispatch(fetchPayrollPreview());
    }
    return () => {
      dispatch(clearPayrollError());
    };
  }, [dispatch, isHRStaff]);

  if (!isHRStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.accessDenied}</h1>
          <p className="text-gray-600">{t.roleRequired}</p>
        </div>
      </div>
    );
  }

  const summaryData = draftSummary ?? preview;
  const hasData = summaryData !== null;
  const canFinalize = hasData && !isRunning && !isFinalizing && !finalizeResult;

  const handleRunPayroll = () => {
    dispatch(clearDraftSummary());
    dispatch(runPayroll());
  };

  const handleFinalizePayroll = () => {
    if (!hasData) return;
    dispatch(finalizePayroll());
  };

  const handleDismissError = () => {
    dispatch(clearPayrollError());
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const anyError = runError ?? finalizeError ?? previewError;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.pageTitle}</h1>
          <h2 className="text-xl font-semibold text-blue-700">{t.draftHeading}</h2>
        </div>

        {/* Error Banner */}
        {anyError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-red-700">{t.error}</p>
                <p className="text-red-600 text-sm mt-1">{anyError}</p>
              </div>
            </div>
            <button
              onClick={handleDismissError}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0 font-medium text-sm"
            >
              {t.dismiss}
            </button>
          </div>
        )}

        {/* Finalize Success Banner */}
        {finalizeResult && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-green-700">{t.finalizeSuccess}</p>
                <p className="text-green-600 text-sm mt-1">
                  {t.finalizedAt}: {formatDate(finalizeResult.FinalizedAt)}
                </p>
                <p className="text-green-600 text-sm">
                  {t.totalEmployees}: {finalizeResult.TotalEmployees} &nbsp;|&nbsp; {t.totalAmount}: {formatAmount(finalizeResult.TotalAmount)} {t.currency}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleRunPayroll}
            disabled={isRunning || isFinalizing || isLoadingPreview}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors shadow-sm
              ${isRunning || isFinalizing || isLoadingPreview
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
            `}
          >
            {isRunning ? (
              <>
                <span className="animate-spin">⚙️</span>
                {t.runningPayroll}
              </>
            ) : (
              <>
                <span>▶️</span>
                {t.runPayroll}
              </>
            )}
          </button>

          <button
            onClick={handleFinalizePayroll}
            disabled={!canFinalize}
            title={!hasData ? t.cannotFinalizeNoData : undefined}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors shadow-sm
              ${!canFinalize
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'}
            `}
          >
            {isFinalizing ? (
              <>
                <span className="animate-spin">⚙️</span>
                {t.finalizing}
              </>
            ) : (
              <>
                <span>✔️</span>
                {t.finalizePayroll}
              </>
            )}
          </button>
        </div>

        {!hasData && !canFinalize && !isRunning && (
          <p className="text-sm text-amber-600 -mt-4 mb-6 ms-1">{t.cannotFinalizeNoData}</p>
        )}

        {/* Draft Summary Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">{t.previewHeading}</h3>
          </div>

          {isLoadingPreview && !hasData ? (
            <div className="p-10 text-center text-gray-500">
              <span className="animate-spin inline-block text-3xl mb-3">⚙️</span>
              <p>{t.loading}</p>
            </div>
          ) : !hasData ? (
            <div className="p-10 text-center text-gray-400">
              <span className="text-5xl mb-4 block">📋</span>
              <p className="text-base">{t.noData}</p>
            </div>
          ) : (
            <>
              {summaryData.Anomalies > 0 && (
                <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="text-amber-500">⚠️</span>
                  <p className="text-amber-700 font-medium text-sm">{t.anomaliesWarning}</p>
                </div>
              )}
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-start py-3 px-4 font-semibold text-gray-600 bg-gray-50 rounded-s-lg">
                        {t.totalEmployees}
                      </th>
                      <th className="text-start py-3 px-4 font-semibold text-gray-600 bg-gray-50">
                        {t.totalAmount}
                      </th>
                      <th className="text-start py-3 px-4 font-semibold text-gray-600 bg-gray-50 rounded-e-lg">
                        {t.anomalies}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-900 text-xl">
                        {summaryData.TotalEmployees.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-SA')}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900 text-xl">
                        {formatAmount(summaryData.TotalAmount)}
                        <span className="text-sm font-normal text-gray-500 ms-2">{t.currency}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xl ${
                            summaryData.Anomalies > 0 ? 'text-amber-600' : 'text-green-600'
                          }`}
                        >
                          {summaryData.Anomalies > 0 ? '⚠️' : '✅'}
                          {summaryData.Anomalies.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-SA')}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayrollProcessingHub;