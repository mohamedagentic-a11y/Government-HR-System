import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from '../lib/i18n';
import { fetchPendingLeaves, updateLeaveStatus, clearLeaveError } from '../store/leaveSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { Leave } from '../store/leaveSlice';

const translations = {
  ar: {
    pageTitle: 'مركز موافقات المدير',
    pendingRequests: 'الطلبات المعلقة',
    approve: 'موافقة',
    reject: 'رفض',
    employee: 'الموظف',
    leaveType: 'نوع الإجازة',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    comments: 'ملاحظات',
    status: 'الحالة',
    createdAt: 'تاريخ الطلب',
    noRequests: 'لا توجد طلبات معلقة',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    commentPlaceholder: 'أضف ملاحظة (اختياري)',
    confirmApprove: 'تأكيد الموافقة',
    confirmReject: 'تأكيد الرفض',
    cancel: 'إلغاء',
    actionSuccess: 'تمت العملية بنجاح',
    approveSuccess: 'تمت الموافقة على الطلب بنجاح',
    rejectSuccess: 'تم رفض الطلب بنجاح',
    unknownEmployee: 'موظف غير معروف',
    annual: 'سنوية',
    sick: 'مرضية',
    emergency: 'طارئة',
    pending: 'معلق',
    leaveId: 'رقم الطلب',
  },
  en: {
    pageTitle: 'Manager Approval Hub',
    pendingRequests: 'Pending Requests',
    approve: 'Approve',
    reject: 'Reject',
    employee: 'Employee',
    leaveType: 'Leave Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    comments: 'Comments',
    status: 'Status',
    createdAt: 'Request Date',
    noRequests: 'No pending requests',
    loading: 'Loading...',
    error: 'An error occurred',
    commentPlaceholder: 'Add a comment (optional)',
    confirmApprove: 'Confirm Approval',
    confirmReject: 'Confirm Rejection',
    cancel: 'Cancel',
    actionSuccess: 'Action completed successfully',
    approveSuccess: 'Leave request approved successfully',
    rejectSuccess: 'Leave request rejected successfully',
    unknownEmployee: 'Unknown Employee',
    annual: 'Annual',
    sick: 'Sick',
    emergency: 'Emergency',
    pending: 'Pending',
    leaveId: 'Request ID',
  },
};

interface ActionModalState {
  open: boolean;
  leave: Leave | null;
  action: 'Approved' | 'Rejected' | null;
  comment: string;
}

export function ManagerApprovalHub() {
  const { language } = useI18n();
  const dict = translations[language as 'ar' | 'en'] ?? translations.ar;
  const dispatch = useDispatch<AppDispatch>();
  const { pendingLeaves, loading, error } = useSelector((state: RootState) => state.leave);

  const [modal, setModal] = useState<ActionModalState>({
    open: false,
    leave: null,
    action: null,
    comment: '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingLeaves());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearLeaveError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const openModal = (leave: Leave, action: 'Approved' | 'Rejected') => {
    setModal({ open: true, leave, action, comment: '' });
  };

  const closeModal = () => {
    setModal({ open: false, leave: null, action: null, comment: '' });
  };

  const handleConfirm = async () => {
    if (!modal.leave || !modal.action) return;
    setSubmitting(true);
    try {
      await dispatch(
        updateLeaveStatus({
          id: modal.leave.LeaveID,
          Status: modal.action,
          Comments: modal.comment || undefined,
        })
      ).unwrap();
      const msg =
        modal.action === 'Approved' ? dict.approveSuccess : dict.rejectSuccess;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
      closeModal();
      dispatch(fetchPendingLeaves());
    } catch {
      // error handled by slice
    } finally {
      setSubmitting(false);
    }
  };

  const translateLeaveType = (type: string) => {
    const map: Record<string, string> = {
      Annual: dict.annual,
      Sick: dict.sick,
      Emergency: dict.emergency,
    };
    return map[type] ?? type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Heading */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{dict.pageTitle}</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 rounded-md bg-green-100 border border-green-400 text-green-800 px-4 py-3 text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-100 border border-red-400 text-red-800 px-4 py-3 text-sm">
          {dict.error}: {error}
        </div>
      )}

      {/* Pending Requests Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{dict.pendingRequests}</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{dict.loading}</div>
        ) : pendingLeaves.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg shadow">
            {dict.noRequests}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.leaveId}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.employee}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.leaveType}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.startDate}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.endDate}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.comments}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.createdAt}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                    {dict.status}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                    {/* actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingLeaves.map((leave) => (
                  <tr key={leave.LeaveID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {leave.LeaveID.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {leave.EmployeeName ?? dict.unknownEmployee}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {translateLeaveType(leave.LeaveType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{leave.StartDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{leave.EndDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {leave.Comments ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {leave.CreatedAt
                        ? new Date(leave.CreatedAt).toLocaleDateString(
                            language === 'ar' ? 'ar-SA' : 'en-GB'
                          )
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {dict.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openModal(leave, 'Approved')}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                          disabled={submitting}
                        >
                          {dict.approve}
                        </button>
                        <button
                          onClick={() => openModal(leave, 'Rejected')}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                          disabled={submitting}
                        >
                          {dict.reject}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {modal.open && modal.leave && modal.action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {modal.action === 'Approved' ? dict.confirmApprove : dict.confirmReject}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {modal.leave.EmployeeName ?? dict.unknownEmployee} —{' '}
              {translateLeaveType(modal.leave.LeaveType)} ({modal.leave.StartDate} →{' '}
              {modal.leave.EndDate})
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {dict.comments}
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder={dict.commentPlaceholder}
                value={modal.comment}
                onChange={(e) => setModal((prev) => ({ ...prev, comment: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                {dict.cancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
                  modal.action === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting
                  ? dict.loading
                  : modal.action === 'Approved'
                  ? dict.approve
                  : dict.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}