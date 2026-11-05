build/frontend-code/src/pages/EmployeeDashboard.tsx

```typescript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from '../lib/i18n';
import { fetchLeaveBalance } from '../store/leaveSlice';
import { fetchMyPayslips } from '../store/payrollSlice';
import { fetchMyReviews } from '../store/performanceSlice';
import { RootState, AppDispatch } from '../store/store';

const translations = {
  ar: {
    pageTitle: 'لوحة القيادة للموظف',
    dashboard: 'لوحة القيادة للموظف',
    annualBalance: 'الرصيد السنوي',
    sickLeave: 'إجازة مرضية',
    performanceReview: 'تقييم الأداء (الربع الأخير)',
    recentPayslips: 'مسيرات الرواتب الأخيرة',
    announcements: 'الإعلانات',
    downloadPDF: 'تحميل PDF',
    days: 'أيام',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ أثناء تحميل البيانات',
    noPayslips: 'لا توجد مسيرات رواتب',
    noReviews: 'لا يوجد تقييم متاح',
    noAnnouncements: 'لا توجد إعلانات حالياً',
    period: 'الفترة',
    netAmount: 'صافي الراتب',
    score: 'الدرجة',
    status: 'الحالة',
    reviewDate: 'تاريخ التقييم',
    sar: 'ريال',
    annualLeaveBalance: 'رصيد الإجازة السنوية',
    sickLeaveBalance: 'رصيد الإجازة المرضية',
    emergencyLeave: 'إجازة طارئة',
  },
  en: {
    pageTitle: 'Employee Dashboard',
    dashboard: 'Employee Dashboard',
    annualBalance: 'Annual Balance',
    sickLeave: 'Sick Leave',
    performanceReview: 'Performance Review (Last Quarter)',
    recentPayslips: 'Recent Payslips',
    announcements: 'Announcements',
    downloadPDF: 'Download PDF',
    days: 'days',
    loading: 'Loading...',
    error: 'An error occurred while loading data',
    noPayslips: 'No payslips available',
    noReviews: 'No review available',
    noAnnouncements: 'No announcements at this time',
    period: 'Period',
    netAmount: 'Net Amount',
    score: 'Score',
    status: 'Status',
    reviewDate: 'Review Date',
    sar: 'SAR',
    annualLeaveBalance: 'Annual Leave Balance',
    sickLeaveBalance: 'Sick Leave Balance',
    emergencyLeave: 'Emergency Leave',
  },
};

export function EmployeeDashboard() {
  const { language } = useI18n();
  const dispatch = useDispatch<AppDispatch>();
  const tr = translations[language as 'ar' | 'en'] ?? translations.ar;

  const { leaveBalance, loading: leaveLoading, error: leaveError } = useSelector(
    (state: RootState) => state.leave
  );
  const { myPayslips, loading: payrollLoading, error: payrollError } = useSelector(
    (state: RootState) => state.payroll
  );
  const { myReviews, loading: perfLoading, error: perfError } = useSelector(
    (state: RootState) => state.performance
  );

  useEffect(() => {
    document.title = tr.pageTitle;
  }, [tr.pageTitle]);

  useEffect(() => {
    dispatch(fetchLeaveBalance());
    dispatch(fetchMyPayslips());
    dispatch(fetchMyReviews());
  }, [dispatch]);

  const handleDownloadPDF = (payslipId: string) => {
    const token = localStorage.getItem('jwt_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`/api/v1/payslips/${payslipId}/pdf`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${payslipId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  const latestReview =
    myReviews && myReviews.length > 0
      ? [...myReviews].sort(
          (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
        )[0]
      : null;

  const recentPayslips = myPayslips
    ? [...myPayslips]
        .sort((a, b) => new Date(b.IssuedAt).getTime() - new Date(a.IssuedAt).getTime())
        .slice(0, 5)
    : [];

  const isLoading = leaveLoading || payrollLoading || perfLoading;
  const hasError = leaveError || payrollError || perfError;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{tr.dashboard}</h1>

      {isLoading && (
        <div className="text-center py-8 text-gray-500">{tr.loading}</div>
      )}

      {hasError && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {tr.error}
        </div>
      )}

      {/* Leave Balance Section */}
      <section className="mb-8" aria-labelledby="leave-balance-heading">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Annual Balance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2
              id="leave-balance-heading"
              className="text-lg font-semibold text-gray-700 mb-4"
            >
              {tr.annualBalance}
            </h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-blue-600">
                {leaveBalance != null ? leaveBalance.Annual : '—'}
              </span>
              <span className="text-gray-500 mb-1">{tr.days}</span>
            </div>
          </div>

          {/* Sick Leave */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{tr.sickLeave}</h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-600">
                {leaveBalance != null ? leaveBalance.Sick : '—'}
              </span>
              <span className="text-gray-500 mb-1">{tr.days}</span>
            </div>
          </div>

          {/* Emergency Leave */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{tr.emergencyLeave}</h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-500">
                {leaveBalance != null ? leaveBalance.Emergency : '—'}
              </span>
              <span className="text-gray-500 mb-1">{tr.days}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Review Section */}
      <section className="mb-8" aria-labelledby="performance-heading">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2
            id="performance-heading"
            className="text-xl font-semibold text-gray-700 mb-4"
          >
            {tr.performanceReview}
          </h2>
          {perfLoading ? (
            <p className="text-gray-400">{tr.loading}</p>
          ) : latestReview ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">{tr.score}</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {latestReview.Score != null ? latestReview.Score : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{tr.status}</p>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                  {latestReview.Status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{tr.reviewDate}</p>
                <p className="text-gray-700 mt-1">
                  {new Date(latestReview.CreatedAt).toLocaleDateString(
                    language === 'ar' ? 'ar-SA' : 'en-US'
                  )}
                </p>
              </div>
              {latestReview.Comments && (
                <div className="col-span-1 md:col-span-3 mt-2">
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'الملاحظات' : 'Comments'}
                  </p>
                  <p className="text-gray-700 mt-1">{latestReview.Comments}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">{tr.noReviews}</p>
          )}
        </div>
      </section>

      {/* Recent Payslips Section */}
      <section className="mb-8" aria-labelledby="payslips-heading">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2
            id="payslips-heading"
            className="text-xl font-semibold text-gray-700 mb-4"
          >
            {tr.recentPayslips}
          </h2>
          {payrollLoading ? (
            <p className="text-gray-400">{tr.loading}</p>
          ) : recentPayslips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-start py-2 px-3 font-medium text-gray-500">
                      {tr.period}
                    </th>
                    <th className="text-start py-2 px-3 font-medium text-gray-500">
                      {tr.netAmount}
                    </th>
                    <th className="text-start py-2 px-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayslips.map((payslip) => (
                    <tr
                      key={payslip.PayslipID}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 text-gray-700">{payslip.Period}</td>
                      <td className="py-3 px-3 text-gray-700">
                        {payslip.NetAmount.toLocaleString(
                          language === 'ar' ? 'ar-SA' : 'en-US'
                        )}{' '}
                        {tr.sar}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(payslip.PayslipID)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {tr.downloadPDF}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">{tr.noPayslips}</p>
          )}
        </div>
      </section>

      {/* Announcements Section */}
      <section className="mb-8" aria-labelledby="announcements-heading">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2
            id="announcements-heading"
            className="text-xl font-semibold text-gray-700 mb-4"
          >
            {tr.announcements}
          </h2>
          <p className="text-gray-400">{tr.noAnnouncements}</p>
        </div>
      </section>
    </div>
  );
}

export default EmployeeDashboard;